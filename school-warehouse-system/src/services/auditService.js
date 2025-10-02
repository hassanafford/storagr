import { createDailyAudit, getDailyAudits } from '../db';

export const createDailyAuditService = async (auditData) => {
  try {
    const data = await createDailyAudit(auditData);
    return data;
  } catch (error) {
    console.error('Error creating daily audit:', error);
    throw error;
  }
};

export const getDailyAuditsService = async (params = {}) => {
  try {
    const data = await getDailyAudits(params);
    return data;
  } catch (error) {
    console.error('Error fetching daily audits:', error);
    throw error;
  }
};

export const getDailyAuditsByWarehouseService = async (warehouseId) => {
  try {
    const data = await getDailyAudits({ warehouseId });
    return data;
  } catch (error) {
    console.error('Error fetching daily audits by warehouse:', error);
    throw error;
  }
};

export const getDailyAuditsByItemService = async (itemId) => {
  try {
    const data = await getDailyAudits({ itemId });
    return data;
  } catch (error) {
    console.error('Error fetching daily audits by item:', error);
    throw error;
  }
};

export default {
  createDailyAudit: createDailyAuditService,
  getDailyAudits: getDailyAuditsService,
  getDailyAuditsByWarehouse: getDailyAuditsByWarehouseService,
  getDailyAuditsByItem: getDailyAuditsByItemService
};