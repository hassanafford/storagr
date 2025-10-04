import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, PieChart, FileText, Plus, TrendingUp, AlertTriangle, User, Calendar, Package, TrendingDown, Minus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotification } from '../components/NotificationProvider';
import { getAllWarehousesService } from '../services/warehouseService';
import { getTransactionsService, getLowInventoryItemsService } from '../services/itemService';
import { getDailyAuditsService } from '../services/auditService';
import { formatTimeAgo, formatEgyptianDateTime, formatEgyptianDate } from '../lib/timeUtils';
import EnhancedBarChart from '../components/EnhancedBarChart';
import EnhancedPieChart from '../components/EnhancedPieChart';

const EnhancedReportsPage = () => {
  const { addNotification } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [lowInventoryItems, setLowInventoryItems] = useState([]);
  const [dailyAudits, setDailyAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [filter, setFilter] = useState({
    warehouseId: '',
    startDate: '',
    endDate: '',
    transactionType: 'all'
  });
  const [chartData, setChartData] = useState({
    transactionsByType: [],
    transactionsByWarehouse: [],
    itemsByCategory: []
  });

  useEffect(() => {
    loadReports();
    loadWarehouses();
    loadLowInventoryItems();
    loadDailyAudits();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await getTransactionsService();
      setTransactions(data);
      processChartData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading reports:', error);
      addNotification({
        message: 'حدث خطأ أثناء تحميل التقارير',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const data = await getAllWarehousesService();
      setWarehouses(data);
    } catch (error) {
      console.error('Error loading warehouses:', error);
      addNotification({
        message: 'حدث خطأ أثناء تحميل المخازن',
        type: 'error'
      });
    }
  };

  const loadLowInventoryItems = async () => {
    try {
      const data = await getLowInventoryItemsService(10);
      setLowInventoryItems(data);
    } catch (error) {
      console.error('Error loading low inventory items:', error);
      addNotification({
        message: 'حدث خطأ أثناء تحميل العناصر منخفضة الكمية',
        type: 'error'
      });
    }
  };

  const loadDailyAudits = async () => {
    try {
      const data = await getDailyAuditsService();
      setDailyAudits(data);
    } catch (error) {
      console.error('Error loading daily audits:', error);
      addNotification({
        message: 'حدث خطأ أثناء تحميل تقارير الجرد اليومي',
        type: 'error'
      });
    }
  };

  const processChartData = (transactionsData) => {
    // Process transactions by type
    const typeCounts = {};
    transactionsData.forEach(transaction => {
      const type = transaction.transaction_type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const transactionsByType = Object.entries(typeCounts).map(([type, count]) => ({
      name: formatTransactionType(type),
      value: count
    }));
    
    // Process transactions by warehouse
    const warehouseCounts = {};
    transactionsData.forEach(transaction => {
      const warehouse = transaction.warehouse_name;
      warehouseCounts[warehouse] = (warehouseCounts[warehouse] || 0) + 1;
    });
    
    const transactionsByWarehouse = Object.entries(warehouseCounts).map(([warehouse, count]) => ({
      name: warehouse,
      value: count
    }));
    
    // Process items by category
    const categoryCounts = {};
    transactionsData.forEach(transaction => {
      const category = transaction.category_name || 'غير مصنف';
      categoryCounts[category] = (categoryCounts[category] || 0) + Math.abs(transaction.quantity);
    });
    
    const itemsByCategory = Object.entries(categoryCounts).map(([category, count]) => ({
      name: category,
      value: count
    }));
    
    setChartData({
      transactionsByType,
      transactionsByWarehouse,
      itemsByCategory
    });
  };

  const handleFilterChange = (name, value) => {
    setFilter({
      ...filter,
      [name]: value
    });
  };

  const handleApplyFilters = async () => {
    try {
      setLoading(true);
      
      // If date range is specified, use date range endpoint
      if (filter.startDate && filter.endDate) {
        const params = {
          startDate: filter.startDate,
          endDate: filter.endDate,
          warehouseId: filter.warehouseId || undefined
        };
        
        const data = await getTransactionsByDateRangeService(params);
        setTransactions(data);
        processChartData(data);
      } else {
        // Otherwise, filter existing data
        let filtered = [...transactions];
        
        if (filter.warehouseId) {
          filtered = filtered.filter(t => t.warehouse_id == filter.warehouseId);
        }
        
        if (filter.transactionType !== 'all') {
          filtered = filtered.filter(t => t.transaction_type === filter.transactionType);
        }
        
        setTransactions(filtered);
        processChartData(filtered);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error applying filters:', error);
      addNotification({
        message: 'حدث خطأ أثناء تطبيق الفلاتر',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const formatTransactionType = (type) => {
    switch (type) {
      case 'issue': return 'صرف';
      case 'return': return 'إرجاع';
      case 'exchange_out': return 'تبادل (صرف)';
      case 'exchange_in': return 'تبادل (استلام)';
      case 'audit_adjustment': return 'تعديل جرد';
      case 'daily_audit': return 'جرد يومي';
      default: return type;
    }
  };

  const formatDate = (dateString) => {
    return formatEgyptianDate(dateString);
  };

  const formatTimeAgo = (dateString) => {
    return formatTimeAgo(dateString);
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'issue': return 'text-red-600';
      case 'return': return 'text-green-600';
      case 'exchange_out': return 'text-purple-600';
      case 'exchange_in': return 'text-blue-600';
      case 'audit_adjustment': return 'text-yellow-600';
      case 'daily_audit': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  const getAuditDifferenceColor = (difference) => {
    if (difference < 0) return 'text-red-600';
    if (difference > 0) return 'text-green-600';
    return 'text-gray-600';
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
    <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          التقارير الشاملة
        </h2>
        <Button 
          onClick={loadReports}
          variant="outline"
          className="flex items-center gap-1"
        >
          <FileText className="h-4 w-4" />
          تحديث البيانات
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            فلاتر التقارير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="warehouse">المخزن</Label>
              <Select 
                value={filter.warehouseId} 
                onValueChange={(value) => handleFilterChange('warehouseId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر مخزن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع المخازن</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate">من تاريخ</Label>
              <Input
                type="date"
                value={filter.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">إلى تاريخ</Label>
              <Input
                type="date"
                value={filter.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="transactionType">نوع المعاملة</Label>
              <Select 
                value={filter.transactionType} 
                onValueChange={(value) => handleFilterChange('transactionType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="issue">صرف</SelectItem>
                  <SelectItem value="return">إرجاع</SelectItem>
                  <SelectItem value="exchange_out">تبادل (صرف)</SelectItem>
                  <SelectItem value="exchange_in">تبادل (استلام)</SelectItem>
                  <SelectItem value="audit_adjustment">تعديل جرد</SelectItem>
                  <SelectItem value="daily_audit">جرد يومي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button onClick={handleApplyFilters} className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              تطبيق الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('summary')}
        >
          الملخص
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'transactions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('transactions')}
        >
          المعاملات
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'audits' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('audits')}
        >
          تقارير الجرد
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'low-inventory' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('low-inventory')}
        >
          العناصر منخفضة الكمية
        </button>
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">إجمالي المعاملات</p>
                    <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">تقارير الجرد</p>
                    <p className="text-2xl font-bold text-green-600">{dailyAudits.length}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">عناصر منخفضة</p>
                    <p className="text-2xl font-bold text-red-600">{lowInventoryItems.length}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">إجمالي المخازن</p>
                    <p className="text-2xl font-bold text-purple-600">{warehouses.length}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>المعاملات حسب النوع</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedPieChart data={chartData.transactionsByType} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>المعاملات حسب المخزن</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedBarChart data={chartData.transactionsByWarehouse} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العنصر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المخزن</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المستخدم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.item_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.warehouse_name}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getTransactionTypeColor(transaction.transaction_type)}`}>
                      {formatTransactionType(transaction.transaction_type)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      transaction.quantity < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {transaction.user_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeAgo(transaction.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>لا توجد معاملات مسجلة</p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>لا توجد معاملات مسجلة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="font-medium text-gray-700">العنصر:</div>
                        <div className="text-gray-900">{transaction.item_name}</div>
                        
                        <div className="font-medium text-gray-700">المخزن:</div>
                        <div className="text-gray-900">{transaction.warehouse_name}</div>
                        
                        <div className="font-medium text-gray-700">النوع:</div>
                        <div className={getTransactionTypeColor(transaction.transaction_type)}>
                          {formatTransactionType(transaction.transaction_type)}
                        </div>
                        
                        <div className="font-medium text-gray-700">الكمية:</div>
                        <div className={`font-medium ${
                          transaction.quantity < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                        </div>
                        
                        <div className="font-medium text-gray-700">المستخدم:</div>
                        <div className="text-gray-900 flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {transaction.user_name}
                        </div>
                        
                        <div className="font-medium text-gray-700">التاريخ:</div>
                        <div className="text-gray-900">{formatTimeAgo(transaction.created_at)}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'audits' && (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <Calendar className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h3 className="text-blue-800 font-medium">تقارير الجرد اليومي</h3>
                <p className="text-blue-700 text-sm mt-1">جميع تقارير الجرد التي تم تسجيلها من قبل الموظفين</p>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العنصر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المخزن</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المتوقع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الفعلي</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاختلاف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المستخدم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyAudits.map((audit) => (
                  <tr key={audit.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{audit.item_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{audit.warehouse_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{audit.expected_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{audit.actual_quantity}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getAuditDifferenceColor(audit.difference)}`}>
                      {audit.difference > 0 ? '+' : ''}{audit.difference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {audit.user_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeAgo(audit.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {dailyAudits.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>لا توجد تقارير جرد مسجلة</p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {dailyAudits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>لا توجد تقارير جرد مسجلة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dailyAudits.map((audit) => (
                  <Card key={audit.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="font-medium text-gray-700">العنصر:</div>
                        <div className="text-gray-900">{audit.item_name}</div>
                        
                        <div className="font-medium text-gray-700">المخزن:</div>
                        <div className="text-gray-900">{audit.warehouse_name}</div>
                        
                        <div className="font-medium text-gray-700">المتوقع:</div>
                        <div className="text-gray-900">{audit.expected_quantity}</div>
                        
                        <div className="font-medium text-gray-700">الفعلي:</div>
                        <div className="text-gray-900">{audit.actual_quantity}</div>
                        
                        <div className="font-medium text-gray-700">الاختلاف:</div>
                        <div className={`font-medium ${getAuditDifferenceColor(audit.difference)}`}>
                          {audit.difference > 0 ? '+' : ''}{audit.difference}
                        </div>
                        
                        <div className="font-medium text-gray-700">المستخدم:</div>
                        <div className="text-gray-900 flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {audit.user_name}
                        </div>
                        
                        <div className="font-medium text-gray-700">التاريخ:</div>
                        <div className="text-gray-900">{formatTimeAgo(audit.created_at)}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'low-inventory' && (
        <div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-medium">عناصر منخفضة الكمية</h3>
                <p className="text-red-700 text-sm mt-1">العناصر التي تحتاج إعادة طلب</p>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العنصر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المخزن</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية المتاحة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحد الأدنى</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowInventoryItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.warehouse_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.min_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        منخفض
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {lowInventoryItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>لا توجد عناصر منخفضة الكمية</p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {lowInventoryItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>لا توجد عناصر منخفضة الكمية</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lowInventoryItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="font-medium text-gray-700">العنصر:</div>
                        <div className="text-gray-900">{item.name}</div>
                        
                        <div className="font-medium text-gray-700">المخزن:</div>
                        <div className="text-gray-900">{item.warehouse_name}</div>
                        
                        <div className="font-medium text-gray-700">الكمية المتاحة:</div>
                        <div className="text-gray-900">{item.quantity}</div>
                        
                        <div className="font-medium text-gray-700">الحد الأدنى:</div>
                        <div className="text-gray-900">{item.min_quantity}</div>
                        
                        <div className="font-medium text-gray-700">الحالة:</div>
                        <div>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            منخفض
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedReportsPage;