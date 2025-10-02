import { api } from '../db';

export const getAllItems = async () => {
  try {
    const data = await api.getAllItems();
    return data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

export const getItemById = async (id) => {
  try {
    const data = await api.getItemById(id);
    return data;
  } catch (error) {
    console.error('Error fetching item:', error);
    throw error;
  }
};

export const getItemsByWarehouse = async (warehouseId) => {
  try {
    const data = await api.getItemsByWarehouse(warehouseId);
    return data;
  } catch (error) {
    console.error('Error fetching items by warehouse:', error);
    throw error;
  }
};

export const updateItemQuantity = async (itemId, quantityChange) => {
  try {
    const data = await api.updateItemQuantity(itemId, quantityChange);
    return data;
  } catch (error) {
    console.error('Error updating item quantity:', error);
    throw error;
  }
};

export const createTransaction = async (transactionData) => {
  try {
    const data = await api.createTransaction(transactionData);
    return data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const getTransactions = async () => {
  try {
    const data = await api.getTransactions();
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const getTransactionsByWarehouse = async (warehouseId) => {
  try {
    const data = await api.getTransactionsByWarehouse(warehouseId);
    return data;
  } catch (error) {
    console.error('Error fetching transactions by warehouse:', error);
    throw error;
  }
};

export const getLowInventoryItems = async (threshold = 10) => {
  try {
    const data = await api.getLowInventoryItems(threshold);
    return data;
  } catch (error) {
    console.error('Error fetching low inventory items:', error);
    throw error;
  }
};

export const createItem = async (itemData) => {
  // Form validation
  if (!itemData.name || itemData.name.trim() === '') {
    throw new Error('اسم العنصر مطلوب');
  }
  
  if (itemData.name.length < 3) {
    throw new Error('اسم العنصر يجب أن يكون على الأقل 3 أحرف');
  }
  
  if (!itemData.category_id) {
    throw new Error('الفئة مطلوبة');
  }
  
  if (!itemData.warehouse_id) {
    throw new Error('المخزن مطلوب');
  }
  
  if (itemData.quantity < 0) {
    throw new Error('الكمية لا يمكن أن تكون سالبة');
  }
  
  try {
    const data = await api.createItem(itemData);
    return data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

export const updateItem = async (id, itemData) => {
  // Form validation
  if (!itemData.name || itemData.name.trim() === '') {
    throw new Error('اسم العنصر مطلوب');
  }
  
  if (itemData.name.length < 3) {
    throw new Error('اسم العنصر يجب أن يكون على الأقل 3 أحرف');
  }
  
  if (!itemData.category_id) {
    throw new Error('الفئة مطلوبة');
  }
  
  if (!itemData.warehouse_id) {
    throw new Error('المخزن مطلوب');
  }
  
  if (itemData.quantity < 0) {
    throw new Error('الكمية لا يمكن أن تكون سالبة');
  }
  
  try {
    const data = await api.updateItem(id, itemData);
    return data;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

export const deleteItem = async (id) => {
  try {
    const data = await api.deleteItem(id);
    return data;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

export const getItemHistory = async (id) => {
  try {
    // We need to add this method to the API
    const data = await api.getItemById(id);
    return data;
  } catch (error) {
    console.error('Error fetching item history:', error);
    throw error;
  }
};

export const searchItems = async (query) => {
  try {
    // We need to add this method to the API
    const data = await api.getAllItems();
    // Filter items based on query
    return data.filter(item => 
      item.name.includes(query) || 
      (item.category_name && item.category_name.includes(query))
    );
  } catch (error) {
    console.error('Error searching items:', error);
    throw error;
  }
};