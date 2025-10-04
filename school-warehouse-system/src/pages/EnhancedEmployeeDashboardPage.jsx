import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, FileText, TrendingDown, RefreshCw, CheckCircle, Building, AlertTriangle, BarChart3 } from 'lucide-react';
import { getWarehouseByIdService, getWarehouseStatsService } from '../services/warehouseService';
import { getTransactionsByWarehouseService, updateItemQuantityService, createTransactionService, getItemsByWarehouseService } from '../services/itemService';
import { useNotification } from '../components/NotificationProvider';
import TransactionForms from '../components/TransactionForms';
import DailyAudit from '../components/DailyAudit';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { formatEgyptianDateTime, getEgyptianTime } from '../lib/timeUtils';

const EnhancedEmployeeDashboardPage = ({ user }) => {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState(null);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load warehouse data
  useEffect(() => {
    const loadWarehouseData = async () => {
      try {
        setLoading(true);
        
        // Load warehouse details
        const warehouseData = await getWarehouseByIdService(user.warehouse_id);
        setWarehouse(warehouseData);
        
        // Load items for this warehouse
        const itemsData = await getItemsByWarehouseService(user.warehouse_id);
        setItems(itemsData);
        
        // Load warehouse stats
        const statsData = await getWarehouseStatsService(user.warehouse_id);
        setStats(statsData);
        
        // Load transactions for this warehouse
        const transactionsData = await getTransactionsByWarehouseService(user.warehouse_id);
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

    if (user && user.warehouse_id) {
      loadWarehouseData();
    }
  }, [user]);

  const loadWarehouseData = async () => {
    try {
      // Load warehouse details
      const warehouseData = await getWarehouseByIdService(user.warehouse_id);
      setWarehouse(warehouseData);
      
      // Load items for this warehouse
      const itemsData = await getItemsByWarehouseService(user.warehouse_id);
      setItems(itemsData);
      
      // Load warehouse stats
      const statsData = await getWarehouseStatsService(user.warehouse_id);
      setStats(statsData);
      
      // Load transactions for this warehouse
      const transactionsData = await getTransactionsByWarehouseService(user.warehouse_id);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error refreshing warehouse data:', error);
    }
  };

  // Format time ago in Arabic
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = getEgyptianTime();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'out': return 'صرف';
      case 'in': return 'إرجاع';
      case 'adjustment': return 'تعديل';
      case 'audit': return 'جرد';
      case 'transfer': return 'تحويل';
      default: return 'معاملة';
    }
  };

  // Get transaction type color
  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'out': return 'text-red-600';
      case 'in': return 'text-green-600';
      case 'adjustment': return 'text-yellow-600';
      case 'audit': return 'text-indigo-600';
      case 'transfer': return 'text-purple-600';
      default: return 'text-gray-600';
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

  return (
    <div className="space-y-6 w-full overflow-x-hidden" dir="rtl">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-blue-800 flex items-center gap-2">
              <Package className="h-6 w-6" />
              {warehouse.name}
            </h2>
            <p className="text-gray-600 mt-1">{warehouse.description || 'مخزن الموظف'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              العودة للوحة التحكم
            </Button>
          </div>
        </div>

        {/* Warehouse Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-blue-800">إجمالي العناصر</p>
                <h3 className="text-2xl font-bold text-blue-900 mt-1">
                  {stats?.total_items || 0}
                </h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-green-800">الكمية الإجمالية</p>
                <h3 className="text-2xl font-bold text-green-900 mt-1">
                  {stats?.total_quantity || 0}
                </h3>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-purple-800">الحركات الأخيرة</p>
                <h3 className="text-2xl font-bold text-purple-900 mt-1">
                  {transactions.length}
                </h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="transactions">سجل الحركات</TabsTrigger>
            <TabsTrigger value="operations">العمليات</TabsTrigger>
            <TabsTrigger value="audit">الجرد اليومي</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Items List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    العناصر في المخزن
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {items.length > 0 ? (
                      items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 border-b border-gray-200 last:border-0">
                          <div>
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.category_name}</p>
                          </div>
                          <Badge variant="secondary" className="text-lg">
                            {item.quantity}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>لا توجد عناصر في هذا المخزن</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    آخر الحركات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {transactions.length > 0 ? (
                      transactions.slice(0, 10).map((transaction) => (
                        <div key={transaction.id} className="flex items-start border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                          <div className={`p-2 rounded-lg mr-3 ${
                            transaction.transaction_type === 'out' ? 'bg-red-100' : 
                            transaction.transaction_type === 'in' ? 'bg-green-100' : 
                            'bg-blue-100'
                          }`}>
                            {transaction.transaction_type === 'out' && <TrendingDown className="h-5 w-5 text-red-600" />}
                            {transaction.transaction_type === 'in' && <TrendingUp className="h-5 w-5 text-green-600" />}
                            {transaction.transaction_type === 'adjustment' && <FileText className="h-5 w-5 text-purple-600" />}
                            {transaction.transaction_type === 'audit' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                            {transaction.transaction_type === 'transfer' && <FileText className="h-5 w-5 text-purple-600" />}

                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {getTransactionTypeLabel(transaction.transaction_type)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {Math.abs(transaction.quantity)} {transaction.item_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {transaction.user_name} | {formatTimeAgo(transaction.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>لا توجد حركات حديثة</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  سجل الحركات الكامل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العنصر</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المستخدم</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.length > 0 ? (
                        transactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${getTransactionTypeColor(transaction.transaction_type)}`}>
                              {getTransactionTypeLabel(transaction.transaction_type)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.item_name}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              transaction.quantity < 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.user_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTimeAgo(transaction.created_at)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                            لا توجد حركات
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="operations" className="mt-6">
            <TransactionForms 
              user={user} 
              warehouse={warehouse} 
              onTransactionComplete={loadWarehouseData}
            />
          </TabsContent>
          
          <TabsContent value="audit" className="mt-6">
            <DailyAudit user={user} warehouse={warehouse} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedEmployeeDashboardPage;