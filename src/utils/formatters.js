export function formatKg(value) {
  return `${Number(value || 0).toLocaleString()} kg`;
}

export function formatDate(value) {
  return new Date(value || Date.now()).toLocaleDateString();
}

export function formatDateTime(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
