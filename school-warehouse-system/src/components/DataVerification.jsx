import React, { useState, useEffect } from 'react';
import { getAllWarehouses } from '../services/warehouseService';
import { getItemsByWarehouseService, getLowInventoryItemsService } from '../services/itemService';

const DataVerification = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [lowInventoryItems, setLowInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [warehousesData, lowItems] = await Promise.all([
          getAllWarehouses(),
          getLowInventoryItemsService(10)
        ]);

        setWarehouses(warehousesData);
        setLowInventoryItems(lowItems);

        // Load all items for each warehouse
        const allItems = [];
        for (const warehouse of warehousesData) {
          const warehouseItems = await getItemsByWarehouseService(warehouse.id);
          allItems.push(...warehouseItems.map(item => ({
            ...item,
            warehouse_name: warehouse.name
          })));
        }
        setItems(allItems);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate warehouse stats
  const warehouseStats = warehouses.map(warehouse => {
    const warehouseItems = items.filter(item => item.warehouse_id == warehouse.id);
    const totalItems = warehouseItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

    // Determine status based on item count
    let status = 'normal';
    if (totalItems < 300) {
      status = 'low';
    } else if (totalItems > 1000) {
      status = 'high';
    }

    return {
      id: warehouse.id,
      name: warehouse.name,
      items: totalItems,
      status: status
    };
  });

  // Group low inventory items by warehouse
  const lowItemsByWarehouse = warehouses.map(warehouse => {
    const warehouseLowItems = lowInventoryItems.filter(item => item.warehouse_id == warehouse.id);
    return {
      warehouse: warehouse.name,
      count: warehouseLowItems.length,
      items: warehouseLowItems
    };
  }).filter(wh => wh.count > 0);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
        <div className="text-center py-8 text-red-500">
          <p>حدث خطأ أثناء تحميل البيانات: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">التحقق من دقة البيانات</h2>

      {/* Warehouse Stats Verification */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">إحصائيات المخازن</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouseStats.map(warehouse => (
            <div key={warehouse.id} className={`p-4 rounded-lg border ${warehouse.status === 'low' ? 'bg-red-50 border-red-200' :
                warehouse.status === 'high' ? 'bg-blue-50 border-blue-200' :
                  'bg-gray-50 border-gray-200'
              }`}>
              <h4 className="font-medium text-gray-800">{warehouse.name}</h4>
              <p className="text-lg font-bold mt-1">
                {warehouse.items.toLocaleString()} عنصر
              </p>
              <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${warehouse.status === 'low' ? 'bg-red-100 text-red-800' :
                  warehouse.status === 'high' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                {warehouse.status === 'low' ? 'منخفض' :
                  warehouse.status === 'high' ? 'مرتفع' :
                    'عادي'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Low Inventory Items Verification */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          عناصر بكمية منخفضة (أقل من 10)
        </h3>
        <p className="text-gray-600 mb-4">
          إجمالي العناصر المنخفضة: {lowInventoryItems.length}
        </p>

        {lowItemsByWarehouse.length > 0 ? (
          <div className="space-y-6">
            {lowItemsByWarehouse.map(warehouseGroup => (
              <div key={warehouseGroup.warehouse} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">
                  {warehouseGroup.warehouse} - {warehouseGroup.count} عنصر منخفض
                </h4>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-white">
                    <thead className="table-header-blue">
                      <tr>
                        <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider">العنصر</th>
                        <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider">الكمية</th>
                        <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider">الفئة</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-white">
                      {warehouseGroup.items.map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 table-cell-right">{item.name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 font-bold table-cell-right">{item.quantity}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 table-cell-right">{item.category_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>لا توجد عناصر بكمية منخفضة</p>
          </div>
        )}
      </div>

      {/* Raw Data */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">البيانات الأولية</h3>
        <details className="bg-gray-50 rounded-lg p-4">
          <summary className="cursor-pointer font-medium text-gray-700">عرض جميع العناصر ({items.length} عنصر)</summary>
          <div className="mt-4 bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-white">
              <thead className="table-header-blue">
                <tr>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider">المخزن</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider">العنصر</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider">الكمية</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider">الفئة</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-white">
                {items.map(item => (
                  <tr key={`${item.warehouse_id}-${item.id}`}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 table-cell-right">{item.warehouse_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 table-cell-right">{item.name}</td>
                    <td className={`px-4 py-2 whitespace-nowrap text-sm ${item.quantity <= 10 ? 'text-red-600 font-bold' : 'text-gray-500'
                      } table-cell-right`}>{item.quantity}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 table-cell-right">{item.category_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
};

export default DataVerification;