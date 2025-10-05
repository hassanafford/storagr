import React, { useState, useEffect } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../services/userService';
import { getAllWarehouses } from '../services/warehouseService';
import { useNotification } from './NotificationProvider';

const UserManagementPanel = () => {
  const { addNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    national_id: '',
    name: '',
    role: 'employee',
    warehouse_id: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, warehouseData] = await Promise.all([
          getAllUsers(),
          getAllWarehouses()
        ]);
        setUsers(userData);
        setWarehouses(warehouseData);
      } catch (error) {
        console.error('Error loading data:', error);
        addNotification({
          message: 'حدث خطأ أثناء تحميل البيانات',
          type: 'error'
        });
      }
    };
    
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingUser) {
        // Update existing user
        await updateUser(editingUser.id, formData);
        addNotification({
          message: 'تم تحديث المستخدم بنجاح!',
          type: 'success'
        });
      } else {
        // Create new user
        await createUser(formData);
        addNotification({
          message: 'تم إنشاء المستخدم بنجاح!',
          type: 'success'
        });
      }
      
      // Reset form and refresh data
      setFormData({
        national_id: '',
        name: '',
        role: 'employee',
        warehouse_id: ''
      });
      setShowForm(false);
      setEditingUser(null);
      
      // Refresh user list
      const userData = await getAllUsers();
      setUsers(userData);
    } catch (error) {
      console.error('Error saving user:', error);
      addNotification({
        message: 'حدث خطأ أثناء حفظ المستخدم',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      national_id: user.national_id,
      name: user.name,
      role: user.role,
      warehouse_id: user.warehouse_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await deleteUser(userId);
        addNotification({
          message: 'تم حذف المستخدم بنجاح!',
          type: 'success'
        });
        
        // Refresh user list
        const userData = await getAllUsers();
        setUsers(userData);
      } catch (error) {
        console.error('Error deleting user:', error);
        addNotification({
          message: 'حدث خطأ أثناء حذف المستخدم',
          type: 'error'
        });
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      national_id: '',
      name: '',
      role: 'employee',
      warehouse_id: ''
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">إدارة المستخدمين</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300"
        >
          إضافة مستخدم
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 border border-gray-200 rounded-lg">
          <h4 className="text-lg font-medium text-gray-800 mb-4">
            {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الوطني</label>
              <input
                type="text"
                name="national_id"
                value={formData.national_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل الرقم الوطني"
                required
                disabled={editingUser}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل الاسم"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="employee">موظف</option>
                <option value="admin">مدير النظام</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المخزن (اختياري)</label>
              <select
                name="warehouse_id"
                value={formData.warehouse_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">اختر المخزن</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : editingUser ? 'تحديث' : 'حفظ'}
            </button>
          </div>
        </form>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-white">
          <thead className="table-header-blue">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الرقم الوطني</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الاسم</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الدور</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">المخزن</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-white">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 table-cell-right">{user.national_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 table-cell-right">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 table-cell-right">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'admin' ? 'مدير النظام' : 'موظف'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 table-cell-right">
                  {user.warehouse_id ? 
                    warehouses.find(w => w.id == user.warehouse_id)?.name || 'غير محدد' : 
                    'غير محدد'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium table-cell-right">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:text-blue-900 ml-3"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>لا توجد مستخدمين</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>لا توجد مستخدمين</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium text-gray-700">الرقم الوطني:</div>
                  <div className="text-gray-900">{user.national_id}</div>
                  
                  <div className="font-medium text-gray-700">الاسم:</div>
                  <div className="text-gray-900">{user.name}</div>
                  
                  <div className="font-medium text-gray-700">الدور:</div>
                  <div className="text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? 'مدير النظام' : 'موظف'}
                    </span>
                  </div>
                  
                  <div className="font-medium text-gray-700">المخزن:</div>
                  <div className="text-gray-900">
                    {user.warehouse_id ? 
                      warehouses.find(w => w.id == user.warehouse_id)?.name || 'غير محدد' : 
                      'غير محدد'}
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 space-x-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
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
};

export default UserManagementPanel;