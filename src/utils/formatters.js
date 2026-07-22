export function formatKg(value) {
  return `${Number(value || 0).toLocaleString()} kg`;
}

export function formatDate(value) {
  return new Date(value || Date.now()).toLocaleDateString();
}
