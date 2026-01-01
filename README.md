# Norsk Lead AI

منصة لإدارة ومعالجة الـ leads (واجهة أمامية + خادم خلفي).

## بنية المشروع

- `client/` — الواجهة الأمامية (React/Vite مثلاً)
- `server/` — الـ API / backend (Node.js)
- `shared/` — كود مشترك بين client و server
- `drizzle/` — تعريفات قاعدة البيانات والمهاجرات
- `e2e/` — اختبارات End-to-End (Playwright)
- `migrations/` — سكربتات المهاجرات لقاعدة البيانات
- `docs/` — توثيق وملفات تقارير

## المتطلبات

- Node.js 18 أو أعلى
- pnpm
- قاعدة بيانات (PostgreSQL / MySQL – حسب المشروع)
- ملف بيئة `.env` مبني على `.env.example`

## التشغيل محليًا

```bash
pnpm install
pnpm dev
```

(عدّل أوامر التشغيل حسب مشروعك الفعلي)

## الاختبارات

```bash
pnpm test
pnpm test:e2e
```
