# دليل إعداد Supabase للمشروع - التحويل الكامل إلى Serverless

## نظرة عامة
تم تحويل المشروع بالكامل من بنية تعتمد على خادم Express منفصل إلى بنية serverless كاملة باستخدام:
- **Supabase**: قاعدة البيانات، المصادقة، Realtime، Edge Functions
- **Vercel**: استضافة الواجهة الأمامية فقط

## الخطوة 1: إعداد قاعدة البيانات في Supabase

### 1.1 إنشاء الجداول

قم بتنفيذ SQL التالي في Supabase SQL Editor:

```sql
-- جدول المستودعات
CREATE TABLE IF NOT EXISTS warehouses (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول الفئات
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  national_id VARCHAR(14) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'employee')),
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول العناصر
CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(50),
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE CASCADE,
  min_quantity INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول المعاملات
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT REFERENCES items(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('in', 'out', 'audit', 'adjustment')),
  quantity INTEGER NOT NULL,
  recipient VARCHAR(255),
  notes TEXT,
  expected_quantity INTEGER,
  actual_quantity INTEGER,
  discrepancy INTEGER,
  egyptian_timestamp VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول الإشعارات (للتحديثات الفورية)
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء indexes للأداء
CREATE INDEX idx_items_warehouse ON items(warehouse_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_transactions_item ON transactions(item_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_users_national_id ON users(national_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
```

### 1.2 إعداد Row Level Security (RLS)

```sql
-- تفعيل RLS على جميع الجداول
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- سياسات للمستودعات (الجميع يمكنهم القراءة، الأدمن فقط يمكنهم التعديل)
CREATE POLICY "Allow read access to all authenticated users" ON warehouses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin full access" ON warehouses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::bigint 
      AND users.role = 'admin'
    )
  );

-- سياسات للفئات
CREATE POLICY "Allow read access to categories" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin to manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::bigint 
      AND users.role = 'admin'
    )
  );

-- سياسات للمستخدمين
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (
    id = auth.uid()::bigint OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::bigint 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::bigint 
      AND users.role = 'admin'
    )
  );

-- سياسات للعناصر
CREATE POLICY "Users can read items from their warehouse" ON items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::bigint 
      AND (users.role = 'admin' OR users.warehouse_id = items.warehouse_id)
    )
  );

CREATE POLICY "Employees can update items in their warehouse" ON items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::bigint 
      AND (users.role = 'admin' OR users.warehouse_id = items.warehouse_id)
    )
  );

CREATE POLICY "Admin can manage all items" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::bigint 
      AND users.role = 'admin'
    )
  );

-- سياسات للمعاملات
CREATE POLICY "Users can read transactions from their warehouse" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN items i ON i.id = transactions.item_id
      WHERE u.id = auth.uid()::bigint 
      AND (u.role = 'admin' OR u.warehouse_id = i.warehouse_id)
    )
  );

CREATE POLICY "Employees can create transactions" ON transactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::bigint AND
    EXISTS (
      SELECT 1 FROM users u
      JOIN items i ON i.id = transactions.item_id
      WHERE u.id = auth.uid()::bigint 
      AND (u.role = 'admin' OR u.warehouse_id = i.warehouse_id)
    )
  );

-- سياسات للإشعارات
CREATE POLICY "Users can read their notifications" ON notifications
  FOR SELECT USING (
    user_id = auth.uid()::bigint OR
    user_id IS NULL OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::bigint 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);
```

### 1.3 إنشاء Database Functions

```sql
-- دالة للحصول على الوقت المصري
CREATE OR REPLACE FUNCTION get_egyptian_time()
RETURNS TEXT AS $$
BEGIN
  RETURN TO_CHAR(NOW() AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD HH24:MI:SS');
END;
$$ LANGUAGE plpgsql;

-- دالة لإنشاء إشعار تلقائي عند انخفاض الكمية
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity <= NEW.min_quantity THEN
    INSERT INTO notifications (user_id, type, message, details)
    SELECT 
      u.id,
      'warning',
      'تحذير: كمية منخفضة للعنصر ' || NEW.name,
      jsonb_build_object(
        'item_id', NEW.id,
        'item_name', NEW.name,
        'current_quantity', NEW.quantity,
        'min_quantity', NEW.min_quantity
      )
    FROM users u
    WHERE u.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لفحص الكمية المنخفضة
CREATE TRIGGER trigger_check_low_stock
AFTER UPDATE OF quantity ON items
FOR EACH ROW
EXECUTE FUNCTION check_low_stock();

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## الخطوة 2: إعداد Supabase Realtime

### 2.1 تفعيل Realtime على الجداول

في Supabase Dashboard:
1. اذهب إلى **Database** → **Replication**
2. فعّل Realtime للجداول التالية:
   - `items` (للتحديثات الفورية للمخزون)
   - `transactions` (للمعاملات الجديدة)
   - `notifications` (للإشعارات الفورية)
   - `users` (لتحديثات المستخدمين)

### 2.2 إعداد Broadcast للإشعارات

الواجهة الأمامية تستخدم Supabase Realtime Broadcast للإشعارات الفورية (تم إعداده مسبقاً في `websocketService.js`).

## الخطوة 3: إنشاء مستخدم Admin أولي

```sql
-- إنشاء مستودع تجريبي
INSERT INTO warehouses (name, location) 
VALUES ('المستودع الرئيسي', 'القاهرة')
ON CONFLICT DO NOTHING;

-- إنشاء مستخدم admin (الرقم القومي: 12345678901234، كلمة المرور: 901234)
INSERT INTO users (national_id, name, role, warehouse_id)
VALUES ('12345678901234', 'المدير العام', 'admin', 1)
ON CONFLICT (national_id) DO NOTHING;

-- إنشاء فئات تجريبية
INSERT INTO categories (name, description) VALUES
  ('قرطاسية', 'أدوات مكتبية وقرطاسية'),
  ('أثاث', 'أثاث مدرسي'),
  ('إلكترونيات', 'أجهزة إلكترونية'),
  ('نظافة', 'مواد تنظيف')
ON CONFLICT (name) DO NOTHING;
```

## الخطوة 4: الحصول على مفاتيح Supabase

1. اذهب إلى **Settings** → **API**
2. انسخ:
   - **Project URL**: `https://xuwoixfgusvufgaliswt.supabase.co`
   - **anon/public key**: للواجهة الأمامية
   - **service_role key**: للـ Edge Functions (احتفظ به سرياً!)

## الخطوة 5: تحديث متغيرات البيئة

### للواجهة الأمامية (.env):
```env
VITE_SUPABASE_URL=https://xuwoixfgusvufgaliswt.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## الخطوة 6: نشر المشروع

### 6.1 نشر الواجهة على Vercel

```bash
cd school-warehouse-system
npm run build
vercel --prod
```

### 6.2 ربط Vercel مع GitHub (اختياري)

1. اذهب إلى Vercel Dashboard
2. Import مشروعك من GitHub
3. اضبط Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## الخطوة 7: اختبار النظام

### 7.1 تسجيل الدخول
- الرقم القومي: `12345678901234`
- كلمة المرور: `901234` (آخر 6 أرقام من الرقم القومي)

### 7.2 اختبار الـ Realtime
1. افتح المشروع في نافذتين مختلفتين
2. قم بتحديث كمية عنصر في نافذة
3. يجب أن ترى التحديث فوراً في النافذة الأخرى

## ملاحظات مهمة

### الأمان
- ✅ تم تفعيل RLS على جميع الجداول
- ✅ المصادقة تتم عبر national_id (آخر 6 أرقام = كلمة المرور)
- ✅ الموظفون يمكنهم الوصول فقط لمستودعاتهم
- ✅ الأدمن لديه وصول كامل

### التكاليف
- **Supabase Free Tier**: 
  - 500 MB Database
  - 1 GB File Storage
  - 2 GB Bandwidth
  - 50,000 Monthly Active Users
- **Vercel Hobby**: مجاني للمشاريع الشخصية

### الأداء
- استخدم Supabase Connection Pooling للأداء الأفضل
- فعّل Caching في Vercel
- استخدم Indexes على الجداول الكبيرة

## استكشاف الأخطاء

### مشكلة: لا يمكن تسجيل الدخول
- تأكد من وجود المستخدم في جدول `users`
- تأكد من صحة الرقم القومي (14 رقم)
- كلمة المرور = آخر 6 أرقام من الرقم القومي

### مشكلة: لا تظهر البيانات
- تأكد من تفعيل RLS بشكل صحيح
- تحقق من السياسات (Policies)
- افحص Console للأخطاء

### مشكلة: Realtime لا يعمل
- تأكد من تفعيل Realtime على الجداول
- تحقق من اتصال الشبكة
- افحص Supabase Dashboard → Logs

## الدعم والمساعدة

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [React Documentation](https://react.dev)

---

تم التحويل بنجاح إلى بنية serverless كاملة! 🎉