// src/api/data.js

import axios from './axios';

// Get reactor data
export const getReactorData = async (reactorId, dataType, params = {}) => {
  const response = await axios.get(`/data/${reactorId}/${dataType}`, { params });
  return response.data;
};

// Get latest data
export const getLatestData = async (reactorId, dataType, count = 1) => {
  const response = await axios.get(`/data/${reactorId}/${dataType}/latest`, {
    params: { count }
  });
  return response.data;
};

// Get dashboard data (all types)
export const getDashboardData = async (reactorId) => {
  const response = await axios.get(`/data/${reactorId}/dashboard`);
  return response.data;
};

// Get data by time range
export const getDataByTimeRange = async (reactorId, hours, start, end) => {
  const response = await axios.get(`/data/${reactorId}/time-range`, {
    params: { hours, start, end }
  });
  return response.data;
};

// Get field statistics
export const getFieldStatistics = async (reactorId, dataType, params) => {
  const response = await axios.get(`/data/${reactorId}/${dataType}/statistics`, { params });
  return response.data;
};

// Get multi-field data
export const getMultiFieldData = async (reactorId, dataType, params) => {
  const response = await axios.get(`/data/${reactorId}/${dataType}/multi-field`, { params });
  return response.data;
};

// Insert data
export const insertData = async (reactorId, dataType, data) => {
  const response = await axios.post(`/data/${reactorId}/${dataType}`, data);
  return response.data;
};

// Export data as CSV
export const exportData = async (reactorId, dataType, params) => {
  const response = await axios.get(`/data/${reactorId}/${dataType}/export`, {
    params,
    responseType: 'blob'
  });
  return response.data;
};