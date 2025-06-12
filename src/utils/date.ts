/**
 * Calculate age based on birthdate
 * @param birthDate The date of birth
 * @returns Age as a string or translated 'Not Specified' if date is invalid
 */
export const calculateAge = (birthDate: Date): string => {
  if (!(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
    return 'Not Specified';
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (
    monthDifference < 0 || 
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age.toString();
};

/**
 * Format date to a localized string
 * @param date The date to format
 * @param locale Optional locale (defaults to browser locale)
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string, 
  locale: string = navigator.language
): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};
