import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet } from '../services/api';

/* ── Thunks ──────────────────────────────────────────────────────────────── */

// Skip the API call if data is already loaded — prevents re-fetching every
// time the contributor overview page mounts (e.g. switching sidebar tabs).
export const fetchContributorStats = createAsyncThunk(
  'contributor/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiGet('/api/contributor/stats');
      if (!data.ok || !data.stats) return rejectWithValue(data.error || 'Failed to load stats');
      return data.stats;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
  {
    condition: (_, { getState }) => {
      const { contributor } = getState();
      return contributor.statsStatus !== 'succeeded' && contributor.statsStatus !== 'loading';
    }
  }
);

export const fetchContributorInsights = createAsyncThunk(
  'contributor/fetchInsights',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiGet('/api/contributor/insights');
      if (!data.ok || !data.insights) return rejectWithValue(data.error || 'Failed to load insights');
      return data.insights;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
  {
    condition: (_, { getState }) => {
      const { contributor } = getState();
      return contributor.insightsStatus !== 'succeeded' && contributor.insightsStatus !== 'loading';
    }
  }
);

/* ── Slice ───────────────────────────────────────────────────────────────── */

const contributorSlice = createSlice({
  name: 'contributor',
  initialState: {
    stats: null,
    statsStatus: 'idle',    // 'idle' | 'loading' | 'succeeded' | 'failed'
    statsError: null,
    insights: null,
    insightsStatus: 'idle',
    insightsError: null,
  },
  reducers: {
    // Force a re-fetch on next mount (call after submitting/editing/deleting an activity)
    invalidateContributorStats(state) {
      state.statsStatus = 'idle';
      state.insightsStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContributorStats.pending, (state) => {
        state.statsStatus = 'loading';
        state.statsError = null;
      })
      .addCase(fetchContributorStats.fulfilled, (state, action) => {
        state.statsStatus = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(fetchContributorStats.rejected, (state, action) => {
        state.statsStatus = 'failed';
        state.statsError = action.payload;
      })
      .addCase(fetchContributorInsights.pending, (state) => {
        state.insightsStatus = 'loading';
        state.insightsError = null;
      })
      .addCase(fetchContributorInsights.fulfilled, (state, action) => {
        state.insightsStatus = 'succeeded';
        state.insights = action.payload;
      })
      .addCase(fetchContributorInsights.rejected, (state, action) => {
        state.insightsStatus = 'failed';
        state.insightsError = action.payload;
      });
  },
});

export const { invalidateContributorStats } = contributorSlice.actions;
export default contributorSlice.reducer;
