import { configureStore } from '@reduxjs/toolkit';
import activitiesReducer from './activitiesSlice';
import contributorReducer from './contributorSlice';
import citizenReducer from './citizenSlice';
import eventsReducer from './eventsSlice';
import { bluemindApi } from './apiSlice';

const store = configureStore({
  reducer: {
    activities: activitiesReducer,
    contributor: contributorReducer,
    citizen: citizenReducer,
    events: eventsReducer,
    [bluemindApi.reducerPath]: bluemindApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(bluemindApi.middleware),
});

export default store;
