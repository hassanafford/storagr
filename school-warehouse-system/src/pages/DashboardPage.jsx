import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, PieChart, FileText, Plus, TrendingUp, AlertTriangle, Package, TrendingDown, Minus } from 'lucide-react';
import { useNotification } from '../components/NotificationProvider';
import { getAllWarehousesService } from '../services/warehouseService';
import { getTransactionsService, getLowInventoryItemsService } from '../services/itemService';
import { formatTimeAgo } from '../lib/timeUtils';
import AdminTransactionOperations from '../components/AdminTransactionOperations';
import EnhancedWarehouseCard from '../components/EnhancedWarehouseCard';
import DashboardPieChart from '../components/DashboardPieChart';
import ProfessionalWarehouseChart from '../components/ProfessionalWarehouseChart';
import analyticsService from '../services/analyticsService';

function DashboardPage({ user }) {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [warehouseStats, setWarehouseStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [lowInventoryItems, setLowInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTransactionOperations, setShowTransactionOperations] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Ref to track if interval is already set up
  const intervalRef = useRef(null);

  const formatTransactionTimeAgo = useCallback((dateString) => {
    return formatTimeAgo(dateString);
  }, []);

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        console.log('Loading warehouses...');
        const data = await getAllWarehousesService();
        console.log('Warehouses loaded:', data.length);
        setWarehouses(data);
        if (data.length === 0) {
          setLoading(false); // If no warehouses, stop loading
        }
      } catch (error) {
        console.error('Error loading warehouses:', error);
        addNotification({
          message: 'حدث خطأ أثناء تحميل بيانات المخازن',
          type: 'error'
        });
        setLoading(false); // Stop loading on error
      }
    };

    loadWarehouses();
  }, [addNotification]);

  const loadDashboardData = useCallback(async () => {
    console.log('Loading dashboard data. Warehouses count:', warehouses.length);

    if (warehouses.length === 0) {
      console.log('No warehouses, showing empty state');
      // Even if no warehouses, we should still complete loading
      setWarehouseStats([]);
      setTransactions([]);
      setLowInventoryItems([]);
      setAnalyticsData(null);
      setRecentActivities([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Starting data load...');
      
      // Load all data in parallel to improve performance
      const [transactionsData, lowItems, analytics] = await Promise.all([
        getTransactionsService(),
        getLowInventoryItemsService(10),
        analyticsService.getAdminAnalytics()
      ]).catch(async (error) => {
        console.error('Error loading dashboard data, trying without analytics:', error);
        // Try to load without analytics as fallback
        const [transactionsData, lowItems] = await Promise.all([
          getTransactionsService(),
          getLowInventoryItemsService(10)
        ]);
        return [transactionsData, lowItems, null];
      });

      console.log('Data loaded:', {
        transactions: transactionsData.length,
        lowItems: lowItems.length,
        analytics: !!analytics,
        warehouses: warehouses.length
      });

      // Process warehouse stats using analytics data for better performance
      const stats = warehouses.map(warehouse => {
        let totalItems = 0;
        
        // If we have analytics data, use it
        if (analytics && analytics.itemsByWarehouse) {
          const warehouseData = analytics.itemsByWarehouse.find(w => w.label === warehouse.name);
          totalItems = warehouseData ? warehouseData.value : 0;
        }
        
        console.log('Processing warehouse:', {
          warehouse: warehouse.name,
          totalItems: totalItems
        });

        // If no analytics data found, we still want to show the warehouse
        let status = 'normal';
        if (totalItems < 300) {
          status = 'low';
        } else if (totalItems > 1000) {
          status = 'high';
        }

        return {
          id: warehouse.id,
          name: warehouse.name,
          items: totalItems,
          status: status
        };
      });
      
      console.log('Setting warehouse stats. Count:', stats.length, 'Stats:', stats);
      setWarehouseStats(stats);
      setTransactions(transactionsData);
      setLowInventoryItems(lowItems);
      setAnalyticsData(analytics);

      // Process recent activities
      const activities = transactionsData.slice(0, 5).map(transaction => {
        let type = 'issue';
        let title = 'تم صرف عناصر';
        let icon = <TrendingDown className="h-5 w-5 text-blue-600" />;

        if (transaction.transaction_type === 'in') {
          type = 'add';
          title = 'تم استلام عناصر';
          icon = <TrendingUp className="h-5 w-5 text-teal-600" />;
        } else if (transaction.transaction_type === 'out') {
          type = 'issue';
          title = 'تم صرف عناصر';
          icon = <TrendingDown className="h-5 w-5 text-blue-600" />;
        } else if (transaction.transaction_type === 'exchange') {
          type = 'exchange';
          title = 'تم تبديل عناصر';
          icon = <Minus className="h-5 w-5 text-purple-600" />;
        }

        return {
          id: transaction.id,
          type: type,
          title: title,
          description: `${Math.abs(transaction.quantity)} ${transaction.item_name} - ${transaction.recipient}`,
          time: formatTransactionTimeAgo(transaction.created_at),
          warehouse: transaction.warehouse_name,
          user: transaction.user_name,
          icon: icon
        };
      });
      setRecentActivities(activities);

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      addNotification({
        message: 'حدث خطأ أثناء تحميل بيانات لوحة التحكم',
        type: 'error'
      });
      setLoading(false);
    }
  }, [warehouses, formatTransactionTimeAgo, addNotification]);

  useEffect(() => {
    console.log('Data loading useEffect triggered. Warehouses:', warehouses.length);
    if (warehouses.length > 0) {
      loadDashboardData();
    } else {
      // If no warehouses, we should still complete loading
      setLoading(false);
    }
  }, [warehouses]);

  // Set up real-time data synchronization
  useEffect(() => {
    // Only set up interval if we have warehouses
    if (warehouses.length === 0) {
      console.log('No warehouses, skipping interval setup');
      return;
    }

    console.log('Setting up real-time data sync. Warehouses:', warehouses.length);

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      console.log('Refreshing dashboard data...');
      loadDashboardData();
    }, 30000);

    console.log('Setting new interval');

    return () => {
      console.log('Cleaning up interval');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [warehouses, loadDashboardData]);

  const handleTransactionComplete = () => {
    // Reload all dashboard data after a transaction
    loadDashboardData();
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
    <div className="space-y-6 w-full overflow-x-hidden">
      <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-blue-800 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            لوحة تحكم مدير النظام
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                console.log('Toggle analytics button clicked. Current state:', showAnalytics);
                setShowAnalytics(!showAnalytics);
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ease-in-out flex items-center gap-1"
            >
              <PieChart className="h-4 w-4" />
              {showAnalytics ? 'إخفاء التحليلات' : 'عرض التحليلات'}
            </button>
            <button
              onClick={() => setShowTransactionOperations(!showTransactionOperations)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ease-in-out flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              {showTransactionOperations ? 'إخفاء العمليات' : 'العمليات الإدارية'}
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ease-in-out flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              التقارير
            </button>
            <button
              onClick={() => navigate('/items')}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ease-in-out flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              إضافة عنصر
            </button>
          </div>
        </div>

        {/* Admin Transaction Operations */}
        {showTransactionOperations && (
          <div className="mb-8">
            <AdminTransactionOperations onTransactionComplete={handleTransactionComplete} />
          </div>
        )}

        {/* Enhanced Warehouse Cards with real-time monitoring */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {warehouseStats.length > 0 ? (
            warehouseStats.map((warehouse) => (
              <EnhancedWarehouseCard
                key={warehouse.id}
                warehouse={warehouse}
                transactions={transactions}
                onClick={() => navigate(`/warehouses/${warehouse.id}`)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              {warehouses.length > 0 ? (
                <p>جاري تحميل بيانات المخازن...</p>
              ) : (
                <div>
                  <p className="mb-2">لا توجد مخازن مسجلة في النظام</p>
                  <button 
                    onClick={() => navigate('/warehouses')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-300"
                  >
                    إضافة مخزن جديد
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analytics Charts */}
        {showAnalytics && warehouseStats.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <DashboardPieChart
                title="توزيع الأصناف حسب النوع"
                data={analyticsData?.itemsByCategory || []}
                onRefresh={loadDashboardData}
                loading={loading}
                error={null}
              />
              <DashboardPieChart
                title="توزيع الأصناف حسب المخزن"
                data={analyticsData?.itemsByWarehouse || []}
                onRefresh={loadDashboardData}
                loading={loading}
                error={null}
              />
            </div>

            {/* Additional Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <DashboardPieChart
                title="أنواع المعاملات"
                data={analyticsData?.transactionTypes || []}
                onRefresh={loadDashboardData}
                loading={loading}
                error={null}
              />
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">ملخص البيانات</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{(analyticsData?.totalItems || 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">إجمالي العناصر</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{analyticsData?.totalWarehouses || 0}</p>
                    <p className="text-sm text-gray-600">عدد المخازن</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{(analyticsData?.totalTransactions || 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">عدد المعاملات</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{analyticsData?.lowInventoryItems || 0}</p>
                    <p className="text-sm text-gray-600">عناصر منخفضة</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Low Inventory Alerts */}
        {lowInventoryItems.length > 0 && (
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-red-800 font-medium">تنبيه: عناصر بكمية منخفضة</h3>
                  <p className="text-red-700 text-sm mt-1">هناك {lowInventoryItems.length} عنصر بكمية أقل من 10 في المخازن</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-white">
                <thead className="table-header-blue">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">العنصر</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">المخزن</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الكمية</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-white">
                  {lowInventoryItems.slice(0, 5).map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 table-cell-right">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{item.warehouse_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold table-cell-right">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-50 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              الأنشطة الأخيرة
            </h3>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                    <div className={`p-2 rounded-lg mr-3 ${activity.type === 'issue' ? 'bg-blue-100' :
                      activity.type === 'add' ? 'bg-teal-100' :
                        activity.type === 'exchange' ? 'bg-purple-100' : 'bg-yellow-100'
                      }`}>
                      {activity.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.warehouse && `${activity.warehouse} | `}
                        {activity.user && `${activity.user} | `}
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>لا توجد أنشطة حديثة</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              نظرة عامة على المخازن
            </h3>
            <ProfessionalWarehouseChart />
          </div>
        </div>
      </div>

      {/* New Admin Dashboard Component - temporarily removed to avoid conflicts */}
      {/* <AdminDashboard user={user} /> */}
    </div>
  );
}

export default DashboardPage;