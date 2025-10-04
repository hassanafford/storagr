import React, { useState, useEffect } from 'react';
import { getAllWarehouses } from '../services/warehouseService';
import { getAllItems, createTransaction, updateItemQuantity } from '../services/itemService';
import { useNotification } from './NotificationProvider';

const AdminTransactionPanel = () => {
  const { addNotification } = useNotification();
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('issue');
  
  const [issueData, setIssueData] = useState({
    item_id: '',
    warehouse_id: '',
    quantity: 1,
    recipient: '',
    notes: ''
  });
  
  const [returnData, setReturnData] = useState({
    item_id: '',
    warehouse_id: '',
    quantity: 1,
    condition: 'good',
    notes: ''
  });
  
  const [exchangeData, setExchangeData] = useState({
    outgoing_item_id: '',
    incoming_item_id: '',
    outgoing_warehouse_id: '',
    incoming_warehouse_id: '',
    outgoing_quantity: 1,
    incoming_quantity: 1,
    recipient: '',
    notes: ''
  });

  // New state for manual inventory adjustment
  const [adjustmentData, setAdjustmentData] = useState({
    item_id: '',
    warehouse_id: '',
    quantity: 0,
    reason: ''
  });

  // New state for inventory audit
  const [auditData, setAuditData] = useState({
    warehouse_id: '',
    item_id: '',
    physical_quantity: 0,
    notes: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [warehouseData, itemData] = await Promise.all([
          getAllWarehouses(),
          getAllItems()
        ]);
        setWarehouses(warehouseData);
        setItems(itemData);
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

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create transaction record
      const transactionData = {
        item_id: issueData.item_id,
        user_id: 1, // Admin user ID - in a real app, this would be the actual admin ID
        transaction_type: 'out', // Changed from 'issue' to 'out'
        quantity: -Math.abs(issueData.quantity), // Negative for issuing
        recipient: issueData.recipient,
        notes: issueData.notes
      };
      
      await createTransaction(transactionData);
      
      // Update item quantity
      await updateItemQuantity(issueData.item_id, -Math.abs(issueData.quantity));
      
      addNotification({
        message: 'تم صرف العنصر بنجاح!',
        type: 'success'
      });
      
      // Reset form
      setIssueData({
        item_id: '',
        warehouse_id: '',
        quantity: 1,
        recipient: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error issuing item:', error);
      addNotification({
        message: 'حدث خطأ أثناء صرف العنصر',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create transaction record
      const transactionData = {
        item_id: returnData.item_id,
        user_id: 1, // Admin user ID - in a real app, this would be the actual admin ID
        transaction_type: 'in', // Changed from 'return' to 'in'
        quantity: Math.abs(returnData.quantity), // Positive for returning
        recipient: returnData.condition,
        notes: returnData.notes
      };
      
      await createTransaction(transactionData);
      
      // Update item quantity
      await updateItemQuantity(returnData.item_id, Math.abs(returnData.quantity));
      
      addNotification({
        message: 'تم إرجاع العنصر بنجاح!',
        type: 'success'
      });
      
      // Reset form
      setReturnData({
        item_id: '',
        warehouse_id: '',
        quantity: 1,
        condition: 'good',
        notes: ''
      });
    } catch (error) {
      console.error('Error returning item:', error);
      addNotification({
        message: 'حدث خطأ أثناء إرجاع العنصر',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create outgoing transaction record
      const outgoingTransactionData = {
        item_id: exchangeData.outgoing_item_id,
        user_id: 1, // Admin user ID - in a real app, this would be the actual admin ID
        transaction_type: 'out', // Changed from 'exchange_out' to 'out'
        quantity: -Math.abs(exchangeData.outgoing_quantity), // Negative for outgoing
        recipient: exchangeData.recipient,
        notes: exchangeData.notes ? `تبديل: ${exchangeData.notes}` : 'تبديل عنصر'
      };
      
      await createTransaction(outgoingTransactionData);
      
      // Update outgoing item quantity
      await updateItemQuantity(exchangeData.outgoing_item_id, -Math.abs(exchangeData.outgoing_quantity));
      
      // Create incoming transaction record
      const incomingTransactionData = {
        item_id: exchangeData.incoming_item_id,
        user_id: 1, // Admin user ID - in a real app, this would be the actual admin ID
        transaction_type: 'in', // Changed from 'exchange_in' to 'in'
        quantity: Math.abs(exchangeData.incoming_quantity), // Positive for incoming
        recipient: exchangeData.recipient,
        notes: exchangeData.notes ? `تبديل: ${exchangeData.notes}` : 'تبديل عنصر'
      };
      
      await createTransaction(incomingTransactionData);
      
      // Update incoming item quantity
      await updateItemQuantity(exchangeData.incoming_item_id, Math.abs(exchangeData.incoming_quantity));
      
      addNotification({
        message: 'تم تبديل العناصر بنجاح!',
        type: 'success'
      });
      
      // Reset form
      setExchangeData({
        outgoing_item_id: '',
        incoming_item_id: '',
        outgoing_warehouse_id: '',
        incoming_warehouse_id: '',
        outgoing_quantity: 1,
        incoming_quantity: 1,
        recipient: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error exchanging items:', error);
      addNotification({
        message: 'حدث خطأ أثناء تبديل العناصر',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create adjustment transaction record
      const transactionData = {
        item_id: adjustmentData.item_id,
        user_id: 1, // Admin user ID
        transaction_type: 'adjustment',
        quantity: adjustmentData.quantity, // Can be positive or negative
        recipient: '_inventory_adjustment_', // Special identifier for adjustments
        notes: adjustmentData.reason || 'تعديل يدوي للكمية'
      };
      
      await createTransaction(transactionData);
      
      // Update item quantity
      await updateItemQuantity(adjustmentData.item_id, adjustmentData.quantity);
      
      addNotification({
        message: 'تم تعديل الكمية بنجاح!',
        type: 'success'
      });
      
      // Reset form
      setAdjustmentData({
        item_id: '',
        warehouse_id: '',
        quantity: 0,
        reason: ''
      });
    } catch (error) {
      console.error('Error adjusting quantity:', error);
      addNotification({
        message: 'حدث خطأ أثناء تعديل الكمية',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get current item quantity from database
      const currentItem = items.find(item => item.id == auditData.item_id);
      const currentDbQuantity = currentItem ? currentItem.quantity : 0;
      const difference = auditData.physical_quantity - currentDbQuantity;
      
      // If there's a difference, create an adjustment transaction
      if (difference !== 0) {
        const transactionData = {
          item_id: auditData.item_id,
          user_id: 1, // Admin user ID
          transaction_type: 'audit', // Changed from 'audit_adjustment' to 'audit'
          quantity: difference, // Can be positive or negative
          recipient: '_inventory_adjustment_', // Special identifier for adjustments
          notes: auditData.reason || 'تعديل يدوي للكمية',
          expected_quantity: currentDbQuantity,
          actual_quantity: auditData.physical_quantity,
          discrepancy: difference
        };
        
        await createTransaction(transactionData);
        await updateItemQuantity(auditData.item_id, difference);
      }
      
      addNotification({
        message: `تم تسجيل الجرد: الاختلاف ${difference === 0 ? 'صفر' : difference > 0 ? `+${difference}` : difference}`,
        type: 'success'
      });
      
      // Reset form
      setAuditData({
        warehouse_id: '',
        item_id: '',
        physical_quantity: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Error auditing inventory:', error);
      addNotification({
        message: 'حدث خطأ أثناء تسجيل الجرد',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getItemsByWarehouse = (warehouseId) => {
    return items.filter(item => item.warehouse_id == warehouseId);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8" dir="rtl">
      <h3 className="text-xl font-bold text-gray-800 mb-6">عمليات الأدمن</h3>
      
      <div className="flex overflow-x-auto border-b border-gray-200 mb-6">
        <button
          className={`whitespace-nowrap py-2 px-4 font-medium text-sm ${
            activeTab === 'issue' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('issue')}
        >
          صرف عناصر
        </button>
        <button
          className={`whitespace-nowrap py-2 px-4 font-medium text-sm ${
            activeTab === 'return' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('return')}
        >
          إرجاع عناصر
        </button>
        <button
          className={`whitespace-nowrap py-2 px-4 font-medium text-sm ${
            activeTab === 'exchange' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('exchange')}
        >
          تبديل عناصر
        </button>
        <button
          className={`whitespace-nowrap py-2 px-4 font-medium text-sm ${
            activeTab === 'adjustment' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('adjustment')}
        >
          تعديل يدوي
        </button>
        <button
          className={`whitespace-nowrap py-2 px-4 font-medium text-sm ${
            activeTab === 'audit' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('audit')}
        >
          جرد مخزن
        </button>
      </div>

      {activeTab === 'issue' && (
        <form onSubmit={handleIssueSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label>
              <select
                value={issueData.warehouse_id}
                onChange={(e) => {
                  const warehouseId = e.target.value;
                  setIssueData({
                    ...issueData,
                    warehouse_id: warehouseId,
                    item_id: ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">اختر المخزن</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
              <select
                value={issueData.item_id}
                onChange={(e) => setIssueData({...issueData, item_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!issueData.warehouse_id}
              >
                <option value="">اختر العنصر</option>
                {issueData.warehouse_id && getItemsByWarehouse(issueData.warehouse_id).map((item) => (
                  <option key={item.id} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
              <input
                type="number"
                min="1"
                value={issueData.quantity}
                onChange={(e) => setIssueData({...issueData, quantity: parseInt(e.target.value) || 1})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المستلم</label>
              <input
                type="text"
                value={issueData.recipient}
                onChange={(e) => setIssueData({...issueData, recipient: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="اسم المستلم"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
            <textarea
              value={issueData.notes}
              onChange={(e) => setIssueData({...issueData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="أي ملاحظات إضافية"
              rows="3"
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50"
            >
              {loading ? 'جاري التنفيذ...' : 'صرف العنصر'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'return' && (
        <form onSubmit={handleReturnSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label>
              <select
                value={returnData.warehouse_id}
                onChange={(e) => {
                  const warehouseId = e.target.value;
                  setReturnData({
                    ...returnData,
                    warehouse_id: warehouseId,
                    item_id: ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">اختر المخزن</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
              <select
                value={returnData.item_id}
                onChange={(e) => setReturnData({...returnData, item_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!returnData.warehouse_id}
              >
                <option value="">اختر العنصر</option>
                {returnData.warehouse_id && getItemsByWarehouse(returnData.warehouse_id).map((item) => (
                  <option key={item.id} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
              <input
                type="number"
                min="1"
                value={returnData.quantity}
                onChange={(e) => setReturnData({...returnData, quantity: parseInt(e.target.value) || 1})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حالة العنصر</label>
              <select
                value={returnData.condition}
                onChange={(e) => setReturnData({...returnData, condition: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="good">جيدة</option>
                <option value="damaged">تالفة</option>
                <option value="partial">جزئية</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
            <textarea
              value={returnData.notes}
              onChange={(e) => setReturnData({...returnData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="أي ملاحظات إضافية"
              rows="3"
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50"
            >
              {loading ? 'جاري التنفيذ...' : 'إرجاع العنصر'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'exchange' && (
        <form onSubmit={handleExchangeSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">العنصر الصادر</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label>
                  <select
                    value={exchangeData.outgoing_warehouse_id}
                    onChange={(e) => {
                      const warehouseId = e.target.value;
                      setExchangeData({
                        ...exchangeData,
                        outgoing_warehouse_id: warehouseId,
                        outgoing_item_id: ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">اختر المخزن</option>
                    {warehouses.map((warehouse) => (
                      <option key={`out-${warehouse.id}`} value={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
                  <select
                    value={exchangeData.outgoing_item_id}
                    onChange={(e) => setExchangeData({...exchangeData, outgoing_item_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={!exchangeData.outgoing_warehouse_id}
                  >
                    <option value="">اختر العنصر</option>
                    {exchangeData.outgoing_warehouse_id && getItemsByWarehouse(exchangeData.outgoing_warehouse_id).map((item) => (
                      <option key={`out-item-${item.id}`} value={item.id}>
                        {item.name} (المتوفر: {item.quantity})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                  <input
                    type="number"
                    min="1"
                    value={exchangeData.outgoing_quantity}
                    onChange={(e) => setExchangeData({...exchangeData, outgoing_quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">العنصر الوارد</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label>
                  <select
                    value={exchangeData.incoming_warehouse_id}
                    onChange={(e) => {
                      const warehouseId = e.target.value;
                      setExchangeData({
                        ...exchangeData,
                        incoming_warehouse_id: warehouseId,
                        incoming_item_id: ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">اختر المخزن</option>
                    {warehouses.map((warehouse) => (
                      <option key={`in-${warehouse.id}`} value={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
                  <select
                    value={exchangeData.incoming_item_id}
                    onChange={(e) => setExchangeData({...exchangeData, incoming_item_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={!exchangeData.incoming_warehouse_id}
                  >
                    <option value="">اختر العنصر</option>
                    {exchangeData.incoming_warehouse_id && getItemsByWarehouse(exchangeData.incoming_warehouse_id).map((item) => (
                      <option key={`in-item-${item.id}`} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                  <input
                    type="number"
                    min="1"
                    value={exchangeData.incoming_quantity}
                    onChange={(e) => setExchangeData({...exchangeData, incoming_quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">المستلم</label>
              <input
                type="text"
                value={exchangeData.recipient}
                onChange={(e) => setExchangeData({...exchangeData, recipient: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="اسم المستلم"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
            <textarea
              value={exchangeData.notes}
              onChange={(e) => setExchangeData({...exchangeData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="أي ملاحظات إضافية"
              rows="3"
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50"
            >
              {loading ? 'جاري التنفيذ...' : 'تنفيذ التبديل'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'adjustment' && (
        <form onSubmit={handleAdjustmentSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label>
              <select
                value={adjustmentData.warehouse_id}
                onChange={(e) => {
                  const warehouseId = e.target.value;
                  setAdjustmentData({
                    ...adjustmentData,
                    warehouse_id: warehouseId,
                    item_id: ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">اختر المخزن</option>
                {warehouses.map((warehouse) => (
                  <option key={`adj-${warehouse.id}`} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
              <select
                value={adjustmentData.item_id}
                onChange={(e) => setAdjustmentData({...adjustmentData, item_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!adjustmentData.warehouse_id}
              >
                <option value="">اختر العنصر</option>
                {adjustmentData.warehouse_id && getItemsByWarehouse(adjustmentData.warehouse_id).map((item) => (
                  <option key={`adj-item-${item.id}`} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية الجديدة</label>
              <input
                type="number"
                value={adjustmentData.quantity}
                onChange={(e) => setAdjustmentData({...adjustmentData, quantity: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="الكمية الجديدة"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سبب التعديل</label>
              <input
                type="text"
                value={adjustmentData.reason}
                onChange={(e) => setAdjustmentData({...adjustmentData, reason: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="سبب التعديل"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50"
            >
              {loading ? 'جاري التنفيذ...' : 'تعديل الكمية'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'audit' && (
        <form onSubmit={handleAuditSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label>
              <select
                value={auditData.warehouse_id}
                onChange={(e) => {
                  const warehouseId = e.target.value;
                  setAuditData({
                    ...auditData,
                    warehouse_id: warehouseId,
                    item_id: ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">اختر المخزن</option>
                {warehouses.map((warehouse) => (
                  <option key={`audit-${warehouse.id}`} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
              <select
                value={auditData.item_id}
                onChange={(e) => setAuditData({...auditData, item_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!auditData.warehouse_id}
              >
                <option value="">اختر العنصر</option>
                {auditData.warehouse_id && getItemsByWarehouse(auditData.warehouse_id).map((item) => (
                  <option key={`audit-item-${item.id}`} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية الفعلية</label>
              <input
                type="number"
                min="0"
                value={auditData.physical_quantity}
                onChange={(e) => setAuditData({...auditData, physical_quantity: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="الكمية الفعلية بعد الجرد"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
              <input
                type="text"
                value={auditData.notes}
                onChange={(e) => setAuditData({...auditData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ملاحظات إضافية"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50"
            >
              {loading ? 'جاري التنفيذ...' : 'تسجيل الجرد'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminTransactionPanel;