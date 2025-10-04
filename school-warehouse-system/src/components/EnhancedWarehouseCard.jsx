import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, TrendingDown, Minus, AlertCircle, Clock, User } from 'lucide-react';
import { getTransactionsByWarehouse } from '../services/itemService';
import { formatTimeAgo } from '../lib/timeUtils';

const EnhancedWarehouseCard = ({ warehouse, onClick, transactions = [] }) => {
  const [warehouseTransactions, setWarehouseTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Determine status color and label
  const getStatusConfig = (status) => {
    switch (status) {
      case 'low':
        return { 
          variant: 'destructive', 
          label: 'كمية منخفضة',
          cardClass: 'border-red-200 bg-red-50 hover:bg-red-100',
          icon: <TrendingDown className="h-5 w-5 text-red-600" />
        };
      case 'high':
        return { 
          variant: 'success', 
          label: 'كمية عالية',
          cardClass: 'border-green-200 bg-green-50 hover:bg-green-100',
          icon: <TrendingUp className="h-5 w-5 text-green-600" />
        };
      case 'critical':
        return { 
          variant: 'destructive', 
          label: 'كمية حرجة',
          cardClass: 'border-red-300 bg-red-100 hover:bg-red-200',
          icon: <AlertCircle className="h-5 w-5 text-red-700" />
        };
      default:
        return { 
          variant: 'default', 
          label: 'عادي',
          cardClass: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
          icon: <Minus className="h-5 w-5 text-blue-600" />
        };
    }
  };

  const statusConfig = getStatusConfig(warehouse.status);

  // Get recent transactions for this warehouse
  const getRecentTransactions = () => {
    return transactions
      .filter(t => t.warehouse_id == warehouse.id)
      .slice(0, 3); // Get last 3 transactions
  };

  const recentTransactions = getRecentTransactions();

  // Format time ago in Arabic
  const formatTimeAgo = (dateString) => {
    return formatTimeAgo(dateString);
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'issue': return 'صرف';
      case 'return': return 'إرجاع';
      case 'exchange_out': return 'صرف (تبديل)';
      case 'exchange_in': return 'استلام (تبديل)';
      case 'audit_adjustment': return 'تعديل جرد';
      case 'daily_audit': return 'جرد يومي';
      default: return 'معاملة';
    }
  };

  // Get transaction type color
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

  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-xl rounded-xl border shadow-sm hover:scale-105 transform ${statusConfig.cardClass} h-full`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex justify-between items-start">
          <span className="text-gray-800">{warehouse.name}</span>
          <div className="bg-gray-100 p-2 rounded-lg">
            <Package className="h-5 w-5 text-gray-600" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-between h-full">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-2xl font-bold text-gray-900">{warehouse.items.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">عنصر في المخزن</p>
          </div>
          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              آخر المعاملات
            </h4>
            <div className="space-y-1">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="text-xs flex justify-between items-center">
                  <span className={getTransactionTypeColor(transaction.transaction_type)}>
                    {getTransactionTypeLabel(transaction.transaction_type)}
                  </span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {transaction.user_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500">
            <span>النقر للوصول الكامل</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedWarehouseCard;