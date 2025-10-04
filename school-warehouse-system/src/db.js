import { createClient } from '@supabase/supabase-js';
import { mapAppToDbTransactionType } from './lib/transactionUtils';
import { getEgyptianTime, formatForDatabase } from './lib/timeUtils';

// Supabase configuration - Fixed for Vite environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://oselaoheeykmsvkvrfwa.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zZWxhb2hlZXlrbXN2a3ZyZndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NzMwNTIsImV4cCI6MjA3NTE0OTA1Mn0.fLxfxm6rHQwlYYc2EqDazsyc-RwXY2pWmEbH_mbqGHc';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get token from localStorage
const getToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.token;
};

// Authentication function using Supabase with password verification
export const authenticateUser = async (nationalId, password) => {
  console.log('Login attempt:', { nationalId });

  if (!nationalId || !password) {
    throw new Error('National ID and password are required');
  }

  // Validate that national ID is numeric
  if (!/^[0-9]+$/.test(nationalId)) {
    throw new Error('Invalid national ID format');
  }

  try {
    // Query users table in Supabase
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        warehouses (name)
      `)
      .eq('national_id', nationalId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      throw new Error('Invalid credentials');
    }

    if (!data) {
      throw new Error('Invalid credentials');
    }

    // Verify password using database function
    const { data: verifyData, error: verifyError } = await supabase
      .rpc('verify_password', {
        password: password,
        password_hash: data.password_hash
      });

    if (verifyError) {
      console.error('Error verifying password:', verifyError);
      throw new Error('Authentication failed');
    }

    if (!verifyData) {
      throw new Error('Invalid credentials');
    }

    const user = data;

    // إرجاع بيانات المستخدم مباشرة بدون تشفير
    // Supabase يدير الجلسات تلقائيًا
    return {
      user: {
        id: user.id,
        national_id: user.national_id,
        name: user.name,
        role: user.role,
        warehouse_id: user.warehouse_id
      }
    };
  } catch (err) {
    console.error('Error authenticating user:', err);
    throw err;
  }
};

// Warehouse functions
export const getWarehouses = async () => {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*');

  if (error) {
    console.error('Error fetching warehouses:', error);
    throw new Error('Failed to fetch warehouses');
  }

  return data;
};

export const getWarehouseById = async (id) => {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching warehouse:', error);
    throw new Error('Failed to fetch warehouse');
  }

  if (!data) {
    throw new Error('Warehouse not found');
  }

  return data;
};

export const getWarehouseItems = async (id) => {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      categories:name,
      warehouses:name
    `)
    .eq('warehouse_id', id);

  if (error) {
    console.error('Error fetching warehouse items:', error);
    throw new Error('Failed to fetch warehouse items');
  }

  return data;
};

export const getWarehouseStats = async (id) => {
  // Get total items count and quantity
  const { data: itemsData, error: itemsError } = await supabase
    .from('items')
    .select('quantity')
    .eq('warehouse_id', id);

  if (itemsError) {
    console.error('Error fetching warehouse stats:', itemsError);
    throw new Error('Failed to fetch warehouse stats');
  }

  const total_items = itemsData.length;
  const total_quantity = itemsData.reduce((sum, item) => sum + item.quantity, 0);

  // Get category distribution
  const { data: categoryData, error: categoryError } = await supabase
    .from('items')
    .select(`
      category_id,
      quantity,
      categories (name)
    `)
    .eq('warehouse_id', id);

  if (categoryError) {
    console.error('Error fetching category distribution:', categoryError);
    throw new Error('Failed to fetch category distribution');
  }

  // Group by category
  const category_distribution = {};
  categoryData.forEach(item => {
    const categoryName = item.categories?.name || 'Uncategorized';
    if (!category_distribution[categoryName]) {
      category_distribution[categoryName] = {
        category_name: categoryName,
        item_count: 0,
        total_quantity: 0
      };
    }
    category_distribution[categoryName].item_count += 1;
    category_distribution[categoryName].total_quantity += item.quantity;
  });

  return {
    total_items,
    total_quantity,
    category_distribution: Object.values(category_distribution)
  };
};

// User functions
export const getUserByNationalId = async (nationalId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('national_id', nationalId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user');
  }

  if (!data) {
    throw new Error('User not found');
  }

  return data;
};

export const getAllUsers = async () => {
  console.log('Users endpoint called');

  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      warehouses (name)
    `);

  if (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }

  return data;
};

export const createUser = async (userData) => {
  // Hash the password (last 6 digits of national ID)
  const password = userData.national_id.slice(-6);

  const { data: hashedPassword, error: hashError } = await supabase
    .rpc('hash_password', { password });

  if (hashError) {
    console.error('Error hashing password:', hashError);
    throw new Error('Failed to create user');
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      national_id: userData.national_id,
      name: userData.name,
      password_hash: hashedPassword,
      role: userData.role,
      warehouse_id: userData.warehouse_id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }

  return {
    ...data,
    message: 'User created successfully'
  };
};

export const updateUser = async (id, userData) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      national_id: userData.national_id,
      name: userData.name,
      role: userData.role,
      warehouse_id: userData.warehouse_id
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }

  if (!data) {
    throw new Error('User not found');
  }

  return { message: 'User updated successfully' };
};

export const deleteUser = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }

  if (data.length === 0) {
    throw new Error('User not found');
  }

  return { message: 'User deleted successfully' };
};

// Item functions
export const getItemById = async (id) => {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      categories:name,
      warehouses:name
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching item:', error);
    throw new Error('Failed to fetch item');
  }

  if (!data) {
    throw new Error('Item not found');
  }

  return data;
};

export const getItemsByWarehouse = async (warehouseId) => {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      categories:name,
      warehouses:name
    `)
    .eq('warehouse_id', warehouseId);

  if (error) {
    console.error('Error fetching items:', error);
    throw new Error('Failed to fetch items');
  }

  return data;
};

export const updateItemQuantity = async (itemId, quantityChange) => {
  // First, get the item to check current quantity
  const { data: itemData, error: itemError } = await supabase
    .from('items')
    .select('quantity')
    .eq('id', itemId)
    .single();

  if (itemError) {
    console.error('Error fetching item:', itemError);
    throw new Error('Failed to fetch item');
  }

  if (!itemData) {
    throw new Error('Item not found');
  }

  // Update the item quantity
  const { data, error } = await supabase
    .from('items')
    .update({
      quantity: Math.max(0, itemData.quantity + quantityChange)
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating item quantity:', error);
    throw new Error('Failed to update item quantity');
  }

  if (!data) {
    throw new Error('Item not found');
  }

  return { message: 'Item quantity updated successfully' };
};

export const getAllItems = async () => {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      categories:name,
      warehouses:name
    `)
    .order('name');

  if (error) {
    console.error('Error fetching items:', error);
    throw new Error('Failed to fetch items');
  }

  return data;
};

// Transaction functions
export const createTransaction = async (transactionData) => {
  // Get Egyptian timestamp using the new utility
  const egyptianTimestamp = formatForDatabase();

  // Calculate discrepancy if both expected and actual quantities are provided
  let discrepancy = null;
  if (transactionData.expected_quantity !== undefined && transactionData.actual_quantity !== undefined) {
    discrepancy = transactionData.actual_quantity - transactionData.expected_quantity;
  }

  // Map the transaction type from app format to database format
  const dbTransactionType = mapAppToDbTransactionType(transactionData.transaction_type);

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      item_id: transactionData.item_id,
      user_id: transactionData.user_id,
      transaction_type: dbTransactionType,
      quantity: transactionData.quantity,
      recipient: transactionData.recipient,
      notes: transactionData.notes,
      expected_quantity: transactionData.expected_quantity,
      actual_quantity: transactionData.actual_quantity,
      discrepancy: discrepancy,
      egyptian_timestamp: egyptianTimestamp
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    throw new Error('Failed to create transaction');
  }

  return {
    ...data,
    message: 'Transaction created successfully'
  };
};

export const getTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      items!inner (
        name,
        warehouse_id,
        warehouses (name)
      ),
      users!inner (
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to fetch transactions');
  }

  return data;
};

export const getTransactionsByWarehouse = async (warehouseId) => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      items!inner (
        name,
        warehouse_id,
        warehouses (name)
      ),
      users!inner (
        name
      )
    `)
    .eq('items.warehouse_id', warehouseId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to fetch transactions');
  }

  return data;
};

// Daily audit functions
export const createDailyAudit = async (auditData) => {
  // Get audit date (today) using the new utility
  const auditDate = getEgyptianTime().toISOString().split('T')[0];

  // Get Egyptian timestamp using the new utility
  const egyptianTimestamp = formatForDatabase();

  // Calculate discrepancy
  const discrepancy = auditData.actual_quantity - auditData.expected_quantity;

  const { data, error } = await supabase
    .from('daily_audits')
    .insert({
      warehouse_id: auditData.warehouse_id,
      item_id: auditData.item_id,
      user_id: auditData.user_id,
      expected_quantity: auditData.expected_quantity,
      actual_quantity: auditData.actual_quantity,
      discrepancy: discrepancy,
      notes: auditData.notes,
      audit_date: auditDate,
      egyptian_timestamp: egyptianTimestamp
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating daily audit:', error);
    throw new Error('Failed to create daily audit');
  }

  return {
    ...data,
    message: 'Daily audit created successfully'
  };
};

export const getDailyAudits = async (params = {}) => {
  let query = supabase
    .from('daily_audits')
    .select(`
      *,
      items (name),
      warehouses (name),
      users (name)
    `)
    .order('created_at', { ascending: false });

  if (params.warehouseId) {
    query = query.eq('warehouse_id', params.warehouseId);
  }

  if (params.itemId) {
    query = query.eq('item_id', params.itemId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching daily audits:', error);
    throw new Error('Failed to fetch daily audits');
  }

  return data;
};

// Low inventory function
export const getLowInventoryItems = async (threshold = 10) => {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      categories:name,
      warehouses:name
    `)
    .lte('quantity', threshold)
    .order('quantity', { ascending: true });

  if (error) {
    console.error('Error fetching low inventory items:', error);
    throw new Error('Failed to fetch low inventory items');
  }

  return data;
};

// Warehouse CRUD functions
export const createWarehouse = async (warehouseData) => {
  const { data, error } = await supabase
    .from('warehouses')
    .insert({
      name: warehouseData.name,
      description: warehouseData.description
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating warehouse:', error);
    throw new Error('Failed to create warehouse');
  }

  return {
    ...data,
    message: 'Warehouse created successfully'
  };
};

export const updateWarehouse = async (id, warehouseData) => {
  const { data, error } = await supabase
    .from('warehouses')
    .update({
      name: warehouseData.name,
      description: warehouseData.description
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating warehouse:', error);
    throw new Error('Failed to update warehouse');
  }

  if (!data) {
    throw new Error('Warehouse not found');
  }

  return { message: 'Warehouse updated successfully' };
};

export const deleteWarehouse = async (id) => {
  const { data, error } = await supabase
    .from('warehouses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting warehouse:', error);
    throw new Error('Failed to delete warehouse');
  }

  if (data.length === 0) {
    throw new Error('Warehouse not found');
  }

  return { message: 'Warehouse deleted successfully' };
};

// Category CRUD functions
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*');

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }

  return data;
};

export const getCategoryById = async (id) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching category:', error);
    throw new Error('Failed to fetch category');
  }

  if (!data) {
    throw new Error('Category not found');
  }

  return data;
};

export const createCategory = async (categoryData) => {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: categoryData.name
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw new Error('Failed to create category');
  }

  return {
    ...data,
    message: 'Category created successfully'
  };
};

export const updateCategory = async (id, categoryData) => {
  const { data, error } = await supabase
    .from('categories')
    .update({
      name: categoryData.name
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    throw new Error('Failed to update category');
  }

  if (!data) {
    throw new Error('Category not found');
  }

  return { message: 'Category updated successfully' };
};

export const deleteCategory = async (id) => {
  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    throw new Error('Failed to delete category');
  }

  if (data.length === 0) {
    throw new Error('Category not found');
  }

  return { message: 'Category deleted successfully' };
};

// Item CRUD functions
export const createItem = async (itemData) => {
  const { data, error } = await supabase
    .from('items')
    .insert({
      name: itemData.name,
      category_id: itemData.category_id,
      warehouse_id: itemData.warehouse_id,
      quantity: itemData.quantity || 0,
      description: itemData.description
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating item:', error);
    throw new Error('Failed to create item');
  }

  return {
    ...data,
    message: 'Item created successfully'
  };
};

export const updateItem = async (id, itemData) => {
  const { data, error } = await supabase
    .from('items')
    .update({
      name: itemData.name,
      category_id: itemData.category_id,
      warehouse_id: itemData.warehouse_id,
      quantity: itemData.quantity,
      description: itemData.description
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating item:', error);
    throw new Error('Failed to update item');
  }

  if (!data) {
    throw new Error('Item not found');
  }

  return { message: 'Item updated successfully' };
};

export const deleteItem = async (id) => {
  const { data, error } = await supabase
    .from('items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting item:', error);
    throw new Error('Failed to delete item');
  }

  if (data.length === 0) {
    throw new Error('Item not found');
  }

  return { message: 'Item deleted successfully' };
};