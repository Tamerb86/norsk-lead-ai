-- Smart Rules Schema Updates
-- تحديثات قاعدة البيانات لنظام القواعد الذكية

-- جدول المهام المجدولة
CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    scheduled_for TIMESTAMP NOT NULL,
    data JSONB,
    user_id INTEGER REFERENCES users(id),
    priority INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- فهارس للمهام المجدولة
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_status ON scheduled_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_scheduled_for ON scheduled_jobs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_type ON scheduled_jobs(type);

-- جدول Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    events JSONB NOT NULL,
    secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- فهارس للـ Webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);

-- جدول سجلات Webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    webhook_id INTEGER REFERENCES webhooks(id) ON DELETE CASCADE,
    event VARCHAR(100) NOT NULL,
    payload TEXT,
    response_status INTEGER,
    response_body TEXT,
    success BOOLEAN DEFAULT false,
    duration INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- فهارس لسجلات Webhooks
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- جدول أحداث البريد الإلكتروني
CREATE TABLE IF NOT EXISTS email_events (
    id SERIAL PRIMARY KEY,
    email_id INTEGER REFERENCES emails(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- فهارس لأحداث البريد
CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_occurred_at ON email_events(occurred_at);

-- إضافة أعمدة جديدة لجدول emails إذا لم تكن موجودة
ALTER TABLE emails ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(64);
ALTER TABLE emails ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMP;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS reply_category VARCHAR(50);
ALTER TABLE emails ADD COLUMN IF NOT EXISTS reply_content TEXT;

-- فهرس للـ tracking_id
CREATE INDEX IF NOT EXISTS idx_emails_tracking_id ON emails(tracking_id);

-- إضافة أعمدة جديدة لجدول leads إذا لم تكن موجودة
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_valid BOOLEAN DEFAULT true;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_validated_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;

-- جدول التسلسلات
CREATE TABLE IF NOT EXISTS sequences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول خطوات التسلسل
CREATE TABLE IF NOT EXISTS sequence_steps (
    id SERIAL PRIMARY KEY,
    sequence_id INTEGER REFERENCES sequences(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    template_id INTEGER,
    wait_days INTEGER DEFAULT 1,
    condition JSONB,
    true_step_id INTEGER,
    false_step_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول تسجيلات التسلسل
CREATE TABLE IF NOT EXISTS sequence_enrollments (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    sequence_id INTEGER REFERENCES sequences(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    current_step_id INTEGER REFERENCES sequence_steps(id),
    last_step_at TIMESTAMP,
    next_step_at TIMESTAMP,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- فهارس للتسلسلات
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_lead_id ON sequence_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_sequence_id ON sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_status ON sequence_enrollments(status);

-- جدول الحملات - إضافة أعمدة جديدة
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS scheduled_start_at TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS scheduled_end_at TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- تعليق: تشغيل هذا الملف في قاعدة البيانات لإنشاء الجداول المطلوبة
-- psql -h <host> -U <user> -d <database> -f schema-updates.sql
