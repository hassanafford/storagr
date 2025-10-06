import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationProvider';
import { getInventoryAuditsService, createInventoryAuditService, updateInventoryAuditService, getAuditDetailsByAuditIdService, createAuditDetailService } from '../services/inventoryAuditService';
import { getItemsByWarehouseService } from '../services/itemService';
import { getWarehouseByIdService } from '../services/warehouseService';

const EmployeeInventoryAuditPage = ({ user }) => {
  const { addNotification } = useNotification();
  const [audits, setAudits] = useState([]);
  const [warehouse, setWarehouse] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [auditType, setAuditType] = useState('full');
  const [auditNotes, setAuditNotes] = useState('');
  const [activeAudit, setActiveAudit] = useState(null);
  const [auditDetails, setAuditDetails] = useState([]);
  const [showAuditDetailForm, setShowAuditDetailForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [expectedQuantity, setExpectedQuantity] = useState('');
  const [actualQuantity, setActualQuantity] = useState('');
  const [detailNotes, setDetailNotes] = useState('');

  // Load warehouse and items for the employee
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (user.warehouse_id) {
          // Load warehouse
          const warehouseData = await getWarehouseByIdService(user.warehouse_id);
          setWarehouse(warehouseData);
          
          // Load items for the warehouse
          const itemData = await getItemsByWarehouseService(user.warehouse_id);
          setItems(itemData);
          
          // Load audits for this warehouse and user
          const auditData = await getInventoryAuditsService({ 
            warehouseId: user.warehouse_id,
            userId: user.id
          });
          setAudits(auditData);
        }
        
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
  }, [user.warehouse_id, user.id]);

  // Load audit details when an audit is selected
  useEffect(() => {
    const loadAuditDetails = async () => {
      if (activeAudit) {
        try {
          const details = await getAuditDetailsByAuditIdService(activeAudit.id);
          setAuditDetails(details);
        } catch (error) {
          console.error('Error loading audit details:', error);
          addNotification({
            message: 'حدث خطأ أثناء تحميل تفاصيل الجرد',
            type: 'error'
          });
        }
      } else {
        setAuditDetails([]);
      }
    };

    loadAuditDetails();
  }, [activeAudit]);

  const handleCreateAudit = async (e) => {
    e.preventDefault();
    
    if (!auditType) {
      addNotification({
        message: 'يرجى اختيار نوع الجرد',
        type: 'error'
      });
      return;
    }
    
    try {
      const auditData = {
        warehouse_id: user.warehouse_id,
        user_id: user.id,
        audit_type: auditType,
        notes: auditNotes
      };
      
      await createInventoryAuditService(auditData);
      
      // Refresh audits list
      const updatedAudits = await getInventoryAuditsService({ 
        warehouseId: user.warehouse_id,
        userId: user.id
      });
      setAudits(updatedAudits);
      
      // Reset form
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
      const updatedAudits = await getInventoryAuditsService({ 
        warehouseId: user.warehouse_id,
        userId: user.id
      });
      setAudits(updatedAudits);
      
      // Set this as the active audit
      const startedAudit = updatedAudits.find(audit => audit.id === auditId);
      setActiveAudit(startedAudit);
      
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
      const updatedAudits = await getInventoryAuditsService({ 
        warehouseId: user.warehouse_id,
        userId: user.id
      });
      setAudits(updatedAudits);
      
      // Clear active audit
      setActiveAudit(null);
      
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

  const handleAddAuditDetail = async (e) => {
    e.preventDefault();
    
    if (!selectedItem || expectedQuantity === '' || actualQuantity === '') {
      addNotification({
        message: 'يرجى ملء جميع الحقول المطلوبة',
        type: 'error'
      });
      return;
    }
    
    try {
      const detailData = {
        inventory_audit_id: activeAudit.id,
        item_id: parseInt(selectedItem),
        expected_quantity: parseInt(expectedQuantity),
        actual_quantity: parseInt(actualQuantity),
        notes: detailNotes
      };
      
      await createAuditDetailService(detailData);
      
      // Refresh audit details
      const updatedDetails = await getAuditDetailsByAuditIdService(activeAudit.id);
      setAuditDetails(updatedDetails);
      
      // Reset form
      setSelectedItem('');
      setExpectedQuantity('');
      setActualQuantity('');
      setDetailNotes('');
      setShowAuditDetailForm(false);
      
      addNotification({
        message: 'تم إضافة تفاصيل الجرد بنجاح',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding audit detail:', error);
      addNotification({
        message: 'حدث خطأ أثناء إضافة تفاصيل الجرد',
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

  if (!warehouse) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">غير مخول بالوصول</h2>
          <p className="text-gray-600">ليس لديك مخزن مخصص. يرجى الاتصال بالمسؤول.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">عمليات الجرد - {warehouse.name}</h2>
          <p className="text-gray-600">إدارة عمليات الجرد لمخزنك</p>
        </div>
        {!activeAudit && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300"
          >
            {showCreateForm ? 'إلغاء' : 'إنشاء عملية جرد جديدة'}
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">إنشاء عملية جرد جديدة</h3>
          <form onSubmit={handleCreateAudit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {activeAudit && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              عملية جرد نشطة: {getAuditTypeBadge(activeAudit.audit_type)} {getStatusBadge(activeAudit.status)}
            </h3>
            <div>
              {activeAudit.status === 'in_progress' && (
                <button
                  onClick={() => handleCompleteAudit(activeAudit.id)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 ml-2"
                >
                  إكمال الجرد
                </button>
              )}
              <button
                onClick={() => setActiveAudit(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300"
              >
                العودة للقائمة
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <button
              onClick={() => setShowAuditDetailForm(!showAuditDetailForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300"
            >
              {showAuditDetailForm ? 'إلغاء' : 'إضافة عنصر للجرد'}
            </button>
          </div>
          
          {showAuditDetailForm && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="text-md font-medium text-gray-800 mb-3">إضافة عنصر للجرد</h4>
              <form onSubmit={handleAddAuditDetail} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
                    <select
                      value={selectedItem}
                      onChange={(e) => setSelectedItem(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">اختر العنصر</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (المتوفر: {item.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الكمية المتوقعة</label>
                    <input
                      type="number"
                      value={expectedQuantity}
                      onChange={(e) => setExpectedQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الكمية الفعلية</label>
                    <input
                      type="number"
                      value={actualQuantity}
                      onChange={(e) => setActualQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
                  <textarea
                    value={detailNotes}
                    onChange={(e) => setDetailNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    placeholder="أي ملاحظات إضافية حول هذا العنصر"
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300"
                  >
                    إضافة للجرد
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <h4 className="text-md font-medium text-gray-800 mb-3">تفاصيل الجرد</h4>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العنصر
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المتوقع
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الفعلي
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الفرق
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الملاحظات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditDetails.map((detail) => (
                  <tr key={detail.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {detail.items?.name || 'غير محدد'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detail.expected_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detail.actual_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={detail.discrepancy !== 0 ? (detail.discrepancy > 0 ? 'text-green-600' : 'text-red-600') : ''}>
                        {detail.discrepancy}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detail.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {auditDetails.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500">لا توجد تفاصيل جرد حالياً</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!activeAudit && (
        <div className="overflow-x-auto">
          <h3 className="text-lg font-medium text-gray-800 mb-4">عمليات الجرد السابقة</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نوع الجرد
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
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
                    {getAuditTypeBadge(audit.audit_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(audit.status)}
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
                        onClick={() => setActiveAudit(audit)}
                        className="text-green-600 hover:text-green-900 ml-3"
                      >
                        متابعة
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
      )}
    </div>
  );
};

export default EmployeeInventoryAuditPage;