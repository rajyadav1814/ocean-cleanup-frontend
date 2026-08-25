import { useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost } from '../services/api';

// Shared across Signup and Submit Activity — fetches the organization list
// and exposes a way to add a new one on the fly from a "custom value" dropdown.
export default function useOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiGet('/api/dashboard/organizations')
      .then((data) => { if (isMounted && data.ok) setOrganizations(data.organizations || []); })
      .catch(() => {})
      .finally(() => { if (isMounted) setOrgsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const addOrganization = useCallback(async (name) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Organization name is required');

    const existing = organizations.find((o) => o.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const data = await apiPost('/api/dashboard/organizations', { name: trimmed });
    if (!data.ok) throw new Error(data.error || 'Failed to add organization');

    setOrganizations((prev) => [...prev, data.organization]);
    return data.organization;
  }, [organizations]);

  return { organizations, orgsLoading, addOrganization };
}
