import { api } from '../db';

export const createDailyAudit = async (auditData) => {
  try {
    const data = await api.createDailyAudit(auditData);
    return data;
  } catch (error) {
    console.error('Error creating daily audit:', error);
    throw error;
  }
};

export const getDailyAudits = async (params = {}) => {
  try {
    const data = await api.getDailyAudits(params);
    return data;
  } catch (error) {
    console.error('Error fetching daily audits:', error);
    throw error;
  }
};

export const getDailyAuditsByWarehouse = async (warehouseId) => {
  try {
    const data = await api.getDailyAudits({ warehouseId });
    return data;
  } catch (error) {
    console.error('Error fetching daily audits by warehouse:', error);
    throw error;
  }
};

export const getDailyAuditsByItem = async (itemId) => {
  try {
    const data = await api.getDailyAudits({ itemId });
    return data;
  } catch (error) {
    console.error('Error fetching daily audits by item:', error);
    throw error;
  }
};

export default {
  createDailyAudit,
  getDailyAudits,
  getDailyAuditsByWarehouse,
  getDailyAuditsByItem
};