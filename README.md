# Norsk Lead AI

منصة لإدارة ومعالجة الـ leads (واجهة أمامية + خادم خلفي).

## بنية المشروع

- `client/` — الواجهة الأمامية (React 19 + Vite + tRPC)
- `server/` — الـ API / backend (Node.js + Express + tRPC + Drizzle)
- `shared/` — كود مشترك بين client و server
- `drizzle/` — مخطط قاعدة البيانات والمهاجرات (PostgreSQL)
  - `drizzle/_archive_mysql/` — مهاجرات MySQL قديمة (أرشيف تاريخي فقط، لا تُستخدم)
- `e2e/` — اختبارات End-to-End (Playwright)
- `docs/` — توثيق وملفات تقارير

## المتطلبات

- Node.js 22 أو أعلى
- pnpm
- PostgreSQL 16+
- ملف بيئة `.env` مبني على `.env.example`

## التشغيل محليًا

```bash
pnpm install
pnpm run db:push   # توليد وتطبيق المهاجرات
pnpm dev
```

## الاختبارات

اختبارات الوحدة/التكامل تحتاج Postgres حقيقي (يُحدد عبر `DATABASE_URL`؛
توجد قيم افتراضية في `vitest.config.ts` تشير إلى `localhost:5432`).
بعض اختبارات التكامل تفترض وجود مستخدم بـ `id = 1`
(انظر `.circleci/seed-test-user.cjs`).

```bash
pnpm test       # vitest
pnpm test:e2e   # Playwright
pnpm run check  # فحص أنواع TypeScript
```

## النشر (Production)

- متغيرات إلزامية: `VITE_APP_ID`, `JWT_SECRET` (32+ حرفاً عشوائياً — يُرفض
  الأضعف عند الإقلاع), `DATABASE_URL`. يُنصح بقوة بتعيين `APP_SECRET` منفصل
  (تشفير 2FA وتوقيع روابط التتبع).
- Stripe: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (الويبهوك يرفض الطلبات
  إذا لم يكن السر مضبوطاً).
- SendGrid: `SENDGRID_API_KEY` + `SENDGRID_WEBHOOK_VERIFICATION_KEY`
  (التحقق من التوقيع إلزامي في الإنتاج).
- نقطة فحص الصحة: `GET /health` (تتحقق من اتصال قاعدة البيانات) — اربطها
  بالـ load balancer.
- الخادم يدعم الإيقاف الآمن (SIGTERM/SIGINT): يغلق الاتصالات ثم تجمّع
  قاعدة البيانات.
- **ملاحظة**: تحديد المعدل (rate limiting) وتخزين أحداث الويبهوك المعالَجة
  في الذاكرة — صالح لنسخة واحدة فقط. عند التوسع لعدة نسخ انقلها إلى Redis.
