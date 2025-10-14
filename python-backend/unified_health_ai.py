#!/usr/bin/env python3
"""
Unified Health AI System - Core Database and Models
"""

import sqlite3
import json
import math
import time
import datetime as dt
from pathlib import Path
from typing import List, Optional, Dict, Any, Union
import hashlib

import numpy as np
import pandas as pd
from pydantic import BaseModel, Field, validator
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score, brier_score_loss, classification_report
import joblib

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

# Configuration
DB_PATH = Path("unified_health.db")
ROLL_DAYS = 7      # rolling window features
SEQ_LEN = 14       # sequence length for deep model
BATCH_SIZE = 32
LEARNING_RATE = 1e-3
EPOCHS = 10

############################
# 1) DATABASE SCHEMA       #
############################

DDL = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- Core entities
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  timezone TEXT DEFAULT 'UTC',
  preferences TEXT  -- JSON preferences
);

CREATE TABLE IF NOT EXISTS apps (
  app_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT,
  api_endpoint TEXT
);

CREATE TABLE IF NOT EXISTS events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_time TEXT NOT NULL,
  payload_hash TEXT,
  raw_json TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (app_id) REFERENCES apps(app_id)
);

-- Health/time-series data
CREATE TABLE IF NOT EXISTS daily_logs (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  stress INTEGER CHECK (stress >= 1 AND stress <= 10),
  energy INTEGER CHECK (energy >= 1 AND energy <= 10),
  focus INTEGER CHECK (focus >= 1 AND focus <= 10),
  notes TEXT,
  journal_entry TEXT,
  coping_strategies TEXT,  -- JSON array
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS symptoms (
  symptom_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'gut', 'skin', 'headache', 'fatigue', 'migraine'
  severity INTEGER CHECK (severity >= 0 AND severity <= 10),
  onset_time TEXT,
  duration_min INTEGER,
  location TEXT,
  triggers TEXT,  -- JSON array
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS meals (
  meal_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  items TEXT,
  tags TEXT,  -- JSON array like ["spicy", "dairy", "gluten"]
  calories INTEGER,
  caffeine_mg INTEGER,
  protein_g REAL,
  carbs_g REAL,
  fat_g REAL,
  fiber_g REAL,
  sugar_g REAL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS sleep_sessions (
  sleep_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  total_min INTEGER,
  deep_min INTEGER,
  light_min INTEGER,
  rem_min INTEGER,
  awake_min INTEGER,
  awakenings INTEGER,
  sleep_score REAL CHECK (sleep_score >= 1 AND sleep_score <= 10),
  sleep_factors TEXT,  -- JSON object
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS workouts (
  workout_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  type TEXT,  -- 'run', 'weights', 'yoga', 'cycling', 'swimming'
  duration_min INTEGER,
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
  calories_burned INTEGER,
  heart_rate_avg INTEGER,
  heart_rate_max INTEGER,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS vitals (
  vital_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  hr_mean REAL,
  hr_max REAL,
  hrv_ms REAL,
  spo2 REAL,
  steps INTEGER,
  active_min INTEGER,
  calories_burned INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS medications (
  med_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,  -- 'prescription', 'otc', 'supplement'
  instructions TEXT,
  side_effects TEXT,  -- JSON array
  interactions TEXT   -- JSON array
);

CREATE TABLE IF NOT EXISTS med_adherence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  med_code TEXT NOT NULL,
  ts TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('taken', 'missed', 'late', 'skipped')),
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (med_code) REFERENCES medications(med_code)
);

CREATE TABLE IF NOT EXISTS remedies (
  remedy_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,  -- 'dietary', 'lifestyle', 'supplement', 'exercise'
  effectiveness_score REAL CHECK (effectiveness_score >= 0 AND effectiveness_score <= 10),
  usage_count INTEGER DEFAULT 0,
  conditions TEXT,  -- JSON array of conditions it helps
  instructions TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS remedy_usage (
  usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  remedy_id INTEGER NOT NULL,
  ts TEXT NOT NULL,
  effectiveness REAL CHECK (effectiveness >= 0 AND effectiveness <= 10),
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (remedy_id) REFERENCES remedies(remedy_id)
);

-- Vision/NLP data
CREATE TABLE IF NOT EXISTS images (
  image_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  path TEXT NOT NULL,
  body_region TEXT,  -- 'face', 'arms', 'torso', 'legs'
  lighting TEXT,
  camera_info TEXT,  -- JSON object
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS image_labels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_id INTEGER NOT NULL,
  lesion_area_px INTEGER,
  delta_e REAL,
  erythema_idx REAL,
  severity REAL CHECK (severity >= 0 AND severity <= 10),
  mask_path TEXT,
  features_json TEXT,  -- JSON object with computed features
  FOREIGN KEY (image_id) REFERENCES images(image_id)
);

CREATE TABLE IF NOT EXISTS journals (
  journal_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  text TEXT NOT NULL,
  mood_context INTEGER CHECK (mood_context >= 1 AND mood_context <= 10),
  stress_context INTEGER CHECK (stress_context >= 1 AND stress_context <= 10),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS journal_nlp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_id INTEGER NOT NULL,
  sentiment REAL CHECK (sentiment >= -1 AND sentiment <= 1),
  topics TEXT,  -- JSON array
  embedding BLOB,
  keywords TEXT,  -- JSON array
  FOREIGN KEY (journal_id) REFERENCES journals(journal_id)
);

CREATE TABLE IF NOT EXISTS device_sync (
  sync_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,  -- 'fitbit', 'apple_health', 'google_fit'
  token_metadata TEXT,  -- JSON object
  last_sync_at TEXT,
  sync_status TEXT DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Feature store (materialized)
CREATE TABLE IF NOT EXISTS fs_daily_user (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  features_json TEXT NOT NULL,
  labels_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS fs_seq_user (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,  -- sequence ending at this date
  seq_json TEXT NOT NULL,  -- {"X": [[...],[...],...], "Y": {...}}
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS fs_vision (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  lesion_features_json TEXT NOT NULL,
  severity_score REAL,
  trend_direction TEXT,  -- 'improving', 'stable', 'worsening'
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS fs_text (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  sentiment_avg REAL,
  topics_json TEXT,  -- JSON array
  embedding_avg BLOB,
  word_count INTEGER,
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Model storage
CREATE TABLE IF NOT EXISTS model_versions (
  model_id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_type TEXT NOT NULL,  -- 'tabular', 'sequence', 'vision', 'nlp'
  target TEXT NOT NULL,  -- 'gut', 'skin', 'mood'
  version TEXT NOT NULL,
  model_path TEXT NOT NULL,
  metrics_json TEXT,  -- JSON object with performance metrics
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS predictions (
  prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  model_type TEXT NOT NULL,
  target TEXT NOT NULL,
  prediction REAL,
  confidence REAL,
  explanation_json TEXT,  -- JSON object with SHAP values
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_user_time ON events(user_id, event_time);
CREATE INDEX IF NOT EXISTS idx_symptoms_user_date ON symptoms(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meals_user_ts ON meals(user_id, ts);
CREATE INDEX IF NOT EXISTS idx_sleep_user_start ON sleep_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_predictions_user_date ON predictions(user_id, date);
"""

def get_conn():
    """Get database connection with proper settings."""
    conn = sqlite3.connect(DB_PATH.as_posix())
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with schema."""
    with get_conn() as conn:
        conn.executescript(DDL)
        print("✅ Database initialized successfully")

#########################
# 2) PYDANTIC MODELS    #
#########################

class UserIn(BaseModel):
    user_id: str
    timezone: str = "UTC"
    preferences: Optional[Dict[str, Any]] = None

class EventIn(BaseModel):
    user_id: str
    app_id: str
    event_type: str
    event_time: dt.datetime
    raw_json: Dict[str, Any]
    
    @validator('event_time')
    def validate_event_time(cls, v):
        if v > dt.datetime.now():
            raise ValueError('Event time cannot be in the future')
        return v

class DailyLogIn(BaseModel):
    user_id: str
    date: dt.date
    mood: Optional[int] = Field(None, ge=1, le=10)
    stress: Optional[int] = Field(None, ge=1, le=10)
    energy: Optional[int] = Field(None, ge=1, le=10)
    focus: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = None
    journal_entry: Optional[str] = None
    coping_strategies: Optional[List[str]] = None

class SymptomIn(BaseModel):
    user_id: str
    date: dt.date
    type: str
    severity: int = Field(ge=0, le=10)
    onset_time: Optional[dt.time] = None
    duration_min: Optional[int] = None
    location: Optional[str] = None
    triggers: Optional[List[str]] = None
    notes: Optional[str] = None

class MealIn(BaseModel):
    user_id: str
    ts: dt.datetime
    items: str
    tags: List[str] = []
    calories: Optional[int] = None
    caffeine_mg: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None

class SleepSessionIn(BaseModel):
    user_id: str
    start_time: dt.datetime
    end_time: dt.datetime
    total_min: Optional[int] = None
    deep_min: Optional[int] = None
    light_min: Optional[int] = None
    rem_min: Optional[int] = None
    awake_min: Optional[int] = None
    awakenings: Optional[int] = None
    sleep_score: Optional[float] = Field(None, ge=1, le=10)
    sleep_factors: Optional[Dict[str, bool]] = None
    notes: Optional[str] = None

class WorkoutIn(BaseModel):
    user_id: str
    ts: dt.datetime
    type: str
    duration_min: Optional[int] = None
    intensity: Optional[int] = Field(None, ge=1, le=5)
    calories_burned: Optional[int] = None
    heart_rate_avg: Optional[int] = None
    heart_rate_max: Optional[int] = None
    notes: Optional[str] = None

class VitalIn(BaseModel):
    user_id: str
    date: dt.date
    hr_mean: Optional[float] = None
    hr_max: Optional[float] = None
    hrv_ms: Optional[float] = None
    spo2: Optional[float] = None
    steps: Optional[int] = None
    active_min: Optional[int] = None
    calories_burned: Optional[int] = None

class JournalIn(BaseModel):
    user_id: str
    ts: dt.datetime
    text: str
    mood_context: Optional[int] = Field(None, ge=1, le=10)
    stress_context: Optional[int] = Field(None, ge=1, le=10)

#########################
# 3) DATA INGESTION      #
#########################

def calculate_payload_hash(payload: Dict[str, Any]) -> str:
    """Calculate hash for idempotency."""
    payload_str = json.dumps(payload, sort_keys=True)
    return hashlib.md5(payload_str.encode()).hexdigest()

def upsert_daily_log(log: DailyLogIn) -> int:
    """Upsert daily log entry."""
    with get_conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO daily_logs 
               (user_id, date, mood, stress, energy, focus, notes, journal_entry, coping_strategies)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (log.user_id, log.date.isoformat(), log.mood, log.stress, log.energy, 
             log.focus, log.notes, log.journal_entry, 
             json.dumps(log.coping_strategies) if log.coping_strategies else None)
        )
        return conn.total_changes

def insert_symptom(symptom: SymptomIn) -> int:
    """Insert symptom entry."""
    with get_conn() as conn:
        cursor = conn.execute(
            """INSERT INTO symptoms 
               (user_id, date, type, severity, onset_time, duration_min, location, triggers, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (symptom.user_id, symptom.date.isoformat(), symptom.type, symptom.severity,
             symptom.onset_time.isoformat() if symptom.onset_time else None,
             symptom.duration_min, symptom.location,
             json.dumps(symptom.triggers) if symptom.triggers else None,
             symptom.notes)
        )
        return cursor.lastrowid

def insert_meal(meal: MealIn) -> int:
    """Insert meal entry."""
    with get_conn() as conn:
        cursor = conn.execute(
            """INSERT INTO meals 
               (user_id, ts, items, tags, calories, caffeine_mg, protein_g, carbs_g, fat_g, fiber_g, sugar_g)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (meal.user_id, meal.ts.isoformat(), meal.items, json.dumps(meal.tags),
             meal.calories, meal.caffeine_mg, meal.protein_g, meal.carbs_g, 
             meal.fat_g, meal.fiber_g, meal.sugar_g)
        )
        return cursor.lastrowid

def insert_sleep_session(sleep: SleepSessionIn) -> int:
    """Insert sleep session entry."""
    with get_conn() as conn:
        cursor = conn.execute(
            """INSERT INTO sleep_sessions 
               (user_id, start_time, end_time, total_min, deep_min, light_min, rem_min, 
                awake_min, awakenings, sleep_score, sleep_factors, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (sleep.user_id, sleep.start_time.isoformat(), sleep.end_time.isoformat(),
             sleep.total_min, sleep.deep_min, sleep.light_min, sleep.rem_min,
             sleep.awake_min, sleep.awakenings, sleep.sleep_score,
             json.dumps(sleep.sleep_factors) if sleep.sleep_factors else None,
             sleep.notes)
        )
        return cursor.lastrowid

def insert_workout(workout: WorkoutIn) -> int:
    """Insert workout entry."""
    with get_conn() as conn:
        cursor = conn.execute(
            """INSERT INTO workouts 
               (user_id, ts, type, duration_min, intensity, calories_burned, heart_rate_avg, heart_rate_max, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (workout.user_id, workout.ts.isoformat(), workout.type, workout.duration_min,
             workout.intensity, workout.calories_burned, workout.heart_rate_avg,
             workout.heart_rate_max, workout.notes)
        )
        return cursor.lastrowid

def insert_vital(vital: VitalIn) -> int:
    """Insert vital signs entry."""
    with get_conn() as conn:
        cursor = conn.execute(
            """INSERT INTO vitals 
               (user_id, date, hr_mean, hr_max, hrv_ms, spo2, steps, active_min, calories_burned)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (vital.user_id, vital.date.isoformat(), vital.hr_mean, vital.hr_max,
             vital.hrv_ms, vital.spo2, vital.steps, vital.active_min, vital.calories_burned)
        )
        return cursor.lastrowid

def insert_journal(journal: JournalIn) -> int:
    """Insert journal entry."""
    with get_conn() as conn:
        cursor = conn.execute(
            """INSERT INTO journals 
               (user_id, ts, text, mood_context, stress_context)
               VALUES (?, ?, ?, ?, ?)""",
            (journal.user_id, journal.ts.isoformat(), journal.text,
             journal.mood_context, journal.stress_context)
        )
        return cursor.lastrowid

if __name__ == "__main__":
    init_db()
    print("✅ Unified Health AI database initialized")