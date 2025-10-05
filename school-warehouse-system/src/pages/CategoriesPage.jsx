import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationProvider';
import { getAllCategoriesService, createCategoryService, updateCategoryService, deleteCategoryService } from '../services/categoryService';

function CategoriesPage() {
  const { addNotification } = useNotification();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllCategoriesService();
      setCategories(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading categories:', error);
      addNotification({
        message: 'حدث خطأ أثناء تحميل الفئات',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear error for this field when user starts typing
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'اسم الفئة مطلوب';
    } else if (formData.name.length < 3) {
      errors.name = 'اسم الفئة يجب أن يكون على الأقل 3 أحرف';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (editingCategory) {
        // Update existing category
        await updateCategoryService(editingCategory.id, formData);
        addNotification({
          message: 'تم تحديث الفئة بنجاح',
          type: 'success'
        });
      } else {
        // Create new category
        await createCategoryService(formData);
        addNotification({
          message: 'تم إنشاء الفئة بنجاح',
          type: 'success'
        });
      }
      
      // Reset form and reload data
      setFormData({ name: '' });
      setFormErrors({});
      setEditingCategory(null);
      setShowForm(false);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      addNotification({
        message: error.message || 'حدث خطأ أثناء حفظ الفئة',
        type: 'error'
      });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
      try {
        await deleteCategoryService(id);
        addNotification({
          message: 'تم حذف الفئة بنجاح',
          type: 'success'
        });
        loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        addNotification({
          message: 'حدث خطأ أثناء حذف الفئة',
          type: 'error'
        });
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '' });
    setFormErrors({});
    setEditingCategory(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">إدارة الفئات</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          إضافة فئة جديدة
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفئة</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="أدخل اسم الفئة"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                {editingCategory ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block table-container">
        <table className="unified-table">
          <thead className="table-header-blue">
            <tr>
              <th className="table-cell table-cell-right">اسم الفئة</th>
              <th className="table-cell table-cell-right">المخزن</th>
              <th className="table-cell table-cell-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="table-cell table-cell-right">{category.name}</td>
                <td className="table-cell table-cell-right">{category.warehouse_name}</td>
                <td className="table-cell table-cell-right">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-900 ml-3"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {categories.length === 0 && (
          <div className="table-empty-state">
            <p>لا توجد فئات مسجلة</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {categories.length === 0 ? (
          <div className="table-empty-state">
            <p>لا توجد فئات مسجلة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="table-card">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium text-gray-700">اسم الفئة:</div>
                  <div className="text-gray-900">{category.name}</div>
                  
                  <div className="font-medium text-gray-700">المخزن:</div>
                  <div className="text-gray-900">{category.warehouse_name}</div>
                </div>
                
                <div className="flex justify-end mt-4 space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoriesPage;