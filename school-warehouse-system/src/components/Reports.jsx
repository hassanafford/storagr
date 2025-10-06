import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, FileText, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { getTransactionsService, getAllItemsService } from '../services/itemService';
import { getAllWarehousesService } from '../services/warehouseService';
import InventoryAnalytics from './InventoryAnalytics';
import { formatEgyptianDateTime, getEgyptianTime, toEgyptianTime } from '../lib/timeUtils';

const Reports = () => {
  const [transactions, setTransactions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [filter, setFilter] = useState({
    warehouse: '',
    itemType: '',
    dateRange: 'all',
    transactionType: 'all'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Use only the transactions service since it already includes item and warehouse data
        const transactionsData = await getTransactionsService();
        
        // Debug: Log the transaction data
        console.log('Transactions data in Reports component:', transactionsData);
        
        // Extract unique warehouses and items from transactions
        const uniqueWarehouses = [];
        const uniqueItems = [];
        
        transactionsData.forEach(transaction => {
          // Debug: Log each transaction
          console.log('Transaction in Reports:', transaction);
          
          // Add warehouse if not already added
          if (transaction.warehouse_name && transaction.warehouse_id && 
              !uniqueWarehouses.find(w => w.id === transaction.warehouse_id)) {
            uniqueWarehouses.push({
              id: transaction.warehouse_id,
              name: transaction.warehouse_name
            });
          }
          
          // Add item if not already added
          if (transaction.item_name && transaction.item_id && 
              !uniqueItems.find(i => i.id === transaction.item_id)) {
            uniqueItems.push({
              id: transaction.item_id,
              name: transaction.item_name
            });
          }
        });
        
        console.log('Unique warehouses:', uniqueWarehouses);
        console.log('Unique items:', uniqueItems);
        
        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
        setWarehouses(uniqueWarehouses);
        setItems(uniqueItems);
        setLoading(false);
      } catch (error) {
        console.error('Error loading report data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...transactions];
    
    if (filter.warehouse) {
      filtered = filtered.filter(transaction => 
        transaction.warehouse_id == filter.warehouse
      );
    }
    
    if (filter.itemType) {
      filtered = filtered.filter(transaction => 
        transaction.category_id == filter.itemType
      );
    }
    
    if (filter.transactionType !== 'all') {
      filtered = filtered.filter(transaction => transaction.transaction_type === filter.transactionType);
    }
    
    if (filter.dateRange !== 'all') {
      const now = getEgyptianTime();
      let startDate = getEgyptianTime();
      
      switch (filter.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(transaction => 
        transaction.created_at && toEgyptianTime(transaction.created_at) >= startDate
      );
    }
    
    setFilteredTransactions(filtered);
  }, [filter, transactions]);

  const handleFilterChange = (field, value) => {
    setFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'out': return 'صرف';
      case 'in': return 'إرجاع';
      case 'adjustment': return 'تعديل';
      case 'audit': return 'جرد';
      case 'transfer': return 'تحويل';
      default: return type;
    }
  };

  const formatDate = (dateString) => {
    return formatEgyptianDateTime(dateString);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">تقارير المعاملات</h2>
        <button 
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-300 ease-in-out"
        >
          {showAnalytics ? 'عرض المعاملات' : 'عرض التحليلات'}
        </button>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label>
          <select 
            value={filter.warehouse}
            onChange={(e) => handleFilterChange('warehouse', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">جميع المخازن</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نوع المعاملة</label>
          <select 
            value={filter.transactionType}
            onChange={(e) => handleFilterChange('transactionType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">جميع الأنواع</option>
            <option value="out">صرف</option>
            <option value="in">إرجاع</option>
            <option value="adjustment">تعديل</option>
            <option value="audit">جرد</option>
            <option value="transfer">تحويل</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الفترة الزمنية</label>
          <select 
            value={filter.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">جميع الفترات</option>
            <option value="today">اليوم</option>
            <option value="week">الأسبوع الماضي</option>
            <option value="month">الشهر الماضي</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نوع العنصر</label>
          <select 
            value={filter.itemType}
            onChange={(e) => handleFilterChange('itemType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">جميع الأنواع</option>
            {/* We would need to fetch categories for this filter */}
            <option value="1">كتب</option>
            <option value="2">أدوات مكتبية</option>
            <option value="3">ملابس</option>
          </select>
        </div>
      </div>
      
      {showAnalytics ? (
        <InventoryAnalytics 
          warehouses={warehouses} 
          items={items} 
          transactions={transactions} 
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="text-blue-800 font-bold text-xl">
                {filteredTransactions.filter(t => t.transaction_type === 'out').length}
              </div>
              <div className="text-blue-600 text-sm">عمليات الصرف</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="text-green-800 font-bold text-xl">
                {filteredTransactions.filter(t => t.transaction_type === 'in').length}
              </div>
              <div className="text-green-600 text-sm">عمليات الإرجاع</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <div className="text-purple-800 font-bold text-xl">
                {filteredTransactions.filter(t => t.transaction_type === 'adjustment' || t.transaction_type === 'audit' || t.transaction_type === 'transfer').length}
              </div>
              <div className="text-purple-600 text-sm">عمليات أخرى</div>
            </div>
          </div>
      
          {/* Transactions Table */}
          {/* Desktop Table View */}
          <div className="hidden md:block table-container">
            <table className="unified-table">
              <thead className="table-header-blue">
                <tr>
                  <th className="table-cell table-cell-right">العنصر</th>
                  <th className="table-cell table-cell-right">المخزن</th>
                  <th className="table-cell table-cell-right">المستخدم</th>
                  <th className="table-cell table-cell-right">النوع</th>
                  <th className="table-cell table-cell-right">الكمية</th>
                  <th className="table-cell table-cell-right">المستلم</th>
                  <th className="table-cell table-cell-right">التاريخ</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="table-cell table-cell-right">
                        {transaction.item_name || 'عنصر محذوف'}
                      </td>
                      <td className="table-cell table-cell-right">
                        {transaction.warehouse_name || 'مخزن غير محدد'}
                      </td>
                      <td className="table-cell table-cell-right">
                        {transaction.user_name || 'مستخدم غير معروف'}
                      </td>
                      <td className="table-cell table-cell-right">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.transaction_type === 'out' ? 'bg-blue-100 text-blue-800' :
                          transaction.transaction_type === 'in' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {getTransactionTypeLabel(transaction.transaction_type)}
                        </span>
                      </td>
                      <td className="table-cell table-cell-right">
                        {transaction.quantity}
                      </td>
                      <td className="table-cell table-cell-right">
                        {transaction.recipient || '-'}
                      </td>
                      <td className="table-cell table-cell-right">
                        {formatDate(transaction.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="table-cell text-center">
                      لا توجد معاملات مطابقة للمعايير
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden">
            {filteredTransactions.length > 0 ? (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="table-card">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium text-gray-700">العنصر:</div>
                      <div className="text-gray-900">{transaction.item_name || 'عنصر محذوف'}</div>
                      
                      <div className="font-medium text-gray-700">المخزن:</div>
                      <div className="text-gray-900">{transaction.warehouse_name || 'مخزن غير محدد'}</div>

                      <div className="font-medium text-gray-700">المستخدم:</div>
                      <div className="text-gray-900">{transaction.user_name || 'مستخدم غير معروف'}</div>

                      <div className="font-medium text-gray-700">النوع:</div>
                      <div className="text-gray-900">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.transaction_type === 'out' ? 'bg-blue-100 text-blue-800' :
                          transaction.transaction_type === 'in' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {getTransactionTypeLabel(transaction.transaction_type)}
                        </span>
                      </div>
                      
                      <div className="font-medium text-gray-700">الكمية:</div>
                      <div className="text-gray-900">{transaction.quantity}</div>
                      
                      <div className="font-medium text-gray-700">المستلم:</div>
                      <div className="text-gray-900">{transaction.recipient || '-'}</div>
                      
                      <div className="font-medium text-gray-700">التاريخ:</div>
                      <div className="text-gray-900">{formatDate(transaction.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="table-empty-state">
                <p>لا توجد معاملات مطابقة للمعايير</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;