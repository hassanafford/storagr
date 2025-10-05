import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarChart3, Package, TrendingUp, TrendingDown, AlertTriangle, User, Calendar, FileText, Clock, Search, RefreshCw } from 'lucide-react';
import { useNotification } from '../components/NotificationProvider';
import { getWarehouseByIdService, getWarehouseItemsService, getWarehouseStatsService } from '../services/warehouseService';
import { getItemsByWarehouseService, updateItemQuantityService, createTransactionService, getTransactionsByWarehouseService } from '../services/itemService';
import { formatTimeAgo } from '../lib/timeUtils';
import DashboardPieChart from '../components/DashboardPieChart';
import { subscribeToInventoryUpdates, subscribeToTransactions } from '../services/realtimeService';

function EmployeeDashboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('analytics');
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  useEffect(() => {
    const loadWarehouse = async () => {
      try {
        if (user.warehouse_id) {
          const warehouseData = await getWarehouseByIdService(user.warehouse_id);
          setWarehouse(warehouseData);
          // Load analytics data for employee
          loadEmployeeAnalytics(user.warehouse_id);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading warehouse:', error);
        addNotification({
          message: 'حدث خطأ أثناء تحميل بيانات المخزن',
          type: 'error'
        });
        setLoading(false);
      }
    };

    loadWarehouse();
  }, [user.warehouse_id]);

  useEffect(() => {
    if (!warehouse) return;

    const inventorySub = subscribeToInventoryUpdates((data) => {
      loadEmployeeAnalytics(warehouse.id);
      addNotification({
        message: `تم تحديث المخزون: ${data.item?.name || 'عنصر'}`,
        type: 'info'
      });
    }, warehouse.id);

    const transactionsSub = subscribeToTransactions((transaction) => {
      loadEmployeeAnalytics(warehouse.id);
    });

    return () => {
      inventorySub.unsubscribe();
      transactionsSub.unsubscribe();
    };
  }, [warehouse]);

  // Load employee analytics data
  const loadEmployeeAnalytics = async (warehouseId) => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const data = await getWarehouseStatsService(warehouseId);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading employee analytics data:', error);
      setAnalyticsError(error.message);
      addNotification({
        message: 'حدث خطأ أثناء تحميل بيانات التحليلات',
        type: 'error'
      });
    } finally {
      setAnalyticsLoading(false);
    }
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

  // Mobile tab navigation items
  const tabItems = [
    { id: 'analytics', name: 'التحليلات', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'issue', name: 'صرف عناصر', icon: <TrendingDown className="h-4 w-4" /> },
    { id: 'return', name: 'إرجاع عناصر', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'exchange', name: 'تبديل عناصر', icon: <RefreshCw className="h-4 w-4" /> },
    { id: 'log', name: 'سجل الحركات', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">لوحة تحكم الموظف</h2>
          <p className="text-gray-600 text-sm sm:text-base">المخزن: {warehouse?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(`/warehouses/${warehouse?.id}`)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">عرض تفاصيل المخزن</span>
            <span className="sm:hidden">تفاصيل</span>
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center"
          >
            <FileText className="h-4 w-4 ml-1" />
            <span className="hidden sm:inline">التقارير</span>
            <span className="sm:hidden">تقارير</span>
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002-2h2a2 2 0 002 2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="hidden sm:inline">عرض السجل</span>
            <span className="sm:hidden">سجل</span>
          </button>
        </div>
      </div>

      {/* Desktop Tab Navigation */}
      <div className="hidden sm:flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'analytics'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          onClick={() => setActiveTab('analytics')}
        >
          التحليلات
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'issue'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          onClick={() => setActiveTab('issue')}
        >
          صرف عناصر
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'return'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          onClick={() => setActiveTab('return')}
        >
          إرجاع عناصر
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'exchange'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          onClick={() => setActiveTab('exchange')}
        >
          تبديل عناصر
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'log'
            ? 'text-green-600 border-b-2 border-green-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          onClick={() => setActiveTab('log')}
        >
          سجل الحركات
        </button>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="sm:hidden mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">
            {tabItems.find(tab => tab.id === activeTab)?.name}
          </h3>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-gray-100 p-2 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="bg-gray-50 rounded-lg p-2 mb-4">
            <div className="grid grid-cols-2 gap-2">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  className={`flex items-center justify-center p-2 rounded-lg text-sm font-medium ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {tab.icon}
                  <span className="mr-2">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Summary Cards */}
            {analyticsData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
                  <p className="text-2xl font-bold text-blue-600">{analyticsData.totalItems.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">إجمالي العناصر</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
                  <p className="text-2xl font-bold text-green-600">{analyticsData.totalTransactions.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">عدد المعاملات</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center border border-red-100">
                  <p className="text-2xl font-bold text-red-600">{analyticsData.lowInventoryItems}</p>
                  <p className="text-sm text-gray-600">عناصر منخفضة</p>
                </div>
              </div>
            )}

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardPieChart
                title="توزيع الأصناف حسب النوع"
                data={analyticsData?.itemsByCategory || []}
                onRefresh={() => loadEmployeeAnalytics(warehouse.id)}
                loading={analyticsLoading}
                error={analyticsError}
              />
              <DashboardPieChart
                title="أنواع المعاملات"
                data={analyticsData?.transactionTypes || []}
                onRefresh={() => loadEmployeeAnalytics(warehouse.id)}
                loading={analyticsLoading}
                error={analyticsError}
              />
            </div>
          </div>
        )}
        {activeTab === 'issue' && <IssueItemsForm addNotification={addNotification} user={user} warehouse={warehouse} />}
        {activeTab === 'return' && <ReturnItemsForm addNotification={addNotification} user={user} warehouse={warehouse} />}
        {activeTab === 'exchange' && <ExchangeItemsForm addNotification={addNotification} user={user} warehouse={warehouse} />}
        {activeTab === 'log' && <TransactionLog addNotification={addNotification} user={user} warehouse={warehouse} />}
      </div>
    </div>
  );
}

function IssueItemsForm({ addNotification, user, warehouse }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Ref to track if interval is already set up
  const intervalRef = useRef(null);

  // Load items for the employee's warehouse
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const data = await getItemsByWarehouse(warehouse.id);
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
    };

    if (warehouse) {
      loadItems();

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set up real-time data synchronization
      intervalRef.current = setInterval(() => {
        loadItems();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [warehouse]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedItem || !recipient) {
      addNotification({
        message: 'يرجى ملء جميع الحقول المطلوبة',
        type: 'error'
      });
      return;
    }

    try {
      // Create transaction record
      const transactionData = {
        item_id: selectedItem,
        user_id: user.id,
        transaction_type: 'issue',
        quantity: -quantity, // Negative for issuing
        recipient: recipient,
        notes: notes
      };

      await createTransactionService(transactionData);

      // Update item quantity
      await updateItemQuantityService(selectedItem, -quantity);

      addNotification({
        message: 'تم صرف العنصر بنجاح!',
        type: 'success'
      });

      // Reset form
      setQuantity(1);
      setRecipient('');
      setNotes('');

      // Refresh items list
      const data = await getItemsByWarehouseService(warehouse.id);
      setItems(data);
    } catch (error) {
      console.error('Error issuing item:', error);
      addNotification({
        message: 'حدث خطأ أثناء صرف العنصر',
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
        <div className="flex">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-700 text-sm">اختر العنصر الذي تريد صرفه، ثم قدم تفاصيل المستلم.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">اختر العنصر</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المستلم</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="اسم الطالب/الموظف"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات إضافية حول هذا الصرف"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          ></textarea>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300"
          >
            صرف العنصر
          </button>
        </div>
      </form>
    </div>
  );
}

function ReturnItemsForm({ addNotification, user, warehouse }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Ref to track if interval is already set up
  const intervalRef = useRef(null);

  // Load items for the employee's warehouse
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const data = await getItemsByWarehouse(warehouse.id);
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
    };

    if (warehouse) {
      loadItems();

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set up real-time data synchronization
      intervalRef.current = setInterval(() => {
        loadItems();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [warehouse]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedItem) {
      addNotification({
        message: 'يرجى اختيار العنصر المراد إرجاعه',
        type: 'error'
      });
      return;
    }

    try {
      // Create transaction record
      const transactionData = {
        item_id: selectedItem,
        user_id: user.id,
        transaction_type: 'return',
        quantity: quantity, // Positive for returning
        recipient: condition,
        notes: notes
      };

      await createTransaction(transactionData);

      // Update item quantity
      await updateItemQuantity(selectedItem, quantity);

      addNotification({
        message: 'تم إرجاع العنصر بنجاح!',
        type: 'success'
      });

      // Reset form
      setQuantity(1);
      setCondition('good');
      setNotes('');

      // Refresh items list
      const data = await getItemsByWarehouse(warehouse.id);
      setItems(data);
    } catch (error) {
      console.error('Error returning item:', error);
      addNotification({
        message: 'حدث خطأ أثناء إرجاع العنصر',
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6">
        <div className="flex">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-700 text-sm">اختر العنصر الذي تريد إرجاعه، وحدد حالة العنصر.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">اختر العنصر</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الكمية
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              حالة العنصر
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
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
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات إضافية حول هذا الإرجاع"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          ></textarea>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300"
          >
            إرجاع العنصر
          </button>
        </div>
      </form>
    </div>
  );
}

function ExchangeItemsForm({ addNotification, user, warehouse }) {
  const [items, setItems] = useState([]);
  const [outgoingItem, setOutgoingItem] = useState('');
  const [incomingItem, setIncomingItem] = useState('');
  const [outgoingQuantity, setOutgoingQuantity] = useState(1);
  const [incomingQuantity, setIncomingQuantity] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Ref to track if interval is already set up
  const intervalRef = useRef(null);

  // Load items for the employee's warehouse
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const data = await getItemsByWarehouse(warehouse.id);
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
    };

    if (warehouse) {
      loadItems();

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set up real-time data synchronization
      intervalRef.current = setInterval(() => {
        loadItems();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [warehouse]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!outgoingItem || !incomingItem || !recipient) {
      addNotification({
        message: 'يرجى ملء جميع الحقول المطلوبة',
        type: 'error'
      });
      return;
    }

    try {
      // Create outgoing transaction record
      const outgoingTransactionData = {
        item_id: outgoingItem,
        user_id: user.id,
        transaction_type: 'exchange_out',
        quantity: -outgoingQuantity, // Negative for outgoing
        recipient: recipient,
        notes: notes ? `تبديل: ${notes}` : 'تبديل عنصر'
      };

      await createTransaction(outgoingTransactionData);

      // Update outgoing item quantity
      await updateItemQuantity(outgoingItem, -outgoingQuantity);

      // Create incoming transaction record
      const incomingTransactionData = {
        item_id: incomingItem,
        user_id: user.id,
        transaction_type: 'exchange_in',
        quantity: incomingQuantity, // Positive for incoming
        recipient: recipient,
        notes: notes ? `تبديل: ${notes}` : 'تبديل عنصر'
      };

      await createTransaction(incomingTransactionData);

      // Update incoming item quantity
      await updateItemQuantity(incomingItem, incomingQuantity);

      addNotification({
        message: 'تم تبديل العناصر بنجاح!',
        type: 'success'
      });

      // Reset form
      setOutgoingQuantity(1);
      setIncomingQuantity(1);
      setRecipient('');
      setNotes('');

      // Refresh items list
      const data = await getItemsByWarehouse(warehouse.id);
      setItems(data);
    } catch (error) {
      console.error('Error exchanging items:', error);
      addNotification({
        message: 'حدث خطأ أثناء تبديل العناصر',
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6">
        <div className="flex">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <p className="text-purple-700 text-sm">حدد العنصر taxpع والوارد، وكمياتهما، وتفاصيل المستلم.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">العنصر taxpع</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
                <select
                  value={outgoingItem}
                  onChange={(e) => setOutgoingItem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر العنصر</option>
                  {items.map((item) => (
                    <option key={`out-${item.id}`} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                <input
                  type="number"
                  min="1"
                  value={outgoingQuantity}
                  onChange={(e) => setOutgoingQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">العنصر الوارد</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
                <select
                  value={incomingItem}
                  onChange={(e) => setIncomingItem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر العنصر</option>
                  {items.map((item) => (
                    <option key={`in-${item.id}`} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                <input
                  type="number"
                  min="1"
                  value={incomingQuantity}
                  onChange={(e) => setIncomingQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المستلم</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="اسم الطالب/الموظف"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات إضافية حول هذا التبديل"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          ></textarea>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300"
          >
            تبديل العناصر
          </button>
        </div>
      </form>
    </div>
  );
}

function TransactionLog({ addNotification, user, warehouse }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ref to track if interval is already set up
  const intervalRef = useRef(null);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const data = await getTransactionsByWarehouse(warehouse.id);
        setTransactions(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading transactions:', error);
        addNotification({
          message: 'حدث خطأ أثناء تحميل سجل الحركات',
          type: 'error'
        });
        setLoading(false);
      }
    };

    if (warehouse) {
      loadTransactions();

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set up real-time data synchronization
      intervalRef.current = setInterval(() => {
        loadTransactions();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [warehouse]);

  const formatTimeAgo = (dateString) => {
    return formatTimeAgo(dateString);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6">
        <div className="flex">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-green-700 text-sm">سجل جميع الحركات في مخزن {warehouse.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {transactions.length > 0 ? (
          <table className="min-w-full divide-y divide-white">
            <thead className="table-header-blue">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">العنصر</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">المخزن</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الكمية</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">المستلم</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">التاريخ</th>

              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-white">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 table-cell-right">{transaction.items?.name || 'غير محدد'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{transaction.items?.warehouses?.name || 'غير محدد'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm table-cell-right">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.transaction_type === 'out' ? 'bg-blue-100 text-blue-800' :
                      transaction.transaction_type === 'in' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                      {transaction.transaction_type === 'out' ? 'صرف' :
                        transaction.transaction_type === 'in' ? 'إرجاع' :
                          transaction.transaction_type === 'adjustment' ? 'تعديل' :
                            transaction.transaction_type === 'audit' ? 'جرد' :
                              transaction.transaction_type === 'transfer' ? 'تحويل' :
                                transaction.transaction_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{Math.abs(transaction.quantity)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{transaction.recipient}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{transaction.users?.name || 'غير محدد'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{formatTimeAgo(transaction.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد حركات</h3>
            <p className="mt-1 text-sm text-gray-500">لم يتم تسجيل أي حركة بعد في هذا المخزن.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboardPage;
