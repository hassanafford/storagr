import { api } from '../db';

export const getAllCategories = async () => {
  try {
    const data = await api.getCategories();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getCategoryById = async (id) => {
  try {
    const data = await api.getCategoryById(id);
    return data;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  // Form validation
  if (!categoryData.name || categoryData.name.trim() === '') {
    throw new Error('اسم الفئة مطلوب');
  }
  
  if (categoryData.name.length < 3) {
    throw new Error('اسم الفئة يجب أن يكون على الأقل 3 أحرف');
  }
  
  if (!categoryData.warehouse_id) {
    throw new Error('المخزن مطلوب');
  }
  
  try {
    const data = await api.createCategory(categoryData);
    return data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  // Form validation
  if (!categoryData.name || categoryData.name.trim() === '') {
    throw new Error('اسم الفئة مطلوب');
  }
  
  if (categoryData.name.length < 3) {
    throw new Error('اسم الفئة يجب أن يكون على الأقل 3 أحرف');
  }
  
  if (!categoryData.warehouse_id) {
    throw new Error('المخزن مطلوب');
  }
  
  try {
    const data = await api.updateCategory(id, categoryData);
    return data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const data = await api.deleteCategory(id);
    return data;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};