import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const GG_BLUE = "#0066CC";
const GG_BLUE_BG = "linear-gradient(135deg,#0066CC,#0052A3)";
const F = "'Noto Sans KR','Malgun Gothic',sans-serif";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    // 사용자 역할 확인
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role, health_center_id")
      .eq("id", data.user.id)
      .single();

    if (userError || !user) {
      setError("사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.");
      setLoading(false);
      return;
    }

    if (user.role === "citizen") {
      setError("관리자 권한이 없는 계정입니다.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    navigate("/admin/dashboard");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#f0f4ff,#e8f4fd)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: F,
      padding: 20,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        padding: "48px 36px",
        maxWidth: 400,
        width: "100%",
        boxShadow: "0 8px 32px rgba(0,102,204,.12)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: GG_BLUE_BG, display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 28 }}>🔐</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#333", margin: "0 0 6px" }}>
            관리자 로그인
          </h1>
          <p style={{ fontSize: 14, color: "#999", margin: 0 }}>
            경기도 보건소 건강증진 관리 시스템
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              style={{
                width: "100%", padding: "14px 16px", border: "1px solid #ddd",
                borderRadius: 12, fontSize: 16, fontFamily: F, color: "#333",
                background: "#fafafa", boxSizing: "border-box",
                outline: "none", transition: "border .2s",
              }}
              onFocus={(e) => e.target.style.borderColor = GG_BLUE}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              required
              style={{
                width: "100%", padding: "14px 16px", border: "1px solid #ddd",
                borderRadius: 12, fontSize: 16, fontFamily: F, color: "#333",
                background: "#fafafa", boxSizing: "border-box",
                outline: "none", transition: "border .2s",
              }}
              onFocus={(e) => e.target.style.borderColor = GG_BLUE}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
          </div>

          {error && (
            <div style={{
              background: "#FEF2F2", color: "#DC2626", fontSize: 14,
              padding: "12px 16px", borderRadius: 10, marginBottom: 16,
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: 16, background: loading ? "#93c5fd" : GG_BLUE_BG,
              color: "#fff", border: "none", borderRadius: 12, fontSize: 17,
              fontWeight: 700, fontFamily: F, cursor: loading ? "wait" : "pointer",
              boxShadow: "0 4px 16px rgba(0,102,204,.25)",
            }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <a href="/" style={{ fontSize: 14, color: "#999", textDecoration: "none" }}>
            ← 건강나이 측정으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
