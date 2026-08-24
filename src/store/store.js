import { configureStore } from '@reduxjs/toolkit';
import activitiesReducer from './activitiesSlice';
import dashboardReducer from './dashboardSlice';
import contributorReducer from './contributorSlice';
import citizenReducer from './citizenSlice';

const store = configureStore({
  reducer: {
    activities: activitiesReducer,
    dashboard: dashboardReducer,
    contributor: contributorReducer,
    citizen: citizenReducer,
  },
});

export default store;
