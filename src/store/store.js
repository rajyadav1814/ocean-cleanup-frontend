import { configureStore } from '@reduxjs/toolkit';
import activitiesReducer from './activitiesSlice';
import dashboardReducer from './dashboardSlice';
import usersReducer from './usersSlice';

const store = configureStore({
  reducer: {
    activities: activitiesReducer,
    dashboard: dashboardReducer,
    users: usersReducer,
  },
});

export default store;
