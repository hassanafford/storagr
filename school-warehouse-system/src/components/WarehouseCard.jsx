import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const WarehouseCard = ({ warehouse, onClick }) => {
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
        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl font-bold text-gray-900">{warehouse.items.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">عنصر في المخزن</p>
          </div>
          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>
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

export default WarehouseCard;