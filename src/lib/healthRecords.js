import { supabase } from './supabase';

/**
 * 건강나이 측정 결과를 Supabase에 저장
 */
export async function saveHealthRecord({
  healthCenterId,
  gender,
  age,
  realAge,
  healthAge,
  delta,
  riskCount,
  answers,
  risks,
  satisfactionScore,
  satisfactionTier,
  bmi,
  medications,
  surveyResponses,
  submittedName,
  submittedPhone,
}) {
  // 현재 로그인 사용자 확인 (비로그인도 허용)
  const { data: { user } } = await supabase.auth.getUser();

  const record = {
    user_id: user?.id || null,
    health_center_id: healthCenterId,
    gender,
    age,
    real_age: realAge,
    health_age: healthAge,
    delta,
    risk_count: riskCount,
    answers,
    risks,
    satisfaction_score: satisfactionScore,
    satisfaction_tier: satisfactionTier,
    bmi,
    medications,
    survey_responses: surveyResponses,
    submitted_name: submittedName,
    submitted_phone: submittedPhone,
  };

  const { data, error } = await supabase
    .from('health_records')
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 비로그인 사용자도 저장할 수 있도록 — 익명 삽입용 RPC
 * (RLS 우회가 필요하면 Supabase에서 anon INSERT 정책 추가 필요)
 */
export async function saveHealthRecordAnonymous(record) {
  const { error } = await supabase
    .from('health_records')
    .insert({
      ...record,
      user_id: null,
    });

  if (error) throw error;
  return data;
}

/**
 * 보건소 목록 조회
 */
export async function getHealthCenters() {
  const { data, error } = await supabase
    .from('health_centers')
    .select('id, name, city, district')
    .order('id');

  if (error) throw error;
  return data;
}

/**
 * 보건소 담당자: 자기 보건소 기록 조회
 */
export async function getRecordsByCenter(healthCenterId, { limit = 50, offset = 0 } = {}) {
  const { data, error, count } = await supabase
    .from('health_records')
    .select('*', { count: 'exact' })
    .eq('health_center_id', healthCenterId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, count };
}

/**
 * 슈퍼 관리자: 익명화 집계 조회
 */
export async function getAnonymizedStats(centerId = null) {
  const { data, error } = await supabase
    .rpc('get_stats_for_super_admin', {
      center_id: centerId,
    });

  if (error) throw error;
  return data;
}
