# دليل إعداد نظام المصادقة - NorskLeads

## نظرة عامة

تم استبدال نظام OAuth الخارجي بنظام مصادقة محلي (Local Authentication) يعتمد على:
- **JWT (JSON Web Tokens)** للجلسات
- **bcrypt** لتشفير كلمات المرور
- **Cookies** لتخزين الجلسات

---

## 1. الملفات المُنشأة والمُحدثة

### ملفات السيرفر (Backend)

| الملف | الوصف |
|-------|-------|
| `server/_core/auth.ts` | نظام المصادقة الأساسي (JWT, password hashing) |
| `server/_core/authRoutes.ts` | مسارات API للتسجيل وتسجيل الدخول |
| `server/_core/adminRoutes.ts` | مسارات API لصفحة الإدارة |
| `server/_core/context.ts` | سياق tRPC المحدث |
| `server/_core/env.ts` | متغيرات البيئة (بدون OAuth) |
| `server/_core/index.ts` | الملف الرئيسي للسيرفر |
| `server/db.ts` | وظائف قاعدة البيانات للمستخدمين |

### ملفات الواجهة (Frontend)

| الملف | الوصف |
|-------|-------|
| `client/src/_core/hooks/useAuth.ts` | Hook للمصادقة |
| `client/src/pages/Login.tsx` | صفحة تسجيل الدخول |
| `client/src/pages/Register.tsx` | صفحة إنشاء حساب |
| `client/src/pages/Profile.tsx` | صفحة الملف الشخصي |
| `client/src/pages/Admin.tsx` | صفحة الإدارة |
| `client/src/main.tsx` | الراوتر الرئيسي |

---

## 2. متغيرات البيئة المطلوبة

```env
# مطلوب
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
DATABASE_URL=postgresql://user:password@host:5432/database
VITE_APP_ID=norsk-lead-ai
NODE_ENV=production

# اختياري
ADMIN_EMAIL=admin@example.com
```

---

## 3. هيكل نظام المصادقة

### 3.1 ملف `server/_core/auth.ts`

```typescript
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const JWT_EXPIRES_IN = "7d";

// تشفير كلمة المرور
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// التحقق من كلمة المرور
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// إنشاء JWT Token
export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// التحقق من Token
export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

// استخراج المستخدم من الطلب
export async function getUserFromRequest(req: Request): Promise<User | null> {
  const token = req.cookies?.auth_token;
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  return getUserById(decoded.userId);
}
```

### 3.2 ملف `server/_core/authRoutes.ts`

```typescript
import { Router } from "express";
import { hashPassword, verifyPassword, generateToken } from "./auth";

const router = Router();

// تسجيل مستخدم جديد
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  
  // التحقق من عدم وجود المستخدم
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: "Email already exists" });
  }
  
  // تشفير كلمة المرور وإنشاء المستخدم
  const passwordHash = await hashPassword(password);
  const user = await createUser({ name, email, passwordHash });
  
  // إنشاء Token وإرساله
  const token = generateToken(user.id);
  res.cookie("auth_token", token, { httpOnly: true, secure: true });
  res.json({ user });
});

// تسجيل الدخول
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const token = generateToken(user.id);
  res.cookie("auth_token", token, { httpOnly: true, secure: true });
  res.json({ user });
});

// تسجيل الخروج
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.json({ success: true });
});

// الحصول على المستخدم الحالي
router.get("/me", async (req, res) => {
  const user = await getUserFromRequest(req);
  res.json({ user });
});

export default router;
```

### 3.3 ملف `server/_core/context.ts`

```typescript
import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getUserFromRequest } from "./auth";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const user = await getUserFromRequest(req);
  
  return {
    req,
    res,
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
```

---

## 4. Hook المصادقة للواجهة

### ملف `client/src/_core/hooks/useAuth.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

interface User {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
}

interface UseAuthOptions {
  redirectOnUnauthenticated?: boolean;
}

export function useAuth(options: UseAuthOptions = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  // جلب المستخدم الحالي
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      setUser(data.user);
      
      if (!data.user && options.redirectOnUnauthenticated) {
        setLocation("/login");
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [options.redirectOnUnauthenticated, setLocation]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // تسجيل الدخول
  const login = async (credentials: { email: string; password: string }) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });
    
    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  // التسجيل
  const register = async (data: { name: string; email: string; password: string }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    
    const result = await res.json();
    if (res.ok) {
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  // تسجيل الخروج
  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setLocation("/");
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refetch: fetchUser,
  };
}
```

---

## 5. تحديث tRPC protectedProcedure

### ملف `server/routers.ts`

```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./_core/context";

const t = initTRPC.context<Context>().create();

// Procedure عام
export const publicProcedure = t.procedure;

// Procedure محمي (يتطلب تسجيل دخول)
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "يجب تسجيل الدخول",
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Procedure للمدير فقط
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "صلاحيات غير كافية",
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
```

---

## 6. إضافة وظائف قاعدة البيانات

### إضافة إلى `server/db.ts`

```typescript
// الحصول على مستخدم بالبريد الإلكتروني
export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] || null;
}

// الحصول على مستخدم بالمعرف
export async function getUserById(id: number) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0] || null;
}

// إنشاء مستخدم جديد
export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const result = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: "viewer",
    })
    .returning();
  return result[0];
}

// تحديث كلمة المرور
export async function updateUserPassword(userId: number, passwordHash: string) {
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId));
}
```

---

## 7. تحديث Schema قاعدة البيانات

### إضافة حقل `passwordHash` إلى جدول المستخدمين

```typescript
// drizzle/schema.ts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  role: text("role").default("viewer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**تشغيل Migration:**
```bash
pnpm db:push
```

---

## 8. المسارات (Routes) المتاحة

### مسارات المصادقة

| المسار | الطريقة | الوصف |
|--------|---------|-------|
| `/api/auth/register` | POST | تسجيل مستخدم جديد |
| `/api/auth/login` | POST | تسجيل الدخول |
| `/api/auth/logout` | POST | تسجيل الخروج |
| `/api/auth/me` | GET | الحصول على المستخدم الحالي |
| `/api/auth/profile` | PUT | تحديث الملف الشخصي |
| `/api/auth/password` | PUT | تغيير كلمة المرور |

### مسارات الإدارة

| المسار | الطريقة | الوصف |
|--------|---------|-------|
| `/api/admin/stats` | GET | إحصائيات النظام |
| `/api/admin/users` | GET | قائمة المستخدمين |
| `/api/admin/users/:id/role` | PUT | تغيير صلاحية مستخدم |
| `/api/admin/users/:id` | DELETE | حذف مستخدم |

---

## 9. صفحات الواجهة

| المسار | الملف | الوصف |
|--------|-------|-------|
| `/login` | `Login.tsx` | تسجيل الدخول |
| `/register` | `Register.tsx` | إنشاء حساب جديد |
| `/profile` | `Profile.tsx` | الملف الشخصي |
| `/admin` | `Admin.tsx` | لوحة الإدارة |

---

## 10. الأمان

### ممارسات الأمان المُطبقة:

1. **تشفير كلمات المرور** باستخدام bcrypt مع salt rounds = 12
2. **JWT Tokens** مع انتهاء صلاحية 7 أيام
3. **HttpOnly Cookies** لمنع XSS attacks
4. **Secure Cookies** في بيئة الإنتاج
5. **CORS** محدد للنطاقات المسموحة
6. **Rate Limiting** على مسارات المصادقة

### توصيات إضافية:

- استخدم `JWT_SECRET` قوي وطويل (32+ حرف)
- فعّل HTTPS في الإنتاج
- أضف reCAPTCHA لمنع الـ bots
- فعّل 2FA للحسابات الحساسة

---

## 11. اختبار النظام

### 1. إنشاء حساب جديد:
```bash
curl -X POST https://lead.nexifyhub.no/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### 2. تسجيل الدخول:
```bash
curl -X POST https://lead.nexifyhub.no/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. الحصول على المستخدم الحالي:
```bash
curl https://lead.nexifyhub.no/api/auth/me \
  -H "Cookie: auth_token=YOUR_TOKEN"
```

---

## 12. استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| "Invalid credentials" | تأكد من صحة البريد وكلمة المرور |
| "Email already exists" | البريد مسجل مسبقاً |
| "Unauthorized" | Token منتهي أو غير صالح |
| "Forbidden" | صلاحيات غير كافية |

---

## 13. الخطوات التالية

1. ✅ إزالة OAuth الخارجي
2. ✅ تثبيت نظام المصادقة المحلي
3. ✅ إنشاء صفحات Login/Register/Profile
4. ✅ إنشاء صفحة Admin
5. ⏳ إعداد Stripe للدفع
6. ⏳ إعداد SendGrid للبريد
7. ⏳ استيراد بيانات الشركات

---

*آخر تحديث: ديسمبر 2024*
