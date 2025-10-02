import React, { useState, useEffect } from 'react';
import { getAllWarehouses, getWarehouseItems } from '../services/warehouseService';
import { useNotification } from './NotificationProvider';

const InventoryAuditPanel = () => {
  const { addNotification } = useNotification();
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [items, setItems] = useState([]);
  const [auditData, setAuditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const data = await getAllWarehouses();
        setWarehouses(data);
      } catch (error) {
        console.error('Error loading warehouses:', error);
        addNotification({
          message: 'حدث خطأ أثناء تحميل بيانات المخازن',
          type: 'error'
        });
      }
    };

    loadWarehouses();
  }, []);

  const handleWarehouseChange = async (warehouseId) => {
    setSelectedWarehouse(warehouseId);
    if (!warehouseId) {
      setItems([]);
      setAuditData({});
      return;
    }

    setLoading(true);
    try {
      const warehouseItems = await getWarehouseItems(warehouseId);
      setItems(warehouseItems);
      
      // Initialize audit data with current quantities
      const initialAuditData = {};
      warehouseItems.forEach(item => {
        initialAuditData[item.id] = {
          physical_quantity: item.quantity,
          difference: 0,
          notes: ''
        };
      });
      setAuditData(initialAuditData);
    } catch (error) {
      console.error('Error loading warehouse items:', error);
      addNotification({
        message: 'حدث خطأ أثناء تحميل عناصر المخزن',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId, physicalQuantity) => {
    const item = items.find(i => i.id == itemId);
    if (!item) return;

    const difference = physicalQuantity - item.quantity;
    
    setAuditData({
      ...auditData,
      [itemId]: {
        physical_quantity: physicalQuantity,
        difference: difference,
        notes: auditData[itemId]?.notes || ''
      }
    });
  };

  const handleNotesChange = (itemId, notes) => {
    setAuditData({
      ...auditData,
      [itemId]: {
        ...auditData[itemId],
        notes: notes
      }
    });
  };

  const handleSubmitAudit = async () => {
    if (!selectedWarehouse) {
      addNotification({
        message: 'الرجاء اختيار مخزن أولاً',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Find items with differences
      const itemsWithDifferences = Object.entries(auditData)
        .filter(([itemId, data]) => data.difference !== 0)
        .map(([itemId, data]) => {
          const item = items.find(i => i.id == itemId);
          return {
            item_id: itemId,
            item_name: item?.name,
            system_quantity: item?.quantity,
            physical_quantity: data.physical_quantity,
            difference: data.difference,
            notes: data.notes
          };
        });

      if (itemsWithDifferences.length === 0) {
        addNotification({
          message: 'لا توجد اختلافات في الكميات، الجرد مكتمل',
          type: 'success'
        });
      } else {
        // In a real implementation, you would send this data to the server
        // For now, we'll just show a notification with the differences
        addNotification({
          message: `تم العثور على ${itemsWithDifferences.length} اختلاف في الكميات`,
          type: 'warning'
        });
        
        // Log the differences to console for demonstration
        console.log('Audit Results:', itemsWithDifferences);
      }
      
      // Reset form
      handleWarehouseChange(selectedWarehouse);
    } catch (error) {
      console.error('Error submitting audit:', error);
      addNotification({
        message: 'حدث خطأ أثناء تقديم الجرد',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8" dir="rtl">
      <h3 className="text-xl font-bold text-gray-800 mb-6">جرد المخازن</h3>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">اختر المخزن</label>
        <select
          value={selectedWarehouse}
          onChange={(e) => handleWarehouseChange(e.target.value)}
          className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        >
          <option value="">اختر المخزن</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العنصر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية المسجلة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية الفعلية</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاختلاف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const auditItem = auditData[item.id] || {
                    physical_quantity: item.quantity,
                    difference: 0,
                    notes: ''
                  };
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                        <div className="text-xs text-gray-500">{item.category_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <input
                          type="number"
                          min="0"
                          value={auditItem.physical_quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${
                          auditItem.difference > 0 ? 'text-green-600' : 
                          auditItem.difference < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {auditItem.difference > 0 ? '+' : ''}{auditItem.difference}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <input
                          type="text"
                          value={auditItem.notes}
                          onChange={(e) => handleNotesChange(item.id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="ملاحظات..."
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {items.map((item) => {
              const auditItem = auditData[item.id] || {
                physical_quantity: item.quantity,
                difference: 0,
                notes: ''
              };
              
              return (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium text-gray-700">العنصر:</div>
                    <div className="text-gray-900">
                      {item.name}
                      <div className="text-xs text-gray-500">{item.category_name}</div>
                    </div>
                    
                    <div className="font-medium text-gray-700">الكمية المسجلة:</div>
                    <div className="text-gray-900">{item.quantity}</div>
                    
                    <div className="font-medium text-gray-700">الكمية الفعلية:</div>
                    <div className="text-gray-900">
                      <input
                        type="number"
                        min="0"
                        value={auditItem.physical_quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="font-medium text-gray-700">الاختلاف:</div>
                    <div className="text-gray-900">
                      <span className={`font-medium ${
                        auditItem.difference > 0 ? 'text-green-600' : 
                        auditItem.difference < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {auditItem.difference > 0 ? '+' : ''}{auditItem.difference}
                      </span>
                    </div>
                    
                    <div className="font-medium text-gray-700">ملاحظات:</div>
                    <div className="text-gray-900">
                      <input
                        type="text"
                        value={auditItem.notes}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ملاحظات..."
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmitAudit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50"
            >
              {isSubmitting ? 'جاري تقديم الجرد...' : 'تقديم الجرد'}
            </button>
          </div>
        </>
      )}

      {!loading && selectedWarehouse && items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>لا توجد عناصر في هذا المخزن</p>
        </div>
      )}
    </div>
  );
};

export default InventoryAuditPanel;