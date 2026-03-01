export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const formatPhoneNumber = (phone: string): string => {
  if (phone.startsWith('+94')) {
    return phone;
  }
  if (phone.startsWith('0')) {
    return `+94${phone.slice(1)}`;
  }
  return `+94${phone}`;
};

export const paginate = (page: number, limit: number): { skip: number; limit: number } => {
  const currentPage = Math.max(1, page);
  const currentLimit = Math.max(1, limit);
  const skip = (currentPage - 1) * currentLimit;
  return { skip, limit: currentLimit };
};
