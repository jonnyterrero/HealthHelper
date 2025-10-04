/**
 * AI Client - Interface to Python AI Backend
 * ==========================================
 * Client library for communicating with the Python FastAPI backend
 */

export interface PredictionRequest {
  user_id: string;
  date: string;
}

export interface PredictionResponse {
  user_id: string;
  date: string;
  predictions: Record<string, number>;
  explanations: Record<string, Record<string, number>>;
  confidence: Record<string, number>;
  recommendations: string[];
}

export interface HealthDataRequest {
  user_id: string;
  data_type: 'daily_log' | 'symptom' | 'meal' | 'sleep' | 'workout' | 'vital' | 'journal';
  data: Record<string, any>;
}

export interface FeatureRebuildRequest {
  user_id: string;
  start_date: string;
  end_date: string;
}

export interface ModelTrainRequest {
  user_id: string;
  targets?: string[];
}

class AIClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/ai') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get AI predictions for a specific date
   */
  async getPredictions(request: PredictionRequest): Promise<PredictionResponse> {
    const response = await fetch(`${this.baseUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to get predictions: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Ingest health data
   */
  async ingestData(request: HealthDataRequest): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to ingest data: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Rebuild features for a date range
   */
  async rebuildFeatures(request: FeatureRebuildRequest): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to rebuild features: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get features for a specific date
   */
  async getFeatures(userId: string, date: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/features?user_id=${userId}&date=${date}`);

    if (!response.ok) {
      throw new Error(`Failed to get features: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Train models for a user
   */
  async trainModels(request: ModelTrainRequest): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to train models: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get analytics summary
   */
  async getAnalytics(userId: string, type: 'summary' | 'trends' = 'summary', days?: number): Promise<any> {
    let url = `${this.baseUrl}/analytics?user_id=${userId}&type=${type}`;
    if (days) {
      url += `&days=${days}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get analytics: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Batch ingest multiple data points
   */
  async batchIngest(userId: string, dataPoints: Array<{ type: string; data: any }>): Promise<void> {
    const promises = dataPoints.map(point =>
      this.ingestData({
        user_id: userId,
        data_type: point.type as any,
        data: point.data,
      })
    );

    await Promise.all(promises);
  }

  /**
   * Full sync: ingest data, rebuild features, and get predictions
   */
  async fullSync(
    userId: string,
    dataPoints: Array<{ type: string; data: any }>,
    date: string
  ): Promise<PredictionResponse> {
    // 1. Ingest all data
    await this.batchIngest(userId, dataPoints);

    // 2. Rebuild features for the date
    await this.rebuildFeatures({
      user_id: userId,
      start_date: date,
      end_date: date,
    });

    // 3. Get predictions
    return this.getPredictions({
      user_id: userId,
      date,
    });
  }
}

// Export singleton instance
export const aiClient = new AIClient();

// Export class for custom instances
export { AIClient };