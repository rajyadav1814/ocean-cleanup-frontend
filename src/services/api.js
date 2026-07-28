const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ocean-cleanup-backend.vercel.app';

// Retrieve the stored JWT token
function getToken() {
  return localStorage.getItem('ocean_token');
}

// Build auth headers — attach Bearer token when present
function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

export async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: authHeaders()
  });
  return response.json();
}

export async function apiPost(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body)
  });
  return response.json();
}

export async function apiDelete(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return response.json();
}

export async function apiPatch(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body)
  });
  return response.json();
}

export async function apiPut(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body)
  });
  return response.json();
}

export async function apiGetNotifications() {
  return apiGet('/api/dashboard/notifications');
}

export async function apiMarkNotificationRead(id) {
  return apiPatch(`/api/dashboard/notifications/${id}/read`);
}

// ─── Organization API helpers (admin-only) ────────────────────────────────────
export const orgApi = {
  list:      (active)        => apiGet(`/api/admin/organizations${active !== undefined ? `?active=${active}` : ''}`),
  getById:   (id)            => apiGet(`/api/admin/organizations/${id}`),
  create:    (data)          => apiPost(`/api/admin/organizations`, data),
  update:    (id, data)      => apiPut(`/api/admin/organizations/${id}`, data),
  remove:    (id)            => apiDelete(`/api/admin/organizations/${id}`),
  setStatus: (id, isActive)  => apiPatch(`/api/admin/organizations/${id}/status`, { isActive }),
};

// For multipart form-data (file uploads) — do NOT set Content-Type manually
export async function apiPostForm(path, formData) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData
  });
  return response.json();
}

// Auth-specific helpers — token key used across the app
export const TOKEN_KEY = 'ocean_token';
export const USER_KEY = 'ocean_user';

export async function authLogin(username, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function authSignup(payload) {
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function authVerify(token) {
  const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}
