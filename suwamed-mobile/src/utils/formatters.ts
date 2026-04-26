export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

export const capitalizeFirst = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const capitalizeWords = (text: string): string => {
  return text
    .split(' ')
    .map((word) => capitalizeFirst(word))
    .join(' ');
};

export const formatAppointmentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return statusMap[status] || capitalizeFirst(status);
};

export const formatPaymentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    completed: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
  };
  return statusMap[status] || capitalizeFirst(status);
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: '#F59E0B',
    confirmed: '#3B82F6',
    in_progress: '#1A73E8',
    completed: '#10B981',
    cancelled: '#DC2626',
    no_show: '#6B7280',
    paid: '#10B981',
    failed: '#DC2626',
    refunded: '#F59E0B',
    verified: '#10B981',
    rejected: '#DC2626',
    under_review: '#F59E0B',
  };
  return colorMap[status] || '#6B7280';
};

export const formatSpecialization = (specialization: string): string => {
  return specialization
    .split('_')
    .map((word) => capitalizeFirst(word))
    .join(' ');
};

export const pluralize = (count: number, singular: string, plural?: string): string => {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || `${singular}s`}`;
};
