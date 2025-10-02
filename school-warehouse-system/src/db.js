import io from 'socket.io-client';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Fixed for Vite environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xuwoixfgusvufgaliswt.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Remove the direct database connection and use API calls instead
const API_BASE_URL = 'http://localhost:5001/api';

// Create WebSocket connection - SINGLETON PATTERN with state tracking
let socket = null;
let notificationCallback = null;
let isConnected = false;
let isConnecting = false;

// Get token from localStorage
const getToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.token;
};

export const initWebSocket = (callback) => {
  console.log('initWebSocket called', { isConnected, isConnecting });
  
  // Always disconnect existing socket to prevent duplicates
  if (socket) {
    console.log('Disconnecting existing WebSocket connection');
    socket.disconnect();
    socket = null;
    isConnected = false;
    isConnecting = false;
  }
  
  notificationCallback = callback;
  isConnecting = true;
  
  // Get token for authentication
  const token = getToken();
  console.log('Token for WebSocket connection:', token ? 'Present' : 'Missing');
  
  // Connect to WebSocket server with authentication
  const socketOptions = {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
    reconnectionDelayMax: 15000,
    randomizationFactor: 0.5,
    timeout: 10000,
    autoConnect: false
  };
  
  // Add authentication token if available
  if (token) {
    socketOptions.auth = { token };
  }
  
  socket = io('http://localhost:5001', socketOptions);
  
  // Add event listeners
  socket.on('connect', () => {
    console.log('WebSocket connected with ID:', socket.id);
    isConnected = true;
    isConnecting = false;
  });
  
  socket.on('notification', (notification) => {
    console.log('Received notification:', notification);
    if (notificationCallback) {
      notificationCallback(notification);
    }
  });
  
  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
    isConnected = false;
    isConnecting = false;
  });
  
  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    isConnected = false;
    isConnecting = false;
  });
  
  // Manually connect
  socket.connect();
  
  return Promise.resolve();
};

// Function to disconnect WebSocket
export const disconnectWebSocket = () => {
  console.log('disconnectWebSocket called');
  isConnected = false;
  isConnecting = false;
  notificationCallback = null;
  
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Add UTF-8 encoding header to all requests
const authenticatedFetch = (url, options = {}) => {
  const token = getToken();
  
  console.log('Making authenticated request to:', url);
  console.log('Token available:', !!token);
  
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json; charset=utf-8',
    ...options.headers
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log('Authorization header set');
  } else {
    console.log('No token available for authorization');
  }
  
  console.log('Request headers:', headers);
  
  return fetch(url, {
    ...options,
    headers
  });
};

export const api = {
  // Authentication endpoint
  authenticateUser: (nationalId, password) => {
    return fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nationalId, password }),
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  
  // Warehouse endpoints
  getWarehouses: () => authenticatedFetch(`${API_BASE_URL}/warehouses`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  getWarehouseById: (id) => authenticatedFetch(`${API_BASE_URL}/warehouses/${id}`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  getWarehouseItems: (id) => authenticatedFetch(`${API_BASE_URL}/warehouses/${id}/items`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  getWarehouseStats: (id) => authenticatedFetch(`${API_BASE_URL}/warehouses/${id}/stats`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  
  // User endpoints
  getUserByNationalId: (nationalId) => authenticatedFetch(`${API_BASE_URL}/users/${nationalId}`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  getAllUsers: () => authenticatedFetch(`${API_BASE_URL}/users`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  createUser: (userData) => {
    return authenticatedFetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      body: JSON.stringify(userData),
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  updateUser: (id, userData) => {
    return authenticatedFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  deleteUser: (id) => {
    return authenticatedFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  
  // Item endpoints
  getItemById: (id) => authenticatedFetch(`${API_BASE_URL}/items/${id}`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  getItemsByWarehouse: (warehouseId) => authenticatedFetch(`${API_BASE_URL}/items/warehouse/${warehouseId}`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  updateItemQuantity: (itemId, quantityChange) => {
    return authenticatedFetch(`${API_BASE_URL}/items/${itemId}/quantity`, {
      method: 'PUT',
      body: JSON.stringify({ quantityChange }),
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  getAllItems: () => authenticatedFetch(`${API_BASE_URL}/items`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  
  // Transaction endpoints
  createTransaction: (transactionData) => {
    return authenticatedFetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transactionData),
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  
  // Daily audit endpoints
  createDailyAudit: (auditData) => {
    return authenticatedFetch(`${API_BASE_URL}/daily-audits`, {
      method: 'POST',
      body: JSON.stringify(auditData),
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  getDailyAudits: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString 
      ? `${API_BASE_URL}/daily-audits?${queryString}`
      : `${API_BASE_URL}/daily-audits`;
      
    return authenticatedFetch(url).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  getTransactions: () => authenticatedFetch(`${API_BASE_URL}/transactions`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  getTransactionsByWarehouse: (warehouseId) => authenticatedFetch(`${API_BASE_URL}/transactions/warehouse/${warehouseId}`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  
  // Low inventory endpoint
  getLowInventoryItems: (threshold = 10) => authenticatedFetch(`${API_BASE_URL}/items/low-inventory?threshold=${threshold}`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  
  // Warehouse CRUD endpoints
  createWarehouse: (warehouseData) => {
    return authenticatedFetch(`${API_BASE_URL}/warehouses`, {
      method: 'POST',
      body: JSON.stringify(warehouseData),
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  updateWarehouse: (id, warehouseData) => {
    return authenticatedFetch(`${API_BASE_URL}/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(warehouseData),
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  deleteWarehouse: (id) => {
    return authenticatedFetch(`${API_BASE_URL}/warehouses/${id}`, {
      method: 'DELETE',
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  
  // Category CRUD endpoints
  getCategories: () => authenticatedFetch(`${API_BASE_URL}/categories`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  getCategoryById: (id) => authenticatedFetch(`${API_BASE_URL}/categories/${id}`).then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }),
  createCategory: (categoryData) => {
    return authenticatedFetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      body: JSON.stringify(categoryData),
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  updateCategory: (id, categoryData) => {
    return authenticatedFetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  deleteCategory: (id) => {
    return authenticatedFetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  
  // Item CRUD endpoints
  createItem: (itemData) => {
    return authenticatedFetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  updateItem: (id, itemData) => {
    return authenticatedFetch(`${API_BASE_URL}/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
  deleteItem: (id) => {
    return authenticatedFetch(`${API_BASE_URL}/items/${id}`, {
      method: 'DELETE',
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    });
  },
};

export default api;