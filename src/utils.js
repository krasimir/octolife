export function diffInDays(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
export function formatPlural(value, what) {
  if (value === 1) return `${value} ${what}`;
  return `${value} ${what}s`;
}
export function getAge(date) {
  return formatPlural(
    Math.ceil(diffInDays(new Date(), new Date(date)) / 365),
    'year'
  );
}
export function formatHour(hour) {
  if (hour < 10) {
    return `0${hour}:00`;
  }
  return `${hour}:00`;
}
