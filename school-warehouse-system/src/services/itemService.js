import { getAllItems, getItemById, getItemsByWarehouse, updateItemQuantity, createTransaction, getTransactions, getTransactionsByWarehouse, getLowInventoryItems, createItem, updateItem, deleteItem } from '../db';

export const getAllItemsService = async () => {
  try {
    const data = await getAllItems();
    return data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

export const getItemByIdService = async (id) => {
  try {
    const data = await getItemById(id);
    return data;
  } catch (error) {
    console.error('Error fetching item:', error);
    throw error;
  }
};

export const getItemsByWarehouseService = async (warehouseId) => {
  try {
    const data = await getItemsByWarehouse(warehouseId);
    return data;
  } catch (error) {
    console.error('Error fetching items by warehouse:', error);
    throw error;
  }
};

export const updateItemQuantityService = async (itemId, quantityChange) => {
  try {
    const data = await updateItemQuantity(itemId, quantityChange);
    return data;
  } catch (error) {
    console.error('Error updating item quantity:', error);
    throw error;
  }
};

export const createTransactionService = async (transactionData) => {
  try {
    const data = await createTransaction(transactionData);
    return data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const getTransactionsService = async () => {
  try {
    const data = await getTransactions();
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const getTransactionsByWarehouseService = async (warehouseId) => {
  try {
    const data = await getTransactionsByWarehouse(warehouseId);
    return data;
  } catch (error) {
    console.error('Error fetching transactions by warehouse:', error);
    throw error;
  }
};

export const getLowInventoryItemsService = async (threshold = 10) => {
  try {
    const data = await getLowInventoryItems(threshold);
    return data;
  } catch (error) {
    console.error('Error fetching low inventory items:', error);
    throw error;
  }
};

export const createItemService = async (itemData) => {
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
    const data = await createItem(itemData);
    return data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

export const updateItemService = async (id, itemData) => {
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
    const data = await updateItem(id, itemData);
    return data;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

export const deleteItemService = async (id) => {
  try {
    const data = await deleteItem(id);
    return data;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

export const getItemHistoryService = async (id) => {
  try {
    // We need to implement this properly
    const data = await getItemById(id);
    return data;
  } catch (error) {
    console.error('Error fetching item history:', error);
    throw error;
  }
};

export const searchItemsService = async (query) => {
  try {
    // We need to implement this properly
    const data = await getAllItems();
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