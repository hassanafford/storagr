import React, { useState, useEffect } from 'react';
import { getAllWarehouses } from '../services/warehouseService';
import { getItemsByWarehouseService, updateItemQuantityService, createTransactionService } from '../services/itemService';
import { useNotification } from '../components/NotificationProvider';
import { RefreshCw, Package, User, FileText } from 'lucide-react';

const AdminTransactionOperations = ({ onTransactionComplete }) => {
  const { addNotification } = useNotification();
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationType, setOperationType] = useState('issue'); // issue, return, exchange
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [condition, setCondition] = useState('good');
  const [outgoingItem, setOutgoingItem] = useState('');
  const [incomingItem, setIncomingItem] = useState('');
  const [outgoingQuantity, setOutgoingQuantity] = useState(1);
  const [incomingQuantity, setIncomingQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load warehouses
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setLoading(true);
        const data = await getAllWarehouses();
        setWarehouses(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading warehouses:', error);
        addNotification({
          message: 'حدث خطأ أثناء تحميل بيانات المخازن',
          type: 'error'
        });
        setLoading(false);
      }
    };

    loadWarehouses();
  }, []);

  // Load items when warehouse is selected
  useEffect(() => {
    const loadItems = async () => {
      if (selectedWarehouse) {
        try {
          setLoading(true);
          const data = await getItemsByWarehouseService(selectedWarehouse);
          setItems(data);
          setLoading(false);
        } catch (error) {
          console.error('Error loading items:', error);
          addNotification({
            message: 'حدث خطأ أثناء تحميل بيانات العناصر',
            type: 'error'
          });
          setLoading(false);
        }
      } else {
        setItems([]);
      }
    };

    loadItems();
  }, [selectedWarehouse]);

  const handleWarehouseChange = (warehouseId) => {
    setSelectedWarehouse(warehouseId);
    // Reset form when warehouse changes
    setSelectedItem('');
    setOutgoingItem('');
    setIncomingItem('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedWarehouse) {
      addNotification({
        message: 'يرجى اختيار المخزن',
        type: 'error'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      switch (operationType) {
        case 'issue':
          if (!selectedItem || !recipient) {
            addNotification({
              message: 'يرجى ملء جميع الحقول المطلوبة',
              type: 'error'
            });
            setIsSubmitting(false);
            return;
          }
          
          // Create transaction record
          const issueTransactionData = {
            item_id: selectedItem,
            user_id: JSON.parse(localStorage.getItem('user')).id,
            transaction_type: 'issue',
            quantity: -quantity, // Negative for issuing
            recipient: recipient,
            notes: notes
          };
          
          await createTransactionService(issueTransactionData);
          
          // Update item quantity
          await updateItemQuantityService(selectedItem, -quantity);
          
          addNotification({
            message: 'تم صرف العنصر بنجاح!',
            details: `العنصر: ${items.find(i => i.id == selectedItem)?.name} | الكمية: ${quantity} | المستلم: ${recipient}`,
            type: 'success'
          });
          
          // Reset form
          setSelectedItem('');
          setQuantity(1);
          setRecipient('');
          setNotes('');
          break;
          
        case 'return':
          if (!selectedItem) {
            addNotification({
              message: 'يرجى اختيار العنصر المراد إرجاعه',
              type: 'error'
            });
            setIsSubmitting(false);
            return;
          }
          
          // Create transaction record
          const returnTransactionData = {
            item_id: selectedItem,
            user_id: JSON.parse(localStorage.getItem('user')).id,
            transaction_type: 'return',
            quantity: quantity, // Positive for returning
            recipient: condition,
            notes: notes
          };
          
          await createTransactionService(returnTransactionData);
          
          // Update item quantity
          await updateItemQuantityService(selectedItem, quantity);
          
          addNotification({
            message: 'تم إرجاع العنصر بنجاح!',
            details: `العنصر: ${items.find(i => i.id == selectedItem)?.name} | الكمية: ${quantity} | الحالة: ${condition}`,
            type: 'success'
          });
          
          // Reset form
          setSelectedItem('');
          setQuantity(1);
          setCondition('good');
          setNotes('');
          break;
          
        case 'exchange':
          if (!outgoingItem || !incomingItem || !recipient) {
            addNotification({
              message: 'يرجى ملء جميع الحقول المطلوبة',
              type: 'error'
            });
            setIsSubmitting(false);
            return;
          }
          
          // Create outgoing transaction record
          const outgoingTransactionData = {
            item_id: outgoingItem,
            user_id: JSON.parse(localStorage.getItem('user')).id,
            transaction_type: 'exchange_out',
            quantity: -outgoingQuantity, // Negative for outgoing
            recipient: recipient,
            notes: notes ? `تبديل: ${notes}` : 'تبديل عنصر'
          };
          
          await createTransactionService(outgoingTransactionData);
          
          // Update outgoing item quantity
          await updateItemQuantityService(outgoingItem, -outgoingQuantity);
          
          // Create incoming transaction record
          const incomingTransactionData = {
            item_id: incomingItem,
            user_id: JSON.parse(localStorage.getItem('user')).id,
            transaction_type: 'exchange_in',
            quantity: incomingQuantity, // Positive for incoming
            recipient: recipient,
            notes: notes ? `تبديل: ${notes}` : 'تبديل عنصر'
          };
          
          await createTransactionService(incomingTransactionData);
          
          // Update incoming item quantity
          await updateItemQuantityService(incomingItem, incomingQuantity);
          
          addNotification({
            message: 'تم تبديل العناصر بنجاح!',
            details: `التصبع: ${items.find(i => i.id == outgoingItem)?.name} (${outgoingQuantity}) | الوارد: ${items.find(i => i.id == incomingItem)?.name} (${incomingQuantity}) | المستلم: ${recipient}`,
            type: 'success'
          });
          
          // Reset form
          setOutgoingItem('');
          setIncomingItem('');
          setOutgoingQuantity(1);
          setIncomingQuantity(1);
          setRecipient('');
          setNotes('');
          break;
          
        default:
          throw new Error('Invalid operation type');
      }
      
      // Refresh data
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (error) {
      console.error('Error performing transaction:', error);
      addNotification({
        message: 'حدث خطأ أثناء تنفيذ العملية',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && warehouses.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          عمليات المعاملات الإدارية
        </h2>
        <button 
          onClick={() => {
            if (selectedWarehouse) {
              // Reload items for selected warehouse
              const loadItems = async () => {
                try {
                  setLoading(true);
                  const data = await getItemsByWarehouseService(selectedWarehouse);
                  setItems(data);
                  addNotification({
                    message: 'تم تحديث بيانات العناصر',
                    type: 'success'
                  });
                  setLoading(false);
                } catch (error) {
                  console.error('Error reloading items:', error);
                  addNotification({
                    message: 'حدث خطأ أثناء تحديث بيانات العناصر',
                    type: 'error'
                  });
                  setLoading(false);
                }
              };
              loadItems();
            }
          }}
          disabled={loading || !selectedWarehouse}
          className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center"
        >
          <RefreshCw className={`h-4 w-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Warehouse Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label>
          <select 
            value={selectedWarehouse}
            onChange={(e) => handleWarehouseChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading || isSubmitting}
          >
            <option value="">اختر المخزن</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>
        </div>
        
        {/* Operation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نوع العملية</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setOperationType('issue')}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition ${
                operationType === 'issue' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isSubmitting}
            >
              صرف عناصر
            </button>
            <button
              type="button"
              onClick={() => setOperationType('return')}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition ${
                operationType === 'return' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isSubmitting}
            >
              إرجاع عناصر
            </button>
            <button
              type="button"
              onClick={() => setOperationType('exchange')}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition ${
                operationType === 'exchange' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isSubmitting}
            >
              تبديل عناصر
            </button>
          </div>
        </div>
        
        {/* Operation Forms */}
        {operationType === 'issue' && selectedWarehouse && (
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              صرف عناصر
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">العنصر</label>
                <select 
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="">اختر العنصر</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">الكمية</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">المستلم</label>
                  <input 
                    type="text" 
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="اسم الطالب/الموظف" 
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">ملاحظات (اختياري)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية حول هذا الصرف"
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  disabled={isSubmitting}
                ></textarea>
              </div>
            </div>
          </div>
        )}
        
        {operationType === 'return' && selectedWarehouse && (
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="font-medium text-green-800 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              إرجاع عناصر
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">العنصر</label>
                <select 
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="">اختر العنصر</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">الكمية</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">حالة العنصر</label>
                  <select 
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="good">جيدة</option>
                    <option value="damaged">تالفة</option>
                    <option value="partial">جزئية</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">ملاحظات (اختياري)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية حول هذا الإرجاع"
                  className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  disabled={isSubmitting}
                ></textarea>
              </div>
            </div>
          </div>
        )}
        
        {operationType === 'exchange' && selectedWarehouse && (
          <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
            <h3 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              تبديل عناصر
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-purple-200 rounded-lg p-3 bg-white">
                  <h4 className="font-medium text-purple-700 mb-2">العنصر taxpع</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-purple-600 mb-1">العنصر</label>
                      <select 
                        value={outgoingItem}
                        onChange={(e) => setOutgoingItem(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSubmitting}
                      >
                        <option value="">اختر العنصر</option>
                        {items.map((item) => (
                          <option key={`out-${item.id}`} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-purple-600 mb-1">الكمية</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={outgoingQuantity}
                        onChange={(e) => setOutgoingQuantity(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border border-purple-200 rounded-lg p-3 bg-white">
                  <h4 className="font-medium text-purple-700 mb-2">العنصر الوارد</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-purple-600 mb-1">العنصر</label>
                      <select 
                        value={incomingItem}
                        onChange={(e) => setIncomingItem(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSubmitting}
                      >
                        <option value="">اختر العنصر</option>
                        {items.map((item) => (
                          <option key={`in-${item.id}`} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-purple-600 mb-1">الكمية</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={incomingQuantity}
                        onChange={(e) => setIncomingQuantity(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">المستلم</label>
                <input 
                  type="text" 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="اسم الطالب/الموظف" 
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">ملاحظات (اختياري)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية حول هذا التبديل"
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  disabled={isSubmitting}
                ></textarea>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={isSubmitting || !selectedWarehouse}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-6 rounded-lg transition duration-300 flex items-center"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                جاري التنفيذ...
              </>
            ) : (
              <>
                <User className="h-4 w-4 ml-2" />
                تنفيذ العملية
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminTransactionOperations;