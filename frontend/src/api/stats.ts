import { api } from './client';

export interface StatsData {
  total: number;
  successful: number;
  failed: number;
  paused: number;
  avgExecutionTime: number;
  slowestStep?: {
    nodeType: string;
    duration: number;
  };
  runsOverTime: Array<{
    time: string;
    value: number;
  }>;
  recentActivity: Array<{
    userName: string;
    action: string;
    time: string;
  }>;
  totalChange?: number;
  successfulChange?: number;
  failedChange?: number;
  pausedChange?: number;
}

export interface RunsOverTimeResponse {
  data: Array<{
    date: string;
    count: number;
  }>;
}

export const statsApi = {
  async getStats(): Promise<StatsData> {
    const response = await api.get('/stats');
    return response.data;
  },

  async getRunsOverTime(): Promise<RunsOverTimeResponse> {
    const response = await api.get('/stats/runs-over-time');
    return response.data;
  },

  async getRecentActivity(): Promise<Array<{
    userName: string;
    action: string;
    time: string;
  }>> {
    const response = await api.get('/stats/recent-activity');
    return response.data;
  },
};
