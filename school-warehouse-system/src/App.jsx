import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, NavLink, Navigate } from 'react-router-dom';
import { useNotification } from './components/NotificationProvider';
import { authenticateUserService, getCurrentUser, logoutUser } from './services/userService';
import { getAllWarehousesService, getWarehouseByIdService } from './services/warehouseService';
import { getItemsByWarehouseService, updateItemQuantityService, createTransactionService, getTransactionsService, getLowInventoryItemsService } from './services/itemService';

import Reports from './components/Reports';
import './App.css';
import { Menu, X, Home, Building, Package, Tag, FileText, LogOut, User, Warehouse } from 'lucide-react';

// Import page components
import DashboardPage from './pages/DashboardPage';
import EmployeeDashboardPage from './pages/EmployeeDashboardPage';
import EnhancedEmployeeDashboardPage from './pages/EnhancedEmployeeDashboardPage';
import ReportsPage from './pages/ReportsPage';
import WarehousesPage from './pages/WarehousesPage';
import ItemsPage from './pages/ItemsPage';
import CategoriesPage from './pages/CategoriesPage';
import WarehouseDetailPage from './pages/WarehouseDetailPage';
import DataVerification from './components/DataVerification';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const { addNotification } = useNotification();

  // Check if user is already logged in
  useEffect(() => {
    console.log('App component mounted');
    
    // Check if user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsLoggedIn(true);
    }
  }, []); // Empty dependency array to run only once

  // Load warehouses data
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const data = await getAllWarehousesService();
        setWarehouses(data);
      } catch (error) {
        console.error('Error loading warehouses:', error);
        if (error.message && error.message.includes('401')) {
          addNotification({
            message: 'يرجى تسجيل الدخول مرة أخرى',
            type: 'error'
          });
          handleLogout();
        } else {
          addNotification({
            message: 'حدث خطأ أثناء تحميل بيانات المخازن',
            type: 'error'
          });
        }
      }
    };

    if (isLoggedIn) {
      loadWarehouses();
    }
  }, [isLoggedIn]);

  const handleLogin = async (nationalId, password) => {
    try {
      const authenticatedUser = await authenticateUserService(nationalId, password);
      if (authenticatedUser && !authenticatedUser.error) {
        setUser(authenticatedUser);
        setIsLoggedIn(true);
        
        addNotification({
          message: `مرحباً ${authenticatedUser.name}! لقد تم تسجيل الدخول بنجاح.`,
          type: 'success'
        });
        return true;
      } else {
        addNotification({
          message: 'رقم الهوية الوطنية أو كلمة المرور غير صحيحة',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      addNotification({
        message: error.message || 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.',
        type: 'error'
      });
    }
    return false;
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setIsLoggedIn(false);
    
    addNotification({
      message: 'لقد تم تسجيل الخروج بنجاح.',
      type: 'info'
    });
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Pass user to Header for role-based navigation */}
      <Header user={user} onLogout={handleLogout} />
      <main className="w-full px-4 py-8">
        {user.role === 'admin' ? (
          // Use proper Routes for admin navigation
          <Routes>
            <Route path="/" element={<DashboardPage user={user} />} />
            <Route path="/dashboard" element={<DashboardPage user={user} />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/warehouses/:id" element={<WarehouseDetailPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/verify-data" element={<DataVerification />} />
            {/* Redirect any other paths to admin dashboard */}
            <Route path="*" element={<DashboardPage user={user} />} />
          </Routes>
        ) : (
          // Use proper Routes for employee navigation
          <Routes>
            <Route path="/" element={<EnhancedEmployeeDashboardPage user={user} />} />
            <Route path="/dashboard" element={<EnhancedEmployeeDashboardPage user={user} />} />
            <Route path="/reports" element={<ReportsPage />} />
            {/* Employee can only access their specific warehouse */}
            {user.warehouse_id && (
              <Route path="/warehouse" element={<Navigate to={`/warehouses/${user.warehouse_id}`} replace />} />
            )}
            {/* Redirect any other paths to employee dashboard */}
            <Route path="*" element={<EnhancedEmployeeDashboardPage user={user} />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { addNotification } = useNotification();

  // Automatically set password to last 6 digits of national ID
  useEffect(() => {
    if (nationalId.length >= 6) {
      setPassword(nationalId.slice(-6));
    } else {
      setPassword('');
    }
  }, [nationalId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (await onLogin(nationalId, password)) {
      setError('');
      addNotification({
        message: 'تم تسجيل الدخول بنجاح! جاري التحويل إلى لوحة التحكم...',
        type: 'success'
      });
    } else {
      setError('رقم الهوية الوطنية أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">نظام إدارة مخازن المدرسة</h1>
          <p className="text-gray-600">تسجيل الدخول</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-1">
              رقم الهوية الوطنية
            </label>
            <input
              type="text"
              id="nationalId"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="أدخل رقم الهوية الوطنية"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور
            </label>
            <input
              type="text"  // Changed to text to show the digits
              id="password"
              value={password}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 transition"
              placeholder="تُعبأ تلقائياً بأخر 6 أرقام من الهوية"
            />
            <p className="mt-1 text-xs text-gray-500">تُعبأ تلقائياً بأخر 6 أرقام من رقم الهوية الوطنية</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02]"
          >
            تسجيل الدخول
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>أدخل رقم الهوية الوطنية فقط، سيتم تعبئة كلمة المرور تلقائياً بأخر 6 أرقام</p>
        </div>
      </div>
    </div>
  );
}

function Header({ user, onLogout }) {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    onLogout();
    addNotification({
      message: 'لقد تم تسجيل الخروج بنجاح.',
      type: 'info'
    });
    navigate('/'); // Navigate to home after logout
  };

  // Admin navigation items
  const adminNavItems = [
    { name: 'لوحة التحكم', path: '/dashboard', icon: <Home className="h-4 w-4" /> },
    { name: 'المخازن', path: '/warehouses', icon: <Building className="h-4 w-4" /> },
    { name: 'العناصر', path: '/items', icon: <Package className="h-4 w-4" /> },
    { name: 'الفئات', path: '/categories', icon: <Tag className="h-4 w-4" /> },
    { name: 'التقارير', path: '/reports', icon: <FileText className="h-4 w-4" /> },
    { name: 'التحقق من البيانات', path: '/verify-data', icon: <FileText className="h-4 w-4" /> },
  ];

  // Employee navigation items
  const employeeNavItems = [
    { name: 'لوحة التحكم', path: '/dashboard', icon: <Home className="h-4 w-4" /> },
    { name: 'مخزني', path: '/warehouse', icon: <Warehouse className="h-4 w-4" /> },
  ];

  const navItems = user.role === 'admin' ? adminNavItems : employeeNavItems;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">نظام إدارة مخازن المدرسة</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink 
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive 
                      ? "bg-blue-100 text-blue-700" 
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`
                }
              >
                {item.icon}
                <span className="mr-2">{item.name}</span>
              </NavLink>
            ))}
          </nav>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user.role === 'admin' ? 'مدير النظام' : 'موظف المخزن'}
              </p>
              <p className="text-xs text-gray-500">{user.name}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition duration-300 flex items-center"
            >
              <LogOut className="h-4 w-4" />
              <span className="mr-1 hidden sm:inline">تسجيل الخروج</span>
            </button>
            
            {/* Mobile menu button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden bg-gray-100 p-2 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <NavLink 
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => 
                    `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition ${
                      isActive 
                        ? "bg-blue-100 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  {item.icon}
                  <span className="mr-3">{item.name}</span>
                </NavLink>
              ))}
              
              <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg mt-2">
                <User className="h-5 w-5 text-gray-500" />
                <div className="mr-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user.role === 'admin' ? 'مدير النظام' : 'موظف المخزن'}
                  </p>
                  <p className="text-xs text-gray-500">{user.name}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Old AdminDashboard component removed to avoid conflicts with new components

function EmployeeDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('issue');
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    const loadWarehouse = async () => {
      try {
        if (user.warehouse_id) {
          const warehouseData = await getWarehouseByIdService(user.warehouse_id);
          setWarehouse(warehouseData);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading warehouse:', error);
        addNotification({
          message: 'حدث خطأ أثناء تحميل بيانات المخزن',
          type: 'error'
        });
        setLoading(false);
      }
    };

    loadWarehouse();
  }, [user.warehouse_id]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">غير مخول بالوصول</h2>
          <p className="text-gray-600">ليس لديك مخزن مخصص. يرجى الاتصال بالمسؤول.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">لوحة تحكم الموظف</h2>
      <p className="text-gray-600 mb-6">المخزن: {warehouse.name}</p>
      
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
            activeTab === 'issue' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('issue')}
        >
          صرف عناصر
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
            activeTab === 'return' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('return')}
        >
          إرجاع عناصر
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
            activeTab === 'exchange' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('exchange')}
        >
          تبديل عناصر
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'issue' && <IssueItemsForm addNotification={addNotification} user={user} warehouse={warehouse} />}
        {activeTab === 'return' && <ReturnItemsForm addNotification={addNotification} user={user} warehouse={warehouse} />}
        {activeTab === 'exchange' && <ExchangeItemsForm addNotification={addNotification} user={user} warehouse={warehouse} />}
      </div>
    </div>
  );
}

function IssueItemsForm({ addNotification, user, warehouse }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // Load items for the employee's warehouse
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const data = await getItemsByWarehouseService(warehouse.id);
        setItems(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading items:', error);
        addNotification({
          message: 'حدث خطأ أثناء تحميل بيانات العناصر',
          type: 'error'
        });
        setLoading(false);
      }
    };

    if (warehouse) {
      loadItems();
    }
  }, [warehouse]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedItem || !recipient) {
      addNotification({
        message: 'يرجى ملء جميع الحقول المطلوبة',
        type: 'error'
      });
      return;
    }
    
    try {
      // Create transaction record
      const transactionData = {
        item_id: selectedItem,
        user_id: user.id,
        transaction_type: 'issue',
        quantity: -quantity, // Negative for issuing
        recipient: recipient,
        notes: notes
      };
      
      await createTransactionService(transactionData);
      
      // Update item quantity
      await updateItemQuantityService(selectedItem, -quantity);
      
      addNotification({
        message: 'تم صرف العنصر بنجاح!',
        type: 'success'
      });
      
      // Reset form
      setQuantity(1);
      setRecipient('');
      setNotes('');
    } catch (error) {
      console.error('Error issuing item:', error);
      addNotification({
        message: 'حدث خطأ أثناء صرف العنصر',
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
        <div className="flex">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-700 text-sm">اختر العنصر الذي تريد صرفه، ثم قدم تفاصيل المستلم.</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
          <select 
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">اختر العنصر</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
            <input 
              type="number" 
              min="1" 
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المستلم</label>
            <input 
              type="text" 
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="اسم الطالب/الموظف" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات إضافية حول هذا الصرف"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300"
          >
            صرف العنصر
          </button>
        </div>
      </form>
    </div>
  );
}

function ReturnItemsForm({ addNotification, user, warehouse }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // Load items for the employee's warehouse
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const data = await getItemsByWarehouseService(warehouse.id);
        setItems(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading items:', error);
        addNotification({
          message: 'حدث خطأ أثناء تحميل بيانات العناصر',
          type: 'error'
        });
        setLoading(false);
      }
    };

    if (warehouse) {
      loadItems();
    }
  }, [warehouse]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedItem) {
      addNotification({
        message: 'يرجى اختيار العنصر المراد إرجاعه',
        type: 'error'
      });
      return;
    }
    
    try {
      // Create transaction record
      const transactionData = {
        item_id: selectedItem,
        user_id: user.id,
        transaction_type: 'return',
        quantity: quantity, // Positive for returning
        recipient: condition,
        notes: notes
      };
      
      await createTransactionService(transactionData);
      
      // Update item quantity
      await updateItemQuantityService(selectedItem, quantity);
      
      addNotification({
        message: 'تم إرجاع العنصر بنجاح!',
        type: 'success'
      });
      
      // Reset form
      setQuantity(1);
      setCondition('good');
      setNotes('');
    } catch (error) {
      console.error('Error returning item:', error);
      addNotification({
        message: 'حدث خطأ أثناء إرجاع العنصر',
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6">
        <div className="flex">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-700 text-sm">اختر العنصر الذي تريد إرجاعه، وحدد حالة العنصر.</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
          <select 
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">اختر العنصر</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الكمية
            </label>
            <input 
              type="number" 
              min="1" 
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              حالة العنصر
            </label>
            <select 
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="good">جيدة</option>
              <option value="damaged">تالفة</option>
              <option value="partial">جزئية</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات إضافية حول هذا الإرجاع"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button 
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300"
          >
            إرجاع العنصر
          </button>
        </div>
      </form>
    </div>
  );
}

function ExchangeItemsForm({ addNotification, user, warehouse }) {
  const [items, setItems] = useState([]);
  const [outgoingItem, setOutgoingItem] = useState('');
  const [incomingItem, setIncomingItem] = useState('');
  const [outgoingQuantity, setOutgoingQuantity] = useState(1);
  const [incomingQuantity, setIncomingQuantity] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // Load items for the employee's warehouse
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const data = await getItemsByWarehouseService(warehouse.id);
        setItems(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading items:', error);
        addNotification({
          message: 'حدث خطأ أثناء تحميل بيانات العناصر',
          type: 'error'
        });
        setLoading(false);
      }
    };

    if (warehouse) {
      loadItems();
    }
  }, [warehouse]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!outgoingItem || !incomingItem || !recipient) {
      addNotification({
        message: 'يرجى ملء جميع الحقول المطلوبة',
        type: 'error'
      });
      return;
    }
    
    try {
      // Create outgoing transaction record
      const outgoingTransactionData = {
        item_id: outgoingItem,
        user_id: user.id,
        transaction_type: 'exchange_out',
        quantity: -outgoingQuantity, // Negative for outgoing
        recipient: recipient,
        notes: notes ? `تبديل: ${notes}` : 'تبديل عنصر'
      };
      
      await createTransactionService(outgoingTransactionData);
      
      // Update outgoing item quantity
      await updateItemQuantityService(outgoingItem, -outgoingQuantity);
      
      // Create incoming transaction record
      const incomingTransactionData = {
        item_id: incomingItem,
        user_id: user.id,
        transaction_type: 'exchange_in',
        quantity: incomingQuantity, // Positive for incoming
        recipient: recipient,
        notes: notes ? `تبديل: ${notes}` : 'تبديل عنصر'
      };
      
      await createTransactionService(incomingTransactionData);
      
      // Update incoming item quantity
      await updateItemQuantityService(incomingItem, incomingQuantity);
      
      addNotification({
        message: 'تم تبديل العناصر بنجاح!',
        type: 'success'
      });
      
      // Reset form
      setOutgoingQuantity(1);
      setIncomingQuantity(1);
      setRecipient('');
      setNotes('');
    } catch (error) {
      console.error('Error exchanging items:', error);
      addNotification({
        message: 'حدث خطأ أثناء تبديل العناصر',
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6">
        <div className="flex">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <p className="text-purple-700 text-sm">حدد العنصر الصادر والوارد، وكمياتهما، وتفاصيل المستلم.</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">العنصر الصادر</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
                <select 
                  value={outgoingItem}
                  onChange={(e) => setOutgoingItem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر العنصر</option>
                  {items.map((item) => (
                    <option key={`out-${item.id}`} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                <input 
                  type="number" 
                  min="1" 
                  value={outgoingQuantity}
                  onChange={(e) => setOutgoingQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">العنصر الوارد</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنصر</label>
                <select 
                  value={incomingItem}
                  onChange={(e) => setIncomingItem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر العنصر</option>
                  {items.map((item) => (
                    <option key={`in-${item.id}`} value={item.id}>{item.name} (المتوفر: {item.quantity})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                <input 
                  type="number" 
                  min="1" 
                  value={incomingQuantity}
                  onChange={(e) => setIncomingQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المستلم</label>
            <input 
              type="text" 
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="اسم الطالب/الموظف" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات إضافية حول هذا التبديل"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button 
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300"
          >
            تبديل العناصر
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;