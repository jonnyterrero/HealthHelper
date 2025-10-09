# unified_health_ai.py
# Python 3.10+ — minimal deps: pandas, numpy, scikit-learn, torch, sqlalchemy, pydantic, shap (optional)
import sqlite3, json, math, time, datetime as dt
from pathlib import Path
from typing import List, Optional, Dict, Any

import numpy as np
import pandas as pd
from pydantic import BaseModel, Field, validator

from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, brier_score_loss

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

DB_PATH = Path("unified_health.db")

############################
# 1) SCHEMA & CONNECTIONS  #
############################

DDL = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apps (
  app_id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_time TEXT NOT NULL,
  payload_hash TEXT,
  raw_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_logs (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  mood INTEGER,                 -- 1..5
  stress INTEGER,               -- 1..5
  notes TEXT,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS symptoms (
  symptom_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'gut','skin','headache',...
  severity INTEGER,             -- 0..10
  onset_time TEXT,
  duration_min INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS meals (
  meal_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  items TEXT,                   -- free text; keep a parsed table later if needed
  tags TEXT,                    -- JSON list like ["spicy","dairy"]
  calories INTEGER,
  caffeine_mg INTEGER
);

CREATE TABLE IF NOT EXISTS sleep_sessions (
  sleep_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  total_min INTEGER,
  awakenings INTEGER,
  sleep_score REAL
);

CREATE TABLE IF NOT EXISTS workouts (
  workout_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  type TEXT,                    -- 'run','weights','yoga',...
  duration_min INTEGER,
  intensity INTEGER             -- 1..5
);

CREATE TABLE IF NOT EXISTS vitals (
  vital_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  hr_mean REAL,
  hrv_ms REAL,
  steps INTEGER
);

CREATE TABLE IF NOT EXISTS medications (
  med_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  instructions TEXT
);

CREATE TABLE IF NOT EXISTS med_adherence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  med_code TEXT NOT NULL,
  ts TEXT NOT NULL,
  status TEXT NOT NULL          -- 'taken','missed','late'
);

CREATE TABLE IF NOT EXISTS images (
  image_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  path TEXT NOT NULL,
  body_region TEXT,
  lighting TEXT
);

CREATE TABLE IF NOT EXISTS image_labels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_id INTEGER NOT NULL,
  lesion_area_px INTEGER,
  delta_e REAL,
  erythema_idx REAL,
  severity REAL
);

CREATE TABLE IF NOT EXISTS journals (
  journal_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS journal_nlp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_id INTEGER NOT NULL,
  sentiment REAL,               -- -1..1
  topics TEXT,                  -- JSON list
  embedding BLOB                -- placeholder
);

-- FEATURE STORE
CREATE TABLE IF NOT EXISTS fs_daily_user (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  features_json TEXT NOT NULL,
  labels_json   TEXT,           -- { "gut": y, "skin": y, "mood": y }
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS fs_seq_user (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,           -- sequence ending at this date
  seq_json TEXT NOT NULL,       -- {"X": [[...],[...],...], "Y": {...}}
  PRIMARY KEY (user_id, date)
);
"""

def get_conn():
    conn = sqlite3.connect(DB_PATH.as_posix())
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def init_db():
    with get_conn() as conn:
        conn.executescript(DDL)

#########################
# 2) INGESTION MODELS   #
#########################

class MealIn(BaseModel):
    user_id: str
    ts: dt.datetime
    items: str
    tags: List[str] = []
    calories: Optional[int] = None
    caffeine_mg: Optional[int] = None

class SymptomIn(BaseModel):
    user_id: str
    date: dt.date
    type: str
    severity: int = Field(ge=0, le=10)
    onset_time: Optional[dt.time] = None
    duration_min: Optional[int] = None
    notes: Optional[str] = None

# Add pydantic models for sleep, workouts, etc. similarly.

def upsert_meal(rec: MealIn):
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO meals (user_id, ts, items, tags, calories, caffeine_mg)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (rec.user_id, rec.ts.isoformat(), rec.items, json.dumps(rec.tags),
             rec.calories, rec.caffeine_mg)
        )

def insert_symptom(rec: SymptomIn):
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO symptoms (user_id, date, type, severity, onset_time, duration_min, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (rec.user_id, rec.date.isoformat(), rec.type, rec.severity,
             rec.onset_time.isoformat() if rec.onset_time else None,
             rec.duration_min, rec.notes)
        )

##############################
# 3) FEATURE ENGINEERING     #
##############################

ROLL_DAYS = 7      # rolling window features
SEQ_LEN   = 14     # sequence length for deep model

def build_fs_daily(user_id: str, start_date: str, end_date: str):
    """Materialize daily tabular features + labels per user."""
    with get_conn() as conn:
        # pull source tables
        meals = pd.read_sql_query(
            "SELECT date(ts) as date, SUM(caffeine_mg) AS caffeine, COUNT(*) AS meals_cnt "
            "FROM meals WHERE user_id=? GROUP BY date(ts)", conn, params=[user_id]
        )
        sleep = pd.read_sql_query(
            "SELECT date(end_time) as date, SUM(total_min) AS sleep_min, AVG(sleep_score) as sleep_score "
            "FROM sleep_sessions WHERE user_id=? GROUP BY date(end_time)", conn, params=[user_id]
        )
        vitals = pd.read_sql_query(
            "SELECT date as date, hrv_ms, steps FROM vitals WHERE user_id=?", conn, params=[user_id]
        )
        stress = pd.read_sql_query(
            "SELECT date, stress FROM daily_logs WHERE user_id=?", conn, params=[user_id]
        )
        mood = pd.read_sql_query(
            "SELECT date, mood FROM daily_logs WHERE user_id=?", conn, params=[user_id]
        )
        gut = pd.read_sql_query(
            "SELECT date, MAX(severity) AS gut_sev FROM symptoms WHERE user_id=? AND type='gut' GROUP BY date",
            conn, params=[user_id]
        )
        skin = pd.read_sql_query(
            "SELECT date, MAX(severity) AS skin_sev FROM symptoms WHERE user_id=? AND type='skin' GROUP BY date",
            conn, params=[user_id]
        )

    # date frame
    idx = pd.date_range(pd.to_datetime(start_date), pd.to_datetime(end_date), freq="D")
    df = pd.DataFrame(index=idx.normalize()).assign(date=lambda d: d.index.date)

    def merge_on_date(df, other, cols):
        other = other.copy()
        other['date'] = pd.to_datetime(other['date']).dt.date
        return df.merge(other[['date', *cols]], on='date', how='left')

    for other, cols in [
        (meals, ['caffeine','meals_cnt']),
        (sleep, ['sleep_min','sleep_score']),
        (vitals, ['hrv_ms','steps']),
        (stress, ['stress']),
        (mood, ['mood']),
        (gut, ['gut_sev']),
        (skin, ['skin_sev']),
    ]:
        df = merge_on_date(df, other, cols)

    df = df.sort_values('date')
    # fillna sensible defaults
    df[['caffeine','meals_cnt','sleep_min','steps','hrv_ms']] = \
        df[['caffeine','meals_cnt','sleep_min','steps','hrv_ms']].fillna(0)
    df[['sleep_score','stress','mood']] = df[['sleep_score','stress','mood']].fillna(df[['sleep_score','stress','mood']].median())
    df[['gut_sev','skin_sev']] = df[['gut_sev','skin_sev']].fillna(0)

    # rolling features
    dfr = df.copy()
    for col in ['caffeine','sleep_min','sleep_score','hrv_ms','steps','stress','mood','gut_sev','skin_sev']:
        dfr[f'{col}_rmean_{ROLL_DAYS}'] = dfr[col].rolling(ROLL_DAYS, min_periods=1).mean()
        dfr[f'{col}_rstd_{ROLL_DAYS}']  = dfr[col].rolling(ROLL_DAYS, min_periods=1).std().fillna(0)
        dfr[f'{col}_lag1'] = dfr[col].shift(1)

    # labels for next-day risk (binary example: severity>=5 tomorrow)
    dfr['y_gut_next']  = (dfr['gut_sev'].shift(-1)  >= 5).astype(int)
    dfr['y_skin_next'] = (dfr['skin_sev'].shift(-1) >= 5).astype(int)
    dfr['y_mood_next'] = (dfr['mood'].shift(-1)     <= 2).astype(int)  # “low mood” tomorrow

    # persist to fs_daily_user
    out = dfr.copy()
    with get_conn() as conn:
        for _, row in out.iterrows():
            feats = row.filter(regex=r'(rmean|rstd|lag1|^caffeine$|^sleep_min$|^sleep_score$|^hrv_ms$|^steps$|^stress$|^mood$|^gut_sev$|^skin_sev$)').to_dict()
            labels = {
                "gut":  int(row['y_gut_next'])  if not math.isnan(row['y_gut_next'])  else None,
                "skin": int(row['y_skin_next']) if not math.isnan(row['y_skin_next']) else None,
                "mood": int(row['y_mood_next']) if not math.isnan(row['y_mood_next']) else None,
            }
            conn.execute(
                """INSERT OR REPLACE INTO fs_daily_user (user_id, date, features_json, labels_json)
                   VALUES (?, ?, ?, ?)""",
                (user_id, pd.to_datetime(row['date']).date().isoformat(),
                 json.dumps(feats), json.dumps(labels))
            )

def build_fs_seq(user_id: str, start_date: str, end_date: str, seq_len: int = SEQ_LEN):
    """Create N-day sequences for deep model (X[t-seq+1:t], Y[t+1])."""
    with get_conn() as conn:
        df = pd.read_sql_query(
            "SELECT date, features_json, labels_json FROM fs_daily_user WHERE user_id=? AND date BETWEEN ? AND ? ORDER BY date",
            conn, params=[user_id, start_date, end_date]
        )
    if df.empty: return
    feats = df['features_json'].apply(json.loads).to_list()
    X = pd.DataFrame(feats).values.astype(np.float32)
    dates = pd.to_datetime(df['date']).dt.date.values
    labels = df['labels_json'].apply(json.loads).to_list()

    sequences = []
    for i in range(len(X) - seq_len - 1):
        x_seq = X[i:i+seq_len]
        y = labels[i+seq_len]  # next-day label dictionary
        sequences.append((dates[i+seq_len], x_seq, y))

    with get_conn() as conn:
        for d, x, y in sequences:
            conn.execute(
                "INSERT OR REPLACE INTO fs_seq_user (user_id, date, seq_json) VALUES (?, ?, ?)",
                (user_id, d.isoformat(), json.dumps({"X": x.tolist(), "Y": y}))
            )

##############################
# 4) TABULAR RISK CLASSIFIER #
##############################

def train_tabular_trigger(user_id: str, target: str = "gut"):
    """Train a simple logistic regression for same-day quick scoring."""
    with get_conn() as conn:
        df = pd.read_sql_query(
            "SELECT date, features_json, labels_json FROM fs_daily_user WHERE user_id=? ORDER BY date",
            conn, params=[user_id]
        )
    if df.empty: 
        print("No features found."); 
        return None

    X = pd.DataFrame(df['features_json'].apply(json.loads).to_list())
    y = df['labels_json'].apply(json.loads).apply(lambda d: d.get(target)).astype(float)
    mask = y.notna()
    X, y = X[mask], y[mask]

    # temporal CV
    tscv = TimeSeriesSplit(n_splits=3)
    best_auc = -1
    best_clf = None

    for train_idx, test_idx in tscv.split(X):
        pipe = Pipeline([
            ("scaler", StandardScaler(with_mean=False)),
            ("lr", LogisticRegression(max_iter=1000))
        ])
        pipe.fit(X.iloc[train_idx], y.iloc[train_idx])
        prob = pipe.predict_proba(X.iloc[test_idx])[:,1]
        auc  = roc_auc_score(y.iloc[test_idx], prob)
        if auc > best_auc:
            best_auc = auc
            best_clf = pipe

    print(f"[{target}] Tabular AUC (TS-CV): {best_auc:.3f}")
    return best_clf

################################
# 5) SEQUENCE MODEL (PyTorch)  #
################################

class SeqDataset(Dataset):
    def __init__(self, rows):
        self.rows = rows
    def __len__(self): return len(self.rows)
    def __getitem__(self, idx):
        item = self.rows[idx]
        X = np.array(item['X'], dtype=np.float32)        # (T, F)
        y = np.array([item['Y'].get('gut') is not None and int(item['Y']['gut'])], dtype=np.float32)
        return torch.from_numpy(X), torch.from_numpy(y)

class LSTMHead(nn.Module):
    def __init__(self, in_dim, hidden=64):
        super().__init__()
        self.lstm = nn.LSTM(input_size=in_dim, hidden_size=hidden, num_layers=1, batch_first=True)
        self.head = nn.Sequential(nn.Linear(hidden, 32), nn.ReLU(), nn.Linear(32, 1))
    def forward(self, x):
        out, _ = self.lstm(x)
        h = out[:, -1, :]
        return self.head(h).squeeze(1)

def load_seq_rows(user_id: str, target: str = "gut") -> List[Dict[str,Any]]:
    with get_conn() as conn:
        df = pd.read_sql_query("SELECT seq_json FROM fs_seq_user WHERE user_id=? ORDER BY date", conn, params=[user_id])
    rows = []
    for j in df['seq_json']:
        blob = json.loads(j)
        # keep if label present
        if blob["Y"].get(target) is not None:
            rows.append({"X": blob["X"], "Y": blob["Y"]})
    return rows

def train_sequence_model(user_id: str, target: str = "gut", epochs: int = 5, lr: float = 1e-3):
    rows = load_seq_rows(user_id, target)
    if len(rows) < 30:
        print("Not enough sequence rows yet.")
        return None
    # infer feature dim
    F = len(rows[0]["X"][0])
    ds = SeqDataset(rows)
    dl = DataLoader(ds, batch_size=32, shuffle=True)
    model = LSTMHead(in_dim=F)
    optim = torch.optim.Adam(model.parameters(), lr=lr)
    bce = nn.BCEWithLogitsLoss()

    model.train()
    for ep in range(epochs):
        losses = []
        for X, y in dl:
            logits = model(X)
            loss = bce(logits, y.squeeze(1))
            optim.zero_grad(); loss.backward(); optim.step()
            losses.append(loss.item())
        print(f"[{target}] Epoch {ep+1}/{epochs} loss: {np.mean(losses):.4f}")
    return model

##############################
# 6) PREDICTION ENTRYPOINTS  #
##############################

def predict_today_trigger(clf, feature_row: Dict[str, float]) -> float:
    X = pd.DataFrame([feature_row])
    return float(clf.predict_proba(X)[0,1])

def predict_seq_next(model, X_seq: np.ndarray) -> float:
    with torch.no_grad():
        logits = model(torch.from_numpy(X_seq[None, ...].astype(np.float32)))
        prob = torch.sigmoid(logits).item()
    return float(prob)

##############################
# 7) EXAMPLE ORCHESTRATION   #
##############################

def nightly(user_id: str, start_date: str, end_date: str):
    init_db()
    build_fs_daily(user_id, start_date, end_date)
    build_fs_seq(user_id, start_date, end_date)

    gut_clf = train_tabular_trigger(user_id, "gut")
    skin_clf = train_tabular_trigger(user_id, "skin")
    mood_clf = train_tabular_trigger(user_id, "mood")

    gut_seq = train_sequence_model(user_id, "gut", epochs=3)
    # skin_seq, mood_seq → similar calls (after you switch labels in SeqDataset)

    # Here you’d persist models with joblib/torch.save and schedule with cron/Prefect/Airflow.
    return dict(gut_clf=gut_clf, skin_clf=skin_clf, mood_clf=mood_clf, gut_seq=gut_seq)

if __name__ == "__main__":
    # Tiny demo window — replace with real dates
    uid = "user_001"
    init_db()
    # (You’d ingest data before this; omitted for brevity.)
    nightly(uid, "2025-06-01", "2025-10-03")
