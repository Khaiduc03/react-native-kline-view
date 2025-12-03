export const fixRound = (
  value: number | null | undefined,
  precision: number,
  showSign: boolean = false,
  showGrouping: boolean = false,
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }

  let result = Number(value).toFixed(precision);

  if (showGrouping) {
    result = result.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  if (showSign && value > 0) {
    result = `+${result}`;
  }

  return result;
};

export const formatTime = (
  timestamp: number,
  format: string = 'MM-DD HH:mm',
): string => {
  const date = new Date(timestamp);

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};
