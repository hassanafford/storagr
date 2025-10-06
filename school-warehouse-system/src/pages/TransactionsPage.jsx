import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransactionsService } from '../services/itemService';
import { formatEgyptianDateTime } from '../lib/timeUtils';
import { Search, Filter, Calendar, User, Package, Building, ArrowUpDown } from 'lucide-react';

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [filters, setFilters] = useState({
    transactionType: '',
    warehouse: '',
    user: ''
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactionsService();
      setTransactions(data);
      setFilteredTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...transactions];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(transaction =>
        (transaction.item_name && transaction.item_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.user_name && transaction.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.warehouse_name && transaction.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply filters
    if (filters.transactionType) {
      result = result.filter(transaction => transaction.transaction_type === filters.transactionType);
    }

    if (filters.warehouse) {
      result = result.filter(transaction => transaction.warehouse_name === filters.warehouse);
    }

    if (filters.user) {
      result = result.filter(transaction => transaction.user_name === filters.user);
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested properties
        if (sortConfig.key === 'item_name') {
          aValue = a.item_name || '';
          bValue = b.item_name || '';
        } else if (sortConfig.key === 'warehouse_name') {
          aValue = a.warehouse_name || '';
          bValue = b.warehouse_name || '';
        } else if (sortConfig.key === 'user_name') {
          aValue = a.user_name || '';
          bValue = b.user_name || '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredTransactions(result);
  }, [transactions, searchTerm, filters, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'in': return 'إرجاع';
      case 'out': return 'صرف';
      case 'exchange': return 'تبديل';
      case 'issue': return 'صرف';
      case 'return': return 'إرجاع';
      case 'exchange_out': return 'صرف (تبديل)';
      case 'exchange_in': return 'استلام (تبديل)';
      case 'audit_adjustment': return 'تعديل جرد';
      case 'daily_audit': return 'جرد يومي';
      default: return 'معاملة';
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'in': return 'bg-green-100 text-green-800';
      case 'out': return 'bg-red-100 text-red-800';
      case 'exchange': return 'bg-purple-100 text-purple-800';
      case 'issue': return 'bg-red-100 text-red-800';
      case 'return': return 'bg-green-100 text-green-800';
      case 'exchange_out': return 'bg-purple-100 text-purple-800';
      case 'exchange_in': return 'bg-blue-100 text-blue-800';
      case 'audit_adjustment': return 'bg-yellow-100 text-yellow-800';
      case 'daily_audit': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique values for filters
  const uniqueWarehouses = [...new Set(transactions.map(t => t.warehouse_name).filter(Boolean))];
  const uniqueUsers = [...new Set(transactions.map(t => t.user_name).filter(Boolean))];
  const uniqueTransactionTypes = [...new Set(transactions.map(t => t.transaction_type))];

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">سجل المعاملات</h2>
          <p className="text-gray-600 mt-1">جميع عمليات الصرف والإرجاع في النظام</p>
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

      {/* Filters */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="بحث في المعاملات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Transaction Type Filter */}
          <div className="relative">
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={filters.transactionType}
              onChange={(e) => setFilters({...filters, transactionType: e.target.value})}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">جميع الأنواع</option>
              {uniqueTransactionTypes.map(type => (
                <option key={type} value={type}>{getTransactionTypeLabel(type)}</option>
              ))}
            </select>
          </div>

          {/* Warehouse Filter */}
          <div className="relative">
            <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={filters.warehouse}
              onChange={(e) => setFilters({...filters, warehouse: e.target.value})}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">جميع المخازن</option>
              {uniqueWarehouses.map(warehouse => (
                <option key={warehouse} value={warehouse}>{warehouse}</option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={filters.user}
              onChange={(e) => setFilters({...filters, user: e.target.value})}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">جميع المستخدمين</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-blue-800">إجمالي المعاملات</p>
              <h3 className="text-2xl font-bold text-blue-900 mt-1">{filteredTransactions.length}</h3>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-green-800">الإرجاعات</p>
              <h3 className="text-2xl font-bold text-green-900 mt-1">
                {filteredTransactions.filter(t => t.transaction_type === 'in' || t.transaction_type === 'return').length}
              </h3>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-red-800">الصرف</p>
              <h3 className="text-2xl font-bold text-red-900 mt-1">
                {filteredTransactions.filter(t => t.transaction_type === 'out' || t.transaction_type === 'issue').length}
              </h3>
            </div>
            <div className="bg-red-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="hidden md:block table-container">
        <table className="unified-table">
          <thead className="table-header-blue">
            <tr>
              <th 
                className="table-cell table-cell-right cursor-pointer hover:bg-blue-600"
                onClick={() => handleSort('created_at')}
              >
                التاريخ
              </th>
              <th 
                className="table-cell table-cell-right cursor-pointer hover:bg-blue-600"
                onClick={() => handleSort('item_name')}
              >
                العنصر
              </th>
              <th 
                className="table-cell table-cell-right cursor-pointer hover:bg-blue-600"
                onClick={() => handleSort('transaction_type')}
              >
                النوع
              </th>
              <th 
                className="table-cell table-cell-right cursor-pointer hover:bg-blue-600"
                onClick={() => handleSort('quantity')}
              >
                الكمية
              </th>
              <th 
                className="table-cell table-cell-right cursor-pointer hover:bg-blue-600"
                onClick={() => handleSort('warehouse_name')}
              >
                المخزن
              </th>
              <th 
                className="table-cell table-cell-right cursor-pointer hover:bg-blue-600"
                onClick={() => handleSort('user_name')}
              >
                المستخدم
              </th>
              <th className="table-cell table-cell-right">
                المستلم
              </th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-cell table-cell-right text-center text-gray-500">
                  لا توجد معاملات مطابقة للبحث
                </td>
              </tr>
            ) : (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="table-cell table-cell-right">
                    <div className="flex items-center justify-end">
                      <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                      {formatEgyptianDateTime(transaction.created_at)}
                    </div>
                  </td>
                  <td className="table-cell table-cell-right">
                    <div className="flex items-center justify-end">
                      <Package className="mr-2 h-4 w-4 text-gray-400" />
                      {transaction.item_name || 'عنصر محذوف'}
                    </div>
                  </td>
                  <td className="table-cell table-cell-right">
                    <div className="flex items-center justify-end">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionTypeColor(transaction.transaction_type)}`}>
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell table-cell-right">
                    <div className="flex items-center justify-end">
                      {Math.abs(transaction.quantity)}
                    </div>
                  </td>
                  <td className="table-cell table-cell-right">
                    <div className="flex items-center justify-end">
                      <Building className="mr-2 h-4 w-4 text-gray-400" />
                      {transaction.warehouse_name || 'مخزن غير محدد'}
                    </div>
                  </td>
                  <td className="table-cell table-cell-right">
                    <div className="flex items-center justify-end">
                      <User className="mr-2 h-4 w-4 text-gray-400" />
                      {transaction.user_name || 'مستخدم غير معروف'}
                    </div>
                  </td>
                  <td className="table-cell table-cell-right">
                    <div className="flex items-center justify-end">
                      {transaction.recipient || '-'}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4 mt-6">
        {filteredTransactions.map((transaction) => (
          <div key={transaction.id} className="table-card">
            <div className="flex justify-between items-start mb-2">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionTypeColor(transaction.transaction_type)}`}>
                {getTransactionTypeLabel(transaction.transaction_type)}
              </span>
              <span className="text-xs text-gray-500">
                {formatEgyptianDateTime(transaction.created_at)}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">العنصر:</span>
                <span className="text-sm text-gray-900">{transaction.item_name || 'عنصر محذوف'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">الكمية:</span>
                <span className="text-sm text-gray-900">{Math.abs(transaction.quantity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">المخزن:</span>
                <span className="text-sm text-gray-900">{transaction.warehouse_name || 'مخزن غير محدد'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">المستخدم:</span>
                <span className="text-sm text-gray-900">{transaction.user_name || 'مستخدم غير معروف'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">المستلم:</span>
                <span className="text-sm text-gray-900">{transaction.recipient || '-'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionsPage;