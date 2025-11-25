-- ============================================
-- 清理已软删除的应用及其关联数据
-- 警告: 这是物理删除操作，执行前请务必备份数据库！
-- 执行日期: 2025-11-25
-- ============================================

-- 第一步：查看要删除的应用（预览，不执行删除）
SELECT id, name, code, tenant_id, is_deleted, created_at 
FROM app_application 
WHERE is_deleted = 1;

-- 第二步：查看关联数据统计（预览）
-- 查看关联的许可证数量
SELECT 'licenses_license' as table_name, COUNT(*) as count 
FROM licenses_license 
WHERE application_id IN (SELECT id FROM app_application WHERE is_deleted = 1);

-- 查看关联的许可计划数量
SELECT 'licenses_license_plan' as table_name, COUNT(*) as count 
FROM licenses_license_plan 
WHERE application_id IN (SELECT id FROM app_application WHERE is_deleted = 1);

-- 查看关联的租户配额数量
SELECT 'licenses_tenant_license_quota' as table_name, COUNT(*) as count 
FROM licenses_tenant_license_quota 
WHERE application_id IN (SELECT id FROM app_application WHERE is_deleted = 1);

-- 查看关联的反馈数量（如果有application_id字段）
-- SELECT 'feedbacks_feedback' as table_name, COUNT(*) as count 
-- FROM feedbacks_feedback 
-- WHERE application_id IN (SELECT id FROM app_application WHERE is_deleted = 1);

-- 查看关联的文章数量
SELECT 'cms_article' as table_name, COUNT(*) as count 
FROM cms_article 
WHERE application_id IN (SELECT id FROM app_application WHERE is_deleted = 1);

-- 查看关联的分类数量
SELECT 'cms_category' as table_name, COUNT(*) as count 
FROM cms_category 
WHERE application_id IN (SELECT id FROM app_application WHERE is_deleted = 1);

-- ============================================
-- 第三步：物理删除（按顺序执行，先删除子表再删除主表）
-- ============================================

-- 开始事务
START TRANSACTION;

-- 3.1 删除关联的许可证
DELETE FROM licenses_license 
WHERE application_id IN (SELECT id FROM app_application WHERE is_deleted = 1);

-- 3.2 删除关联的许可计划
DELETE FROM licenses_license_plan 
WHERE application_id IN (SELECT id FROM app_application WHERE is_deleted = 1);

-- 3.3 删除关联的租户配额
DELETE FROM licenses_tenant_license_quota 
WHERE application_id IN (SELECT id FROM app_application WHERE is_deleted = 1);

-- 3.4 删除关联的文章（如果需要）
DELETE FROM cms_article 
WHERE application_id IN (SELECT id FROM app_application WHERE is_deleted = 1);

-- 3.5 删除关联的分类（如果需要）
DELETE FROM cms_category 
WHERE application_id IN (SELECT id FROM app_application WHERE is_deleted = 1);

-- 3.6 最后删除应用本身
DELETE FROM app_application WHERE is_deleted = 1;

-- 确认删除结果
SELECT 'Deleted apps count:' as info, ROW_COUNT() as count;

-- 如果一切正常，提交事务
COMMIT;

-- 如果出现问题，回滚事务（取消注释下面这行，注释掉上面的COMMIT）
-- ROLLBACK;

-- ============================================
-- 验证清理结果
-- ============================================
SELECT 'Remaining deleted apps:' as info, COUNT(*) as count 
FROM app_application 
WHERE is_deleted = 1;
