import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPost } from '../services/api';

/* ── Thunks ──────────────────────────────────────────────────────────────── */

// Only fetch if data hasn't been loaded yet (prevents re-fetch on tab switch)
export const fetchActivities = createAsyncThunk(
  'activities/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiGet('/api/activities');
      return data.activities || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
  {
    // Skip the API call if data is already loaded
    condition: (_, { getState }) => {
      const { activities } = getState();
      return activities.status !== 'succeeded' && activities.status !== 'loading';
    }
  }
);

export const reviewActivityThunk = createAsyncThunk(
  'activities/review',
  async ({ id, status, reviewNote = '' }, { rejectWithValue }) => {
    try {
      const data = await apiPost(`/api/activities/${id}/review`, { status, reviewNote });
      if (!data.ok) return rejectWithValue('Review failed');
      return data.activity;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

/* ── Slice ───────────────────────────────────────────────────────────────── */

const activitiesSlice = createSlice({
  name: 'activities',
  initialState: {
    items: [],
    status: 'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    // Force a re-fetch on next mount (call after submit)
    invalidateActivities(state) {
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchActivities
      .addCase(fetchActivities.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // reviewActivityThunk — optimistically update the item
      .addCase(reviewActivityThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.items.findIndex((a) => a.id === updated.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...updated };
      });
  },
});

export const { invalidateActivities } = activitiesSlice.actions;
export default activitiesSlice.reducer;
