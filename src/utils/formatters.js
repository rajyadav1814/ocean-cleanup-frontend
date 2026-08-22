export function formatKg(value) {
  return `${Number(value || 0).toLocaleString()} kg`;
}

export function formatDate(value) {
  return new Date(value || Date.now()).toLocaleDateString();
}

// Matches the `d-m-y, h:mm AM/PM` format previously duplicated as
// formatReviewDate / formatTimestamp / formatActivityDate across the
// verifier and contributor activity pages.
export function formatActivityDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12;
  const paddedMinutes = minutes.toString().padStart(2, '0');

  return `${day}-${month}-${year}, ${hours}:${paddedMinutes} ${period}`;
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
