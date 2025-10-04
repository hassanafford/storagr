// Utility functions for mapping transaction types between application and database

// Map application transaction types to database transaction types
export const mapAppToDbTransactionType = (appType) => {
  const mapping = {
    'issue': 'out',
    'return': 'in',
    'exchange_out': 'out',
    'exchange_in': 'in',
    'audit_adjustment': 'audit',
    'daily_audit': 'audit'
  };
  
  // If the app type is already a valid DB type, return it as is
  const validDbTypes = ['in', 'out', 'audit', 'adjustment', 'transfer'];
  if (validDbTypes.includes(appType)) {
    return appType;
  }
  
  // Otherwise, use the mapping or return the original type
  return mapping[appType] || appType;
};

// Map database transaction types to application transaction types
export const mapDbToAppTransactionType = (dbType) => {
  // For display purposes, we might want to keep the original mapping
  // but for now, we'll just return the dbType as is since the UI functions
  // already handle the display mapping
  return dbType;
};

// Get transaction type label for display
export const getTransactionTypeLabel = (type) => {
  switch (type) {
    case 'issue': return 'صرف';
    case 'return': return 'إرجاع';
    case 'exchange_out': return 'صرف (تبديل)';
    case 'exchange_in': return 'استلام (تبديل)';
    case 'audit_adjustment': return 'تعديل جرد';
    case 'daily_audit': return 'جرد يومي';
    case 'in': return 'دخول';
    case 'out': return 'خروج';
    case 'audit': return 'جرد';
    case 'adjustment': return 'تعديل';
    case 'transfer': return 'نقل';
    default: return 'معاملة';
  }
};

// Get transaction type color for display
export const getTransactionTypeColor = (type) => {
  switch (type) {
    case 'issue': return 'text-red-600';
    case 'return': return 'text-green-600';
    case 'exchange_out': return 'text-purple-600';
    case 'exchange_in': return 'text-blue-600';
    case 'audit_adjustment': return 'text-yellow-600';
    case 'daily_audit': return 'text-indigo-600';
    case 'in': return 'text-green-600';
    case 'out': return 'text-red-600';
    case 'audit': return 'text-yellow-600';
    case 'adjustment': return 'text-blue-600';
    case 'transfer': return 'text-purple-600';
    default: return 'text-gray-600';
  }
};