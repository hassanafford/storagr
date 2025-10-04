import React, { useState, useEffect } from 'react';
import ProfessionalPieChart from './ProfessionalPieChart';
// import ProfessionalWarehouseChart from './ProfessionalWarehouseChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, PieChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const InventoryAnalytics = ({ warehouses, items, transactions }) => {
  const [analyticsData, setAnalyticsData] = useState({
    itemsByCategory: [],
    itemsByWarehouse: [],
    transactionTypes: [],
    inventoryStatus: []
  });

  useEffect(() => {
    if (warehouses.length > 0 && items.length > 0 && transactions.length > 0) {
      // Calculate items by category
      const categoryMap = {};
      items.forEach(item => {
        const categoryName = item.category_name || 'غير مصنف';
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + item.quantity;
      });
      
      const itemsByCategory = Object.entries(categoryMap)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);

      // Calculate items by warehouse
      const warehouseMap = {};
      items.forEach(item => {
        const warehouse = warehouses.find(w => w.id == item.warehouse_id);
        const warehouseName = warehouse ? warehouse.name : 'غير محدد';
        warehouseMap[warehouseName] = (warehouseMap[warehouseName] || 0) + item.quantity;
      });
      
      const itemsByWarehouse = Object.entries(warehouseMap)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);

      // Calculate transaction types
      const transactionTypeMap = {
        'صرف': transactions.filter(t => t.transaction_type === 'out').length,
        'إرجاع': transactions.filter(t => t.transaction_type === 'in').length,
        'تعديل': transactions.filter(t => t.transaction_type === 'adjustment').length,
        'جرد': transactions.filter(t => t.transaction_type === 'audit').length,
        'تحويل': transactions.filter(t => t.transaction_type === 'transfer').length
      };
      
      const transactionTypes = Object.entries(transactionTypeMap)
        .filter(([_, value]) => value > 0)
        .map(([label, value]) => ({ label, value }));

      // Calculate inventory status
      const lowItems = items.filter(item => item.quantity <= 10).length;
      const mediumItems = items.filter(item => item.quantity > 10 && item.quantity <= 50).length;
      const highItems = items.filter(item => item.quantity > 50).length;
      
      const inventoryStatus = [
        { label: 'كمية منخفضة', value: lowItems },
        { label: 'كمية متوسطة', value: mediumItems },
        { label: 'كمية عالية', value: highItems }
      ];

      setAnalyticsData({
        itemsByCategory,
        itemsByWarehouse,
        transactionTypes,
        inventoryStatus
      });
    }
  }, [warehouses, items, transactions]);

  // Define consistent color palettes
  const categoryColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
  const warehouseColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
  const transactionColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
  const statusColors = ['#ef4444', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6 w-full overflow-x-hidden" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              توزيع الأصناف حسب النوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProfessionalPieChart 
              title="توزيع الأصناف حسب النوع"
              data={analyticsData.itemsByCategory}
              colors={categoryColors}
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
            <ProfessionalPieChart 
              title="توزيع الأصناف حسب المخزن"
              data={analyticsData.itemsByWarehouse}
              colors={warehouseColors}
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
            <ProfessionalPieChart 
              title="أنواع المعاملات"
              data={analyticsData.transactionTypes}
              colors={transactionColors}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-600" />
              حالة الجرد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProfessionalPieChart 
              title="حالة الجرد"
              data={analyticsData.inventoryStatus}
              colors={statusColors}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            نظرة عامة على مخزون المستودعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfessionalWarehouseChart />
        </CardContent>
      </Card> */}
    </div>
  );
};

export default InventoryAnalytics;