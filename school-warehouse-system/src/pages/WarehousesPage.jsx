import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationProvider';
import { getAllWarehouses, createWarehouseService, updateWarehouseService, deleteWarehouseService, getWarehouseStatsService } from '../services/warehouseService';

function WarehousesPage() {
  const { addNotification } = useNotification();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [warehouseStats, setWarehouseStats] = useState({});

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const data = await getAllWarehouses();
      setWarehouses(data);
      
      // Load stats for each warehouse
      const stats = {};
      for (const warehouse of data) {
        try {
          const warehouseStats = await getWarehouseStatsService(warehouse.id);
          stats[warehouse.id] = warehouseStats;
        } catch (error) {
          console.error(`Error loading stats for warehouse ${warehouse.id}:`, error);
        }
      }
      setWarehouseStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading warehouses:', error);
      addNotification({
        message: 'حدث خطأ أثناء تحميل المخازن',
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
      errors.name = 'اسم المخزن مطلوب';
    } else if (formData.name.length < 3) {
      errors.name = 'اسم المخزن يجب أن يكون على الأقل 3 أحرف';
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
      if (editingWarehouse) {
        // Update existing warehouse
        await updateWarehouseService(editingWarehouse.id, formData);
        addNotification({
          message: 'تم تحديث المخزن بنجاح',
          type: 'success'
        });
      } else {
        // Create new warehouse
        await createWarehouseService(formData);
        addNotification({
          message: 'تم إنشاء المخزن بنجاح',
          type: 'success'
        });
      }
      
      // Reset form and reload data
      setFormData({ name: '', description: '' });
      setFormErrors({});
      setEditingWarehouse(null);
      setShowForm(false);
      loadWarehouses();
    } catch (error) {
      console.error('Error saving warehouse:', error);
      addNotification({
        message: error.message || 'حدث خطأ أثناء حفظ المخزن',
        type: 'error'
      });
    }
  };

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      description: warehouse.description || ''
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المخزن؟')) {
      try {
        await deleteWarehouseService(id);
        addNotification({
          message: 'تم حذف المخزن بنجاح',
          type: 'success'
        });
        loadWarehouses();
      } catch (error) {
        console.error('Error deleting warehouse:', error);
        addNotification({
          message: 'حدث خطأ أثناء حذف المخزن',
          type: 'error'
        });
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setEditingWarehouse(null);
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
        <h2 className="text-2xl font-bold text-gray-800">إدارة المخازن</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          إضافة مخزن جديد
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingWarehouse ? 'تعديل المخزن' : 'إضافة مخزن جديد'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المخزن</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="أدخل اسم المخزن"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل وصف المخزن"
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
                {editingWarehouse ? 'تحديث' : 'إضافة'}
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
              <th className="table-cell table-cell-right">اسم المخزن</th>
              <th className="table-cell table-cell-right">الوصف</th>
              <th className="table-cell table-cell-right">عدد العناصر</th>
              <th className="table-cell table-cell-right">الكمية الإجمالية</th>
              <th className="table-cell table-cell-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {warehouses.map((warehouse) => {
              const stats = warehouseStats[warehouse.id] || { total_items: 0, total_quantity: 0 };
              return (
                <tr key={warehouse.id}>
                  <td className="table-cell table-cell-right">{warehouse.name}</td>
                  <td className="table-cell table-cell-right">{warehouse.description || '-'}</td>
                  <td className="table-cell table-cell-right">{stats.total_items || 0}</td>
                  <td className="table-cell table-cell-right">{stats.total_quantity || 0}</td>
                  <td className="table-cell table-cell-right">
                    <button
                      onClick={() => handleEdit(warehouse)}
                      className="text-blue-600 hover:text-blue-900 ml-3"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(warehouse.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {warehouses.length === 0 && (
          <div className="table-empty-state">
            <p>لا توجد مخازن مسجلة</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {warehouses.length === 0 ? (
          <div className="table-empty-state">
            <p>لا توجد مخازن مسجلة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {warehouses.map((warehouse) => {
              const stats = warehouseStats[warehouse.id] || { total_items: 0, total_quantity: 0 };
              return (
                <div key={warehouse.id} className="table-card">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium text-gray-700">اسم المخزن:</div>
                    <div className="text-gray-900">{warehouse.name}</div>
                    
                    <div className="font-medium text-gray-700">الوصف:</div>
                    <div className="text-gray-900">{warehouse.description || '-'}</div>
                    
                    <div className="font-medium text-gray-700">عدد العناصر:</div>
                    <div className="text-gray-900">{stats.total_items || 0}</div>
                    
                    <div className="font-medium text-gray-700">الكمية الإجمالية:</div>
                    <div className="text-gray-900">{stats.total_quantity || 0}</div>
                  </div>
                  
                  <div className="flex justify-end mt-4 space-x-2">
                    <button
                      onClick={() => handleEdit(warehouse)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(warehouse.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default WarehousesPage;