import { api } from '../db';
import io from 'socket.io-client';

// Create a service for handling dashboard data with real-time updates
class DashboardService {
  constructor() {
    this.socket = null;
    this.notificationCallback = null;
    this.isConnected = false;
    this.dataUpdateCallbacks = [];
  }

  // Initialize WebSocket connection with proper authentication
  initWebSocket(callback) {
    this.notificationCallback = callback;
    
    // Get token from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user.token;
    
    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // Connect to WebSocket server with authentication
    const socketOptions = {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 15000,
      timeout: 10000,
      autoConnect: false
    };
    
    // Add authentication token if available
    if (token) {
      socketOptions.auth = { token };
    }
    
    this.socket = io('http://localhost:5001', socketOptions);
    
    // Add event listeners
    this.socket.on('connect', () => {
      console.log('Dashboard WebSocket connected with ID:', this.socket.id);
      this.isConnected = true;
    });
    
    this.socket.on('notification', (notification) => {
      console.log('Received dashboard notification:', notification);
      if (this.notificationCallback) {
        this.notificationCallback(notification);
      }
      
      // Trigger data update callbacks when notifications are received
      this.dataUpdateCallbacks.forEach(cb => {
        if (typeof cb === 'function') {
          cb(notification);
        }
      });
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Dashboard WebSocket disconnected:', reason);
      this.isConnected = false;
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Dashboard WebSocket connection error:', error);
      this.isConnected = false;
    });
    
    // Manually connect
    this.socket.connect();
    
    return Promise.resolve();
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

  // Disconnect WebSocket
  disconnectWebSocket() {
    this.isConnected = false;
    this.notificationCallback = null;
    this.dataUpdateCallbacks = [];
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Dashboard data fetching methods with real-time capabilities
  async getAdminDashboardData() {
    try {
      const [warehouses, items, transactions] = await Promise.all([
        api.getWarehouses(),
        api.getAllItems(),
        api.getTransactions()
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
        api.getWarehouseById(warehouseId),
        api.getItemsByWarehouse(warehouseId),
        api.getTransactionsByWarehouse(warehouseId)
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

  async getWarehouseStats(warehouseId) {
    try {
      const stats = await api.getWarehouseStats(warehouseId);
      return stats;
    } catch (error) {
      console.error('Error fetching warehouse stats:', error);
      throw error;
    }
  }

  async getLowInventoryItems(threshold = 10) {
    try {
      const items = await api.getLowInventoryItems(threshold);
      return items;
    } catch (error) {
      console.error('Error fetching low inventory items:', error);
      throw error;
    }
  }

  async getRealTimeAnalytics() {
    try {
      const [warehouses, items, transactions] = await Promise.all([
        api.getWarehouses(),
        api.getAllItems(),
        api.getTransactions()
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