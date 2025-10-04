# 🏫 نظام إدارة مخازن المدرسة

## 🚀 **البدء السريع:**

### **1️⃣ تنفيذ قاعدة البيانات في Supabase:**

1. افتح: https://app.supabase.com/project/xuwoixfgusvufgaliswt/sql
2. افتح ملف: `supabase/complete_setup.sql`
3. انسخ المحتوى والصقه في SQL Editor
4. اضغط **Run** (F5)

### **2️⃣ تفعيل Realtime:**

1. افتح: https://app.supabase.com/project/xuwoixfgusvufgaliswt/database/replication
2. فعّل Realtime على: `items`, `transactions`, `notifications`, `users`, `warehouses`

### **3️⃣ تشغيل التطبيق:**

```bash
cd school-warehouse-system
npm run dev
```

### **4️⃣ تسجيل الدخول:**

```
الرقم القومي: 12345678901234
كلمة المرور: 901234 (تُعبأ تلقائياً)
```

---

## 📁 **هيكل المشروع:**

```
New folder/
├── school-warehouse-system/    # التطبيق الرئيسي
│   ├── src/                    # الكود المصدري
│   ├── .env                    # إعدادات Supabase
│   └── package.json
├── supabase/
│   └── complete_setup.sql      # ملف قاعدة البيانات الوحيد
└── LOGIN_CREDENTIALS.txt       # بيانات تسجيل الدخول
```

---

## 🔧 **إعدادات Supabase:**

```env
VITE_SUPABASE_URL=https://xuwoixfgusvufgaliswt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 **البيانات الأساسية:**

- ✅ 12 مخزن
- ✅ 13 مستخدم (1 admin + 12 employee)
- ✅ 7 فئات
- ✅ 7 أصناف

---

## 🐛 **حل المشاكل:**

### **خطأ 401 Unauthorized:**
- تأكد من تنفيذ `complete_setup.sql` في Supabase
- السياسات (RLS) موجودة في الملف وتسمح بالوصول العام

### **لا توجد بيانات:**
- أعد تنفيذ `complete_setup.sql`
- تحقق من Table Editor في Supabase

---

## 🚀 **النشر على Vercel:**

```bash
vercel --prod
```

---

**✅ جاهز للعمل!**