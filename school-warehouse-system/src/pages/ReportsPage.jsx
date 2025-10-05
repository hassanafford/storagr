import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationProvider';
import { getTransactionsService } from '../services/itemService';
import { getAllWarehouses } from '../services/warehouseService';
import { getLowInventoryItemsService } from '../services/itemService';
import { formatEgyptianDateTime } from '../lib/timeUtils';

function ReportsPage() {
  const { addNotification } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [lowInventoryItems, setLowInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');
  const [filter, setFilter] = useState({
    warehouseId: '',
    dateRange: 'all'
  });

  useEffect(() => {
    loadReports();
    loadWarehouses();
    loadLowInventoryItems();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await getTransactionsService();
      setTransactions(data);
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
      const data = await getAllWarehouses();
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

  const handleFilterChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value
    });
  };

  const formatTransactionType = (type) => {
    switch (type) {
      case 'issue': return 'صرف';
      case 'return': return 'إرجاع';
      case 'exchange_out': return 'تبادل (صرف)';
      case 'exchange_in': return 'تبادل (استلام)';
      default: return type;
    }
  };

  const formatDate = (dateString) => {
    return formatEgyptianDateTime(dateString);
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">التقارير</h2>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'transactions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('transactions')}
        >
          المعاملات
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'low-inventory' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('low-inventory')}
        >
          العناصر منخفضة الكمية
        </button>
      </div>

      {activeTab === 'transactions' && (
        <div>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المخزن</label>
              <select
                name="warehouseId"
                value={filter.warehouseId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">جميع المخازن</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفترة الزمنية</label>
              <select
                name="dateRange"
                value={filter.dateRange}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">جميع الفترات</option>
                <option value="today">اليوم</option>
                <option value="week">هذا الأسبوع</option>
                <option value="month">هذا الشهر</option>
              </select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-white">
              <thead className="table-header-blue">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">العنصر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">المخزن</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">النوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الكمية</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">المستلم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">التاريخ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-white">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 table-cell-right">{transaction.item_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{transaction.warehouse_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{formatTransactionType(transaction.transaction_type)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{transaction.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{transaction.recipient}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{formatDate(transaction.created_at)}</td>
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
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium text-gray-700">العنصر:</div>
                      <div className="text-gray-900">{transaction.item_name}</div>
                      
                      <div className="font-medium text-gray-700">المخزن:</div>
                      <div className="text-gray-900">{transaction.warehouse_name}</div>
                      
                      <div className="font-medium text-gray-700">النوع:</div>
                      <div className="text-gray-900">{formatTransactionType(transaction.transaction_type)}</div>
                      
                      <div className="font-medium text-gray-700">الكمية:</div>
                      <div className="text-gray-900">{transaction.quantity}</div>
                      
                      <div className="font-medium text-gray-700">المستلم:</div>
                      <div className="text-gray-900">{transaction.recipient}</div>
                      
                      <div className="font-medium text-gray-700">التاريخ:</div>
                      <div className="text-gray-900">{formatDate(transaction.created_at)}</div>
                    </div>
                  </div>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-red-800 font-medium">تنبيه: عناصر بكمية منخفضة</h3>
                <p className="text-red-700 text-sm mt-1">هذه العناصر تحتاج إلى إعادة التعبئة</p>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-white">
              <thead className="table-header-blue">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">العنصر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الفئة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">المخزن</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الكمية</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-white">
                {lowInventoryItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 table-cell-right">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{item.category_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 table-cell-right">{item.warehouse_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold table-cell-right">{item.quantity}</td>
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
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium text-gray-700">العنصر:</div>
                      <div className="text-gray-900">{item.name}</div>
                      
                      <div className="font-medium text-gray-700">الفئة:</div>
                      <div className="text-gray-900">{item.category_name}</div>
                      
                      <div className="font-medium text-gray-700">المخزن:</div>
                      <div className="text-gray-900">{item.warehouse_name}</div>
                      
                      <div className="font-medium text-gray-700">الكمية:</div>
                      <div className="text-red-600 font-bold">{item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;