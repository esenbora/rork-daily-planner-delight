export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatMonthDay = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatTimeFromMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
};
