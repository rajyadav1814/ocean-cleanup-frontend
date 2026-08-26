import { configureStore } from '@reduxjs/toolkit';
import activitiesReducer from './activitiesSlice';
import dashboardReducer from './dashboardSlice';
import contributorReducer from './contributorSlice';
import citizenReducer from './citizenSlice';
import eventsReducer from './eventsSlice';

const store = configureStore({
  reducer: {
    activities: activitiesReducer,
    dashboard: dashboardReducer,
    contributor: contributorReducer,
    citizen: citizenReducer,
    events: eventsReducer,
  },
});

export default store;
