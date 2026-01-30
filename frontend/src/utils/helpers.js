// src/utils/helpers.js

import { formatDistance } from 'date-fns';
// import { formatInTimeZone } from 'date-fns-tz';

export const formatDate = (utcTimestamp) => {
  if (!utcTimestamp) return 'N/A';
  const date = new Date(utcTimestamp);
  return date.toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  }).replace(/,/, ''); // Clean up comma for exact match
};


export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

export const formatNumber = (num, precision = 3) => {
  if (num === null || num === undefined) return 'N/A';
  const value = Number(num);
  if (Number.isNaN(value)) return 'N/A';
  return value.toFixed(precision);
};

export const downloadCSV = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const getAlertSeverityColor = (severity) => {
  const colors = {
    info: '#2196f3',
    warning: '#ff9800',
    critical: '#f44336',
  };
  return colors[severity] || colors.warning;
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};