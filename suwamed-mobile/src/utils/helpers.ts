export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.startsWith('+94')) return cleaned;
  if (cleaned.startsWith('94')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+94${cleaned.slice(1)}`;
  return `+94${cleaned}`;
};

export const maskPhoneNumber = (phone: string): string => {
  const formatted = formatPhoneNumber(phone);
  if (formatted.length < 6) return formatted;
  return `${formatted.slice(0, 4)} ** *** **${formatted.slice(-2)}`;
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-LK')}`;
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidSriLankanPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+94|94|0)?[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

export const getRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
};
