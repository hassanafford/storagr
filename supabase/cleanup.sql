-- ============================================
-- تنظيف قاعدة البيانات - حذف الجداول القديمة
-- ============================================
-- ⚠️ تحذير: هذا سيحذف جميع البيانات الموجودة!
-- نفّذ هذا الملف أولاً قبل تنفيذ schema.sql
-- ============================================

-- حذف الجداول بالترتيب الصحيح (من الأصغر للأكبر)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;

-- حذف الـ Views إن وجدت
DROP VIEW IF EXISTS items_full_view CASCADE;
DROP VIEW IF EXISTS transactions_full_view CASCADE;
DROP VIEW IF EXISTS low_stock_items_view CASCADE;

-- حذف الـ Functions إن وجدت
DROP FUNCTION IF EXISTS get_egyptian_time() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS check_low_stock() CASCADE;
DROP FUNCTION IF EXISTS log_quantity_change() CASCADE;
DROP FUNCTION IF EXISTS get_warehouse_stats(BIGINT) CASCADE;

-- تم التنظيف بنجاح! الآن يمكنك تنفيذ schema.sql