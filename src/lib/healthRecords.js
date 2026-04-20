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
 * 비로그인 사용자도 저장할 수 있도록 — 익명 삽입 (saveHealthRecord 와 동일한 camelCase 입력)
 */
export async function saveHealthRecordAnonymous(input) {
  const record = {
    user_id: null,
    health_center_id: input.healthCenterId,
    gender: input.gender ?? null,
    age: input.age ?? null,
    real_age: input.realAge ?? null,
    health_age: input.healthAge ?? null,
    delta: input.delta ?? null,
    risk_count: input.riskCount ?? null,
    answers: input.answers ?? {},
    risks: input.risks ?? {},
    satisfaction_score: input.satisfactionScore ?? null,
    satisfaction_tier: input.satisfactionTier ?? null,
    bmi: input.bmi ?? null,
    medications: input.medications ?? [],
    survey_responses: input.surveyResponses ?? {},
    submitted_name: input.submittedName ?? null,
    submitted_phone: input.submittedPhone ?? null,
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
 * 중도이탈/부분저장 — 진행 중 답변이라도 DB에 보관
 * 결과화면까지 도달하지 못해도 answers만 기록해 둡니다.
 */
export async function savePartialRecord({ healthCenterId, gender, age, answers }) {
  if (!healthCenterId) return null;
  const { data, error } = await supabase
    .from('health_records')
    .insert({
      user_id: null,
      health_center_id: healthCenterId,
      gender: gender || null,
      age: age || null,
      answers: answers || {},
      survey_responses: { _partial: true },
    })
    .select()
    .single();

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
