import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const GG_BLUE = "#0066CC";
const GG_BLUE_DARK = "#004C99";
const GG_BLUE_BG = "linear-gradient(135deg,#0066CC,#0052A3)";
const GG_GREEN = "#00A651";
const GG_RED = "#E5342E";
const F = "'Noto Sans KR','Malgun Gothic',sans-serif";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [centers, setCenters] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [searchName, setSearchName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { navigate("/admin"); return; }
    setUser(authUser);

    const { data: prof } = await supabase
      .from("users")
      .select("*, health_centers(name)")
      .eq("id", authUser.id)
      .single();

    if (!prof || prof.role === "citizen") { navigate("/admin"); return; }
    setProfile(prof);

    // 보건소 목록
    const { data: cList } = await supabase
      .from("health_centers")
      .select("id, name, city, district")
      .order("id");
    setCenters(cList || []);

    if (prof.role === "health_center_admin") {
      await loadRecords(prof.health_center_id);
    } else if (prof.role === "super_admin") {
      await loadAllStats();
    }
    setLoading(false);
  }

  async function loadRecords(centerId) {
    const { data } = await supabase
      .from("health_records")
      .select("*")
      .eq("health_center_id", centerId)
      .order("created_at", { ascending: false });
    setRecords(data || []);
    setSelectedCenter(centerId);
  }

  async function loadAllStats() {
    const { data } = await supabase.rpc("get_stats_for_super_admin");
    setStats(data || []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin");
  }

  function exportCSV() {
    if (!records.length) return;
    const headers = ["이름","연락처","성별","나이","실제나이","건강나이","차이","위험요인수","만족도","BMI","제출일시"];
    const rows = records.map(r => [
      r.submitted_name || "", r.submitted_phone || "",
      r.gender === "male" ? "남" : "여", r.age, r.real_age, r.health_age,
      r.delta, r.risk_count, r.satisfaction_score, r.bmi,
      new Date(r.created_at).toLocaleString("ko-KR"),
    ]);
    const bom = "\uFEFF";
    const csv = bom + [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `건강나이_결과_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = records.filter(r =>
    !searchName || (r.submitted_name || "").includes(searchName)
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, background: "#f5f7fa" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 18, color: "#666" }}>로딩 중...</div>
      </div>
    </div>
  );

  const centerName = profile?.health_centers?.name || centers.find(c => c.id === selectedCenter)?.name || "";
  const roleName = profile?.role === "super_admin" ? "경기도 전체 관리자" : `보건소 담당자`;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", fontFamily: F }}>
      {/* 헤더 */}
      <div style={{ background: GG_BLUE_BG, padding: "18px 24px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>건강증진 관리 시스템</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>
            {roleName} {centerName && `· ${centerName}`} · {profile?.email}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/" style={{ padding: "8px 16px", background: "rgba(255,255,255,.15)", color: "#fff", borderRadius: 8, fontSize: 14, textDecoration: "none", fontWeight: 600 }}>퀴즈 보기</a>
          <button onClick={handleLogout} style={{ padding: "8px 16px", background: "rgba(255,255,255,.2)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: 600, fontFamily: F }}>로그아웃</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>

        {/* ── 보건소 담당자 뷰 ── */}
        {profile?.role === "health_center_admin" && (
          <>
            {/* 요약 카드 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "총 응답 수", value: records.length, icon: "📋", color: GG_BLUE },
                { label: "평균 건강나이 차이", value: records.length ? `+${(records.reduce((s, r) => s + (r.delta || 0), 0) / records.length).toFixed(1)}세` : "-", icon: "📊", color: GG_RED },
                { label: "평균 위험요인", value: records.length ? (records.reduce((s, r) => s + (r.risk_count || 0), 0) / records.length).toFixed(1) + "개" : "-", icon: "⚠️", color: "#F59E0B" },
                { label: "평균 만족도", value: records.length ? (records.reduce((s, r) => s + (r.satisfaction_score || 0), 0) / records.length).toFixed(1) + "/30" : "-", icon: "😊", color: GG_GREEN },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
                  <div style={{ fontSize: 13, color: "#999", marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>

            {/* 검색 + 내보내기 */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <input
                type="text" placeholder="이름으로 검색..." value={searchName}
                onChange={e => setSearchName(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: "12px 16px", border: "1px solid #ddd", borderRadius: 10, fontSize: 15, fontFamily: F }}
              />
              <button onClick={exportCSV} style={{ padding: "12px 20px", background: GG_GREEN, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                📥 CSV 다운로드
              </button>
            </div>

            {/* 결과 테이블 */}
            <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                      {["#","이름","연락처","성별","나이","건강나이","차이","위험요인","만족도","BMI","일시"].map((h, i) => (
                        <th key={i} style={{ padding: "14px 12px", textAlign: "left", fontWeight: 700, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={11} style={{ padding: 40, textAlign: "center", color: "#999" }}>데이터가 없습니다</td></tr>
                    ) : filtered.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 ? "#fafbfc" : "#fff" }}>
                        <td style={{ padding: "12px", color: "#999" }}>{i + 1}</td>
                        <td style={{ padding: "12px", fontWeight: 600 }}>{r.submitted_name || "-"}</td>
                        <td style={{ padding: "12px" }}>{r.submitted_phone || "-"}</td>
                        <td style={{ padding: "12px" }}>{r.gender === "male" ? "남" : "여"}</td>
                        <td style={{ padding: "12px" }}>{r.age}세</td>
                        <td style={{ padding: "12px", fontWeight: 700, color: GG_BLUE }}>{r.health_age}세</td>
                        <td style={{ padding: "12px", fontWeight: 700, color: r.delta > 3 ? GG_RED : r.delta > 0 ? "#F59E0B" : GG_GREEN }}>+{r.delta}세</td>
                        <td style={{ padding: "12px" }}>{r.risk_count}개</td>
                        <td style={{ padding: "12px" }}>{r.satisfaction_score}/30</td>
                        <td style={{ padding: "12px" }}>{r.bmi || "-"}</td>
                        <td style={{ padding: "12px", whiteSpace: "nowrap", color: "#999", fontSize: 13 }}>{new Date(r.created_at).toLocaleString("ko-KR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── 슈퍼 관리자 뷰 ── */}
        {profile?.role === "super_admin" && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#333", marginBottom: 20 }}>📊 경기도 전체 보건소 집계</h2>

            {stats && stats.length > 0 ? (
              <>
                {/* 전체 요약 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
                  {[
                    { label: "전체 응답 수", value: stats.reduce((s, r) => s + Number(r.out_total_records), 0), icon: "📋", color: GG_BLUE },
                    { label: "참여 보건소", value: stats.length + "개소", icon: "🏥", color: GG_GREEN },
                    { label: "평균 건강나이 차이", value: "+" + (stats.reduce((s, r) => s + Number(r.out_avg_delta) * Number(r.out_total_records), 0) / stats.reduce((s, r) => s + Number(r.out_total_records), 0)).toFixed(1) + "세", icon: "📊", color: GG_RED },
                  ].map((c, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
                      <div style={{ fontSize: 13, color: "#999", marginBottom: 4 }}>{c.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
                    </div>
                  ))}
                </div>

                {/* 보건소별 테이블 */}
                <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                          {["#","보건소","응답 수","평균 건강나이 차이","평균 건강나이","평균 만족도","평균 위험요인"].map((h, i) => (
                            <th key={i} style={{ padding: "14px 12px", textAlign: "left", fontWeight: 700, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map((s, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 ? "#fafbfc" : "#fff" }}>
                            <td style={{ padding: "12px", color: "#999" }}>{i + 1}</td>
                            <td style={{ padding: "12px", fontWeight: 600 }}>{s.out_center_name}</td>
                            <td style={{ padding: "12px", fontWeight: 700, color: GG_BLUE }}>{Number(s.out_total_records)}</td>
                            <td style={{ padding: "12px", fontWeight: 700, color: Number(s.out_avg_delta) > 3 ? GG_RED : "#F59E0B" }}>+{Number(s.out_avg_delta).toFixed(1)}세</td>
                            <td style={{ padding: "12px" }}>{Number(s.out_avg_health_age).toFixed(1)}세</td>
                            <td style={{ padding: "12px" }}>{Number(s.out_avg_satisfaction).toFixed(1)}/30</td>
                            <td style={{ padding: "12px" }}>{s.out_risk_distribution?.avg_risk_count || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center", color: "#999", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
                아직 수집된 데이터가 없습니다.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
