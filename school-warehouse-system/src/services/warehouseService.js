import { api } from '../db';

export const getAllWarehouses = async () => {
  try {
    const data = await api.getWarehouses();
    return data;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
};

export const getWarehouseById = async (id) => {
  try {
    const data = await api.getWarehouseById(id);
    return data;
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    throw error;
  }
};

export const getWarehouseItems = async (warehouseId) => {
  try {
    const data = await api.getWarehouseItems(warehouseId);
    return data;
  } catch (error) {
    console.error('Error fetching warehouse items:', error);
    throw error;
  }
};

export const getWarehouseStats = async (warehouseId) => {
  try {
    const data = await api.getWarehouseStats(warehouseId);
    return data;
  } catch (error) {
    console.error('Error fetching warehouse stats:', error);
    throw error;
  }
};

export const createWarehouse = async (warehouseData) => {
  // Form validation
  if (!warehouseData.name || warehouseData.name.trim() === '') {
    throw new Error('اسم المخزن مطلوب');
  }
  
  if (warehouseData.name.length < 3) {
    throw new Error('اسم المخزن يجب أن يكون على الأقل 3 أحرف');
  }
  
  try {
    const data = await api.createWarehouse(warehouseData);
    return data;
  } catch (error) {
    console.error('Error creating warehouse:', error);
    throw error;
  }
};

export const updateWarehouse = async (id, warehouseData) => {
  // Form validation
  if (!warehouseData.name || warehouseData.name.trim() === '') {
    throw new Error('اسم المخزن مطلوب');
  }
  
  if (warehouseData.name.length < 3) {
    throw new Error('اسم المخزن يجب أن يكون على الأقل 3 أحرف');
  }
  
  try {
    const data = await api.updateWarehouse(id, warehouseData);
    return data;
  } catch (error) {
    console.error('Error updating warehouse:', error);
    throw error;
  }
};

export const deleteWarehouse = async (id) => {
  try {
    const data = await api.deleteWarehouse(id);
    return data;
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    throw error;
  }
};

export const getWarehouseCategories = async (warehouseId) => {
  try {
    // This should be implemented in the API if needed
    // For now, we'll return an empty array
    return [];
  } catch (error) {
    console.error('Error fetching warehouse categories:', error);
    throw error;
  }
};