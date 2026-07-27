import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet } from '../services/api';

/* ── Thunk ───────────────────────────────────────────────────────────────── */

export const fetchUserLists = createAsyncThunk(
  'users/fetchLists',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiGet('/api/dashboard/users');
      if (!data.ok) return rejectWithValue('Failed to load user lists');
      return { verifiers: data.verifiers, contributors: data.contributors };
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  },
  {
    condition: (_, { getState }) => {
      const { users } = getState();
      return users.status !== 'succeeded' && users.status !== 'loading';
    }
  }
);

/* ── Slice ───────────────────────────────────────────────────────────────── */

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    verifiers: [],
    contributors: [],
    status: 'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    invalidateUsers(state) {
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserLists.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUserLists.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.verifiers = action.payload.verifiers;
        state.contributors = action.payload.contributors;
      })
      .addCase(fetchUserLists.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { invalidateUsers } = usersSlice.actions;
export default usersSlice.reducer;
