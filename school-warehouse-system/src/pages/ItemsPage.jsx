import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationProvider';
import { getAllItemsService, createItemService, updateItemService, deleteItemService, searchItemsService } from '../services/itemService';
import { getAllWarehousesService } from '../services/warehouseService';
import { getAllCategoriesService } from '../services/categoryService';

function ItemsPage() {
  const { addNotification } = useNotification();
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    warehouse_id: '',
    quantity: 0,
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadItems();
    loadWarehouses();
    loadCategories();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await getAllItemsService();
      setItems(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading items:', error);
      addNotification({
        message: 'حدث خطأ أثناء تحميل العناصر',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const data = await getAllWarehousesService();
      setWarehouses(data);
    } catch (error) {
      console.error('Error loading warehouses:', error);
      addNotification({
        message: 'حدث خطأ أثناء تحميل المخازن',
        type: 'error'
      });
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getAllCategoriesService();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      addNotification({
        message: 'حدث خطأ أثناء تحميل الفئات',
        type: 'error'
      });
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim() === '') {
      loadItems();
      return;
    }
    
    try {
      const data = await searchItemsService(searchQuery);
      setItems(data);
    } catch (error) {
      console.error('Error searching items:', error);
      addNotification({
        message: 'حدث خطأ أثناء البحث في العناصر',
        type: 'error'
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'اسم العنصر مطلوب';
    } else if (formData.name.length < 3) {
      errors.name = 'اسم العنصر يجب أن يكون على الأقل 3 أحرف';
    }
    
    if (!formData.category_id) {
      errors.category_id = 'الفئة مطلوبة';
    }
    
    if (!formData.warehouse_id) {
      errors.warehouse_id = 'المخزن مطلوب';
    }
    
    if (formData.quantity < 0) {
      errors.quantity = 'الكمية لا يمكن أن تكون سالبة';
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
      if (editingItem) {
        // Update existing item
        await updateItemService(editingItem.id, formData);
        addNotification({
          message: 'تم تحديث العنصر بنجاح',
          type: 'success'
        });
      } else {
        // Create new item
        await createItemService(formData);
        addNotification({
          message: 'تم إنشاء العنصر بنجاح',
          type: 'success'
        });
      }
      
      // Reset form and reload data
      setFormData({ name: '', category_id: '', warehouse_id: '', quantity: 0, description: '' });
      setFormErrors({});
      setEditingItem(null);
      setShowForm(false);
      loadItems();
    } catch (error) {
      console.error('Error saving item:', error);
      addNotification({
        message: error.message || 'حدث خطأ أثناء حفظ العنصر',
        type: 'error'
      });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category_id: item.category_id,
      warehouse_id: item.warehouse_id,
      quantity: item.quantity || 0,
      description: item.description || ''
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      try {
        await deleteItemService(id);
        addNotification({
          message: 'تم حذف العنصر بنجاح',
          type: 'success'
        });
        loadItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        addNotification({
          message: 'حدث خطأ أثناء حذف العنصر',
          type: 'error'
        });
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', category_id: '', warehouse_id: '', quantity: 0, description: '' });
    setFormErrors({});
    setEditingItem(null);
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
        <h2 className="text-2xl font-bold text-gray-800">إدارة العناصر</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          إضافة عنصر جديد
        </button>
      </div>

      <div className="mb-6 flex">
        <div className="flex-1 mr-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ابحث في العناصر..."
          />
        </div>
        <button
          onClick={handleSearch}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          بحث
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingItem ? 'تعديل العنصر' : 'إضافة عنصر جديد'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم العنصر</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="أدخل اسم العنصر"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label>
                <select
                  name="warehouse_id"
                  value={formData.warehouse_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.warehouse_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">اختر المخزن</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
                {formErrors.warehouse_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.warehouse_id}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">اختر الفئة</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                {formErrors.category_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.category_id}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.quantity}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل وصف العنصر"
                rows="3"
              ></textarea>
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
                {editingItem ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-white">
          <thead className="table-header-blue">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">اسم العنصر</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الفئة</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">المخزن</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الكمية</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الوصف</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-white">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 table-cell-right">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{item.category_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{item.warehouse_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{item.quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-500 table-cell-right">{item.description || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium table-cell-right">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-900 ml-3"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>لا توجد عناصر مسجلة</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>لا توجد عناصر مسجلة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium text-gray-700">اسم العنصر:</div>
                  <div className="text-gray-900">{item.name}</div>
                  
                  <div className="font-medium text-gray-700">الفئة:</div>
                  <div className="text-gray-900">{item.category_name}</div>
                  
                  <div className="font-medium text-gray-700">المخزن:</div>
                  <div className="text-gray-900">{item.warehouse_name}</div>
                  
                  <div className="font-medium text-gray-700">الكمية:</div>
                  <div className="text-gray-900">{item.quantity}</div>
                  
                  <div className="font-medium text-gray-700">الوصف:</div>
                  <div className="text-gray-900">{item.description || '-'}</div>
                </div>
                
                <div className="flex justify-end mt-4 space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
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

export default ItemsPage;