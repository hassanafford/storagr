const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://xuwoixfgusvufgaliswt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get Egyptian time (UTC+2)
const getEgyptianTime = () => {
  const now = new Date();
  // Egypt is UTC+2
  const egyptTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
  return egyptTime.toISOString().slice(0, 19).replace('T', ' ');
};

const app = express();
const server = http.createServer(app);

// Configure CORS to allow multiple origins including Vercel deployment
const corsOptions = {
  origin: [
    "http://localhost:5173", 
    "http://localhost:5174", 
    "http://localhost:5175", 
    "http://localhost:5176", 
    "http://localhost:5177", 
    "http://localhost:5178", 
    "http://localhost:5179", 
    "http://localhost:5180",
    "https://storagr.vercel.app", // Add your Vercel deployment URL
    "https://*.vercel.app" // Allow all Vercel deployments
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "http://localhost:5174", 
      "http://localhost:5175", 
      "http://localhost:5176", 
      "http://localhost:5177", 
      "http://localhost:5178", 
      "http://localhost:5179", 
      "http://localhost:5180",
      "https://storagr.vercel.app", // Add your Vercel deployment URL
      "https://*.vercel.app" // Allow all Vercel deployments
    ],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Remove MySQL database connection since we're using Supabase now
// const db = mysql.createConnection({
//   host: process.env.DB_HOST || 'localhost',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'storage',
//   charset: 'utf8mb4',
//   collation: 'utf8mb4_unicode_ci',
//   multipleStatements: true,
//   supportBigNumbers: true,
//   bigNumberStrings: true
// });

// Connect to Supabase
console.log('Connecting to Supabase at:', supabaseUrl);
console.log('Using Supabase key:', supabaseKey.substring(0, 10) + '...'); // Log first 10 chars of key for debugging

// Test basic connectivity to Supabase
const https = require('https');
const url = require('url');

const parsedUrl = url.parse(supabaseUrl);
const options = {
  hostname: parsedUrl.hostname,
  port: 443,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
};

console.log('Testing connectivity to Supabase...');
const req = https.request(options, (res) => {
  console.log('Supabase connectivity test response:', res.statusCode);
});

req.on('error', (error) => {
  console.error('Supabase connectivity test error:', error);
});

req.end();

supabase.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('Error connecting to Supabase:', error);
    } else {
      console.log('Successfully connected to Supabase');
    }
  })
  .catch(err => {
    console.error('Exception during Supabase connection:', err);
  });

// Test Supabase connection periodically
setInterval(async () => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connection test successful');
    }
  } catch (err) {
    console.error('Supabase connection test error:', err);
  }
}, 30000); // Test every 30 seconds

// Middleware for authentication and authorization
const authenticateUser = (req, res, next) => {
  console.log('Authentication middleware called for URL:', req.url);
  console.log('Authorization header:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('No authorization header found');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    console.log('Token extracted:', token);
    
    // In a real application, you would verify the JWT token here
    // For this demo, we'll just pass the user data in the token
    const user = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    console.log('User decoded:', user);
    
    req.user = user;
    next();
  } catch (error) {
    console.log('Error decoding token:', error);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

const requireEmployee = (req, res, next) => {
  if (!req.user || (req.user.role !== 'employee' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Access denied. Employee privileges required.' });
  }
  next();
};

// Store connected users and their sockets
const connectedUsers = new Map();

// Function to emit real-time notifications to all clients
const emitNotification = (notification) => {
  io.emit('notification', notification);
};

// Function to emit real-time notifications to specific user
const emitNotificationToUser = (userId, notification) => {
  // Emit to specific user if connected
  const userSocket = connectedUsers.get(userId);
  if (userSocket) {
    userSocket.emit('notification', notification);
  }
};

// Function to emit real-time notifications to admin users
const emitNotificationToAdmins = (notification) => {
  // Emit to all admin users
  connectedUsers.forEach((socket, userId) => {
    if (socket.user && socket.user.role === 'admin') {
      socket.emit('notification', notification);
    }
  });
};

// WebSocket connection with authentication
io.on('connection', (socket) => {
  console.log('New client connected with ID:', socket.id);
  
  // Check if socket has authentication data
  const token = socket.handshake.auth?.token;
  let user = null;
  if (token) {
    try {
      // Decode the token to get user info
      user = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      socket.user = user;
      // Store the socket reference for this user
      connectedUsers.set(user.id, socket);
      console.log('Authenticated user connected:', user.name);
    } catch (error) {
      console.error('Error decoding token for socket:', error);
    }
  }
  
  // Store socket reference for user (in a real app, you'd use a proper session store)
  socket.on('setUser', (userData) => {
    socket.user = userData;
    if (userData && userData.id) {
      connectedUsers.set(userData.id, socket);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Remove the socket reference when disconnected
    if (socket.user && socket.user.id) {
      connectedUsers.delete(socket.user.id);
    }
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'School Warehouse API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes

// Get all warehouses
app.get('/api/warehouses', authenticateUser, async (req, res) => {
  try {
    console.log('Attempting to fetch warehouses from Supabase...');
    const { data, error } = await supabase
      .from('warehouses')
      .select('*');
    
    if (error) {
      console.error('Error fetching warehouses from Supabase:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return res.status(500).json({ error: 'Failed to fetch warehouses: ' + error.message });
    }
    
    console.log('Successfully fetched warehouses:', data?.length || 0);
    res.json(data);
  } catch (err) {
    console.error('Exception fetching warehouses:', {
      message: err.message,
      stack: err.stack
    });
    return res.status(500).json({ error: 'Failed to fetch warehouses: ' + err.message });
  }
});

// Get warehouse by ID
app.get('/api/warehouses/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching warehouse:', error);
      return res.status(500).json({ error: 'Failed to fetch warehouse' });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching warehouse:', err);
    return res.status(500).json({ error: 'Failed to fetch warehouse' });
  }
});

// Get items by warehouse ID
app.get('/api/warehouses/:id/items', authenticateUser, async (req, res) => {
  const { id } = req.params;
  
  // Employees can only access items from their assigned warehouse
  if (req.user.role === 'employee' && req.user.warehouse_id != id) {
    return res.status(403).json({ error: 'Access denied to this warehouse' });
  }
  
  try {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        categories:name,
        warehouses:name
      `)
      .eq('warehouse_id', id);
    
    if (error) {
      console.error('Error fetching warehouse items:', error);
      return res.status(500).json({ error: 'Failed to fetch warehouse items' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching warehouse items:', err);
    return res.status(500).json({ error: 'Failed to fetch warehouse items' });
  }
});

// Get warehouse statistics
app.get('/api/warehouses/:id/stats', authenticateUser, async (req, res) => {
  const { id } = req.params;
  
  // Employees can only access stats from their assigned warehouse
  if (req.user.role === 'employee' && req.user.warehouse_id != id) {
    return res.status(403).json({ error: 'Access denied to this warehouse' });
  }
  
  try {
    // Get total items count and quantity
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('quantity')
      .eq('warehouse_id', id);
    
    if (itemsError) {
      console.error('Error fetching warehouse stats:', itemsError);
      return res.status(500).json({ error: 'Failed to fetch warehouse stats' });
    }
    
    const total_items = itemsData.length;
    const total_quantity = itemsData.reduce((sum, item) => sum + item.quantity, 0);
    
    // Get category distribution
    const { data: categoryData, error: categoryError } = await supabase
      .from('items')
      .select(`
        category_id,
        quantity,
        categories (name)
      `)
      .eq('warehouse_id', id);
    
    if (categoryError) {
      console.error('Error fetching category distribution:', categoryError);
      return res.status(500).json({ error: 'Failed to fetch category distribution' });
    }
    
    // Group by category
    const category_distribution = {};
    categoryData.forEach(item => {
      const categoryName = item.categories?.name || 'Uncategorized';
      if (!category_distribution[categoryName]) {
        category_distribution[categoryName] = {
          category_name: categoryName,
          item_count: 0,
          total_quantity: 0
        };
      }
      category_distribution[categoryName].item_count += 1;
      category_distribution[categoryName].total_quantity += item.quantity;
    });
    
    res.json({
      total_items,
      total_quantity,
      category_distribution: Object.values(category_distribution)
    });
  } catch (err) {
    console.error('Error fetching warehouse stats:', err);
    return res.status(500).json({ error: 'Failed to fetch warehouse stats' });
  }
});

// Get user by national ID
app.get('/api/users/:nationalId', authenticateUser, requireAdmin, async (req, res) => {
  const { nationalId } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('national_id', nationalId)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching user:', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get all users
app.get('/api/users', authenticateUser, requireAdmin, async (req, res) => {
  console.log('Users endpoint called');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        warehouses (name)
      `);
    
    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
app.post('/api/users', authenticateUser, requireAdmin, async (req, res) => {
  const { national_id, name, role, warehouse_id } = req.body;
  
  if (!national_id || !name || !role) {
    return res.status(400).json({ error: 'National ID, name, and role are required' });
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        national_id,
        name,
        role,
        warehouse_id
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }
    
    // Emit real-time notification to admin users only
    emitNotificationToAdmins({
      type: 'success',
      message: 'تم إنشاء المستخدم بنجاح'
    });
    
    res.status(201).json({
      ...data,
      message: 'User created successfully'
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
app.put('/api/users/:id', authenticateUser, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { national_id, name, role, warehouse_id } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        national_id,
        name,
        role,
        warehouse_id
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Emit real-time notification to admin users only
    emitNotificationToAdmins({
      type: 'success',
      message: 'تم تحديث المستخدم بنجاح'
    });
    
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
app.delete('/api/users/:id', authenticateUser, requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Emit real-time notification
    emitNotification({
      type: 'success',
      message: 'تم حذف المستخدم بنجاح'
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Authenticate user
app.post('/api/auth/login', async (req, res) => {
  const { nationalId, password } = req.body;
  
  console.log('Login attempt:', { nationalId, password });
  
  if (!nationalId || !password) {
    return res.status(400).json({ error: 'National ID and password are required' });
  }
  
  // Validate that national ID is numeric
  if (!/^[0-9]+$/.test(nationalId)) {
    return res.status(400).json({ error: 'Invalid national ID format' });
  }
  
  // Extract last 6 digits of national ID as expected password
  const expectedPassword = nationalId.slice(-6);
  
  console.log('Expected password:', expectedPassword);
  console.log('Provided password:', password);
  
  // Check if provided password matches expected password
  if (password !== expectedPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        warehouses (name)
      `)
      .eq('national_id', nationalId)
      .single();
    
    if (error) {
      console.error('Error authenticating user:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
    
    if (!data) {
      // User not found - return error instead of creating new user
      return res.status(401).json({ error: 'User not registered' });
    } else {
      const user = data;
      
      // Create a token (in a real app, you would use JWT)
      const token = Buffer.from(JSON.stringify({
        id: user.id,
        national_id: user.national_id,
        name: user.name,
        role: user.role,
        warehouse_id: user.warehouse_id
      })).toString('base64');
      
      res.json({
        token,
        user: {
          id: user.id,
          national_id: user.national_id,
          name: user.name,
          role: user.role,
          warehouse_id: user.warehouse_id
        }
      });
    }
  } catch (err) {
    console.error('Error authenticating user:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get items by warehouse
app.get('/api/items/warehouse/:warehouseId', authenticateUser, async (req, res) => {
  const { warehouseId } = req.params;
  
  // Employees can only access items from their assigned warehouse
  if (req.user.role === 'employee' && req.user.warehouse_id != warehouseId) {
    return res.status(403).json({ error: 'Access denied to this warehouse' });
  }
  
  try {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        categories:name,
        warehouses:name
      `)
      .eq('warehouse_id', warehouseId);
    
    if (error) {
      console.error('Error fetching items:', error);
      return res.status(500).json({ error: 'Failed to fetch items' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching items:', err);
    return res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Update item quantity
app.put('/api/items/:id/quantity', authenticateUser, requireEmployee, async (req, res) => {
  const { id } = req.params;
  const { quantityChange } = req.body;
  
  if (quantityChange === undefined) {
    return res.status(400).json({ error: 'Quantity change is required' });
  }
  
  try {
    // First, get the item to check warehouse access
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .select('warehouse_id')
      .eq('id', id)
      .single();
    
    if (itemError) {
      console.error('Error fetching item:', itemError);
      return res.status(500).json({ error: 'Failed to fetch item' });
    }
    
    if (!itemData) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const itemWarehouseId = itemData.warehouse_id;
    
    // Employees can only update items from their assigned warehouse
    if (req.user.role === 'employee' && req.user.warehouse_id != itemWarehouseId) {
      return res.status(403).json({ error: 'Access denied to this item' });
    }
    
    // Update the item quantity
    const { data, error } = await supabase
      .from('items')
      .update({
        quantity: Math.max(0, itemData.quantity + quantityChange)
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating item quantity:', error);
      return res.status(500).json({ error: 'Failed to update item quantity' });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Emit real-time notification to admin users only
    emitNotificationToAdmins({
      type: 'success',
      message: 'تم تحديث كمية العنصر بنجاح'
    });
    
    res.json({ message: 'Item quantity updated successfully' });
  } catch (err) {
    console.error('Error updating item quantity:', err);
    return res.status(500).json({ error: 'Failed to update item quantity' });
  }
});

// Create transaction with Egyptian time tracking
app.post('/api/transactions', authenticateUser, requireEmployee, async (req, res) => {
  const { item_id, user_id, transaction_type, quantity, recipient, notes, expected_quantity, actual_quantity } = req.body;
  
  // Verify that the user is creating a transaction for themselves
  if (user_id != req.user.id) {
    return res.status(403).json({ error: 'You can only create transactions for yourself' });
  }
  
  // Calculate discrepancy if both expected and actual quantities are provided
  let discrepancy = null;
  if (expected_quantity !== undefined && actual_quantity !== undefined) {
    discrepancy = actual_quantity - expected_quantity;
  }
  
  try {
    // First, get the item to check warehouse access
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .select('warehouse_id')
      .eq('id', item_id)
      .single();
    
    if (itemError) {
      console.error('Error fetching item:', itemError);
      return res.status(500).json({ error: 'Failed to fetch item' });
    }
    
    if (!itemData) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const itemWarehouseId = itemData.warehouse_id;
    
    // Employees can only create transactions for items from their assigned warehouse
    if (req.user.role === 'employee' && req.user.warehouse_id != itemWarehouseId) {
      return res.status(403).json({ error: 'Access denied to this item' });
    }
    
    // Get Egyptian timestamp
    const egyptianTimestamp = getEgyptianTime();
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        item_id,
        user_id,
        transaction_type,
        quantity,
        recipient,
        notes,
        expected_quantity,
        actual_quantity,
        discrepancy,
        egyptian_timestamp: egyptianTimestamp
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating transaction:', error);
      return res.status(500).json({ error: 'Failed to create transaction' });
    }
    
    // Emit real-time notification to all clients (including admin)
    let message = '';
    let details = '';
    
    // Get additional information for detailed notification
    const { data: infoData, error: infoError } = await supabase
      .from('items')
      .select(`
        name,
        warehouses (name),
        users (name)
      `)
      .eq('id', item_id)
      .single();
    
    if (!infoError && infoData) {
      details = `العنصر: ${infoData.name} | المخزن: ${infoData.warehouses?.name || 'N/A'} | المستخدم: ${req.user.name}`;
    }
    
    switch (transaction_type) {
      case 'issue':
        message = 'تم صرف العنصر';
        break;
      case 'return':
        message = 'تم إرجاع العنصر';
        break;
      case 'exchange_out':
      case 'exchange_in':
        message = 'تم تبديل العناصر';
        break;
      case 'audit_adjustment':
        message = 'تم تعديل الجرد';
        break;
      case 'daily_audit':
        message = 'تم الجرد اليومي';
        break;
      default:
        message = 'تم إنشاء المعاملة';
    }
    
    // Emit detailed notification to admin users only
    const notification = {
      type: 'success',
      message: message,
      details: details,
      quantity: quantity,
      transaction_type: transaction_type,
      timestamp: new Date().toISOString(),
      egyptian_timestamp: egyptianTimestamp,
      user_name: req.user.name,
      warehouse_id: itemWarehouseId,
      discrepancy: discrepancy
    };
    
    emitNotificationToAdmins(notification);
    
    res.status(201).json({
      ...data,
      message: 'Transaction created successfully',
      notification: notification
    });
  } catch (err) {
    console.error('Error creating transaction:', err);
    return res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Get all items
app.get('/api/items', authenticateUser, requireAdmin, async (req, res) => {
  const { warehouseId, categoryId } = req.query;
  
  try {
    let query = supabase
      .from('items')
      .select(`
        *,
        categories:name,
        warehouses:name
      `);
    
    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    query = query.order('name');
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching items:', error);
      return res.status(500).json({ error: 'Failed to fetch items' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching items:', err);
    return res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get low inventory items
app.get('/api/items/low-inventory', authenticateUser, requireAdmin, async (req, res) => {
  const threshold = req.query.threshold || 10; // Default threshold is 10 items
  
  try {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        categories:name,
        warehouses:name
      `)
      .lte('quantity', threshold)
      .order('quantity', { ascending: true });
    
    if (error) {
      console.error('Error fetching low inventory items:', error);
      return res.status(500).json({ error: 'Failed to fetch low inventory items' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching low inventory items:', err);
    return res.status(500).json({ error: 'Failed to fetch low inventory items' });
  }
});

// Get item by ID
app.get('/api/items/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        categories:name,
        warehouses:name
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching item:', error);
      return res.status(500).json({ error: 'Failed to fetch item' });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Employees can only access items from their assigned warehouse
    if (req.user.role === 'employee' && req.user.warehouse_id != data.warehouse_id) {
      return res.status(403).json({ error: 'Access denied to this item' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching item:', err);
    return res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create warehouse
app.post('/api/warehouses', authenticateUser, requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Warehouse name is required' });
  }
  
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .insert({
        name,
        description
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating warehouse:', error);
      return res.status(500).json({ error: 'Failed to create warehouse' });
    }
    
    // Emit real-time notification to admin users only
    emitNotificationToAdmins({
      type: 'success',
      message: 'تم إنشاء المخزن بنجاح'
    });
    
    res.status(201).json({
      ...data,
      message: 'Warehouse created successfully'
    });
  } catch (err) {
    console.error('Error creating warehouse:', err);
    return res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

// Update warehouse
app.put('/api/warehouses/:id', authenticateUser, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .update({
        name,
        description
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating warehouse:', error);
      return res.status(500).json({ error: 'Failed to update warehouse' });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    // Emit real-time notification
    emitNotification({
      type: 'success',
      message: 'تم تحديث المخزن بنجاح'
    });
    
    res.json({ message: 'Warehouse updated successfully' });
  } catch (err) {
    console.error('Error updating warehouse:', err);
    return res.status(500).json({ error: 'Failed to update warehouse' });
  }
});

// Delete warehouse
app.delete('/api/warehouses/:id', authenticateUser, requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting warehouse:', error);
      return res.status(500).json({ error: 'Failed to delete warehouse' });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    // Emit real-time notification
    emitNotification({
      type: 'success',
      message: 'تم حذف المخزن بنجاح'
    });
    
    res.json({ message: 'Warehouse deleted successfully' });
  } catch (err) {
    console.error('Error deleting warehouse:', err);
    return res.status(500).json({ error: 'Failed to delete warehouse' });
  }
});

// Get all categories with warehouse names
app.get('/api/categories', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        warehouses (name)
      `);
    
    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching categories:', err);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by ID
app.get('/api/categories/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching category:', error);
      return res.status(500).json({ error: 'Failed to fetch category' });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Employees can only access categories from their assigned warehouse
    if (req.user.role === 'employee') {
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('warehouse_id')
        .eq('category_id', id);
      
      if (itemsError) {
        console.error('Error checking category access:', itemsError);
        return res.status(500).json({ error: 'Failed to check category access' });
      }
      
      if (items.length === 0 || items[0].warehouse_id != req.user.warehouse_id) {
        return res.status(403).json({ error: 'Access denied to this category' });
      }
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching category:', err);
    return res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create category
app.post('/api/categories', authenticateUser, requireAdmin, async (req, res) => {
  const { name, warehouse_id } = req.body;
  
  if (!name || !warehouse_id) {
    return res.status(400).json({ error: 'Category name and warehouse ID are required' });
  }
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        warehouse_id
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ error: 'Failed to create category' });
    }
    
    // Emit real-time notification
    emitNotification({
      type: 'success',
      message: 'تم إنشاء الفئة بنجاح'
    });
    
    res.status(201).json({
      ...data,
      message: 'Category created successfully'
    });
  } catch (err) {
    console.error('Error creating category:', err);
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
app.put('/api/categories/:id', authenticateUser, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, warehouse_id } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name,
        warehouse_id
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({ error: 'Failed to update category' });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Emit real-time notification
    emitNotification({
      type: 'success',
      message: 'تم تحديث الفئة بنجاح'
    });
    
    res.json({ message: 'Category updated successfully' });
  } catch (err) {
    console.error('Error updating category:', err);
    return res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
app.delete('/api/categories/:id', authenticateUser, requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({ error: 'Failed to delete category' });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Emit real-time notification
    emitNotification({
      type: 'success',
      message: 'تم حذف الفئة بنجاح'
    });
    
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Create item
app.post('/api/items', authenticateUser, requireAdmin, async (req, res) => {
  const { name, category_id, warehouse_id, quantity, description } = req.body;
  
  if (!name || !category_id || !warehouse_id) {
    return res.status(400).json({ error: 'Item name, category ID, and warehouse ID are required' });
  }
  
  try {
    const { data, error } = await supabase
      .from('items')
      .insert({
        name,
        category_id,
        warehouse_id,
        quantity: quantity || 0,
        description
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating item:', error);
      return res.status(500).json({ error: 'Failed to create item' });
    }
    
    // Emit real-time notification
    emitNotification({
      type: 'success',
      message: 'تم إنشاء العنصر بنجاح'
    });
    
    res.status(201).json({
      ...data,
      message: 'Item created successfully'
    });
  } catch (err) {
    console.error('Error creating item:', err);
    return res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update item
app.put('/api/items/:id', authenticateUser, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, category_id, warehouse_id, quantity, description } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('items')
      .update({
        name,
        category_id,
        warehouse_id,
        quantity,
        description
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating item:', error);
      return res.status(500).json({ error: 'Failed to update item' });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Emit real-time notification
    emitNotification({
      type: 'success',
      message: 'تم تحديث العنصر بنجاح'
    });
    
    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    console.error('Error updating item:', err);
    return res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
app.delete('/api/items/:id', authenticateUser, requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting item:', error);
      return res.status(500).json({ error: 'Failed to delete item' });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Emit real-time notification
    emitNotification({
      type: 'success',
      message: 'تم حذف العنصر بنجاح'
    });
    
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    return res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Create daily audit
app.post('/api/daily-audits', authenticateUser, requireEmployee, async (req, res) => {
  const { warehouse_id, item_id, user_id, expected_quantity, actual_quantity, notes } = req.body;
  
  // Verify that the user is creating an audit for themselves
  if (user_id != req.user.id) {
    return res.status(403).json({ error: 'You can only create audits for yourself' });
  }
  
  // Calculate discrepancy
  const discrepancy = actual_quantity - expected_quantity;
  
  // Get audit date (today)
  const auditDate = new Date().toISOString().split('T')[0];
  
  // Get Egyptian timestamp
  const egyptianTimestamp = getEgyptianTime();
  
  // Employees can only create audits for items from their assigned warehouse
  if (req.user.role === 'employee' && req.user.warehouse_id != warehouse_id) {
    return res.status(403).json({ error: 'Access denied to this warehouse' });
  }
  
  try {
    const { data, error } = await supabase
      .from('daily_audits')
      .insert({
        warehouse_id,
        item_id,
        user_id,
        expected_quantity,
        actual_quantity,
        discrepancy,
        notes,
        audit_date: auditDate,
        egyptian_timestamp: egyptianTimestamp
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating daily audit:', error);
      return res.status(500).json({ error: 'Failed to create daily audit' });
    }
    
    // Emit real-time notification to admin users only
    const notification = {
      type: 'success',
      message: 'تم إجراء الجرد اليومي',
      details: `العنصر: ${item_id} | المخزن: ${warehouse_id} | المستخدم: ${req.user.name}`,
      expected_quantity: expected_quantity,
      actual_quantity: actual_quantity,
      discrepancy: discrepancy,
      timestamp: new Date().toISOString(),
      egyptian_timestamp: egyptianTimestamp,
      user_name: req.user.name,
      warehouse_id: warehouse_id
    };
    
    emitNotificationToAdmins(notification);
    
    res.status(201).json({
      ...data,
      message: 'Daily audit created successfully',
      notification: notification
    });
  } catch (err) {
    console.error('Error creating daily audit:', err);
    return res.status(500).json({ error: 'Failed to create daily audit' });
  }
});

// Get daily audits
app.get('/api/daily-audits', authenticateUser, requireAdmin, async (req, res) => {
  const { warehouseId, itemId } = req.query;
  
  try {
    let query = supabase
      .from('daily_audits')
      .select(`
        *,
        items (name),
        warehouses (name),
        users (name)
      `);
    
    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }
    
    if (itemId) {
      query = query.eq('item_id', itemId);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching daily audits:', error);
      return res.status(500).json({ error: 'Failed to fetch daily audits' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching daily audits:', err);
    return res.status(500).json({ error: 'Failed to fetch daily audits' });
  }
});

// Get transactions with full details
app.get('/api/transactions', authenticateUser, requireAdmin, async (req, res) => {
  const { limit } = req.query;
  const queryLimit = limit ? parseInt(limit) : null;
  
  try {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        items (name),
        users (name),
        warehouses (name)
      `)
      .order('created_at', { ascending: false });
    
    if (queryLimit) {
      query = query.limit(queryLimit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transactions by date range with Egyptian time
app.get('/api/transactions/date-range', authenticateUser, requireAdmin, async (req, res) => {
  const { startDate, endDate, warehouseId } = req.query;
  
  try {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        items (name),
        users (name),
        warehouses (name)
      `);
    
    if (startDate && endDate) {
      query = query.gte('egyptian_timestamp', startDate)
                   .lte('egyptian_timestamp', endDate);
    }
    
    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }
    
    query = query.order('egyptian_timestamp', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transactions by date range:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions by date range' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching transactions by date range:', err);
    return res.status(500).json({ error: 'Failed to fetch transactions by date range' });
  }
});

// Get transactions by warehouse
app.get('/api/transactions/warehouse/:warehouseId', authenticateUser, async (req, res) => {
  const { warehouseId } = req.params;
  
  // Employees can only access transactions from their assigned warehouse
  if (req.user.role === 'employee' && req.user.warehouse_id != warehouseId) {
    return res.status(403).json({ error: 'Access denied to this warehouse' });
  }
  
  const { limit } = req.query;
  const queryLimit = limit ? parseInt(limit) : null;
  
  try {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        items (name),
        users (name)
      `)
      .eq('warehouse_id', warehouseId)
      .order('created_at', { ascending: false });
    
    if (queryLimit) {
      query = query.limit(queryLimit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transactions by user
app.get('/api/transactions/user/:userId', authenticateUser, async (req, res) => {
  const { userId } = req.params;
  
  // Users can only access their own transactions, admins can access all
  if (req.user.role !== 'admin' && req.user.id != userId) {
    return res.status(403).json({ error: 'Access denied to these transactions' });
  }
  
  const { limit } = req.query;
  const queryLimit = limit ? parseInt(limit) : null;
  
  try {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        items (name),
        warehouses (name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (queryLimit) {
      query = query.limit(queryLimit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Search items
app.get('/api/items/search', authenticateUser, requireAdmin, async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  const searchQuery = `%${q}%`;
  
  try {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        categories (name),
        warehouses (name)
      `)
      .or(`name.ilike.%${searchQuery}%,categories.name.ilike.%${searchQuery}%`);
    
    if (error) {
      console.error('Error searching items:', error);
      return res.status(500).json({ error: 'Failed to search items' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error searching items:', err);
    return res.status(500).json({ error: 'Failed to search items' });
  }
});

// Get item history/transactions
app.get('/api/items/:id/history', authenticateUser, async (req, res) => {
  const { id } = req.params;
  
  // First, get the item to check warehouse access
  const { data: itemData, error: itemError } = await supabase
    .from('items')
    .select('warehouse_id')
    .eq('id', id)
    .single();
  
  if (itemError) {
    console.error('Error fetching item:', itemError);
    return res.status(500).json({ error: 'Failed to fetch item' });
  }
  
  if (!itemData) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  const itemWarehouseId = itemData.warehouse_id;
  
  // Employees can only access history for items from their assigned warehouse
  if (req.user.role === 'employee' && req.user.warehouse_id != itemWarehouseId) {
    return res.status(403).json({ error: 'Access denied to this item history' });
  }
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        users (name)
      `)
      .eq('item_id', id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching item history:', error);
      return res.status(500).json({ error: 'Failed to fetch item history' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching item history:', err);
    return res.status(500).json({ error: 'Failed to fetch item history' });
  }
});

// Bulk update items
app.put('/api/items/bulk-update', authenticateUser, requireAdmin, async (req, res) => {
  const { items } = req.body; // Array of {id, quantityChange}
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required' });
  }
  
  try {
    // Start a transaction by using Supabase's batch operations
    const updates = items.map(({ id, quantityChange }) => 
      supabase
        .from('items')
        .update({
          quantity: Math.max(0, supabase.rpc('quantity') + quantityChange)
        })
        .eq('id', id)
    );
    
    // Execute all updates
    const results = await Promise.all(updates);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error updating item quantities:', errors);
      return res.status(500).json({ error: 'Failed to update item quantities' });
    }
    
    // Emit real-time notification
    emitNotification({
      type: 'success',
      message: `تم تحديث ${items.length} عنصر بنجاح`
    });
    
    res.json({ message: `Successfully updated ${items.length} items` });
  } catch (err) {
    console.error('Error updating item quantities:', err);
    return res.status(500).json({ error: 'Failed to update item quantities' });
  }
});

// Get warehouse categories
app.get('/api/warehouses/:id/categories', authenticateUser, async (req, res) => {
  const { id } = req.params;
  
  // Employees can only access categories from their assigned warehouse
  if (req.user.role === 'employee' && req.user.warehouse_id != id) {
    return res.status(403).json({ error: 'Access denied to this warehouse' });
  }
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('warehouse_id', id)
      .order('name');
    
    if (error) {
      console.error('Error fetching warehouse categories:', error);
      return res.status(500).json({ error: 'Failed to fetch warehouse categories' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching warehouse categories:', err);
    return res.status(500).json({ error: 'Failed to fetch warehouse categories' });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
