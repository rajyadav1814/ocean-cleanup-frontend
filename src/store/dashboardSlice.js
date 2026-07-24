import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet } from '../services/api';

/* ── Thunk ───────────────────────────────────────────────────────────────── */

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiGet('/api/dashboard/stats');
      if (!data.ok) return rejectWithValue('Failed to load stats');
      return data.stats;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
  {
    // Skip if already loaded
    condition: (_, { getState }) => {
      const { dashboard } = getState();
      return dashboard.status !== 'succeeded' && dashboard.status !== 'loading';
    }
  }
);

/* ── Slice ───────────────────────────────────────────────────────────────── */

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
    status: 'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    invalidateDashboard(state) {
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { invalidateDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
