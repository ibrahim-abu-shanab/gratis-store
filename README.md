# Gratis Store 🛍️

متجر إلكتروني لمستحضرات التجميل مبني بـ Node.js + Express.

## تشغيل محلياً

1. نسخ ملف البيئة:
```bash
cp .env.example .env
```

2. عدّل `.env` وضع قيمك الحقيقية

3. تثبيت المكتبات وتشغيل السيرفر:
```bash
npm install
npm start
```

4. افتح المتصفح على `http://localhost:3000`

## الرفع على Render.com

1. ارفع المشروع على GitHub
2. سجل على [render.com](https://render.com) وربطه بالـ repo
3. في إعدادات الـ service، أضف متغيرات البيئة:
   - `ADMIN_KEY` → كلمة سر قوية
   - `ADMIN_USER` → اسم المستخدم
   - `ADMIN_PASS` → الباسورد
