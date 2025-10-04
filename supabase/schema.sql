-- ============================================
-- School Warehouse Management System
-- Supabase Database Schema
-- ============================================

-- تنظيف الجداول القديمة (اختياري - احذر من فقدان البيانات!)
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS transactions CASCADE;
-- DROP TABLE IF EXISTS items CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS warehouses CASCADE;

-- ============================================
-- 1. إنشاء الجداول الأساسية
-- ============================================

-- جدول المستودعات
CREATE TABLE IF NOT EXISTS warehouses (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول الفئات
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  national_id VARCHAR(14) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'employee')),
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول العناصر
CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit VARCHAR(50) DEFAULT 'قطعة',
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE CASCADE,
  min_quantity INTEGER DEFAULT 10,
  max_quantity INTEGER,
  barcode VARCHAR(100),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_item_per_warehouse UNIQUE (name, warehouse_id)
);

-- جدول المعاملات
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT REFERENCES items(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('in', 'out', 'audit', 'adjustment', 'transfer')),
  quantity INTEGER NOT NULL,
  quantity_before INTEGER,
  quantity_after INTEGER,
  recipient VARCHAR(255),
  notes TEXT,
  expected_quantity INTEGER,
  actual_quantity INTEGER,
  discrepancy INTEGER,
  egyptian_timestamp VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  message TEXT NOT NULL,
  details JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول سجل التدقيق (Audit Log)
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id BIGINT,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. إنشاء Indexes للأداء
-- ============================================

CREATE INDEX IF NOT EXISTS idx_items_warehouse ON items(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_quantity ON items(quantity);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);

CREATE INDEX IF NOT EXISTS idx_transactions_item ON transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_national_id ON users(national_id);
CREATE INDEX IF NOT EXISTS idx_users_warehouse ON users(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name, record_id);

-- ============================================
-- 3. Database Functions
-- ============================================

-- دالة للحصول على الوقت المصري (UTC+2)
CREATE OR REPLACE FUNCTION get_egyptian_time()
RETURNS TEXT AS $$
BEGIN
  RETURN TO_CHAR(NOW() AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD HH24:MI:SS');
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة لفحص الكمية المنخفضة وإرسال إشعار
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- فحص إذا كانت الكمية أقل من أو تساوي الحد الأدنى
  IF NEW.quantity <= NEW.min_quantity AND (OLD.quantity IS NULL OR OLD.quantity > NEW.min_quantity) THEN
    -- إنشاء إشعار لجميع المديرين
    INSERT INTO notifications (user_id, type, message, details)
    SELECT 
      u.id,
      'warning',
      'تحذير: كمية منخفضة للعنصر "' || NEW.name || '"',
      jsonb_build_object(
        'item_id', NEW.id,
        'item_name', NEW.name,
        'current_quantity', NEW.quantity,
        'min_quantity', NEW.min_quantity,
        'warehouse_id', NEW.warehouse_id
      )
    FROM users u
    WHERE u.role = 'admin' AND u.is_active = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة لتسجيل المعاملات تلقائياً عند تغيير الكمية
CREATE OR REPLACE FUNCTION log_quantity_change()
RETURNS TRIGGER AS $$
DECLARE
  quantity_diff INTEGER;
  trans_type VARCHAR(50);
BEGIN
  -- حساب الفرق في الكمية
  quantity_diff := NEW.quantity - OLD.quantity;
  
  -- تحديد نوع المعاملة
  IF quantity_diff > 0 THEN
    trans_type := 'in';
  ELSIF quantity_diff < 0 THEN
    trans_type := 'out';
  ELSE
    RETURN NEW; -- لا تغيير في الكمية
  END IF;
  
  -- تسجيل المعاملة (فقط إذا لم يتم تسجيلها يدوياً)
  -- يمكن تعطيل هذا إذا كنت تسجل المعاملات يدوياً
  -- INSERT INTO transactions (
  --   item_id,
  --   transaction_type,
  --   quantity,
  --   quantity_before,
  --   quantity_after,
  --   notes,
  --   egyptian_timestamp
  -- ) VALUES (
  --   NEW.id,
  --   trans_type,
  --   ABS(quantity_diff),
  --   OLD.quantity,
  --   NEW.quantity,
  --   'تحديث تلقائي',
  --   get_egyptian_time()
  -- );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة لحساب إحصائيات المستودع
CREATE OR REPLACE FUNCTION get_warehouse_stats(warehouse_id_param BIGINT)
RETURNS TABLE(
  total_items BIGINT,
  total_quantity BIGINT,
  low_stock_items BIGINT,
  categories_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_items,
    COALESCE(SUM(quantity), 0)::BIGINT as total_quantity,
    COUNT(CASE WHEN quantity <= min_quantity THEN 1 END)::BIGINT as low_stock_items,
    COUNT(DISTINCT category_id)::BIGINT as categories_count
  FROM items
  WHERE items.warehouse_id = warehouse_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Triggers
-- ============================================

-- Trigger لتحديث updated_at على الجداول
CREATE TRIGGER update_warehouses_updated_at
BEFORE UPDATE ON warehouses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger لفحص الكمية المنخفضة
CREATE TRIGGER trigger_check_low_stock
AFTER INSERT OR UPDATE OF quantity ON items
FOR EACH ROW
EXECUTE FUNCTION check_low_stock();

-- ============================================
-- 5. Row Level Security (RLS)
-- ============================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Allow read access to warehouses" ON warehouses;
DROP POLICY IF EXISTS "Allow admin full access to warehouses" ON warehouses;
DROP POLICY IF EXISTS "Allow read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow admin to manage categories" ON categories;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Admin can manage users" ON users;
DROP POLICY IF EXISTS "Users can read items from their warehouse" ON items;
DROP POLICY IF EXISTS "Employees can update items in their warehouse" ON items;
DROP POLICY IF EXISTS "Admin can manage all items" ON items;
DROP POLICY IF EXISTS "Users can read transactions from their warehouse" ON transactions;
DROP POLICY IF EXISTS "Employees can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can read their notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- سياسات المستودعات
CREATE POLICY "Allow read access to warehouses" ON warehouses
  FOR SELECT USING (true); -- الجميع يمكنهم القراءة

CREATE POLICY "Allow admin full access to warehouses" ON warehouses
  FOR ALL USING (true); -- مؤقتاً للتطوير - سيتم تحديثه لاحقاً

-- سياسات الفئات
CREATE POLICY "Allow read access to categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage categories" ON categories
  FOR ALL USING (true);

-- سياسات المستخدمين
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage users" ON users
  FOR ALL USING (true);

-- سياسات العناصر
CREATE POLICY "Users can read items from their warehouse" ON items
  FOR SELECT USING (true);

CREATE POLICY "Employees can update items in their warehouse" ON items
  FOR UPDATE USING (true);

CREATE POLICY "Admin can manage all items" ON items
  FOR ALL USING (true);

-- سياسات المعاملات
CREATE POLICY "Users can read transactions from their warehouse" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Employees can create transactions" ON transactions
  FOR INSERT WITH CHECK (true);

-- سياسات الإشعارات
CREATE POLICY "Users can read their notifications" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- سياسات سجل التدقيق
CREATE POLICY "Admin can read audit logs" ON audit_logs
  FOR SELECT USING (true);

CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 6. بيانات تجريبية (Demo Data)
-- ============================================

-- إنشاء المخازن (12 مخزن)
INSERT INTO warehouses (id, name, description) VALUES
  (1, 'المخزن الرئيسي', 'المخزن الرئيسي للمدرسة'),
  (2, 'مخزن المختبر', 'مخزن معدات المختبر'),
  (3, 'مخزن المكتبة', 'مخزن كتب المكتبة'),
  (4, 'مخزن الملابس', 'مخزن ملابس الطلاب'),
  (5, 'مخزن الأثاث', 'مخزن أثاث المدرسة'),
  (6, 'مخزن الإلكترونيات', 'مخزن الأجهزة الإلكترونية'),
  (7, 'مخزن الأدوات', 'مخزن الأدوات المدرسية'),
  (8, 'مخزن المواد الغذائية', 'مخزن المواد الغذائية للمقهى'),
  (9, 'مخزن التنظيف', 'مخزن مواد التنظيف'),
  (10, 'مخزن الرياضة', 'مخزن معدات الرياضة'),
  (11, 'مخزن الفنون', 'مخزن مستلزمات الفنون'),
  (12, 'مخزن الإسعافات', 'مخزن مستلزمات الإسعافات الأولية')
ON CONFLICT DO NOTHING;

-- إنشاء فئات تجريبية
INSERT INTO categories (name, description) VALUES
  ('قرطاسية', 'أدوات مكتبية وقرطاسية'),
  ('أثاث', 'أثاث مدرسي وأدوات'),
  ('إلكترونيات', 'أجهزة إلكترونية وملحقاتها'),
  ('نظافة', 'مواد ومستلزمات التنظيف'),
  ('كتب', 'كتب دراسية ومراجع'),
  ('رياضة', 'معدات رياضية'),
  ('مختبرات', 'أدوات ومعدات المختبرات')
ON CONFLICT (name) DO NOTHING;

-- إنشاء المستخدمين (1 admin + 12 employee)
-- كلمة المرور = آخر 6 أرقام من الرقم القومي
INSERT INTO users (id, national_id, name, role, warehouse_id) VALUES
  (1, '12345678901234', 'مدير النظام', 'admin', NULL),
  (2, '11111111111111', 'موظف المخزن الرئيسي', 'employee', 1),
  (3, '22222222222222', 'موظف مختبر', 'employee', 2),
  (4, '33333333333333', 'موظف مكتبة', 'employee', 3),
  (5, '44444444444444', 'موظف ملابس', 'employee', 4),
  (6, '55555555555555', 'موظف أثاث', 'employee', 5),
  (7, '66666666666666', 'موظف إلكترونيات', 'employee', 6),
  (8, '77777777777777', 'موظف أدوات', 'employee', 7),
  (9, '88888888888888', 'موظف مواد غذائية', 'employee', 8),
  (10, '99999999999999', 'موظف تنظيف', 'employee', 9),
  (11, '10101010101010', 'موظف رياضة', 'employee', 10),
  (12, '11111111111112', 'موظف فنون', 'employee', 11),
  (13, '12121212121212', 'موظف إسعافات', 'employee', 12)
ON CONFLICT (national_id) DO NOTHING;

-- إنشاء عناصر تجريبية
INSERT INTO items (name, description, quantity, unit, category_id, warehouse_id, min_quantity) VALUES
  ('أقلام جاف أزرق', 'أقلام جاف لون أزرق - عبوة 50 قلم', 500, 'قلم', 1, 1, 100),
  ('دفاتر 100 ورقة', 'دفاتر مسطرة 100 ورقة', 300, 'دفتر', 1, 1, 50),
  ('مكاتب خشبية', 'مكاتب خشبية للطلاب', 50, 'قطعة', 2, 1, 10),
  ('كراسي بلاستيك', 'كراسي بلاستيك للطلاب', 100, 'قطعة', 2, 1, 20),
  ('أجهزة كمبيوتر', 'أجهزة كمبيوتر مكتبية', 25, 'جهاز', 3, 1, 5),
  ('مواد تنظيف', 'مواد تنظيف متنوعة', 150, 'عبوة', 4, 1, 30),
  ('كتب رياضيات', 'كتب رياضيات للصف الأول', 200, 'كتاب', 5, 1, 40)
ON CONFLICT (name, warehouse_id) DO NOTHING;

-- ============================================
-- 7. Views مفيدة
-- ============================================

-- عرض للعناصر مع معلومات كاملة
CREATE OR REPLACE VIEW items_full_view AS
SELECT 
  i.id,
  i.name,
  i.description,
  i.quantity,
  i.unit,
  i.min_quantity,
  i.max_quantity,
  i.barcode,
  c.name as category_name,
  c.id as category_id,
  w.name as warehouse_name,
  w.id as warehouse_id,
  w.location as warehouse_location,
  CASE 
    WHEN i.quantity <= i.min_quantity THEN 'low'
    WHEN i.max_quantity IS NOT NULL AND i.quantity >= i.max_quantity THEN 'high'
    ELSE 'normal'
  END as stock_status,
  i.created_at,
  i.updated_at
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN warehouses w ON i.warehouse_id = w.id;

-- عرض للمعاملات مع معلومات كاملة
CREATE OR REPLACE VIEW transactions_full_view AS
SELECT 
  t.id,
  t.transaction_type,
  t.quantity,
  t.quantity_before,
  t.quantity_after,
  t.recipient,
  t.notes,
  t.discrepancy,
  t.egyptian_timestamp,
  i.name as item_name,
  i.id as item_id,
  u.name as user_name,
  u.id as user_id,
  w.name as warehouse_name,
  w.id as warehouse_id,
  t.created_at
FROM transactions t
LEFT JOIN items i ON t.item_id = i.id
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN warehouses w ON i.warehouse_id = w.id;

-- ============================================
-- 8. تفعيل Realtime
-- ============================================

-- ملاحظة: يجب تفعيل Realtime من Supabase Dashboard
-- Database > Replication > Enable للجداول التالية:
-- - items
-- - transactions
-- - notifications
-- - users

-- ============================================
-- انتهى إعداد قاعدة البيانات
-- ============================================

-- للتحقق من نجاح الإعداد:
SELECT 'Database setup completed successfully!' as status;

-- عرض إحصائيات سريعة:
SELECT 
  (SELECT COUNT(*) FROM warehouses) as warehouses_count,
  (SELECT COUNT(*) FROM categories) as categories_count,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM items) as items_count,
  (SELECT COUNT(*) FROM transactions) as transactions_count;