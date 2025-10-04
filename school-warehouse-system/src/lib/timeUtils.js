// Time utilities for Egyptian timezone (Africa/Cairo - UTC+2)
// This library ensures all time operations are consistent with Egyptian local time

/**
 * Get current time in Egyptian timezone
 * @returns {Date} Current date/time in Egyptian timezone
 */
export const getEgyptianTime = () => {
  // Create a new Date object for current UTC time
  const now = new Date();
  
  // Egypt is UTC+2 (no DST in Egypt since 2011)
  // We add 2 hours to UTC time to get Egyptian time
  const egyptTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
  
  return egyptTime;
};

/**
 * Convert any date to Egyptian timezone
 * @param {Date|string|number} date - Date to convert
 * @returns {Date} Date in Egyptian timezone
 */
export const toEgyptianTime = (date) => {
  const inputDate = new Date(date);
  
  // Egypt is UTC+2 (no DST in Egypt since 2011)
  const egyptTime = new Date(inputDate.getTime() + (2 * 60 * 60 * 1000));
  
  return egyptTime;
};

/**
 * Format date in Egyptian format (DD/MM/YYYY)
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatEgyptianDate = (date) => {
  const egyptDate = toEgyptianTime(date);
  
  const day = egyptDate.getUTCDate().toString().padStart(2, '0');
  const month = (egyptDate.getUTCMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
  const year = egyptDate.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format time in 24-hour format (HH:MM)
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted time string
 */
export const formatEgyptianTime = (date) => {
  const egyptDate = toEgyptianTime(date);
  
  const hours = egyptDate.getUTCHours().toString().padStart(2, '0');
  const minutes = egyptDate.getUTCMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

/**
 * Format date and time in Egyptian format
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatEgyptianDateTime = (date) => {
  return `${formatEgyptianDate(date)} ${formatEgyptianTime(date)}`;
};

/**
 * Format time ago in Arabic (relative time)
 * @param {Date|string|number} date - Date to calculate time ago from
 * @returns {string} Formatted time ago string in Arabic
 */
export const formatTimeAgo = (date) => {
  const egyptDate = toEgyptianTime(date);
  const now = getEgyptianTime();
  const diffInMinutes = Math.floor((now - egyptDate) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'الآن';
  if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
  if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
  return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
};

/**
 * Get today's date in YYYY-MM-DD format (Egyptian timezone)
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getEgyptianToday = () => {
  const egyptDate = getEgyptianTime();
  const year = egyptDate.getUTCFullYear();
  const month = (egyptDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = egyptDate.getUTCDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Format timestamp for database storage (ISO format in UTC)
 * @param {Date} date - Date to format for database
 * @returns {string} ISO formatted timestamp
 */
export const formatForDatabase = (date = null) => {
  const egyptDate = date ? toEgyptianTime(date) : getEgyptianTime();
  
  // Convert back to UTC for database storage
  const utcDate = new Date(egyptDate.getTime() - (2 * 60 * 60 * 1000));
  
  return utcDate.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Parse database timestamp and convert to Egyptian time
 * @param {string} dbTimestamp - Database timestamp in UTC
 * @returns {Date} Date in Egyptian timezone
 */
export const parseDatabaseTimestamp = (dbTimestamp) => {
  // Parse the database timestamp (assumed to be in UTC)
  const utcDate = new Date(dbTimestamp);
  
  // Convert to Egyptian time (UTC+2)
  const egyptTime = new Date(utcDate.getTime() + (2 * 60 * 60 * 1000));
  
  return egyptTime;
};

// Export all functions as default
export default {
  getEgyptianTime,
  toEgyptianTime,
  formatEgyptianDate,
  formatEgyptianTime,
  formatEgyptianDateTime,
  formatTimeAgo,
  getEgyptianToday,
  formatForDatabase,
  parseDatabaseTimestamp
};