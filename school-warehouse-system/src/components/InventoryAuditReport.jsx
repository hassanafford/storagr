import React, { useState, useEffect } from 'react';
import { getAuditStatisticsService, getDiscrepancyReportService } from '../services/inventoryAuditService';
import { getAllWarehousesService } from '../services/warehouseService';

const InventoryAuditReport = ({ user }) => {
  const [statistics, setStatistics] = useState({});
  const [discrepancies, setDiscrepancies] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('statistics');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load warehouses
        const warehouseData = await getAllWarehousesService();
        setWarehouses(warehouseData);
        
        // Load statistics
        const statsData = await getAuditStatisticsService(
          user.role === 'employee' ? user.warehouse_id : null
        );
        setStatistics(statsData);
        
        // Load discrepancies
        const discrepancyData = await getDiscrepancyReportService(
          user.role === 'employee' ? { warehouseId: user.warehouse_id } : {}
        );
        setDiscrepancies(discrepancyData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Filter data by warehouse
  useEffect(() => {
    const filterData = async () => {
      if (selectedWarehouse) {
        try {
          // Load statistics for selected warehouse
          const statsData = await getAuditStatisticsService(parseInt(selectedWarehouse));
          setStatistics(statsData);
          
          // Load discrepancies for selected warehouse
          const discrepancyData = await getDiscrepancyReportService({ 
            warehouseId: parseInt(selectedWarehouse) 
          });
          setDiscrepancies(discrepancyData);
        } catch (error) {
          console.error('Error filtering data:', error);
        }
      } else if (user.role === 'admin') {
        // Reload all data
        const statsData = await getAuditStatisticsService();
        setStatistics(statsData);
        
        const discrepancyData = await getDiscrepancyReportService();
        setDiscrepancies(discrepancyData);
      }
    };

    if (user.role === 'admin') {
      filterData();
    }
  }, [selectedWarehouse, user]);

  const getStatusCount = (status) => {
    return statistics[status] || 0;
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
        <h2 className="text-2xl font-bold text-gray-800">تقارير الجرد</h2>
        {user.role === 'admin' && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">تصفية حسب المخزن:</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">جميع المخازن</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
            activeTab === 'statistics' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('statistics')}
        >
          الإحصائيات
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
            activeTab === 'discrepancies' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('discrepancies')}
        >
          التناقضات ({discrepancies.length})
        </button>
      </div>

      {activeTab === 'statistics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
            <div className="text-3xl font-bold text-blue-700 mb-2">
              {getStatusCount('pending')}
            </div>
            <div className="text-blue-600 font-medium">معلق</div>
            <div className="text-sm text-blue-500 mt-1">عمليات جرد قيد الانتظار</div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-100">
            <div className="text-3xl font-bold text-yellow-700 mb-2">
              {getStatusCount('in_progress')}
            </div>
            <div className="text-yellow-600 font-medium">قيد التنفيذ</div>
            <div className="text-sm text-yellow-500 mt-1">عمليات جرد جارية</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6 border border-green-100">
            <div className="text-3xl font-bold text-green-700 mb-2">
              {getStatusCount('completed')}
            </div>
            <div className="text-green-600 font-medium">مكتمل</div>
            <div className="text-sm text-green-500 mt-1">عمليات جرد مكتملة</div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-6 border border-red-100">
            <div className="text-3xl font-bold text-red-700 mb-2">
              {discrepancies.length}
            </div>
            <div className="text-red-600 font-medium">تناقضات</div>
            <div className="text-sm text-red-500 mt-1">عناصر بها فروق في الكميات</div>
          </div>
        </div>
      )}

      {activeTab === 'discrepancies' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المخزن
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العنصر
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المتوقع
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفعلي
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفرق
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نوع الجرد
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discrepancies.map((discrepancy) => (
                <tr key={discrepancy.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {discrepancy.warehouses?.name || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {discrepancy.items?.name || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {discrepancy.expected_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {discrepancy.actual_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={discrepancy.discrepancy > 0 ? 'text-green-600' : 'text-red-600'}>
                      {discrepancy.discrepancy > 0 ? `+${discrepancy.discrepancy}` : discrepancy.discrepancy}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {discrepancy.inventory_audits?.audit_type || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {discrepancy.inventory_audits?.status || 'غير محدد'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {discrepancies.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">لا توجد تناقضات حالياً</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryAuditReport;