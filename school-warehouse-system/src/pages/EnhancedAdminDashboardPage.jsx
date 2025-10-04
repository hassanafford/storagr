import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, PieChart, FileText, TrendingUp, TrendingDown, Building, AlertTriangle, Package, RefreshCw, CheckCircle } from 'lucide-react';
import { useNotification } from '../components/NotificationProvider';
import dashboardService from '../services/dashboardService';
import EnhancedPieChart from '../components/EnhancedPieChart';
import EnhancedBarChart from '../components/EnhancedBarChart';
import { formatEgyptianDateTime, getEgyptianTime, toEgyptianTime } from '../lib/timeUtils';

const EnhancedAdminDashboardPage = ({ user }) => {
  const { addNotification } = useNotification();
  const [dashboardData, setDashboardData] = useState({
    warehouses: [],
    items: [],
    transactions: [],
    analytics: null,
    lowInventoryItems: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(getEgyptianTime());

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.getAdminDashboardData();
      const analytics = await dashboardService.getRealTimeAnalytics();
      const lowInventoryItems = await dashboardService.getLowInventoryItems(10);
      
      setDashboardData({
        warehouses: data.warehouses,
        items: data.items,
        transactions: data.transactions,
        analytics,
        lowInventoryItems
      });
      
      setLastUpdated(getEgyptianTime());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
      addNotification({
        message: 'حدث خطأ أثناء تحميل بيانات لوحة التحكم',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize dashboard
  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time data updates
    const handleDataUpdate = (notification) => {
      console.log('Real-time update received:', notification);
      // Refresh data when notifications are received
      loadDashboardData();
    };
    
    dashboardService.onDataUpdate(handleDataUpdate);
    
    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    
    return () => {
      dashboardService.removeDataUpdateCallback(handleDataUpdate);
      clearInterval(interval);
    };
  }, []);

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = getEgyptianTime();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  // Get recent activities
  const getRecentActivities = () => {
    if (!dashboardData.transactions || dashboardData.transactions.length === 0) {
      return [];
    }
    
    return dashboardData.transactions
      .slice(0, 5)
      .map(transaction => {
        let type = 'issue';
        let title = 'تم صرف عناصر';
        let icon = <TrendingDown className="h-5 w-5 text-blue-600" />;
        
        if (transaction.transaction_type === 'in') {
          type = 'add';
          title = 'تم إرجاع عناصر';
          icon = <TrendingUp className="h-5 w-5 text-teal-600" />;
        } else if (transaction.transaction_type === 'out') {
          type = 'exchange';
          title = 'تم تبديل عناصر';
          icon = <RefreshCw className="h-5 w-5 text-purple-600" />;
        }

        return {
          id: transaction.id,
          type: type,
          title: title,
          description: `${Math.abs(transaction.quantity)} ${transaction.items?.name || 'غير محدد'} - ${transaction.recipient}`,
          time: formatTimeAgo(toEgyptianTime(new Date(transaction.created_at))),
          warehouse: transaction.items?.warehouses?.name || 'غير محدد',
          user: transaction.users?.name || 'غير محدد',
          icon: icon
        };
      });
  };

  if (loading && !dashboardData.analytics) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const recentActivities = getRecentActivities();
  const analytics = dashboardData.analytics;

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-blue-800 flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              لوحة تحكم مدير النظام
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              آخر تحديث: {formatTimeAgo(lastUpdated)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={loadDashboardData}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ease-in-out flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>
        </div>
        
        {/* Summary Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm text-gray-500">إجمالي العناصر</p>
                    <p className="text-2xl font-bold">{analytics.totalItems.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-100 text-green-600">
                    <Building className="h-6 w-6" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm text-gray-500">عدد المخازن</p>
                    <p className="text-2xl font-bold">{analytics.totalWarehouses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm text-gray-500">عدد المعاملات</p>
                    <p className="text-2xl font-bold">{analytics.totalTransactions.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-red-100 text-red-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm text-gray-500">عناصر منخفضة</p>
                    <p className="text-2xl font-bold">{analytics.lowInventoryItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Low Inventory Alerts */}
        {dashboardData.lowInventoryItems && dashboardData.lowInventoryItems.length > 0 && (
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-red-800 font-medium">تنبيه: عناصر بكمية منخفضة</h3>
                  <p className="text-red-700 text-sm mt-1">
                    هناك {dashboardData.lowInventoryItems.length} عنصر بكمية أقل من 10 في المخازن
                  </p>
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
                  {dashboardData.lowInventoryItems.slice(0, 5).map((item) => (
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
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                توزيع الأصناف حسب النوع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedPieChart 
                title="توزيع الأصناف حسب النوع"
                data={analytics?.itemsByCategory || []}
                onRefresh={loadDashboardData}
                loading={loading}
                error={error}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                توزيع الأصناف حسب المخزن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedBarChart 
                title="توزيع الأصناف حسب المخزن"
                data={analytics?.itemsByWarehouse || []}
                onRefresh={loadDashboardData}
                loading={loading}
                error={error}
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                أنواع المعاملات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedPieChart 
                title="أنواع المعاملات"
                data={analytics?.transactionTypes || []}
                onRefresh={loadDashboardData}
                loading={loading}
                error={error}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                الأنشطة الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboardPage;