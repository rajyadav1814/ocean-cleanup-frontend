import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiGet, apiPost } from '../services/api';

// RTK Query cache for data that pages used to fetch on every mount: each
// result is cached per argument, identical in-flight requests are shared,
// and a page that remounts within its refetch window renders from cache.
// The slices in this folder (activities, events, stats…) keep their own
// once-per-session caching; this covers what had none.

// Runs one of the existing api.js helpers and unwraps its { ok, … } body,
// so auth headers and the base URL stay defined in one place.
async function call(request, pick) {
  try {
    const res = await request();
    if (!res?.ok) return { error: { message: res?.error || res?.message || 'Request failed' } };
    return { data: pick(res) };
  } catch (err) {
    return { error: { message: err?.message || 'Network error' } };
  }
}

export const bluemindApi = createApi({
  reducerPath: 'bluemindApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Organization', 'Story', 'Event'],
  endpoints: (build) => ({
    getOrganizations: build.query({
      queryFn: () => call(() => apiGet('/api/dashboard/organizations'), (r) => r.organizations || []),
      providesTags: ['Organization'],
      keepUnusedDataFor: 30 * 60,
    }),
    addOrganization: build.mutation({
      queryFn: (name) => call(() => apiPost('/api/dashboard/organizations', { name }), (r) => r.organization),
      // Append to the cached list instead of refetching it.
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data: organization } = await queryFulfilled;
          dispatch(bluemindApi.util.updateQueryData('getOrganizations', undefined, (draft) => {
            draft.push(organization);
          }));
        } catch {
          // The caller shows the error.
        }
      },
    }),

    // role: 'citizen' | 'contributor' — each space has its own stories endpoint.
    getStories: build.query({
      queryFn: ({ role, limit = 3 }) =>
        call(() => apiGet(`/api/${role}/stories?limit=${limit}`), (r) => (Array.isArray(r.stories) ? r.stories : [])),
      providesTags: ['Story'],
    }),

    getEvent: build.query({
      queryFn: (id) => call(() => apiGet(`/api/events/${id}`), (r) => r.event),
      providesTags: (_result, _error, id) => [{ type: 'Event', id }],
    }),
    getActivityProof: build.query({
      queryFn: (activityId) => call(() => apiGet(`/api/activities/${activityId}/proof`), (r) => r.proof),
    }),
    // The subject taxonomy rarely changes, so keep it for the session.
    listSubjects: build.query({
      queryFn: (family) =>
        call(() => apiGet(`/api/events/subjects${family ? `?family=${family}` : ''}`), (r) => r.subjects || []),
      keepUnusedDataFor: 60 * 60,
    }),
  }),
});

export const {
  useGetOrganizationsQuery,
  useAddOrganizationMutation,
  useGetStoriesQuery,
  useGetEventQuery,
  useGetActivityProofQuery,
  useListSubjectsQuery,
} = bluemindApi;
