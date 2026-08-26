import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet } from '../services/api';

/* ── Thunks ──────────────────────────────────────────────────────────────── */

// Same "fetch once per session" pattern as activitiesSlice/contributorSlice —
// the events list is read-only here, so a single page is cached globally
// rather than re-fetched on every dashboard mount.
export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (contributorId, { rejectWithValue }) => {
    try {
      const scope = contributorId ? `&contributorId=${encodeURIComponent(contributorId)}` : '';
      const data = await apiGet(`/api/events?limit=200${scope}`);
      if (!data.ok || !data.events) return rejectWithValue(data.error || 'Failed to load events');
      return data.events;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
  {
    condition: (_, { getState }) => {
      const { events } = getState();
      return events.status !== 'succeeded' && events.status !== 'loading';
    }
  }
);

/* ── Slice ───────────────────────────────────────────────────────────────── */

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    invalidateEvents(state) {
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { invalidateEvents } = eventsSlice.actions;
export default eventsSlice.reducer;
