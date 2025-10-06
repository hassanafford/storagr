import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationProvider';
import { getInventoryAuditsService, createInventoryAuditService, updateInventoryAuditService } from '../services/inventoryAuditService';
import { getAllWarehousesService } from '../services/warehouseService';
import { getItemsByWarehouseService } from '../services/itemService';

const InventoryAuditPage = ({ user }) => {
  const { addNotification } = useNotification();
  const [audits, setAudits] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [auditType, setAuditType] = useState('full');
  const [auditNotes, setAuditNotes] = useState('');

  // Load audits and warehouses
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load warehouses
        const warehouseData = await getAllWarehousesService();
        setWarehouses(warehouseData);
        
        // Load audits
        const auditData = await getInventoryAuditsService();
        setAudits(auditData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        addNotification({
          message: 'حدث خطأ أثناء تحميل البيانات',
          type: 'error'
        });
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateAudit = async (e) => {
    e.preventDefault();
    
    if (!selectedWarehouse || !auditType) {
      addNotification({
        message: 'يرجى ملء جميع الحقول المطلوبة',
        type: 'error'
      });
      return;
    }
    
    try {
      const auditData = {
        warehouse_id: parseInt(selectedWarehouse),
        user_id: user.id,
        audit_type: auditType,
        notes: auditNotes
      };
      
      await createInventoryAuditService(auditData);
      
      // Refresh audits list
      const updatedAudits = await getInventoryAuditsService();
      setAudits(updatedAudits);
      
      // Reset form
      setSelectedWarehouse('');
      setAuditType('full');
      setAuditNotes('');
      setShowCreateForm(false);
      
      addNotification({
        message: 'تم إنشاء عملية الجرد بنجاح',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating audit:', error);
      addNotification({
        message: 'حدث خطأ أثناء إنشاء عملية الجرد',
        type: 'error'
      });
    }
  };

  const handleStartAudit = async (auditId) => {
    try {
      const updateData = {
        status: 'in_progress',
        started_at: new Date().toISOString()
      };
      
      await updateInventoryAuditService(auditId, updateData);
      
      // Refresh audits list
      const updatedAudits = await getInventoryAuditsService();
      setAudits(updatedAudits);
      
      addNotification({
        message: 'تم بدء عملية الجرد',
        type: 'success'
      });
    } catch (error) {
      console.error('Error starting audit:', error);
      addNotification({
        message: 'حدث خطأ أثناء بدء عملية الجرد',
        type: 'error'
      });
    }
  };

  const handleCompleteAudit = async (auditId) => {
    try {
      const updateData = {
        status: 'completed',
        completed_at: new Date().toISOString()
      };
      
      await updateInventoryAuditService(auditId, updateData);
      
      // Refresh audits list
      const updatedAudits = await getInventoryAuditsService();
      setAudits(updatedAudits);
      
      addNotification({
        message: 'تم إكمال عملية الجرد',
        type: 'success'
      });
    } catch (error) {
      console.error('Error completing audit:', error);
      addNotification({
        message: 'حدث خطأ أثناء إكمال عملية الجرد',
        type: 'error'
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'معلق', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { text: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800' },
      completed: { text: 'مكتمل', color: 'bg-green-100 text-green-800' },
      cancelled: { text: 'ملغى', color: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getAuditTypeBadge = (type) => {
    const typeMap = {
      full: { text: 'كامل', color: 'bg-purple-100 text-purple-800' },
      partial: { text: 'جزئي', color: 'bg-indigo-100 text-indigo-800' },
      spot: { text: ' Spot Check', color: 'bg-pink-100 text-pink-800' }
    };
    
    const typeInfo = typeMap[type] || { text: type, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
        {typeInfo.text}
      </span>
    );
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
        <h2 className="text-2xl font-bold text-gray-800">إدارة عمليات الجرد</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300"
        >
          {showCreateForm ? 'إلغاء' : 'إنشاء عملية جرد جديدة'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">إنشاء عملية جرد جديدة</h3>
          <form onSubmit={handleCreateAudit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">اختر المخزن</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الجرد</label>
                <select
                  value={auditType}
                  onChange={(e) => setAuditType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="full">كامل</option>
                  <option value="partial">جزئي</option>
                  <option value="spot">Spot Check</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
              <textarea
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="أي ملاحظات إضافية حول عملية الجرد"
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300"
              >
                إنشاء عملية الجرد
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المخزن
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                نوع الجرد
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الموظف
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                تاريخ الإنشاء
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {audits.map((audit) => (
              <tr key={audit.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{audit.warehouses?.name || 'غير محدد'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getAuditTypeBadge(audit.audit_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(audit.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {audit.users?.name || 'غير محدد'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {audit.egyptian_timestamp || new Date(audit.created_at).toLocaleString('ar-EG')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {audit.status === 'pending' && (
                    <button
                      onClick={() => handleStartAudit(audit.id)}
                      className="text-blue-600 hover:text-blue-900 ml-3"
                    >
                      بدء
                    </button>
                  )}
                  {audit.status === 'in_progress' && (
                    <button
                      onClick={() => handleCompleteAudit(audit.id)}
                      className="text-green-600 hover:text-green-900 ml-3"
                    >
                      إكمال
                    </button>
                  )}
                  <button className="text-gray-600 hover:text-gray-900 ml-3">
                    تفاصيل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {audits.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">لا توجد عمليات جرد حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryAuditPage;