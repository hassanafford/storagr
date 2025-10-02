import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationProvider';
import { getAllWarehouses } from '../services/warehouseService';
import { getItemsByWarehouse, getTransactions, getLowInventoryItems } from '../services/itemService';
import ProfessionalWarehouseChart from '../components/ProfessionalWarehouseChart';
import { useNavigate } from 'react-router-dom';
// Old AdminDashboard import removed to avoid conflicts
import EnhancedWarehouseCard from '../components/EnhancedWarehouseCard';
import { FileText, Plus, BarChart3, PieChart, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import analyticsService from '../services/analyticsService';
import DashboardPieChart from '../components/DashboardPieChart';
import { initWebSocket, disconnectWebSocket } from '../db';
import AdminTransactionOperations from '../components/AdminTransactionOperations';

function DashboardPage({ user }) {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [warehouseStats, setWarehouseStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [lowInventoryItems, setLowInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [showTransactionOperations, setShowTransactionOperations] = useState(false);
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  
  // WebSocket state
  const [websocketInitialized, setWebsocketInitialized] = useState(false);

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        console.log('Loading warehouses...');
        const data = await getAllWarehouses();
        console.log('Warehouses loaded:', data.length);
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

  // Initialize WebSocket for real-time updates
  useEffect(() => {
    if (!websocketInitialized) {
      try {
        initWebSocket((notification) => {
          // Handle real-time notifications with detailed context
          addNotification({
            message: notification.message,
            details: notification.details,
            quantity: notification.quantity,
            type: notification.type
          });
          
          // Refresh all dashboard data when notifications are received
          if (warehouses.length > 0) {
            loadData();
            loadAnalyticsData();
          }
        });
        setWebsocketInitialized(true);
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    }
    
    // Clean up WebSocket connection on unmount
    return () => {
      if (websocketInitialized) {
        disconnectWebSocket();
        setWebsocketInitialized(false);
      }
    };
  }, [warehouses]);

  // Load analytics data
  const loadAnalyticsData = async () => {
    try {
      console.log('Loading analytics data...');
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const data = await analyticsService.getAdminAnalytics();
      console.log('Analytics data loaded:', data);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setAnalyticsError(error.message);
      addNotification({
        message: 'حدث خطأ أثناء تحميل بيانات التحليلات',
        type: 'error'
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      console.log('Loading dashboard data. Warehouses count:', warehouses.length);
      
      // Only load data if we have warehouses
      if (warehouses.length === 0) {
        console.log('No warehouses, skipping data load');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Starting data load...');
        // Load warehouse stats
        const stats = [];
        for (const warehouse of warehouses) {
          const items = await getItemsByWarehouse(warehouse.id);
          const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          
          // Determine status based on item count
          let status = 'normal';
          if (totalItems < 300) {
            status = 'low';
          } else if (totalItems > 1000) {
            status = 'high';
          }
          
          stats.push({
            id: warehouse.id,
            name: warehouse.name,
            items: totalItems,
            status: status
          });
        }
        console.log('Setting warehouse stats. Count:', stats.length);
        setWarehouseStats(stats);
        
        // Load recent transactions
        const transactionsData = await getTransactions();
        setTransactions(transactionsData);
        
        const activities = transactionsData.slice(0, 5).map(transaction => {
          let type = 'issue';
          let title = 'تم صرف عناصر';
          let icon = <TrendingDown className="h-5 w-5 text-blue-600" />;
          
          if (transaction.transaction_type === 'return') {
            type = 'add';
            title = 'تم إرجاع عناصر';
            icon = <TrendingUp className="h-5 w-5 text-teal-600" />;
          } else if (transaction.transaction_type === 'exchange_out' || transaction.transaction_type === 'exchange_in') {
            type = 'exchange';
            title = 'تم تبديل عناصر';
            icon = <Minus className="h-5 w-5 text-purple-600" />;
          }
          
          return {
            id: transaction.id,
            type: type,
            title: title,
            description: `${Math.abs(transaction.quantity)} ${transaction.item_name} - ${transaction.recipient}`,
            time: formatTimeAgo(transaction.created_at),
            warehouse: transaction.warehouse_name,
            user: transaction.user_name,
            icon: icon
          };
        });
        setRecentActivities(activities);
        
        
        // Load low inventory items
        const lowItems = await getLowInventoryItems(10);
        setLowInventoryItems(lowItems);
        
        // Load all items
        const allItems = [];
        for (const warehouse of warehouses) {
          const warehouseItems = await getItemsByWarehouse(warehouse.id);
          allItems.push(...warehouseItems);
        }
        setItems(allItems);
        
        // Load analytics data
        loadAnalyticsData();
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        addNotification({
          message: 'حدث خطأ أثناء تحميل بيانات لوحة التحكم',
          type: 'error'
        });
        setLoading(false);
      }
    };

    console.log('Data loading useEffect triggered. Warehouses:', warehouses.length);
    if (warehouses.length > 0) {
      loadData();
    }
  }, [warehouses]);

  // Set up real-time data synchronization
  useEffect(() => {
    console.log('Setting up real-time data sync. Warehouses:', warehouses.length, 'Low inventory items:', lowInventoryItems.length);
    
    // Only set up interval if we have warehouses
    if (warehouses.length === 0) {
      console.log('No warehouses, skipping interval setup');
      return;
    }
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      console.log('Refreshing dashboard data...');
      
      // Reload warehouse stats
      const reloadWarehouseStats = async () => {
        try {
          const stats = [];
          for (const warehouse of warehouses) {
            const items = await getItemsByWarehouse(warehouse.id);
            const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            
            // Determine status based on item count
            let status = 'normal';
            if (totalItems < 300) {
              status = 'low';
            } else if (totalItems > 1000) {
              status = 'high';
            }
            
            stats.push({
              id: warehouse.id,
              name: warehouse.name,
              items: totalItems,
              status: status
            });
          }
          console.log('Updating warehouse stats. New count:', stats.length);
          setWarehouseStats(stats);
        } catch (error) {
          console.error('Error refreshing warehouse stats:', error);
        }
      };
      
      // Reload recent activities
      const reloadRecentActivities = async () => {
        try {
          const transactions = await getTransactions();
          const activities = transactions.slice(0, 5).map(transaction => {
            let type = 'issue';
            let title = 'تم صرف عناصر';
            let icon = <TrendingDown className="h-5 w-5 text-blue-600" />;
            
            if (transaction.transaction_type === 'return') {
              type = 'add';
              title = 'تم إرجاع عناصر';
              icon = <TrendingUp className="h-5 w-5 text-teal-600" />;
            } else if (transaction.transaction_type === 'exchange_out' || transaction.transaction_type === 'exchange_in') {
              type = 'exchange';
              title = 'تم تبديل عناصر';
              icon = <Minus className="h-5 w-5 text-purple-600" />;
            }
            
            return {
              id: transaction.id,
              type: type,
              title: title,
              description: `${Math.abs(transaction.quantity)} ${transaction.item_name} - ${transaction.recipient}`,
              time: formatTimeAgo(transaction.created_at),
              warehouse: transaction.warehouse_name,
              user: transaction.user_name,
              icon: icon
            };
          });
          setRecentActivities(activities);
        } catch (error) {
          console.error('Error refreshing recent activities:', error);
        }
      };
      
      // Reload low inventory items
      const reloadLowInventoryItems = async () => {
        try {
          const lowItems = await getLowInventoryItems(10);
          setLowInventoryItems(lowItems);
          
          // Show notification if low inventory items count has changed
          if (lowItems.length !== lowInventoryItems.length) {
            addNotification({
              message: `هناك ${lowItems.length} عنصر بكمية منخفضة في المخازن`,
              type: 'warning'
            });
          }
        } catch (error) {
          console.error('Error refreshing low inventory items:', error);
        }
      };
      
      reloadWarehouseStats();
      reloadRecentActivities();
      reloadLowInventoryItems();
      loadAnalyticsData();
    }, 30000); // Refresh every 30 seconds
    
    console.log('Setting new interval');
    
    return () => {
      console.log('Cleaning up interval');
      clearInterval(interval);
    };
  }, [warehouses, lowInventoryItems]);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  const handleTransactionComplete = () => {
    // Reload all dashboard data after a transaction
    loadData();
    loadAnalyticsData();
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
          {console.log('Rendering warehouse cards. Count:', warehouseStats.length, 'Data:', warehouseStats)}
          {warehouseStats.map((warehouse) => (
            <EnhancedWarehouseCard 
              key={warehouse.id} 
              warehouse={warehouse}
              transactions={transactions}
              onClick={() => navigate(`/warehouses/${warehouse.id}`)}
            />
          ))}
        </div>
        
        {/* Analytics Charts */}
        {showAnalytics && analyticsData && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <DashboardPieChart 
                title="توزيع الأصناف حسب النوع"
                data={analyticsData.itemsByCategory}
                onRefresh={loadAnalyticsData}
                loading={analyticsLoading}
                error={analyticsError}
              />
              <DashboardPieChart 
                title="توزيع الأصناف حسب المخزن"
                data={analyticsData.itemsByWarehouse}
                onRefresh={loadAnalyticsData}
                loading={analyticsLoading}
                error={analyticsError}
              />
            </div>
            
            {/* Additional Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <DashboardPieChart 
                title="أنواع المعاملات"
                data={analyticsData.transactionTypes}
                onRefresh={loadAnalyticsData}
                loading={analyticsLoading}
                error={analyticsError}
              />
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">ملخص البيانات</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{analyticsData.totalItems.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">إجمالي العناصر</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{analyticsData.totalWarehouses}</p>
                    <p className="text-sm text-gray-600">عدد المخازن</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{analyticsData.totalTransactions.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">عدد المعاملات</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{analyticsData.lowInventoryItems}</p>
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العنصر</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المخزن</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowInventoryItems.slice(0, 5).map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.warehouse_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">{item.quantity}</td>
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
                    <div className={`p-2 rounded-lg mr-3 ${
                      activity.type === 'issue' ? 'bg-blue-100' : 
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