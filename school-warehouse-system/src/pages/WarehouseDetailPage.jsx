import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWarehouseByIdService, getWarehouseItemsService } from '../services/warehouseService';
import { getTransactionsByWarehouseService, updateItemQuantityService, createTransactionService, getItemsByWarehouseService, createItemService, updateItemService, deleteItemService } from '../services/itemService';
import { getCurrentUser } from '../services/userService';
import { subscribeToInventoryUpdates, subscribeToTransactions } from '../services/realtimeService';
import { useNotification } from '../components/NotificationProvider';
import { getEgyptianTime } from '../lib/timeUtils';

function WarehouseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [warehouse, setWarehouse] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    quantity: 0,
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  // Admin transaction states
  const [activeTab, setActiveTab] = useState('details'); // New state for tab navigation
  const [issueData, setIssueData] = useState({
    item_id: '',
    quantity: 1,
    recipient: '',
    notes: ''
  });
  const [returnData, setReturnData] = useState({
    item_id: '',
    quantity: 1,
    condition: 'good',
    notes: ''
  });
  const [exchangeData, setExchangeData] = useState({
    outgoing_item_id: '',
    incoming_item_id: '',
    outgoing_quantity: 1,
    incoming_quantity: 1,
    recipient: '',
    notes: ''
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current user
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Check if user has access to this warehouse
    if (currentUser && currentUser.role === 'employee' && currentUser.warehouse_id != id) {
      // Employee trying to access a different warehouse
      addNotification({
        message: 'غير مخول بالوصول إلى هذا المخزن',
        type: 'error'
      });
      navigate('/dashboard'); // Redirect to their dashboard
      return;
    }

    loadWarehouseData();

    const inventorySub = subscribeToInventoryUpdates((data) => {
      loadWarehouseData();
      addNotification({
        message: `تم تحديث المخزون: ${data.item?.name || 'عنصر'}`,
        type: 'info'
      });
    }, parseInt(id));

    const transactionsSub = subscribeToTransactions((transaction) => {
      loadWarehouseData();
    });

    return () => {
      inventorySub.unsubscribe();
      transactionsSub.unsubscribe();
    };
  }, [id]);

  const loadWarehouseData = async () => {
    try {
      setLoading(true);

      // Load warehouse details
      const warehouseData = await getWarehouseByIdService(id);
      setWarehouse(warehouseData);

      // Load items for this warehouse
      const itemsData = await getItemsByWarehouseService(id);
      setItems(itemsData);

      // Load transactions for this warehouse
      const transactionsData = await getTransactionsByWarehouseService(id);
      setTransactions(transactionsData);

      setLoading(false);
    } catch (error) {
      console.error('Error loading warehouse data:', error);
      addNotification({
        message: 'حدث خطأ أثناء تحميل بيانات المخزن',
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
      errors.name = 'اسم العنصر مطلوب';
    } else if (formData.name.length < 3) {
      errors.name = 'اسم العنصر يجب أن يكون على الأقل 3 أحرف';
    }

    if (!formData.category_id) {
      errors.category_id = 'الفئة مطلوبة';
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
      const itemData = {
        ...formData,
        warehouse_id: id,
        quantity: parseInt(formData.quantity) || 0
      };

      if (editingItem) {
        // Update existing item
        await updateItemService(editingItem.id, itemData);
        addNotification({
          message: 'تم تحديث العنصر بنجاح',
          type: 'success'
        });
      } else {
        // Create new item
        await createItemService(itemData);
        addNotification({
          message: 'تم إنشاء العنصر بنجاح',
          type: 'success'
        });
      }

      // Reset form and reload data
      setFormData({ name: '', category_id: '', quantity: 0, description: '' });
      setFormErrors({});
      setEditingItem(null);
      setShowForm(false);
      loadWarehouseData();
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
      quantity: item.quantity,
      description: item.description || ''
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      try {
        await deleteItemService(itemId);
        addNotification({
          message: 'تم حذف العنصر بنجاح',
          type: 'success'
        });
        loadWarehouseData();
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
    setFormData({ name: '', category_id: '', quantity: 0, description: '' });
    setFormErrors({});
    setEditingItem(null);
    setShowForm(false);
  };

  // Admin transaction handlers
  const handleIssueSubmit = async (e) => {
    e.preventDefault();

    if (!issueData.item_id || !issueData.recipient) {
      addNotification({
        message: 'يرجى ملء جميع الحقول المطلوبة',
        type: 'error'
      });
      return;
    }

    try {
      // Create transaction record
      const transactionData = {
        item_id: issueData.item_id,
        user_id: JSON.parse(localStorage.getItem('user') || '{}').id,
        transaction_type: 'issue',
        quantity: -Math.abs(issueData.quantity),
        recipient: issueData.recipient,
        notes: issueData.notes
      };

      await createTransactionService(transactionData);
      await updateItemQuantityService(issueData.item_id, -Math.abs(issueData.quantity));

      addNotification({
        message: 'تم صرف العنصر بنجاح!',
        type: 'success'
      });

      // Reset form
      setIssueData({
        item_id: '',
        quantity: 1,
        recipient: '',
        notes: ''
      });

      // Refresh data
      loadWarehouseData();
    } catch (error) {
      console.error('Error issuing item:', error);
      addNotification({
        message: 'حدث خطأ أثناء صرف العنصر',
        type: 'error'
      });
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();

    if (!returnData.item_id) {
      addNotification({
        message: 'يرجى اختيار العنصر المراد إرجاعه',
        type: 'error'
      });
      return;
    }

    try {
      // Create transaction record
      const transactionData = {
        item_id: returnData.item_id,
        user_id: JSON.parse(localStorage.getItem('user') || '{}').id,
        transaction_type: 'return',
        quantity: Math.abs(returnData.quantity),
        recipient: returnData.condition,
        notes: returnData.notes
      };

      await createTransactionService(transactionData);
      await updateItemQuantityService(returnData.item_id, Math.abs(returnData.quantity));

      addNotification({
        message: 'تم إرجاع العنصر بنجاح!',
        type: 'success'
      });

      // Reset form
      setReturnData({
        item_id: '',
        quantity: 1,
        condition: 'good',
        notes: ''
      });

      // Refresh data
      loadWarehouseData();
    } catch (error) {
      console.error('Error returning item:', error);
      addNotification({
        message: 'حدث خطأ أثناء إرجاع العنصر',
        type: 'error'
      });
    }
  };

  const handleExchangeSubmit = async (e) => {
    e.preventDefault();

    if (!exchangeData.outgoing_item_id || !exchangeData.incoming_item_id || !exchangeData.recipient) {
      addNotification({
        message: 'يرجى ملء جميع الحقول المطلوبة',
        type: 'error'
      });
      return;
    }

    try {
      // Create outgoing transaction
      const outgoingTransactionData = {
        item_id: exchangeData.outgoing_item_id,
        user_id: JSON.parse(localStorage.getItem('user') || '{}').id,
        transaction_type: 'exchange_out',
        quantity: -Math.abs(exchangeData.outgoing_quantity),
        recipient: exchangeData.recipient,
        notes: exchangeData.notes ? `تبديل: ${exchangeData.notes}` : 'تبديل عنصر'
      };

      await createTransactionService(outgoingTransactionData);
      await updateItemQuantityService(exchangeData.outgoing_item_id, -Math.abs(exchangeData.outgoing_quantity));

      // Create incoming transaction
      const incomingTransactionData = {
        item_id: exchangeData.incoming_item_id,
        user_id: JSON.parse(localStorage.getItem('user') || '{}').id,
        transaction_type: 'exchange_in',
        quantity: Math.abs(exchangeData.incoming_quantity),
        recipient: exchangeData.recipient,
        notes: exchangeData.notes ? `تبديل: ${exchangeData.notes}` : 'تبديل عنصر'
      };

      await createTransactionService(incomingTransactionData);
      await updateItemQuantityService(exchangeData.incoming_item_id, Math.abs(exchangeData.incoming_quantity));

      addNotification({
        message: 'تم تبديل العناصر بنجاح!',
        type: 'success'
      });

      // Reset form
      setExchangeData({
        outgoing_item_id: '',
        incoming_item_id: '',
        outgoing_quantity: 1,
        incoming_quantity: 1,
        recipient: '',
        notes: ''
      });

      // Refresh data
      loadWarehouseData();
    } catch (error) {
      console.error('Error exchanging items:', error);
      addNotification({
        message: 'حدث خطأ أثناء تبديل العناصر',
        type: 'error'
      });
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = getEgyptianTime();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 w-full overflow-x-hidden">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 w-full overflow-x-hidden">
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">المخزن غير موجود</h2>
          <p className="text-gray-600">المخزن المطلوب غير موجود في النظام.</p>
          <button
            onClick={() => navigate('/warehouses')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            العودة إلى المخازن
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full overflow-x-hidden" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{warehouse.name}</h2>
          <p className="text-gray-600 mt-1">{warehouse.description || 'لا يوجد وصف'}</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          العودة للوحة التحكم
        </button>
      </div>

      {/* Tab Navigation for Admin */}
      <div className="flex overflow-x-auto border-b border-gray-200 mb-6">
        <button
          className={`whitespace-nowrap py-2 px-4 font-medium text-sm ${activeTab === 'details'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          onClick={() => setActiveTab('details')}
        >
          تفاصيل المخزن
        </button>
        <button
          className={`whitespace-nowrap py-2 px-4 font-medium text-sm ${activeTab === 'issue'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          onClick={() => setActiveTab('issue')}
        >
          صرف عناصر
        </button>
        <button
          className={`whitespace-nowrap py-2 px-4 font-medium text-sm ${activeTab === 'return'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          onClick={() => setActiveTab('return')}
        >
          إرجاع عناصر
        </button>
        <button
          className={`whitespace-nowrap py-2 px-4 font-medium text-sm ${activeTab === 'exchange'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          onClick={() => setActiveTab('exchange')}
        >
          تبديل عناصر
        </button>
        <button
          className={`whitespace-nowrap py-2 px-4 font-medium text-sm ${activeTab === 'log'
            ? 'text-green-600 border-b-2 border-green-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          onClick={() => setActiveTab('log')}
        >
          سجل الحركات
        </button>
      </div>

      {/* Warehouse Details Tab */}
      {activeTab === 'details' && (
        <div className="w-full overflow-x-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-blue-800">إجمالي العناصر</p>
                  <h3 className="text-2xl font-bold text-blue-900 mt-1">{items.length}</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-green-800">الكمية الإجمالية</p>
                  <h3 className="text-2xl font-bold text-green-900 mt-1">
                    {items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                  </h3>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-purple-800">الحركات الأخيرة</p>
                  <h3 className="text-2xl font-bold text-purple-900 mt-1">{transactions.length}</h3>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-xl font-bold text-gray-800">العناصر في المخزن</h3>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              إضافة عنصر جديد
            </button>
          </div>

          {showForm && (
            <div className="mb-8 bg-gray-50 rounded-xl p-6 w-full overflow-x-hidden">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editingItem ? 'تعديل العنصر' : 'إضافة عنصر جديد'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4 w-full">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم العنصر</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="أدخل اسم العنصر"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.category_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                      <option value="">اختر الفئة</option>
                      <option value="1">أدوات مدرسية</option>
                      <option value="2">معدات إلكترونية</option>
                      <option value="3">أدوات تنظيف</option>
                      <option value="4">مستلزمات المكتب</option>
                      <option value="5">معدات مختبر كيمياء</option>
                      <option value="6">معدات مختبر فيزياء</option>
                      <option value="7">معدات مختبر بيولوجيا</option>
                      <option value="8">كتب دراسية</option>
                      <option value="9">كتب مرجعية</option>
                      <option value="10">مجلات</option>
                      <option value="11">زي مدرسي</option>
                      <option value="12">بدلات رياضة</option>
                      <option value="13">مكاتب</option>
                      <option value="14">كراسي</option>
                      <option value="15">ألواح</option>
                      <option value="16">حاسبات</option>
                      <option value="17">سماعات</option>
                      <option value="18">شاشات</option>
                      <option value="19">مساطر</option>
                      <option value="20">أقلام</option>
                      <option value="21">كراسات</option>
                      <option value="22">وجبات خفيفة</option>
                      <option value="23">مشروبات</option>
                      <option value="24">منظفات</option>
                      <option value="25">مناديل</option>
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
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.quantity ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="أدخل الكمية"
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
          <div className="hidden md:block table-container w-full">
            <table className="unified-table">
              <thead className="table-header-blue">
                <tr>
                  <th className="table-cell table-cell-right">اسم العنصر</th>
                  <th className="table-cell table-cell-right">الفئة</th>
                  <th className="table-cell table-cell-right">الكمية</th>
                  <th className="table-cell table-cell-right">الوصف</th>
                  <th className="table-cell table-cell-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="table-cell table-cell-right">{item.name}</td>
                    <td className="table-cell table-cell-right">{item.category_name}</td>
                    <td className="table-cell table-cell-right">{item.quantity}</td>
                    <td className="table-cell table-cell-right">{item.description || '-'}</td>
                    <td className="table-cell table-cell-right">
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
              <div className="table-empty-state">
                <p>لا توجد عناصر في هذا المخزن</p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden w-full">
            {items.length === 0 ? (
              <div className="table-empty-state">
                <p>لا توجد عناصر في هذا المخزن</p>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {items.map((item) => (
                  <div key={item.id} className="table-card w-full">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium text-gray-700">اسم العنصر:</div>
                      <div className="text-gray-900">{item.name}</div>

                      <div className="font-medium text-gray-700">الفئة:</div>
                      <div className="text-gray-900">{item.category_name}</div>

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
      )}

      {/* Issue Items Tab */}
      {activeTab === 'issue' && (
        <div className="max-w-3xl mx-auto w-full overflow-x-hidden">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-700 text-sm">اختر العنصر الذي تريد صرفه وحدد الكمية والمستلم</p>
            </div>
          </div>

          <form onSubmit={handleIssueSubmit} className="space-y-4 w-full">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
              <select
                value={issueData.item_id}
                onChange={(e) => setIssueData({ ...issueData, item_id: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">اختر عنصر</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
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
                max={items.find(item => item.id == issueData.item_id)?.quantity || 1}
                value={issueData.quantity}
                onChange={(e) => setIssueData({ ...issueData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المستلم</label>
              <input
                type="text"
                value={issueData.recipient}
                onChange={(e) => setIssueData({ ...issueData, recipient: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="اسم المستلم"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea
                value={issueData.notes}
                onChange={(e) => setIssueData({ ...issueData, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ملاحظات إضافية"
                rows="2"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              صرف العنصر
            </button>
          </form>
        </div>
      )}

      {/* Return Items Tab */}
      {activeTab === 'return' && (
        <div className="max-w-3xl mx-auto w-full overflow-x-hidden">
          <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-700 text-sm">اختر العنصر المراد إرجاعه وحدد الكمية وحالة العنصر</p>
            </div>
          </div>

          <form onSubmit={handleReturnSubmit} className="space-y-4 w-full">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
              <select
                value={returnData.item_id}
                onChange={(e) => setReturnData({ ...returnData, item_id: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">اختر عنصر</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
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
                value={returnData.quantity}
                onChange={(e) => setReturnData({ ...returnData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حالة العنصر</label>
              <select
                value={returnData.condition}
                onChange={(e) => setReturnData({ ...returnData, condition: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="good">جيد</option>
                <option value="damaged">تالف</option>
                <option value="used">مستخدم</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea
                value={returnData.notes}
                onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="ملاحظات إضافية"
                rows="2"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              إرجاع العنصر
            </button>
          </form>
        </div>
      )}

      {/* Exchange Items Tab */}
      {activeTab === 'exchange' && (
        <div className="max-w-3xl mx-auto w-full overflow-x-hidden">
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-purple-700 text-sm">حدد العناصر المراد تبديلها والكميات والمستلم</p>
            </div>
          </div>

          <form onSubmit={handleExchangeSubmit} className="space-y-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنصر الصادر</label>
                <select
                  value={exchangeData.outgoing_item_id}
                  onChange={(e) => setExchangeData({ ...exchangeData, outgoing_item_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">اختر عنصر</option>
                  {items.map(item => (
                    <option key={`out-${item.id}`} value={item.id}>
                      {item.name} (المتوفر: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكمية الصادرة</label>
                <input
                  type="number"
                  min="1"
                  max={items.find(item => item.id == exchangeData.outgoing_item_id)?.quantity || 1}
                  value={exchangeData.outgoing_quantity}
                  onChange={(e) => setExchangeData({ ...exchangeData, outgoing_quantity: parseInt(e.target.value) || 1 })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنصر الوارد</label>
                <select
                  value={exchangeData.incoming_item_id}
                  onChange={(e) => setExchangeData({ ...exchangeData, incoming_item_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">اختر عنصر</option>
                  {items.map(item => (
                    <option key={`in-${item.id}`} value={item.id}>
                      {item.name} (المتوفر: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكمية الواردة</label>
                <input
                  type="number"
                  min="1"
                  value={exchangeData.incoming_quantity}
                  onChange={(e) => setExchangeData({ ...exchangeData, incoming_quantity: parseInt(e.target.value) || 1 })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المستلم</label>
              <input
                type="text"
                value={exchangeData.recipient}
                onChange={(e) => setExchangeData({ ...exchangeData, recipient: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="اسم المستلم"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea
                value={exchangeData.notes}
                onChange={(e) => setExchangeData({ ...exchangeData, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="ملاحظات إضافية"
                rows="2"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              تبديل العناصر
            </button>
          </form>
        </div>
      )}

      {/* Transaction Log Tab */}
      {activeTab === 'log' && (
        <div className="w-full overflow-x-hidden">
          <h3 className="text-xl font-bold text-gray-800 mb-6">سجل الحركات</h3>

          {/* Desktop Table View */}
          <div className="hidden md:block table-container w-full">
            <table className="unified-table">
              <thead className="table-header-blue">
                <tr>
                  <th className="table-cell table-cell-right">النوع</th>
                  <th className="table-cell table-cell-right">العنصر</th>
                  <th className="table-cell table-cell-right">المخزن</th>
                  <th className="table-cell table-cell-right">الكمية</th>
                  <th className="table-cell table-cell-right">المستلم/الحالة</th>
                  <th className="table-cell table-cell-right">المستخدم</th>
                  <th className="table-cell table-cell-right">التاريخ</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="table-cell table-cell-right">
                      {transaction.transaction_type === 'out' && 'صرف'}
                      {transaction.transaction_type === 'in' && 'إرجاع'}
                      {transaction.transaction_type === 'adjustment' && 'تعديل'}
                      {transaction.transaction_type === 'audit' && 'جرد'}
                      {transaction.transaction_type === 'transfer' && 'تحويل'}
                    </td>
                    <td className="table-cell table-cell-right">{transaction.item_name || 'غير محدد'}</td>
                    <td className="table-cell table-cell-right">{transaction.warehouse_name || 'غير محدد'}</td>
                    <td className={`table-cell table-cell-right ${transaction.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                    </td>
                    <td className="table-cell table-cell-right">
                      {transaction.recipient}
                    </td>
                    <td className="table-cell table-cell-right">{transaction.user_name || 'غير محدد'}</td>
                    <td className="table-cell table-cell-right">{formatTimeAgo(transaction.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden w-full">
            {transactions.length > 0 ? (
              <div className="space-y-4 w-full">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="table-card w-full">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium text-gray-700">النوع:</div>
                      <div className="text-gray-900">
                        {transaction.transaction_type === 'out' && 'صرف'}
                        {transaction.transaction_type === 'in' && 'إرجاع'}
                        {transaction.transaction_type === 'adjustment' && 'تعديل'}
                        {transaction.transaction_type === 'audit' && 'جرد'}
                        {transaction.transaction_type === 'transfer' && 'تحويل'}
                      </div>

                      <div className="font-medium text-gray-700">العنصر:</div>
                      <div className="text-gray-900">{transaction.item_name || 'غير محدد'}</div>

                      <div className="font-medium text-gray-700">المخزن:</div>
                      <div className="text-gray-900">{transaction.warehouse_name || 'غير محدد'}</div>

                      <div className="font-medium text-gray-700">الكمية:</div>
                      <div className={`text-gray-900 ${transaction.quantity < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                        {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                      </div>

                      <div className="font-medium text-gray-700">المستلم/الحالة:</div>
                      <div className="text-gray-900">{transaction.recipient}</div>

                      <div className="font-medium text-gray-700">المستخدم:</div>
                      <div className="text-gray-900">{transaction.user_name || 'غير محدد'}</div>

                      <div className="font-medium text-gray-700">التاريخ:</div>
                      <div className="text-gray-900">{formatTimeAgo(transaction.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="table-empty-state">
                <p>لا توجد حركات في هذا المخزن</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WarehouseDetailPage;