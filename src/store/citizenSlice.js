import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { citizenApi } from '../services/api';

/* ── Thunks ──────────────────────────────────────────────────────────────── */

// Skip the API call if data is already loaded — prevents re-fetching every
// time the citizen overview page mounts (e.g. switching sidebar tabs).
export const fetchCitizenStats = createAsyncThunk(
  'citizen/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const data = await citizenApi.getStats();
      if (!data.ok) return rejectWithValue(data.error || 'Failed to load stats');
      return data.stats;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
  {
    condition: (_, { getState }) => {
      const { citizen } = getState();
      return citizen.statsStatus !== 'succeeded' && citizen.statsStatus !== 'loading';
    }
  }
);

export const fetchCitizenLeaderboard = createAsyncThunk(
  'citizen/fetchLeaderboard',
  async (_, { rejectWithValue }) => {
    try {
      const data = await citizenApi.getLeaderboard();
      if (!data.ok) return rejectWithValue(data.error || 'Failed to load leaderboard');
      return { leaderboard: data.leaderboard || [], myRow: data.myRow || null };
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
  {
    condition: (_, { getState }) => {
      const { citizen } = getState();
      return citizen.leaderboardStatus !== 'succeeded' && citizen.leaderboardStatus !== 'loading';
    }
  }
);

export const fetchCitizenFeed = createAsyncThunk(
  'citizen/fetchFeed',
  async (limit = 15, { rejectWithValue }) => {
    try {
      const data = await citizenApi.getFeed(limit);
      if (!data.ok) return rejectWithValue(data.error || 'Failed to load feed');
      return data.feed || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
  {
    condition: (_, { getState }) => {
      const { citizen } = getState();
      return citizen.feedStatus !== 'succeeded' && citizen.feedStatus !== 'loading';
    }
  }
);

/* ── Slice ───────────────────────────────────────────────────────────────── */

const citizenSlice = createSlice({
  name: 'citizen',
  initialState: {
    stats: null,
    statsStatus: 'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
    statsError: null,
    leaderboard: [],
    myRow: null,
    leaderboardStatus: 'idle',
    feed: [],
    feedStatus: 'idle',
  },
  reducers: {
    // Force a re-fetch on next mount (call after submitting/editing/deleting an activity)
    invalidateCitizenStats(state) {
      state.statsStatus = 'idle';
      state.leaderboardStatus = 'idle';
      state.feedStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCitizenStats.pending, (state) => {
        state.statsStatus = 'loading';
        state.statsError = null;
      })
      .addCase(fetchCitizenStats.fulfilled, (state, action) => {
        state.statsStatus = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(fetchCitizenStats.rejected, (state, action) => {
        state.statsStatus = 'failed';
        state.statsError = action.payload;
      })
      .addCase(fetchCitizenLeaderboard.pending, (state) => {
        state.leaderboardStatus = 'loading';
      })
      .addCase(fetchCitizenLeaderboard.fulfilled, (state, action) => {
        state.leaderboardStatus = 'succeeded';
        state.leaderboard = action.payload.leaderboard;
        state.myRow = action.payload.myRow;
      })
      .addCase(fetchCitizenLeaderboard.rejected, (state) => {
        state.leaderboardStatus = 'failed';
      })
      .addCase(fetchCitizenFeed.pending, (state) => {
        state.feedStatus = 'loading';
      })
      .addCase(fetchCitizenFeed.fulfilled, (state, action) => {
        state.feedStatus = 'succeeded';
        state.feed = action.payload;
      })
      .addCase(fetchCitizenFeed.rejected, (state) => {
        state.feedStatus = 'failed';
      });
  },
});

export const { invalidateCitizenStats } = citizenSlice.actions;
export default citizenSlice.reducer;
