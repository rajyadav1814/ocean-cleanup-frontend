const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ocean-cleanup-cardano-v2.vercel.app';

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

// For binary downloads (e.g. generated PDFs) — reads the response as a blob
// and triggers a browser save, using the server's Content-Disposition filename.
export async function apiDownloadFile(path, fallbackFilename = 'download') {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: authHeaders()
  });

  if (!response.ok) {
    let message = 'Download failed';
    try {
      const data = await response.json();
      message = data.error || data.message || message;
    } catch {
      // response wasn't JSON — keep the default message
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackFilename;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

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

export async function authLogin(username, password, socketId = null) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, socketId })
  });
  return res.json();
}

export async function authLogout(token) {
  const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
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

export async function authRequestPasswordReset(email) {
  const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return res.json();
}

export async function authCheckEmail(email) {
  const res = await fetch(`${API_BASE_URL}/api/auth/email-availability?email=${encodeURIComponent(email)}`);
  return res.json();
}

export async function authVerify(token) {
  const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function authUpdateProfile(payload) {
  return apiPut('/api/auth/profile', payload);
}

// ─── Contributor API helpers ──────────────────────────────────────────────────
export const contributorApi = {
  exportReport: (from, to) =>
    apiDownloadFile(`/api/contributor/export?from=${from}&to=${to}&format=pdf`, `field-report-${from}-to-${to}.pdf`),
};

// ─── Citizen API helpers ──────────────────────────────────────────────────────
export const citizenApi = {
  getStats:       ()              => apiGet('/api/citizen/stats'),
  getLeaderboard: ()              => apiGet('/api/citizen/leaderboard'),
  getFeed:        (limit = 15)    => apiGet(`/api/citizen/feed?limit=${limit}`),
  submitReport:   (formData)      => apiPostForm('/api/activities', formData),
};
