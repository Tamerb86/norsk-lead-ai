# دليل نظام القواعد الذكية - Smart Rules System

## نظرة عامة

نظام القواعد الذكية هو نظام أتمتة متكامل لـ NorskLeads يتضمن:

1. **Tracking Pixel** - تتبع فتح البريد الإلكتروني
2. **Webhooks** - إشعارات فورية للأحداث
3. **Scheduled Jobs** - مهام مجدولة للمتابعة التلقائية
4. **Reply Classifier** - تصنيف الردود باستخدام Regex
5. **Cron Jobs** - مهام دورية للتذكيرات والتقارير

---

## 1. Tracking Pixel - تتبع فتح البريد

### كيف يعمل؟
- يتم إضافة صورة شفافة 1x1 بكسل في نهاية كل بريد إلكتروني
- عند فتح البريد، يتم تحميل الصورة وتسجيل الحدث

### الاستخدام

```typescript
import { 
  generateTrackingUrl, 
  injectTrackingPixel,
  convertLinksToTracked 
} from './smartRules/trackingPixel';

// إنشاء رابط التتبع
const trackingId = crypto.randomBytes(16).toString('hex');
const trackingUrl = generateTrackingUrl(trackingId, 'https://lead.nexifyhub.no');

// إضافة Tracking Pixel للبريد
const emailWithTracking = injectTrackingPixel(htmlContent, trackingId, baseUrl);

// تحويل الروابط لتكون قابلة للتتبع
const emailWithTrackedLinks = convertLinksToTracked(htmlContent, trackingId, baseUrl);
```

### الـ Endpoints

| Endpoint | الوصف |
|----------|-------|
| `GET /api/track/open/:trackingId.gif` | تتبع فتح البريد |
| `GET /api/track/click/:trackingId/:linkId?url=...` | تتبع النقر على الروابط |

---

## 2. Webhooks - الإشعارات الفورية

### الأحداث المدعومة

| الحدث | الوصف |
|-------|-------|
| `email.sent` | تم إرسال البريد |
| `email.opened` | تم فتح البريد |
| `email.clicked` | تم النقر على رابط |
| `email.replied` | تم الرد على البريد |
| `email.bounced` | فشل تسليم البريد |
| `email.unsubscribed` | إلغاء الاشتراك |
| `campaign.started` | بدأت الحملة |
| `campaign.completed` | اكتملت الحملة |
| `lead.created` | تم إنشاء عميل محتمل |
| `lead.converted` | تم تحويل العميل |

### الاستخدام

```typescript
import { sendWebhook, registerWebhook } from './smartRules/webhooks';

// تسجيل Webhook جديد
const webhook = await registerWebhook(
  userId,
  'My Webhook',
  'https://example.com/webhook',
  ['email.opened', 'email.replied']
);

// إرسال Webhook
await sendWebhook('email.opened', {
  emailId: 123,
  recipientEmail: 'test@example.com',
  openedAt: new Date().toISOString()
});
```

### التحقق من صحة Webhook (في الطرف المستقبل)

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}

// في Express
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhook(JSON.stringify(req.body), signature, 'your-secret');
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // معالجة الحدث
  console.log('Event:', req.body.event);
  console.log('Data:', req.body.data);
  
  res.status(200).send('OK');
});
```

---

## 3. Scheduled Jobs - المهام المجدولة

### أنواع المهام

| النوع | الوصف |
|-------|-------|
| `send_email` | إرسال بريد إلكتروني |
| `follow_up` | متابعة تلقائية |
| `sequence_step` | تنفيذ خطوة في التسلسل |
| `reminder` | إرسال تذكير |
| `campaign_start` | بدء حملة |
| `campaign_end` | إنهاء حملة |
| `lead_nurture` | رعاية العميل المحتمل |
| `data_cleanup` | تنظيف البيانات |

### الاستخدام

```typescript
import { createScheduledJob, JOB_TYPES, startJobProcessor } from './smartRules/scheduledJobs';

// إنشاء مهمة مجدولة
const jobId = await createScheduledJob(
  JOB_TYPES.FOLLOW_UP,
  new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // بعد 3 أيام
  {
    leadId: 123,
    campaignId: 456,
    followUpNumber: 1
  },
  userId,
  10 // الأولوية
);

// إلغاء مهمة
await cancelScheduledJob(jobId);

// بدء معالج المهام (يعمل كل دقيقة)
const processor = startJobProcessor(60000);
```

---

## 4. Reply Classifier - تصنيف الردود

### التصنيفات المدعومة

| التصنيف | الوصف | الإجراء التلقائي |
|---------|-------|-----------------|
| `interested` | مهتم | إشعار المبيعات |
| `not_interested` | غير مهتم | تحديث الحالة |
| `meeting_request` | طلب اجتماع | إشعار المبيعات |
| `more_info` | طلب معلومات | إرسال معلومات |
| `unsubscribe` | إلغاء الاشتراك | إلغاء الاشتراك |
| `out_of_office` | خارج المكتب | جدولة متابعة |
| `bounce` | ارتداد | تحديث البريد |
| `referral` | إحالة | تحديث جهة الاتصال |
| `pricing` | استفسار عن السعر | إرسال الأسعار |
| `neutral` | محايد | لا شيء |
| `spam` | بريد مزعج | إلغاء الاشتراك |

### الاستخدام

```typescript
import { classifyReply, processEmailReply, REPLY_CATEGORIES } from './smartRules/replyClassifier';

// تصنيف رد
const result = classifyReply('Yes, I am interested! Can we schedule a meeting?');
console.log(result);
// {
//   category: 'interested',
//   confidence: 85,
//   matchedPatterns: ['interested', 'schedule.*meeting'],
//   suggestedAction: 'notify_sales',
//   sentiment: 'positive'
// }

// معالجة رد بريد إلكتروني
const classification = await processEmailReply(
  emailId,
  'Thanks for reaching out. I am not interested at this time.',
  'customer@example.com'
);
```

### إضافة قواعد مخصصة

```typescript
import { addCustomRule, REPLY_CATEGORIES } from './smartRules/replyClassifier';

// إضافة قاعدة للكلمات النرويجية المخصصة
addCustomRule(
  REPLY_CATEGORIES.INTERESTED,
  ['veldig interessert', 'send mer info'],
  75, // الأولوية
  'notify_sales' // الإجراء
);
```

---

## 5. Cron Jobs - المهام الدورية

### المهام الافتراضية

| المهمة | الجدول | الوصف |
|--------|--------|-------|
| `process_scheduled_jobs` | كل دقيقة | معالجة المهام المجدولة |
| `cleanup_old_records` | 3:00 صباحاً يومياً | تنظيف السجلات القديمة |
| `daily_report` | 8:00 صباحاً يومياً | إرسال التقرير اليومي |
| `check_campaigns` | كل 15 دقيقة | التحقق من الحملات المجدولة |
| `follow_up_reminders` | 9:00 صباحاً يومياً | تذكيرات المتابعة |
| `update_lead_scores` | كل ساعة | تحديث نقاط العملاء |
| `process_sequences` | كل 5 دقائق | معالجة التسلسلات |
| `weekly_digest` | 9:00 صباحاً الاثنين | الملخص الأسبوعي |
| `validate_emails` | كل ساعة | التحقق من البريد |

### الاستخدام

```typescript
import { 
  registerCronJob, 
  initializeDefaultCronJobs,
  startCronProcessor,
  getCronJobsStatus,
  toggleCronJob,
  runCronJobManually
} from './smartRules/cronJobs';

// تهيئة المهام الافتراضية
initializeDefaultCronJobs();

// بدء المعالج
const processor = startCronProcessor(60000);

// إضافة مهمة مخصصة
registerCronJob(
  'custom_report',
  '0 10 * * 1-5', // 10 صباحاً أيام العمل
  async () => {
    console.log('Sending custom report...');
  }
);

// الحصول على حالة المهام
const status = getCronJobsStatus();
console.log(status);

// تفعيل/تعطيل مهمة
toggleCronJob('daily_report', false);

// تشغيل مهمة يدوياً
await runCronJobManually('weekly_digest');
```

### صيغة Cron Expression

```
* * * * *
│ │ │ │ │
│ │ │ │ └── يوم الأسبوع (0-6, 0=الأحد)
│ │ │ └──── الشهر (1-12)
│ │ └────── يوم الشهر (1-31)
│ └──────── الساعة (0-23)
└────────── الدقيقة (0-59)
```

أمثلة:
- `* * * * *` - كل دقيقة
- `0 * * * *` - كل ساعة
- `0 8 * * *` - 8 صباحاً يومياً
- `0 9 * * 1` - 9 صباحاً كل اثنين
- `*/15 * * * *` - كل 15 دقيقة

---

## التكامل مع الخادم

### إضافة Smart Rules للخادم

```typescript
// في server/_core/index.ts

import trackingPixelRouter from '../smartRules/trackingPixel';
import webhooksRouter from '../smartRules/webhooks';
import { initializeSmartRules, startAllProcessors } from '../smartRules';

// إضافة الـ Routes
app.use('/api/track', trackingPixelRouter);
app.use('/api/webhooks', webhooksRouter);

// تهيئة النظام
initializeSmartRules();

// بدء المعالجات
const processors = startAllProcessors({
  jobInterval: 60000,  // كل دقيقة
  cronInterval: 60000  // كل دقيقة
});

// إيقاف المعالجات عند إغلاق الخادم
process.on('SIGTERM', () => {
  stopAllProcessors(processors);
});
```

---

## تحديث قاعدة البيانات

قم بتشغيل ملف `schema-updates.sql` لإنشاء الجداول المطلوبة:

```bash
psql -h <host> -U <user> -d <database> -f server/smartRules/schema-updates.sql
```

أو من خلال TablePlus:
1. افتح الاتصال بقاعدة البيانات
2. انسخ محتوى الملف
3. نفذ الاستعلامات

---

## متغيرات البيئة المطلوبة

```env
# قاعدة البيانات
DATABASE_URL=postgresql://user:password@host:5432/database

# الخادم
BASE_URL=https://lead.nexifyhub.no

# البريد الإلكتروني (اختياري)
SENDGRID_API_KEY=your-sendgrid-key
```

---

## الأمان

1. **توقيع Webhooks**: جميع الـ Webhooks موقعة باستخدام HMAC-SHA256
2. **التحقق من الملكية**: جميع العمليات تتحقق من ملكية المستخدم
3. **Rate Limiting**: يُنصح بإضافة حد للطلبات
4. **Timeout**: جميع طلبات Webhook لها timeout 10 ثواني

---

## استكشاف الأخطاء

### المهام لا تعمل
1. تأكد من تشغيل `startJobProcessor()`
2. تحقق من سجلات الخادم
3. تأكد من وجود الجداول في قاعدة البيانات

### Webhooks لا تصل
1. تحقق من أن URL صحيح ويمكن الوصول إليه
2. تحقق من سجلات Webhook في `/api/webhooks/:id/logs`
3. تأكد من أن الـ Webhook مفعل

### التصنيف غير دقيق
1. أضف قواعد مخصصة للكلمات الخاصة بعملك
2. تحقق من اللغة المستخدمة في الردود
3. راجع مستوى الثقة في النتائج

---

## الدعم

للمساعدة أو الإبلاغ عن مشاكل:
- GitHub Issues: https://github.com/Tamerb86/norsk-lead-ai/issues
- البريد الإلكتروني: support@nexifyhub.no
