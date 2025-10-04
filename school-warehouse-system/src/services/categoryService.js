import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../db';

export const getAllCategoriesService = async () => {
  try {
    const data = await getCategories();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getCategoryByIdService = async (id) => {
  try {
    const data = await getCategoryById(id);
    return data;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

export const createCategoryService = async (categoryData) => {
  // Form validation
  if (!categoryData.name || categoryData.name.trim() === '') {
    throw new Error('اسم الفئة مطلوب');
  }
  
  if (categoryData.name.length < 3) {
    throw new Error('اسم الفئة يجب أن يكون على الأقل 3 أحرف');
  }
  
  try {
    const data = await createCategory(categoryData);
    return data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategoryService = async (id, categoryData) => {
  // Form validation
  if (!categoryData.name || categoryData.name.trim() === '') {
    throw new Error('اسم الفئة مطلوب');
  }
  
  if (categoryData.name.length < 3) {
    throw new Error('اسم الفئة يجب أن يكون على الأقل 3 أحرف');
  }
  
  try {
    const data = await updateCategory(id, categoryData);
    return data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategoryService = async (id) => {
  try {
    const data = await deleteCategory(id);
    return data;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};