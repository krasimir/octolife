export function diffInDays(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
export function formatPlural(value, what) {
  if (value === 1) return `${value} ${what}`;
  return `${value} ${what}s`;
}
