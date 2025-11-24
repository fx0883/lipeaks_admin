-- 添加application_id字段到licenses_license表
ALTER TABLE licenses_license 
ADD COLUMN application_id BIGINT NULL AFTER tenant_id,
ADD CONSTRAINT licenses_license_application_id_fk 
FOREIGN KEY (application_id) REFERENCES app_application(id) ON DELETE CASCADE;

-- 添加索引
CREATE INDEX licenses_li_applica_fb820b_idx ON licenses_license(application_id, status);

-- 添加application_id字段到licenses_license_plan表  
ALTER TABLE licenses_license_plan
ADD COLUMN application_id BIGINT NULL AFTER tenant_id,
ADD CONSTRAINT licenses_license_plan_application_id_fk
FOREIGN KEY (application_id) REFERENCES app_application(id) ON DELETE CASCADE;

-- 添加索引
CREATE INDEX licenses_li_applica_3d292f_idx ON licenses_license_plan(application_id, plan_type);

-- 添加application_id字段到licenses_tenant_license_quota表
ALTER TABLE licenses_tenant_license_quota
ADD COLUMN application_id BIGINT NULL AFTER tenant_id,
ADD CONSTRAINT licenses_tenant_quota_application_id_fk
FOREIGN KEY (application_id) REFERENCES app_application(id) ON DELETE CASCADE;

-- 添加索引和unique约束
CREATE INDEX licenses_te_applica_8d692b_idx ON licenses_tenant_license_quota(application_id, is_active);

-- 检查feedbacks_feedback表是否需要application_id
-- 如果需要，取消下面的注释
-- ALTER TABLE feedbacks_feedback
-- ADD COLUMN application_id BIGINT NULL,
-- ADD CONSTRAINT feedbacks_feedback_application_id_fk
-- FOREIGN KEY (application_id) REFERENCES app_application(id) ON DELETE CASCADE;
