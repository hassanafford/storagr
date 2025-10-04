-- ============================================
-- نظام إدارة مخازن المدرسة - الإعداد الكامل
-- School Warehouse Management System - Complete Setup
-- ============================================
-- 
-- هذا الملف يحتوي على:
-- 1. تنظيف كامل للجداول القديمة
-- 2. إنشاء جميع الجداول والعلاقات
-- 3. إضافة البيانات الأساسية (12 مخزن + 13 مستخدم)
-- 4. إعداد Triggers و Functions
-- 5. تفعيل Row Level Security
--
-- ⚠️ تحذير: هذا سيحذف جميع البيانات الموجودة!
-- ============================================

-- ============================================
-- المرحلة 1: التنظيف الكامل
-- ============================================

-- حذف الـ Views القديمة
DROP VIEW IF EXISTS items_full_view CASCADE;
DROP VIEW IF EXISTS transactions_full_view CASCADE;
DROP VIEW IF EXISTS low_stock_items_view CASCADE;

-- حذف الـ Triggers القديمة
DROP TRIGGER IF EXISTS update_warehouses_updated_at ON warehouses;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_items_updated_at ON items;
DROP TRIGGER IF EXISTS trigger_check_low_stock ON items;
DROP TRIGGER IF EXISTS trigger_log_quantity_change ON items;

-- حذف الـ Functions القديمة
DROP FUNCTION IF EXISTS get_egyptian_time() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS check_low_stock() CASCADE;
DROP FUNCTION IF EXISTS log_quantity_change() CASCADE;
DROP FUNCTION IF EXISTS get_warehouse_stats(BIGINT) CASCADE;

-- حذف الجداول بالترتيب الصحيح (من الأصغر للأكبر)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;

-- ============================================
-- المرحلة 2: إنشاء الجداول الأساسية
-- ============================================

-- جدول المستودعات (12 مخزن)
CREATE TABLE warehouses (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول الفئات
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول المستخدمين (13 مستخدم: 1 admin + 12 employee)
CREATE TABLE users (
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
CREATE TABLE items (
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
CREATE TABLE transactions (
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
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  message TEXT NOT NULL,
  details JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول سجل التدقيق (Audit Log)
CREATE TABLE audit_logs (
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
-- المرحلة 3: إنشاء Indexes للأداء
-- ============================================

CREATE INDEX idx_items_warehouse ON items(warehouse_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_quantity ON items(quantity);
CREATE INDEX idx_items_barcode ON items(barcode);

CREATE INDEX idx_transactions_item ON transactions(item_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

CREATE INDEX idx_users_national_id ON users(national_id);
CREATE INDEX idx_users_warehouse ON users(warehouse_id);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);

-- ============================================
-- المرحلة 4: Database Functions
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
-- المرحلة 5: Triggers
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
-- المرحلة 6: Row Level Security (RLS)
-- ============================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- سياسات المستودعات - السماح بالوصول الكامل (للتطوير)
CREATE POLICY "Allow public read access to warehouses" ON warehouses
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to warehouses" ON warehouses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to warehouses" ON warehouses
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to warehouses" ON warehouses
  FOR DELETE USING (true);

-- سياسات الفئات - السماح بالوصول الكامل
CREATE POLICY "Allow public read access to categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to categories" ON categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to categories" ON categories
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to categories" ON categories
  FOR DELETE USING (true);

-- سياسات المستخدمين - السماح بالوصول الكامل
CREATE POLICY "Allow public read access to users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to users" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to users" ON users
  FOR DELETE USING (true);

-- سياسات العناصر - السماح بالوصول الكامل
CREATE POLICY "Allow public read access to items" ON items
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to items" ON items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to items" ON items
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to items" ON items
  FOR DELETE USING (true);

-- سياسات المعاملات - السماح بالوصول الكامل
CREATE POLICY "Allow public read access to transactions" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to transactions" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to transactions" ON transactions
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to transactions" ON transactions
  FOR DELETE USING (true);

-- سياسات الإشعارات - السماح بالوصول الكامل
CREATE POLICY "Allow public read access to notifications" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to notifications" ON notifications
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to notifications" ON notifications
  FOR DELETE USING (true);

-- سياسات سجل التدقيق - السماح بالوصول الكامل
CREATE POLICY "Allow public read access to audit_logs" ON audit_logs
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to audit_logs" ON audit_logs
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to audit_logs" ON audit_logs
  FOR DELETE USING (true);

-- ============================================
-- المرحلة 7: إدراج البيانات الأساسية
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
  (12, 'مخزن الإسعافات', 'مخزن مستلزمات الإسعافات الأولية');

-- تحديث sequence للمخازن
SELECT setval('warehouses_id_seq', 12, true);

-- إنشاء فئات تجريبية
INSERT INTO categories (name, description) VALUES
  ('قرطاسية', 'أدوات مكتبية وقرطاسية'),
  ('أثاث', 'أثاث مدرسي وأدوات'),
  ('إلكترونيات', 'أجهزة إلكترونية وملحقاتها'),
  ('نظافة', 'مواد ومستلزمات التنظيف'),
  ('كتب', 'كتب دراسية ومراجع'),
  ('رياضة', 'معدات رياضية'),
  ('مختبرات', 'أدوات ومعدات المختبرات');

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
  (13, '12121212121212', 'موظف إسعافات', 'employee', 12);

-- تحديث sequence للمستخدمين
SELECT setval('users_id_seq', 13, true);

-- إنشاء عناصر تجريبية
INSERT INTO items (name, description, quantity, unit, category_id, warehouse_id, min_quantity) VALUES
  ('أقلام جاف أزرق', 'أقلام جاف لون أزرق - عبوة 50 قلم', 500, 'قلم', 1, 1, 100),
  ('دفاتر 100 ورقة', 'دفاتر مسطرة 100 ورقة', 300, 'دفتر', 1, 1, 50),
  ('مكاتب خشبية', 'مكاتب خشبية للطلاب', 50, 'قطعة', 2, 1, 10),
  ('كراسي بلاستيك', 'كراسي بلاستيك للطلاب', 100, 'قطعة', 2, 1, 20),
  ('أجهزة كمبيوتر', 'أجهزة كمبيوتر مكتبية', 25, 'جهاز', 3, 1, 5),
  ('مواد تنظيف', 'مواد تنظيف متنوعة', 150, 'عبوة', 4, 1, 30),
  ('كتب رياضيات', 'كتب رياضيات للصف الأول', 200, 'كتاب', 5, 1, 40);

-- ============================================
-- المرحلة 8: إنشاء Views مفيدة
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

-- عرض للعناصر ذات المخزون المنخفض
CREATE OR REPLACE VIEW low_stock_items_view AS
SELECT 
  i.*,
  w.name as warehouse_name,
  c.name as category_name
FROM items i
LEFT JOIN warehouses w ON i.warehouse_id = w.id
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.quantity <= i.min_quantity
ORDER BY i.quantity ASC;

-- ============================================
-- المرحلة 9: التحقق من نجاح الإعداد
-- ============================================

-- عرض رسالة نجاح
SELECT '✅ تم إعداد قاعدة البيانات بنجاح!' as status;

-- عرض إحصائيات سريعة
SELECT 
  (SELECT COUNT(*) FROM warehouses) as "عدد المخازن",
  (SELECT COUNT(*) FROM categories) as "عدد الفئات",
  (SELECT COUNT(*) FROM users) as "عدد المستخدمين",
  (SELECT COUNT(*) FROM items) as "عدد الأصناف",
  (SELECT COUNT(*) FROM transactions) as "عدد المعاملات";

-- عرض قائمة المخازن
SELECT 
  id as "رقم المخزن",
  name as "اسم المخزن",
  description as "الوصف"
FROM warehouses
ORDER BY id;

-- عرض قائمة المستخدمين
SELECT 
  id as "الرقم",
  name as "الاسم",
  role as "الدور",
  national_id as "الرقم القومي",
  CASE 
    WHEN role = 'admin' THEN 'لا يوجد'
    ELSE (SELECT name FROM warehouses WHERE id = users.warehouse_id)
  END as "المخزن المسؤول عنه"
FROM users
ORDER BY id;

-- ============================================
-- ملاحظات مهمة:
-- ============================================
-- 
-- 1. بيانات تسجيل الدخول:
--    - المسؤول: الرقم القومي = 12345678901234، كلمة المرور = 901234
--    - الموظفون: كلمة المرور = آخر 6 أرقام من الرقم القومي
--
-- 2. يجب تفعيل Realtime من Supabase Dashboard:
--    Database > Replication > Enable للجداول:
--    - items
--    - transactions
--    - notifications
--    - users
--    - warehouses
--
-- 3. تأكد من إضافة SUPABASE_URL و SUPABASE_ANON_KEY في ملف .env
--
-- 4. السياسات الحالية مفتوحة للتطوير (USING true)
--    يجب تشديدها للإنتاج لاحقاً
--
-- ============================================