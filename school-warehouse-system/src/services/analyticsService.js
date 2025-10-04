import { getAllWarehouses, getWarehouseByIdService } from './warehouseService';
import { getAllItemsService, getItemsByWarehouseService, getTransactionsService, getTransactionsByWarehouseService, getLowInventoryItemsService } from './itemService';

class AnalyticsService {
  // Get analytics data for admin dashboard
  async getAdminAnalytics() {
    try {
      const [warehouses, items, transactions] = await Promise.all([
        getAllWarehouses(),
        getAllItemsService(),
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
      console.error('Error fetching admin analytics:', error);
      throw error;
    }
  }

  // Get analytics data for employee dashboard
  async getEmployeeAnalytics(warehouseId) {
    try {
      const [warehouse, items, transactions] = await Promise.all([
        getWarehouseByIdService(warehouseId),
        getItemsByWarehouseService(warehouseId),
        getTransactionsByWarehouseService(warehouseId)
      ]);
      
      // Calculate analytics data
      const analytics = {
        totalItems: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
        totalTransactions: transactions.length,
        lowInventoryItems: items.filter(item => (item.quantity || 0) <= 10).length,
        // Category distribution
        itemsByCategory: this.calculateCategoryDistribution(items),
        // Transaction types
        transactionTypes: this.calculateTransactionTypes(transactions)
      };
      
      return analytics;
    } catch (error) {
      console.error('Error fetching employee analytics:', error);
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
      'صرف': transactions.filter(t => t.transaction_type === 'out').length,
      'إرجاع': transactions.filter(t => t.transaction_type === 'in').length,
      'تعديل': transactions.filter(t => t.transaction_type === 'adjustment').length,
      'جرد': transactions.filter(t => t.transaction_type === 'audit').length,
      'تحويل': transactions.filter(t => t.transaction_type === 'transfer').length
    };
    
    return Object.entries(transactionTypeMap)
      .filter(([_, value]) => value > 0)
      .map(([label, value]) => ({ label, value }));
  }
}

// Export singleton instance
export default new AnalyticsService();