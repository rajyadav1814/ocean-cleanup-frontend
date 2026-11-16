import { useCallback } from 'react';
import { useGetOrganizationsQuery, useAddOrganizationMutation } from '../store/apiSlice';

// Shared across Signup and Submit Activity — the organization list (cached
// in the store, so revisiting a page doesn't refetch it) and a way to add a
// new one on the fly from a "custom value" dropdown.
export default function useOrganizations() {
  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();
  const [createOrganization] = useAddOrganizationMutation();

  const addOrganization = useCallback(async (name) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Organization name is required');

    const existing = organizations.find((o) => o.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const result = await createOrganization(trimmed);
    if (result.error) throw new Error(result.error.message || 'Failed to add organization');
    return result.data;
  }, [organizations, createOrganization]);

  return { organizations, orgsLoading, addOrganization };
}
