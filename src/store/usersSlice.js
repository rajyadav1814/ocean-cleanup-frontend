import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPatch } from '../services/api';

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

export const toggleUserActiveStatus = createAsyncThunk(
  'users/toggleActive',
  async ({ id, active }, { rejectWithValue }) => {
    try {
      const data = await apiPatch(`/api/dashboard/users/${id}/active`, { active });
      if (!data.ok) return rejectWithValue(data.error || 'Failed to update user status');
      return { user: data.user };
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
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
      })
      .addCase(toggleUserActiveStatus.fulfilled, (state, action) => {
        const updatedUser = action.payload.user;
        const updateList = (list) => {
          const index = list.findIndex((user) => user.id === updatedUser.id);
          if (index !== -1) {
            list[index] = { ...list[index], active: updatedUser.active };
          }
        };

        updateList(state.verifiers);
        updateList(state.contributors);
      })
      .addCase(toggleUserActiveStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { invalidateUsers } = usersSlice.actions;
export default usersSlice.reducer;
