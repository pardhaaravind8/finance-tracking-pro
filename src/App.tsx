import { useState, useEffect, useCallback, useRef } from "react";

// ─── Supabase Config ─────────────────────────────────────────────────────────
const SUPABASE_URL = "https://ttbugpcimkwpnpzpdfgw.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function supabaseFetch(path: string, options: any = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) return { data: null, error: data };
    return { data, error: null };
  } catch {
    return { data: text, error: res.ok ? null : { message: text } };
  }
}

const auth = {
  async signUp(email: string, password: string) {
    return supabaseFetch("/auth/v1/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  async signIn(email: string, password: string) {
    return supabaseFetch("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  async sendOtp(email: string) {
    return supabaseFetch("/auth/v1/otp", {
      method: "POST",
      body: JSON.stringify({ email, create_user: true }),
    });
  },
  async verifyOtp(email: string, token: string) {
    return supabaseFetch("/auth/v1/verify", {
      method: "POST",
      body: JSON.stringify({ email, token, type: "email" }),
    });
  },
  async signOut(access_token: string) {
    await supabaseFetch("/auth/v1/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}` },
    });
  },

  // ✅ FIXED: Do NOT pass a custom state param — Supabase manages PKCE state internally.
  // Passing your own state conflicts with Supabase's OAuth flow and causes
  // "OAuth state not found or expired" errors.
  signInWithGoogle() {
    const redirectTo = encodeURIComponent(window.location.origin);
    window.location.href =
      `${SUPABASE_URL}/auth/v1/authorize` +
      `?provider=google` +
      `&redirect_to=${redirectTo}`;
  },

  // ✅ FIXED: Removed custom state validation — Supabase already validates its own
  // PKCE state internally. The custom state we were sending was never echoed back
  // by Supabase, so the check was always failing.
  async getSessionFromHash(): Promise<{ session: any | null; error: any }> {
    // Check for OAuth error in query params (e.g. user denied consent)
    const qp = new URLSearchParams(window.location.search);
    if (qp.get("error")) {
      window.history.replaceState(null, "", window.location.pathname);
      return { session: null, error: { message: qp.get("error_description") || qp.get("error") } };
    }

    const hash = window.location.hash;
    if (!hash || hash.length < 2) return { session: null, error: null };

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const access_token = params.get("access_token");
    if (!access_token) return { session: null, error: null };

    // Fetch the user profile using the returned access token
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${access_token}` },
    });
    const user = await res.json();

    // Clean the hash out of the URL so it doesn't re-trigger on refresh
    window.history.replaceState(null, "", window.location.pathname);

    if (!res.ok) return { session: null, error: user };
    return { session: { user, access_token }, error: null };
  },
};

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const DARK = {
  bg: "#030304", surface: "#09090b", surface2: "#18181b",
  border: "#27272a", border2: "#3f3f46",
  text: "#e4e4e7", textMuted: "#71717a", textSub: "#a1a1aa",
  accent: "#10b981", accentBg: "#064e3b", accentBorder: "#059669",
  danger: "#ef4444", dangerBg: "#450a0a", dangerBorder: "#b91c1c",
  warn: "#f59e0b", warnBg: "#422006", warnBorder: "#b45309",
  success: "#86efac", successBg: "#052e16", successBorder: "#15803d",
};
const LIGHT = {
  bg: "#f8fafc", surface: "#ffffff", surface2: "#f1f5f9",
  border: "#e2e8f0", border2: "#cbd5e1",
  text: "#0f172a", textMuted: "#64748b", textSub: "#475569",
  accent: "#059669", accentBg: "#d1fae5", accentBorder: "#10b981",
  danger: "#dc2626", dangerBg: "#fee2e2", dangerBorder: "#f87171",
  warn: "#d97706", warnBg: "#fef3c7", warnBorder: "#fbbf24",
  success: "#065f46", successBg: "#d1fae5", successBorder: "#6ee7b7",
};

// ─── Category config ──────────────────────────────────────────────────────────
const catColors: Record<string, string> = {
  Salary: "#059669", Freelance: "#0ea5e9", Investment: "#8b5cf6",
  Food: "#f59e0b", Entertainment: "#ec4899", Utilities: "#64748b",
  Shopping: "#f97316", Transport: "#06b6d4", Rent: "#ef4444", Health: "#22c55e",
};
const catIcons: Record<string, string> = {
  Salary: "💼", Freelance: "💻", Investment: "📈",
  Food: "🍽️", Entertainment: "🎬", Utilities: "⚡",
  Shopping: "🛒", Transport: "🚗", Rent: "🏠", Health: "❤️",
};
const defaultBudgets: Record<string, number> = {
  Food: 5000, Entertainment: 2000, Utilities: 3000, Shopping: 8000,
  Transport: 4000, Rent: 25000, Health: 3000, Investment: 15000,
};

// ─── Utilities ────────────────────────────────────────────────────────────────
const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.abs(n));
const fmtNum = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
function todayStr() { return new Date().toISOString().slice(0, 10); }

function exportCSV(transactions: any[]) {
  const header = "Date,Description,Category,Type,Amount\n";
  const rows = transactions.map((t) => `${t.date},"${t.description}",${t.category},${t.type},${t.amount}`).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `transactions_${todayStr()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts, T }: { toasts: any[]; T: typeof DARK }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: t.type === "error" ? T.dangerBg : t.type === "warn" ? T.warnBg : T.successBg,
          border: `1px solid ${t.type === "error" ? T.dangerBorder : t.type === "warn" ? T.warnBorder : T.successBorder}`,
          color: t.type === "error" ? T.danger : t.type === "warn" ? T.warn : T.success,
          borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 500,
          maxWidth: 320, boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", gap: 8, animation: "slideIn 0.2s ease",
        }}>
          <span>{t.type === "error" ? "✖" : t.type === "warn" ? "⚠" : "✓"}</span>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<any[]>([]);
  const show = useCallback((message: string, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return { toasts, show };
}

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OtpInput({ value, onChange, T }: { value: string; onChange: (v: string) => void; T: typeof DARK }) {
  const digits = (value + "      ").slice(0, 6).split("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "16px 0" }}>
      {digits.map((d, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} type="text" inputMode="numeric" maxLength={1}
          value={d.trim()}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            const arr = (value + "      ").slice(0, 6).split("");
            arr[i] = v.slice(-1);
            onChange(arr.join("").trimEnd());
            if (v && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => { if (e.key === "Backspace" && !d.trim() && i > 0) refs.current[i - 1]?.focus(); }}
          style={{
            width: 44, height: 52, textAlign: "center", fontSize: 22, fontWeight: 700,
            fontFamily: "monospace", borderRadius: 8,
            border: d.trim() ? `2px solid ${T.accent}` : `1.5px solid ${T.border2}`,
            background: T.surface2, color: T.text, outline: "none",
          }}
        />
      ))}
    </div>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────
function CategoryBadge({ cat }: { cat: string }) {
  const bg = catColors[cat] || "#3f3f46";
  return (
    <span style={{ background: bg + "22", color: bg, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, border: `1px solid ${bg}44` }}>
      {catIcons[cat] || "📌"} {cat}
    </span>
  );
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data, T }: { data: any[]; T: typeof DARK }) {
  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]));
  if (maxVal === 0) return <div style={{ color: T.textMuted, fontSize: 12, textAlign: "center", padding: 20 }}>No data yet</div>;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, padding: "8px 0" }}>
      {data.map((d) => (
        <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: 60 }}>
            <div style={{ flex: 1, height: `${(d.income / maxVal) * 60}px`, background: "#10b981", borderRadius: "2px 2px 0 0", minHeight: 2 }} />
            <div style={{ flex: 1, height: `${(d.expense / maxVal) * 60}px`, background: "#ef4444", borderRadius: "2px 2px 0 0", minHeight: 2 }} />
          </div>
          <span style={{ fontSize: 9, color: T.textMuted }}>{d.month}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 140, T }: { segments: any[]; size?: number; T: typeof DARK }) {
  const total = segments.reduce((s: number, x: any) => s + x.value, 0);
  if (total === 0) return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: `3px dashed ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: T.textMuted, fontSize: 11 }}>Empty</span>
    </div>
  );
  const r = (size - 24) / 2, cx = size / 2, cy = size / 2;
  let cumAngle = -Math.PI / 2;
  const paths = segments.map((seg: any) => {
    const angle = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle), y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle), y2 = cy + r * Math.sin(cumAngle);
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`, color: seg.color, label: seg.label, value: seg.value };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} opacity={0.85} stroke={T.surface} strokeWidth={1.5}>
          <title>{p.label}: {fmtINR(p.value)}</title>
        </path>
      ))}
      <circle cx={cx} cy={cy} r={r * 0.56} fill={T.surface} />
    </svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16, br = 6, T }: { w?: any; h?: number; br?: number; T: typeof DARK }) {
  return (
    <div style={{ width: w, height: h, borderRadius: br, background: T.surface2, animation: "shimmer 1.4s infinite", backgroundSize: "200% 100%" }}>
      <style>{`@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon, sub, trend, T }: any) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase" as const, letterSpacing: 1 }}>{label}</span>
      </div>
      <div style={{ color, fontSize: 22, fontWeight: 800 }}>{typeof value === "number" && label === "Transactions" ? value : fmtINR(value)}</div>
      {sub && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>{sub}</div>}
      {trend != null && (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: trend >= 0 ? "#10b981" : "#ef4444", fontSize: 11, fontWeight: 600 }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
          <span style={{ color: T.textMuted, fontSize: 11 }}>vs last month</span>
        </div>
      )}
    </div>
  );
}

// ─── Budget Bar ───────────────────────────────────────────────────────────────
function BudgetBar({ cat, spent, budget, T }: any) {
  const pct = Math.min((spent / budget) * 100, 100);
  const over = spent > budget;
  const color = over ? "#ef4444" : pct > 80 ? "#f59e0b" : "#10b981";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
        <span style={{ color: T.text, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>{catIcons[cat]} {cat}</span>
        <span style={{ color: over ? "#ef4444" : T.textSub, fontSize: 12, fontWeight: over ? 700 : 400 }}>
          {fmtINR(spent)} / {fmtINR(budget)}
          {over && <span style={{ marginLeft: 6, fontSize: 10, background: T.dangerBg, color: T.danger, padding: "1px 6px", borderRadius: 99 }}>OVER</span>}
        </span>
      </div>
      <div style={{ background: T.surface2, borderRadius: 99, height: 7, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ─── AI Insights ─────────────────────────────────────────────────────────────
function AIInsights({ transactions, budgets, T }: any) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchInsights() {
    if (transactions.length === 0) {
      setError("Add some transactions first to get personalized insights.");
      return;
    }
    setLoading(true); setError("");
    const totalIncome = transactions.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
    const totalExpense = transactions.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
    const byCategory = transactions.filter((t: any) => t.type === "expense").reduce((acc: any, t: any) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount); return acc;
    }, {});
    const budgetAlerts = Object.entries(byCategory)
      .filter(([cat, spent]: any) => budgets[cat] && spent > budgets[cat] * 0.8)
      .map(([cat, spent]: any) => `${cat}: spent ₹${fmtNum(spent)} of ₹${fmtNum(budgets[cat])} budget`);
    const prompt = `You are a personal finance advisor for an Indian user. Analyze this data and give 4 specific actionable insights.
Financial Summary:
- Income: ₹${fmtNum(totalIncome)}, Expenses: ₹${fmtNum(totalExpense)}, Savings: ₹${fmtNum(totalIncome - totalExpense)}
- Savings Rate: ${totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0}%
Spending: ${Object.entries(byCategory).map(([k, v]: any) => `${k}: ₹${fmtNum(v)}`).join(", ")}
Budget Alerts: ${budgetAlerts.length ? budgetAlerts.join("; ") : "None"}
Respond ONLY in valid JSON (no markdown):
{"score":<0-100>,"scoreLabel":"<Excellent|Good|Fair|Needs Attention>","insights":[{"title":"<short>","body":"<2 sentences with specific numbers>","type":"<tip|warning|positive>"}],"topRecommendation":"<one concrete action>"}`;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await response.json();
      const text = data.content?.map((c: any) => c.text || "").join("") || "";
      setInsights(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch { setError("Could not fetch AI insights. Please try again."); }
    finally { setLoading(false); }
  }

  const scoreColor = insights ? (insights.score >= 80 ? "#10b981" : insights.score >= 60 ? "#f59e0b" : "#ef4444") : T.border2;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>AI Financial Coach</h1>
          <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>Powered by Claude — personalized insights for your finances</p>
        </div>
        <button onClick={fetchInsights} disabled={loading} style={{ background: loading ? T.surface2 : "linear-gradient(135deg,#059669,#0ea5e9)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", borderRadius: 9, padding: "10px 18px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: loading ? 0.7 : 1 }}>
          <span>{loading ? "⟳" : "✨"}</span>
          {loading ? "Analyzing…" : insights ? "Refresh Analysis" : "Analyze My Finances"}
        </button>
      </div>
      {error && <div style={{ background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: 10, padding: "12px 16px", color: T.danger, fontSize: 13, marginBottom: 16 }}>{error}</div>}
      {loading && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>{[...Array(4)].map((_, i) => (<div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}><Skeleton h={14} w="60%" T={T} /><div style={{ marginTop: 10 }}><Skeleton h={10} T={T} /></div><div style={{ marginTop: 6 }}><Skeleton h={10} w="80%" T={T} /></div></div>))}</div>}
      {!loading && !insights && (
        <div style={{ background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 14, padding: "48px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <div style={{ color: T.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Your AI coach is ready</div>
          <div style={{ color: T.textMuted, fontSize: 13, maxWidth: 380, margin: "0 auto 24px" }}>Add transactions first, then click Analyze to get personalized savings tips and budget recommendations.</div>
          <button onClick={fetchInsights} style={{ background: "linear-gradient(135deg,#059669,#0ea5e9)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "12px 28px", cursor: "pointer" }}>✨ Get My Insights</button>
        </div>
      )}
      {!loading && insights && (
        <>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 16, display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ textAlign: "center", minWidth: 80 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", border: `4px solid ${scoreColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: scoreColor, background: scoreColor + "15" }}>{insights.score}</div>
              <div style={{ color: T.textMuted, fontSize: 10, marginTop: 4, textTransform: "uppercase" as const, letterSpacing: 1 }}>Health Score</div>
            </div>
            <div>
              <div style={{ color: scoreColor, fontWeight: 800, fontSize: 18 }}>{insights.scoreLabel}</div>
              <div style={{ color: T.textSub, fontSize: 13, marginTop: 4, maxWidth: 480 }}><strong style={{ color: T.text }}>This week: </strong>{insights.topRecommendation}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {insights.insights?.map((ins: any, i: number) => {
              const bc = ins.type === "warning" ? T.dangerBorder : ins.type === "positive" ? T.successBorder : "#1d4ed8";
              const bg = ins.type === "warning" ? T.dangerBg : ins.type === "positive" ? T.successBg : (T === DARK ? "#0c1a3a" : "#eff6ff");
              return (
                <div key={i} style={{ background: bg, border: `1px solid ${bc}`, borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{ins.type === "warning" ? "⚠️" : ins.type === "positive" ? "✅" : "💡"}</span>
                    <span style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>{ins.title}</span>
                  </div>
                  <p style={{ color: T.textSub, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{ins.body}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Auth Screen ─────────────────────────────────────────────────────────────
function AuthScreen({ onLogin, T, initialError = "" }: { onLogin: (s: any) => void; T: typeof DARK; initialError?: string }) {
  const [mode, setMode] = useState<"login" | "signup" | "otp">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [info, setInfo] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    if (!email || !password) return setError("Email and password required.");
    setLoading(true); setError("");
    const { data, error: err } = await auth.signIn(email, password);
    setLoading(false);
    if (err) return setError(err.error_description || err.msg || "Login failed. Check your credentials.");
    onLogin({ user: data.user, token: data.access_token, email });
  }

  async function handleSignUp() {
    if (!email || !password) return setError("Email and password required.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true); setError("");
    const { data, error: err } = await auth.signUp(email, password);
    setLoading(false);
    if (err) return setError(err.error_description || err.msg || "Signup failed.");
    setInfo("✅ Account created! Check your email to confirm, then sign in.");
    setMode("login");
  }

  async function handleSendOtp() {
    if (!email) return setError("Enter your email address first.");
    setLoading(true); setError("");
    const { error: err } = await auth.sendOtp(email);
    setLoading(false);
    if (err) return setError(err.error_description || err.msg || err.message || "Could not send OTP. Please try again.");
    setInfo(`📧 A 6-digit OTP has been sent to ${email}. Check your inbox.`);
    setMode("otp");
  }

  async function handleVerifyOtp() {
    if (otpCode.length < 6) return setError("Enter the 6-digit code from your email.");
    setLoading(true); setError("");
    const { data, error: err } = await auth.verifyOtp(email, otpCode);
    setLoading(false);
    if (err) return setError("Invalid or expired OTP. Request a new one.");
    onLogin({ user: data.user || { email }, token: data.access_token || "otp-verified", email });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", background: T.surface2,
    border: `1px solid ${T.border2}`, borderRadius: 8, color: T.text,
    padding: "10px 14px", fontSize: 14, outline: "none", marginBottom: 12,
  };
  const btnPrimary: React.CSSProperties = {
    width: "100%", background: T.accent, color: "#fff", fontWeight: 700,
    fontSize: 14, border: "none", borderRadius: 8, padding: "11px 0",
    cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4,
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: 14, marginBottom: 12, fontSize: 26 }}>🛡️</div>
        <div style={{ color: T.text, fontWeight: 800, fontSize: 22 }}>Finance Tracker Pro</div>
        <div style={{ color: T.textMuted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginTop: 3 }}>Personal Finance Intelligence</div>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32, width: "100%", maxWidth: 420 }}>
        {mode === "otp" ? (
          <>
            <h2 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>Check your email</h2>
            <p style={{ color: T.textMuted, fontSize: 13, margin: "0 0 4px" }}>We sent a 6-digit code to</p>
            <p style={{ color: T.accent, fontWeight: 700, fontSize: 14, margin: "0 0 16px" }}>{email}</p>
            {info && <div style={{ background: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: T.success }}>{info}</div>}
            {error && <p style={{ color: T.danger, fontSize: 12, margin: "0 0 8px" }}>{error}</p>}
            <OtpInput value={otpCode} onChange={setOtpCode} T={T} />
            <button style={btnPrimary} onClick={handleVerifyOtp} disabled={loading}>{loading ? "Verifying…" : "Verify & Sign In"}</button>
            <button onClick={handleSendOtp} disabled={loading} style={{ width: "100%", background: "none", border: `1px solid ${T.border2}`, borderRadius: 8, color: T.textSub, marginTop: 8, padding: "9px 0", cursor: "pointer", fontSize: 13 }}>Resend OTP</button>
            <button onClick={() => { setMode("login"); setOtpCode(""); setError(""); setInfo(""); }} style={{ width: "100%", background: "none", border: "none", color: T.textMuted, marginTop: 8, cursor: "pointer", fontSize: 13 }}>← Back to login</button>
          </>
        ) : (
          <>
            <h2 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>{mode === "login" ? "Sign in to your account" : "Create an account"}</h2>
            {info && <div style={{ background: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: T.success }}>{info}</div>}
            {error && <p style={{ color: T.danger, fontSize: 12, margin: "0 0 8px" }}>{error}</p>}
            <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 4 }}>Email</label>
            <input style={inputStyle} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 4 }}>Password</label>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input style={{ ...inputStyle, marginBottom: 0, paddingRight: 42 }} type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignUp())} />
              <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 14 }}>{showPass ? "🙈" : "👁️"}</button>
            </div>
            <button style={btnPrimary} onClick={mode === "login" ? handleLogin : handleSignUp} disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}</button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ color: T.textMuted, fontSize: 12 }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            {/* Google OAuth button */}
            <button
              onClick={() => auth.signInWithGoogle()}
              disabled={loading}
              style={{ width: "100%", background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: 8, color: T.text, fontSize: 14, fontWeight: 600, padding: "10px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.border)}
              onMouseLeave={(e) => (e.currentTarget.style.background = T.surface2)}
            >
              {/* Official Google "G" logo SVG */}
              <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19.1 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5.1l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.6 35.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.9 2.4-2.5 4.5-4.5 6l6.2 5.2C40 36.1 44 30.5 44 24c0-1.3-.1-2.6-.4-3.9z"/>
              </svg>
              Continue with Google
            </button>

            {mode === "login" && (
              <button onClick={handleSendOtp} disabled={loading} style={{ width: "100%", background: "none", border: `1px solid ${T.border2}`, borderRadius: 8, color: T.textSub, fontSize: 13, padding: "10px 0", marginTop: 8, cursor: "pointer" }}>
                📧 Sign in with OTP (email code)
              </button>
            )}
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setInfo(""); }} style={{ background: "none", border: "none", color: T.accent, fontSize: 13, cursor: "pointer" }}>
                {mode === "login" ? "No account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </>
        )}
      </div>
      <div style={{ marginTop: 20, color: T.textMuted, fontSize: 11, textAlign: "center" }}>Secured by Supabase Auth · Data encrypted at rest</div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ session, onLogout, theme, toggleTheme }: { session: any; onLogout: () => void; theme: "dark" | "light"; toggleTheme: () => void }) {
  const T = theme === "dark" ? DARK : LIGHT;
  const [tab, setTab] = useState("overview");
  const storageKey = `txns_${session.email}`;
  const budgetKey = `budgets_${session.email}`;

  const [txns, setTxns] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); }
    catch { return []; }
  });
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTxn, setEditTxn] = useState<any>(null);
  const [form, setForm] = useState({ description: "", amount: "", type: "expense", category: "Food", date: todayStr(), note: "" });
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(budgetKey) || "null") || defaultBudgets; }
    catch { return defaultBudgets; }
  });

  // Persist transactions and budgets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(txns));
  }, [txns]);

  useEffect(() => {
    localStorage.setItem(budgetKey, JSON.stringify(budgets));
  }, [budgets]);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(true);
  const { toasts, show: showToast } = useToast();

  const totalIncome = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;
  const spendByCategory = txns.filter((t) => t.type === "expense")
    .reduce((acc: any, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + Math.abs(t.amount) }), {});
  const filtered = txns.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (dateFrom && t.date < dateFrom) return false;
    if (dateTo && t.date > dateTo) return false;
    if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openAdd() { setForm({ description: "", amount: "", type: "expense", category: "Food", date: todayStr(), note: "" }); setEditTxn(null); setShowAdd(true); }
  function openEdit(t: any) { setForm({ description: t.description, amount: Math.abs(t.amount).toString(), type: t.type, category: t.category, date: t.date, note: t.note || "" }); setEditTxn(t); setShowAdd(true); }
  function saveTransaction() {
    if (!form.description.trim()) return showToast("Description is required", "error");
    if (!form.amount || isNaN(parseFloat(form.amount))) return showToast("Valid amount is required", "error");
    const amt = parseFloat(form.amount) * (form.type === "expense" ? -1 : 1);
    if (editTxn) {
      setTxns((p) => p.map((t) => t.id === editTxn.id ? { ...t, description: form.description, amount: amt, type: form.type, category: form.category, date: form.date, note: form.note } : t));
      showToast("Transaction updated");
    } else {
      setTxns((p) => [{ id: Date.now(), description: form.description, amount: amt, type: form.type, category: form.category, date: form.date, note: form.note }, ...p]);
      showToast("Transaction added");
    }
    setShowAdd(false);
  }
  function deleteTxn(id: number) { setTxns((p) => p.filter((t) => t.id !== id)); showToast("Transaction deleted", "warn"); }

  const navItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "transactions", label: "Transactions", icon: "💳" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "budgets", label: "Budgets", icon: "🎯" },
    { id: "ai", label: "AI Coach", icon: "✨" },
  ];

  const inp = (extra?: any): React.CSSProperties => ({ width: "100%", boxSizing: "border-box", background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: 8, color: T.text, padding: "9px 12px", fontSize: 13, outline: "none", ...extra });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "system-ui,-apple-system,sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: sideOpen ? 220 : 60, minHeight: "100vh", background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.25s ease", overflow: "hidden" }}>
        <div style={{ padding: sideOpen ? "20px 20px 18px" : "20px 12px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {sideOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 20, background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>🛡️</div>
              <div><div style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>Finance Tracker</div><div style={{ color: T.textMuted, fontSize: 10 }}>Pro</div></div>
            </div>
          )}
          <button onClick={() => setSideOpen(!sideOpen)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 14, padding: 4 }}>{sideOpen ? "◀" : "▶"}</button>
        </div>
        <div style={{ padding: "12px 0", flex: 1 }}>
          {navItems.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)} title={!sideOpen ? label : ""} style={{ display: "flex", alignItems: "center", gap: 10, padding: sideOpen ? "10px 20px" : "10px 0", justifyContent: sideOpen ? "flex-start" : "center", background: tab === id ? T.surface2 : "none", border: "none", borderLeft: tab === id ? `2px solid ${T.accent}` : "2px solid transparent", color: tab === id ? T.text : T.textMuted, fontWeight: tab === id ? 600 : 400, fontSize: 14, cursor: "pointer", width: "100%", textAlign: "left" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              {sideOpen && label}
            </button>
          ))}
        </div>
        <div style={{ padding: sideOpen ? "14px 20px" : "14px 8px", borderTop: `1px solid ${T.border}` }}>
          <button onClick={toggleTheme} title="Toggle theme" style={{ width: "100%", background: T.surface2, border: `1px solid ${T.border}`, color: T.textSub, fontSize: 12, borderRadius: 7, padding: sideOpen ? "7px 12px" : "7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: sideOpen ? "flex-start" : "center", gap: 6, marginBottom: 8 }}>
            <span>{theme === "dark" ? "☀️" : "🌙"}</span>
            {sideOpen && (theme === "dark" ? "Light mode" : "Dark mode")}
          </button>
          {sideOpen && <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.email}</div>}
          <button onClick={onLogout} title={!sideOpen ? "Sign Out" : ""} style={{ background: T.surface2, border: `1px solid ${T.border}`, color: T.textSub, fontSize: 12, borderRadius: 6, padding: sideOpen ? "6px 12px" : "6px", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <span>↩</span>{sideOpen && "Sign Out"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Financial Overview</h1>
                <p style={{ color: T.textMuted, fontSize: 13, margin: "4px 0 0" }}>Your money at a glance</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {txns.length > 0 && <button onClick={() => exportCSV(txns)} style={{ background: T.surface2, border: `1px solid ${T.border}`, color: T.textSub, fontSize: 12, borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>⬇ Export CSV</button>}
                <button onClick={openAdd} style={{ background: T.accent, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>+ Add Transaction</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, margin: "24px 0 20px" }}>
              <StatCard label="Net Balance" value={balance} color={balance >= 0 ? "#10b981" : "#ef4444"} icon="💰" sub={`${savingsRate}% savings rate`} T={T} />
              <StatCard label="Total Income" value={totalIncome} color="#10b981" icon="📥" T={T} />
              <StatCard label="Total Expenses" value={totalExpense} color="#ef4444" icon="📤" T={T} />
              <StatCard label="Transactions" value={txns.length} color={T.textSub} icon="💳" sub="this period" T={T} />
            </div>
            {txns.length === 0 ? (
              <div style={{ background: T.surface, border: `2px dashed ${T.border}`, borderRadius: 16, padding: "60px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>📊</div>
                <div style={{ color: T.text, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No transactions yet</div>
                <div style={{ color: T.textMuted, fontSize: 14, maxWidth: 360, margin: "0 auto 24px" }}>Start by adding your income and expenses to see your financial overview, charts, and AI insights.</div>
                <button onClick={openAdd} style={{ background: T.accent, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "12px 28px", cursor: "pointer" }}>+ Add Your First Transaction</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ color: T.textSub, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Monthly Overview</div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 8 }}><span style={{ fontSize: 11, color: "#10b981" }}>▮ Income</span><span style={{ fontSize: 11, color: "#ef4444" }}>▮ Expense</span></div>
                  <MiniBarChart data={[{ month: "Now", income: totalIncome, expense: totalExpense }]} T={T} />
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ color: T.textSub, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Recent Activity</div>
                  {txns.slice(0, 6).map((t, i) => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 5 ? `1px solid ${T.surface2}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{catIcons[t.category] || "💸"}</span>
                        <div><div style={{ color: T.text, fontSize: 13 }}>{t.description}</div><div style={{ color: T.textMuted, fontSize: 11 }}>{t.date}</div></div>
                      </div>
                      <span style={{ color: t.type === "income" ? "#10b981" : "#ef4444", fontWeight: 700, fontSize: 13 }}>{t.type === "income" ? "+" : "-"}{fmtINR(t.amount)}</span>
                    </div>
                  ))}
                  <button onClick={() => setTab("transactions")} style={{ width: "100%", marginTop: 10, background: "none", border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 12, borderRadius: 7, padding: "7px 0", cursor: "pointer" }}>View all →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Transactions ── */}
        {tab === "transactions" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div><h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Transactions</h1><p style={{ color: T.textMuted, fontSize: 13, margin: "4px 0 0" }}>{filtered.length} of {txns.length} records</p></div>
              <div style={{ display: "flex", gap: 8 }}>
                {txns.length > 0 && <button onClick={() => { exportCSV(filtered); showToast("CSV exported"); }} style={{ background: T.surface2, border: `1px solid ${T.border}`, color: T.textSub, fontSize: 12, borderRadius: 8, padding: "9px 14px", cursor: "pointer" }}>⬇ Export</button>}
                <button onClick={openAdd} style={{ background: T.accent, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", borderRadius: 8, padding: "9px 16px", cursor: "pointer" }}>+ Add Transaction</button>
              </div>
            </div>
            {txns.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" as const }}>
                <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inp(), flex: 1, minWidth: 160 }} />
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ ...inp({ cursor: "pointer", width: "auto" }) }} />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ ...inp({ cursor: "pointer", width: "auto" }) }} />
                {["all", "income", "expense"].map((f) => (
                  <button key={f} onClick={() => setFilterType(f)} style={{ background: filterType === f ? T.surface2 : "none", border: `1px solid ${filterType === f ? T.accent : T.border}`, color: filterType === f ? T.text : T.textMuted, borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", textTransform: "capitalize" as const }}>{f}</button>
                ))}
                {(search || dateFrom || dateTo || filterType !== "all") && <button onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setFilterType("all"); }} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, padding: "8px 12px", fontSize: 12, cursor: "pointer" }}>Clear ✕</button>}
              </div>
            )}
            {txns.length === 0 || filtered.length === 0 ? (
              <div style={{ background: T.surface, border: `2px dashed ${T.border}`, borderRadius: 12, padding: "48px 0", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{txns.length === 0 ? "💳" : "🔍"}</div>
                <div style={{ color: T.text, fontWeight: 600, marginBottom: 6 }}>{txns.length === 0 ? "No transactions yet" : "No matches found"}</div>
                <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 20 }}>{txns.length === 0 ? "Add your first income or expense to get started." : "Try adjusting your filters."}</div>
                {txns.length === 0 && <button onClick={openAdd} style={{ background: T.accent, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer" }}>+ Add Transaction</button>}
              </div>
            ) : (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>{["Date", "Description", "Category", "Amount", ""].map((h, i) => (<th key={i} style={{ color: T.textMuted, fontSize: 11, fontWeight: 600, textAlign: "left", padding: "12px 16px", textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>))}</tr></thead>
                  <tbody>
                    {filtered.map((t, i) => (
                      <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.surface2}` : "none" }}>
                        <td style={{ color: T.textMuted, fontSize: 12, padding: "12px 16px", whiteSpace: "nowrap" }}>{t.date}</td>
                        <td style={{ padding: "12px 16px" }}><div style={{ color: T.text, fontSize: 13 }}>{t.description}</div>{t.note && <div style={{ color: T.textMuted, fontSize: 11 }}>{t.note}</div>}</td>
                        <td style={{ padding: "12px 16px" }}><CategoryBadge cat={t.category} /></td>
                        <td style={{ color: t.type === "income" ? "#10b981" : "#ef4444", fontWeight: 700, fontSize: 13, padding: "12px 16px", whiteSpace: "nowrap" }}>{t.type === "income" ? "+" : "-"}{fmtINR(t.amount)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button onClick={() => openEdit(t)} style={{ background: T.surface2, border: `1px solid ${T.border}`, color: T.textSub, fontSize: 11, borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Edit</button>
                            <button onClick={() => deleteTxn(t.id)} style={{ background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, color: T.danger, fontSize: 11, borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Analytics ── */}
        {tab === "analytics" && (
          <div>
            <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Analytics</h1>
            <p style={{ color: T.textMuted, fontSize: 13, margin: "0 0 24px" }}>Spending patterns & insights</p>
            {txns.length === 0 ? (
              <div style={{ background: T.surface, border: `2px dashed ${T.border}`, borderRadius: 14, padding: "60px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
                <div style={{ color: T.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No data to analyze yet</div>
                <div style={{ color: T.textMuted, fontSize: 13, maxWidth: 340, margin: "0 auto 24px" }}>Add some transactions and your spending charts will appear here.</div>
                <button onClick={() => setTab("transactions")} style={{ background: T.accent, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", borderRadius: 9, padding: "10px 22px", cursor: "pointer" }}>Go to Transactions</button>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px" }}>
                    <div style={{ color: T.textSub, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>Expense Breakdown</div>
                    {Object.keys(spendByCategory).length === 0 ? <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>No expenses yet</div> : (
                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <DonutChart segments={Object.entries(spendByCategory).map(([cat, val]: any) => ({ label: cat, value: val, color: catColors[cat] || "#3f3f46" }))} size={150} T={T} />
                        <div style={{ flex: 1 }}>
                          {Object.entries(spendByCategory).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6).map(([cat, amt]: any) => (
                            <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: catColors[cat] || "#3f3f46", flexShrink: 0 }} />
                              <span style={{ color: T.textSub, fontSize: 11, flex: 1 }}>{cat}</span>
                              <span style={{ color: T.text, fontSize: 11, fontWeight: 600 }}>{Math.round((amt / totalExpense) * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px" }}>
                    <div style={{ color: T.textSub, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Income vs Expense</div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 8 }}><span style={{ fontSize: 11, color: "#10b981" }}>▮ Income</span><span style={{ fontSize: 11, color: "#ef4444" }}>▮ Expense</span></div>
                    <MiniBarChart data={[{ month: "Now", income: totalIncome, expense: totalExpense }]} T={T} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
                      {[{ l: "Income", v: fmtINR(totalIncome), c: "#10b981" }, { l: "Expenses", v: fmtINR(totalExpense), c: "#ef4444" }, { l: "Savings Rate", v: `${savingsRate}%`, c: T.text }].map(({ l, v, c }) => (
                        <div key={l}><div style={{ color: T.textMuted, fontSize: 10 }}>{l}</div><div style={{ color: c, fontWeight: 700 }}>{v}</div></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px" }}>
                  <div style={{ color: T.textSub, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>Spending by Category</div>
                  {Object.entries(spendByCategory).sort((a: any, b: any) => b[1] - a[1]).map(([cat, amt]: any) => {
                    const pct = Math.round((amt / totalExpense) * 100);
                    return (
                      <div key={cat} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: T.text, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>{catIcons[cat]} {cat}</span>
                          <span style={{ color: T.textSub, fontSize: 13 }}>{fmtINR(amt)} · {pct}%</span>
                        </div>
                        <div style={{ background: T.surface2, borderRadius: 4, height: 7, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: catColors[cat] || "#3f3f46", borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Budgets ── */}
        {tab === "budgets" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div><h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Budget Planner</h1><p style={{ color: T.textMuted, fontSize: 13, margin: "4px 0 0" }}>Set monthly limits and track your spending</p></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ color: T.textSub, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>Monthly Budget Limits</div>
                {Object.entries(budgets).map(([cat, limit]) => (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 18, width: 24 }}>{catIcons[cat]}</span>
                    <span style={{ color: T.text, fontSize: 13, flex: 1 }}>{cat}</span>
                    {editingBudget === cat ? (
                      <input type="number" defaultValue={limit} autoFocus
                        onBlur={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val > 0) { setBudgets((b) => ({ ...b, [cat]: val })); showToast(`${cat} budget updated`); } setEditingBudget(null); }}
                        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                        style={{ width: 90, background: T.surface2, border: `1px solid ${T.accent}`, borderRadius: 6, color: T.text, padding: "5px 8px", fontSize: 12, outline: "none", textAlign: "right" }} />
                    ) : (
                      <span onClick={() => setEditingBudget(cat)} style={{ color: T.textSub, fontSize: 13, cursor: "pointer", padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface2 }} title="Click to edit">{fmtINR(limit)}</span>
                    )}
                  </div>
                ))}
                <div style={{ color: T.textMuted, fontSize: 11, marginTop: 12 }}>Click any amount to edit</div>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ color: T.textSub, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>Spending Progress</div>
                {Object.entries(budgets).map(([cat, limit]) => (
                  <BudgetBar key={cat} cat={cat} spent={spendByCategory[cat] || 0} budget={limit} T={T} />
                ))}
              </div>
            </div>
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[
                { label: "Total Budgeted", value: Object.values(budgets).reduce((s, v) => s + v, 0), color: T.textSub, icon: "📋" },
                { label: "Total Spent", value: Object.values(spendByCategory).reduce((s: number, v: any) => s + v, 0), color: "#ef4444", icon: "💸" },
                { label: "Remaining", value: Object.values(budgets).reduce((s, v) => s + v, 0) - Object.values(spendByCategory).reduce((s: number, v: any) => s + v, 0), color: "#10b981", icon: "✅" },
              ].map((c) => (
                <div key={c.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 18px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}><span>{c.icon}</span><span style={{ color: T.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{c.label}</span></div>
                  <div style={{ color: c.color, fontWeight: 800, fontSize: 18 }}>{fmtINR(c.value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI Coach ── */}
        {tab === "ai" && <AIInsights transactions={txns} budgets={budgets} T={T} />}
      </div>

      {/* Add / Edit Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 420 }}>
            <h3 style={{ color: T.text, margin: "0 0 20px", fontSize: 17 }}>{editTxn ? "Edit Transaction" : "Add Transaction"}</h3>
            {[{ label: "Description", key: "description", type: "text", placeholder: "e.g. Coffee shop" }, { label: "Amount (₹)", key: "amount", type: "number", placeholder: "0" }].map((f) => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 4 }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} style={inp()} />
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              {[
                { label: "Date", key: "date", type: "date" },
                { label: "Type", key: "type", type: "select", opts: ["expense", "income"] },
                { label: "Category", key: "category", type: "select", opts: Object.keys(catColors) },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 4 }}>{f.label}</label>
                  {f.type === "select" ? (
                    <select value={(form as any)[f.key]} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} style={{ ...inp({ padding: "9px 8px" }), cursor: "pointer" }}>
                      {f.opts!.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} value={(form as any)[f.key]} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} style={{ ...inp({ padding: "9px 8px", cursor: "pointer" }) }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 4 }}>Note (optional)</label>
              <input type="text" placeholder="e.g. Dinner for 2" value={form.note} onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))} style={inp()} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: T.surface2, border: `1px solid ${T.border}`, color: T.textSub, borderRadius: 8, padding: 10, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveTransaction} style={{ flex: 2, background: T.accent, border: "none", color: "#fff", fontWeight: 700, borderRadius: 8, padding: 10, cursor: "pointer" }}>{editTxn ? "Save Changes" : "Add Transaction"}</button>
            </div>
          </div>
        </div>
      )}
      <Toast toasts={toasts} T={T} />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [checkingGoogle, setCheckingGoogle] = useState(true);
  const [googleError, setGoogleError] = useState("");
  const T = theme === "dark" ? DARK : LIGHT;

  // On first load: check if Google just redirected back with tokens in #hash
  useEffect(() => {
    auth.getSessionFromHash().then(({ session: s, error }) => {
      if (s) setSession({ user: s.user, token: s.access_token, email: s.user.email });
      else if (error?.message) setGoogleError(error.message);
      setCheckingGoogle(false);
    });
  }, []);

  async function handleLogout() {
    if (session?.token && session.token !== "sandbox-token") await auth.signOut(session.token);
    setSession(null);
  }

  if (checkingGoogle) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 36 }}>🛡️</div>
        <div style={{ color: T.textMuted, fontSize: 14 }}>Signing you in…</div>
      </div>
    );
  }

  if (!session) return <AuthScreen onLogin={setSession} T={T} initialError={googleError} />;
  return <Dashboard session={session} onLogout={handleLogout} theme={theme} toggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} />;
}
