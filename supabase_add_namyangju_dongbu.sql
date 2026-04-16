-- =============================================
-- 남양주 동부 보건소 추가 (51번째)
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1단계: health_centers 테이블에 남양주 동부 보건소 추가
INSERT INTO health_centers (name, city, district)
VALUES ('남양주 동부 보건소', '남양주시', '동부')
ON CONFLICT (name) DO NOTHING;

-- 2단계: 이미 signUp API로 생성된 gghealth51@kr.org 이메일 확인 처리
UPDATE auth.users
SET email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'gghealth51@kr.org'
  AND email_confirmed_at IS NULL;

-- 3단계: users 테이블에 역할 연결
INSERT INTO users (id, email, role, health_center_id, name)
SELECT
  au.id,
  'gghealth51@kr.org',
  'health_center_admin',
  hc.id,
  '남양주 동부 담당자'
FROM auth.users au
CROSS JOIN health_centers hc
WHERE au.email = 'gghealth51@kr.org'
  AND hc.name = '남양주 동부 보건소'
ON CONFLICT (id) DO NOTHING;

-- 확인: 계정이 제대로 생성되었는지 확인
SELECT au.email, au.email_confirmed_at, u.role, u.health_center_id, hc.name as center_name
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
LEFT JOIN health_centers hc ON hc.id = u.health_center_id
WHERE au.email = 'gghealth51@kr.org';
