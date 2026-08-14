import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPatch } from '../services/api';

/* ── Thunk ───────────────────────────────────────────────────────────────── */

export const fetchUserLists = createAsyncThunk(
  'users/fetchLists',
  async (_, { rejectWithValue }) => {
    try {
      const [usersData, orgsData] = await Promise.all([
        apiGet('/api/dashboard/users'),
        apiGet('/api/dashboard/organizations')
      ]);
      if (!usersData.ok) return rejectWithValue('Failed to load user lists');
      const orgMap = {};
      if (orgsData.ok && orgsData.organizations) {
        orgsData.organizations.forEach(org => { orgMap[org.orgId] = org.name; });
      }
      return { verifiers: usersData.verifiers, contributors: usersData.contributors, admins: usersData.admins, citizens: usersData.citizens, orgMap };
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
    admins: [],
    citizens: [],
    orgMap: {},
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
        state.admins = action.payload.admins;
        state.citizens = action.payload.citizens;
        state.orgMap = action.payload.orgMap || {};
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
        updateList(state.admins);
        updateList(state.citizens);
      })
      .addCase(toggleUserActiveStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { invalidateUsers } = usersSlice.actions;
export default usersSlice.reducer;
