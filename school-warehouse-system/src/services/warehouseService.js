import { getWarehouses, getWarehouseById, getWarehouseItems, getWarehouseStats, createWarehouse, updateWarehouse, deleteWarehouse } from '../db';

export const getAllWarehouses = async () => {
  try {
    const data = await getWarehouses();
    return data;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
};

export const getWarehouseByIdService = async (id) => {
  try {
    const data = await getWarehouseById(id);
    return data;
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    throw error;
  }
};

export const getWarehouseItemsService = async (warehouseId) => {
  try {
    const data = await getWarehouseItems(warehouseId);
    return data;
  } catch (error) {
    console.error('Error fetching warehouse items:', error);
    throw error;
  }
};

export const getWarehouseStatsService = async (warehouseId) => {
  try {
    const data = await getWarehouseStats(warehouseId);
    return data;
  } catch (error) {
    console.error('Error fetching warehouse stats:', error);
    throw error;
  }
};

export const createWarehouseService = async (warehouseData) => {
  // Form validation
  if (!warehouseData.name || warehouseData.name.trim() === '') {
    throw new Error('اسم المخزن مطلوب');
  }
  
  if (warehouseData.name.length < 3) {
    throw new Error('اسم المخزن يجب أن يكون على الأقل 3 أحرف');
  }
  
  try {
    const data = await createWarehouse(warehouseData);
    return data;
  } catch (error) {
    console.error('Error creating warehouse:', error);
    throw error;
  }
};

export const updateWarehouseService = async (id, warehouseData) => {
  // Form validation
  if (!warehouseData.name || warehouseData.name.trim() === '') {
    throw new Error('اسم المخزن مطلوب');
  }
  
  if (warehouseData.name.length < 3) {
    throw new Error('اسم المخزن يجب أن يكون على الأقل 3 أحرف');
  }
  
  try {
    const data = await updateWarehouse(id, warehouseData);
    return data;
  } catch (error) {
    console.error('Error updating warehouse:', error);
    throw error;
  }
};

export const deleteWarehouseService = async (id) => {
  try {
    const data = await deleteWarehouse(id);
    return data;
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    throw error;
  }
};

export const getWarehouseCategoriesService = async (warehouseId) => {
  try {
    // This should be implemented if needed
    // For now, we'll return an empty array
    return [];
  } catch (error) {
    console.error('Error fetching warehouse categories:', error);
    throw error;
  }
};