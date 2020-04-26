export function diffInDays(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
export function formatPlural(years, what) {
  if (years === 1) return `${years} ${what}`;
  return `${years} ${what}s`;
}
