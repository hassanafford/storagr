# Security Testing Guide for School Warehouse System

This guide provides instructions for testing the security measures implemented in the Supabase database for the School Warehouse System.

## 1. Row Level Security (RLS) Policies Testing

### 1.1 Warehouses Table Access Control

**Test Case 1: Admin Access**
- Log in as an admin user
- Attempt to access all warehouses
- Expected Result: Should be able to view all warehouses

**Test Case 2: Employee Access**
- Log in as an employee user
- Attempt to access their assigned warehouse
- Expected Result: Should only be able to view their assigned warehouse
- Attempt to access other warehouses
- Expected Result: Should be denied access

### 1.2 Categories Table Access Control

**Test Case 3: Admin Access**
- Log in as an admin user
- Attempt to access all categories
- Expected Result: Should be able to view all categories

**Test Case 4: Employee Access**
- Log in as an employee user
- Attempt to access categories in their assigned warehouse
- Expected Result: Should only be able to view categories in their assigned warehouse
- Attempt to access categories in other warehouses
- Expected Result: Should be denied access

### 1.3 Items Table Access Control

**Test Case 5: Admin Access**
- Log in as an admin user
- Attempt to access all items
- Expected Result: Should be able to view all items

**Test Case 6: Employee Access**
- Log in as an employee user
- Attempt to access items in their assigned warehouse
- Expected Result: Should only be able to view items in their assigned warehouse
- Attempt to access items in other warehouses
- Expected Result: Should be denied access

### 1.4 Users Table Access Control

**Test Case 7: Admin Access**
- Log in as an admin user
- Attempt to access all users
- Expected Result: Should be able to view all users

**Test Case 8: Employee Access**
- Log in as an employee user
- Attempt to view their own profile
- Expected Result: Should be able to view their own profile
- Attempt to view other users
- Expected Result: Should be denied access

### 1.5 Transactions Table Access Control

**Test Case 9: Admin Access**
- Log in as an admin user
- Attempt to access all transactions
- Expected Result: Should be able to view all transactions

**Test Case 10: Employee Access**
- Log in as an employee user
- Attempt to access transactions related to items in their assigned warehouse
- Expected Result: Should only be able to view transactions for items in their assigned warehouse
- Attempt to access transactions related to items in other warehouses
- Expected Result: Should be denied access

### 1.6 Daily Audits Table Access Control

**Test Case 11: Admin Access**
- Log in as an admin user
- Attempt to access all audits
- Expected Result: Should be able to view all audits

**Test Case 12: Employee Access**
- Log in as an employee user
- Attempt to access audits in their assigned warehouse
- Expected Result: Should only be able to view audits in their assigned warehouse
- Attempt to access audits in other warehouses
- Expected Result: Should be denied access

## 2. Custom API Functions Testing

### 2.1 get_warehouse_items Function

**Test Case 13: Authorized Access**
- Log in as an admin or employee with access to a warehouse
- Call the get_warehouse_items function with their warehouse ID
- Expected Result: Should return items for that warehouse

**Test Case 14: Unauthorized Access**
- Log in as an employee
- Call the get_warehouse_items function with a different warehouse ID
- Expected Result: Should raise an "Access denied" exception

### 2.2 get_warehouse_transactions Function

**Test Case 15: Authorized Access**
- Log in as an admin or employee with access to a warehouse
- Call the get_warehouse_transactions function with their warehouse ID
- Expected Result: Should return transactions for that warehouse

**Test Case 16: Unauthorized Access**
- Log in as an employee
- Call the get_warehouse_transactions function with a different warehouse ID
- Expected Result: Should raise an "Access denied" exception

### 2.3 get_warehouse_stats Function

**Test Case 17: Authorized Access**
- Log in as an admin or employee with access to a warehouse
- Call the get_warehouse_stats function with their warehouse ID
- Expected Result: Should return statistics for that warehouse

**Test Case 18: Unauthorized Access**
- Log in as an employee
- Call the get_warehouse_stats function with a different warehouse ID
- Expected Result: Should raise an "Access denied" exception

## 3. Application-Level Security Testing

### 3.1 Service Role Key Usage

**Test Case 19: Direct Database Access**
- Attempt to access database tables directly using the service role key bypassing RLS
- Expected Result: Should still be restricted by RLS policies when using authenticated connections

### 3.2 Authentication and Authorization

**Test Case 20: Unauthenticated Access**
- Attempt to access API endpoints without authentication
- Expected Result: Should be denied access with 401 Unauthorized error

**Test Case 21: Insufficient Privileges**
- Log in as an employee user
- Attempt to access admin-only endpoints
- Expected Result: Should be denied access with 403 Forbidden error

## 4. Security Recommendations

### 4.1 API Key Management
1. Rotate API keys regularly
2. Use different keys for different environments (development, staging, production)
3. Restrict key permissions to only what is necessary

### 4.2 Monitoring and Logging
1. Enable Supabase database logs
2. Monitor for unauthorized access attempts
3. Set up alerts for suspicious activities

### 4.3 Regular Security Audits
1. Review RLS policies periodically
2. Test access controls with different user roles
3. Update security measures as needed

## 5. Testing Tools

### 5.1 Supabase SQL Editor
Use the Supabase SQL Editor to test RLS policies directly:
```sql
-- Test as authenticated user
SELECT * FROM warehouses;
SELECT * FROM items;
SELECT * FROM transactions;
```

### 5.2 Postman or curl
Use API testing tools to test endpoints:
```bash
# Test with authentication header
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     https://your-project.supabase.co/rest/v1/warehouses
```

### 5.3 Supabase Dashboard
Use the Supabase Dashboard to monitor:
- Database queries
- Authentication logs
- API usage
- Security events

## 6. Troubleshooting

### 6.1 Common Issues
1. **RLS policies not working**: Check that RLS is enabled on all tables
2. **Access denied errors**: Verify user roles and warehouse assignments
3. **Function errors**: Check function definitions and permissions

### 6.2 Debugging Steps
1. Check Supabase logs for error messages
2. Test queries directly in the SQL editor
3. Verify user authentication and role assignments
4. Review RLS policy definitions

This testing guide ensures that all security measures are properly implemented and functioning as expected.