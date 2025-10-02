import { 
  getWarehouses, 
  getAllItems, 
  getTransactions, 
  getWarehouseById, 
  getItemsByWarehouse, 
  getTransactionsByWarehouse, 
  getWarehouseStats, 
  getLowInventoryItems 
} from '../db';

// Create a service for handling dashboard data
class DashboardService {
  constructor() {
    this.dataUpdateCallbacks = [];
  }

  // Register callback for data updates
  onDataUpdate(callback) {
    this.dataUpdateCallbacks.push(callback);
  }

  // Remove callback for data updates
  removeDataUpdateCallback(callback) {
    const index = this.dataUpdateCallbacks.indexOf(callback);
    if (index > -1) {
      this.dataUpdateCallbacks.splice(index, 1);
    }
  }

  // Dashboard data fetching methods
  async getAdminDashboardData() {
    try {
      const [warehouses, items, transactions] = await Promise.all([
        getWarehouses(),
        getAllItems(),
        getTransactionsService()
      ]);
      
      return {
        warehouses,
        items,
        transactions
      };
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      throw error;
    }
  }

  async getEmployeeDashboardData(warehouseId) {
    try {
      const [warehouse, items, transactions] = await Promise.all([
        getWarehouseById(warehouseId),
        getItemsByWarehouseService(warehouseId),
        getTransactionsByWarehouseService(warehouseId)
      ]);
      
      return {
        warehouse,
        items,
        transactions
      };
    } catch (error) {
      console.error('Error fetching employee dashboard data:', error);
      throw error;
    }
  }

  async getWarehouseStatsService(warehouseId) {
    try {
      const stats = await getWarehouseStats(warehouseId);
      return stats;
    } catch (error) {
      console.error('Error fetching warehouse stats:', error);
      throw error;
    }
  }

  async getLowInventoryItemsService(threshold = 10) {
    try {
      const items = await getLowInventoryItemsService(threshold);
      return items;
    } catch (error) {
      console.error('Error fetching low inventory items:', error);
      throw error;
    }
  }

  async getRealTimeAnalytics() {
    try {
      const [warehouses, items, transactions] = await Promise.all([
        getWarehouses(),
        getAllItems(),
        getTransactionsService()
      ]);
      
      // Calculate analytics data
      const analytics = {
        totalItems: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
        totalWarehouses: warehouses.length,
        totalTransactions: transactions.length,
        lowInventoryItems: items.filter(item => (item.quantity || 0) <= 10).length,
        // Category distribution
        itemsByCategory: this.calculateCategoryDistribution(items),
        // Warehouse distribution
        itemsByWarehouse: this.calculateWarehouseDistribution(items, warehouses),
        // Transaction types
        transactionTypes: this.calculateTransactionTypes(transactions)
      };
      
      return analytics;
    } catch (error) {
      console.error('Error fetching real-time analytics:', error);
      throw error;
    }
  }

  calculateCategoryDistribution(items) {
    const categoryMap = {};
    items.forEach(item => {
      const categoryName = item.category_name || 'غير مصنف';
      categoryMap[categoryName] = (categoryMap[categoryName] || 0) + (item.quantity || 0);
    });
    
    return Object.entries(categoryMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }

  calculateWarehouseDistribution(items, warehouses) {
    const warehouseMap = {};
    items.forEach(item => {
      const warehouse = warehouses.find(w => w.id == item.warehouse_id);
      const warehouseName = warehouse ? warehouse.name : 'غير محدد';
      warehouseMap[warehouseName] = (warehouseMap[warehouseName] || 0) + (item.quantity || 0);
    });
    
    return Object.entries(warehouseMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }

  calculateTransactionTypes(transactions) {
    const transactionTypeMap = {
      'صرف': transactions.filter(t => t.transaction_type === 'issue').length,
      'إرجاع': transactions.filter(t => t.transaction_type === 'return').length,
      'تبديل': transactions.filter(t => t.transaction_type.includes('exchange')).length
    };
    
    return Object.entries(transactionTypeMap)
      .filter(([_, value]) => value > 0)
      .map(([label, value]) => ({ label, value }));
  }
}

// Export singleton instance
export default new DashboardService();