import { configureStore } from '@reduxjs/toolkit';
import activitiesReducer from './activitiesSlice';
import dashboardReducer from './dashboardSlice';

const store = configureStore({
  reducer: {
    activities: activitiesReducer,
    dashboard: dashboardReducer,
  },
});

export default store;
