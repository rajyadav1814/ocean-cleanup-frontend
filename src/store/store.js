import { configureStore } from '@reduxjs/toolkit';
import activitiesReducer from './activitiesSlice';
import dashboardReducer from './dashboardSlice';
import usersReducer from './usersSlice';
import contributorReducer from './contributorSlice';
import citizenReducer from './citizenSlice';

const store = configureStore({
  reducer: {
    activities: activitiesReducer,
    dashboard: dashboardReducer,
    users: usersReducer,
    contributor: contributorReducer,
    citizen: citizenReducer,
  },
});

export default store;
