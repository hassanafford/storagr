-- Enable Row Level Security (RLS) on all tables
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_audits ENABLE ROW LEVEL SECURITY;

------------------------------------------------------
-- Warehouses Policies
------------------------------------------------------

-- Admins can access all warehouses
CREATE POLICY "Admins can access all warehouses"
ON warehouses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Employees can only access their assigned warehouse
CREATE POLICY "Employees can access only their warehouse"
ON warehouses
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.warehouse_id = warehouses.id
  )
);

------------------------------------------------------
-- Categories Policies
------------------------------------------------------

-- Admins can access all categories
CREATE POLICY "Admins can access all categories"
ON categories
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Employees can access categories only in their warehouse
CREATE POLICY "Employees can access only their warehouse categories"
ON categories
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.warehouse_id = categories.warehouse_id
  )
);

------------------------------------------------------
-- Items Policies
------------------------------------------------------

-- Admins can access all items
CREATE POLICY "Admins can access all items"
ON items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Employees can access items only in their warehouse
CREATE POLICY "Employees can access only their warehouse items"
ON items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.warehouse_id = items.warehouse_id
  )
);

------------------------------------------------------
-- Users Policies
------------------------------------------------------

-- Admins can access all users
CREATE POLICY "Admins can access all users"
ON users
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Normal users can only see their own profile
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT TO authenticated
USING (id = auth.uid());

------------------------------------------------------
-- Transactions Policies
------------------------------------------------------

-- Admins can access all transactions
CREATE POLICY "Admins can access all transactions"
ON transactions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Employees can access transactions only in their warehouse
CREATE POLICY "Employees can access only their warehouse transactions"
ON transactions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    JOIN items ON items.id = transactions.item_id
    WHERE users.id = auth.uid() 
    AND users.warehouse_id = items.warehouse_id
  )
);

------------------------------------------------------
-- Daily Audits Policies
------------------------------------------------------

-- Admins can access all audits
CREATE POLICY "Admins can access all audits"
ON daily_audits
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Employees can access audits only in their warehouse
CREATE POLICY "Employees can access only their warehouse audits"
ON daily_audits
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.warehouse_id = daily_audits.warehouse_id
  )
);