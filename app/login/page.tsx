"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { authApi, saveSession } from "@/lib/api";
import { Eye, EyeOff, Lock, Mail, Shield, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { session, setSession } = useAuth();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    setMounted(true);
    if (session) router.replace(session.user.roles.includes("ADMIN") ? "/dashboard/admin" : "/dashboard/user");
  }, [session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError(""); setLoading(true);
    const result = await authApi.login(email, password, rememberMe);
    setLoading(false);
    if (result.error || !result.data) { setError(result.error ?? "Login failed."); return; }
    const s = saveSession(result.data);
    setSession(s);
    router.push(result.data.user.roles.includes("ADMIN") ? "/dashboard/admin" : "/dashboard/user");
  }

  if (!mounted) return null;

  return (
    <div style={S.root}>
      <div style={S.gridBg} />
      <div style={S.orb1} /><div style={S.orb2} />
      <div style={S.card} className="animate-fade-up stagger-1">
        <div style={S.brand} className="animate-fade-up stagger-1">
          <div style={S.logoWrap}><Shield size={22} color="var(--accent)" strokeWidth={1.5} /></div>
          <span style={S.brandName}>VAULT</span>
        </div>
        <div className="animate-fade-up stagger-2" style={{ marginBottom: 28 }}>
          <h1 style={S.title}>Welcome back</h1>
          <p style={S.subtitle}>Sign in to your secure workspace</p>
        </div>
        <form onSubmit={handleSubmit} style={S.form} className="animate-fade-up stagger-3">
          <div style={S.field}>
            <label style={S.label}>Email address</label>
            <div style={S.inputWrap}>
              <Mail size={15} color="var(--text-muted)" style={{ position:"absolute", left:13, pointerEvents:"none" }} />
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={S.input} autoComplete="email" />
            </div>
          </div>
          <div style={S.field}>
            <label style={S.label}>Password</label>
            <div style={S.inputWrap}>
              <Lock size={15} color="var(--text-muted)" style={{ position:"absolute", left:13, pointerEvents:"none" }} />
              <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={{ ...S.input, paddingRight:44 }} autoComplete="current-password" />
              <button type="button" onClick={()=>setShowPass(!showPass)} style={S.eyeBtn} tabIndex={-1}>
                {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>
          <label style={S.checkLabel}>
            <input type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} style={{ accentColor:"var(--accent)" }} />
            <span>Remember me for 30 days</span>
          </label>
          {error && <div style={S.errorBox}><AlertCircle size={14}/><span>{error}</span></div>}
          <button type="submit" disabled={loading} style={{ ...S.submitBtn, opacity: loading ? 0.6 : 1 }}>
            {loading ? <><span style={S.spinner}/>Authenticating…</> : <>Sign in<ArrowRight size={16} style={{ marginLeft:8 }}/></>}
          </button>
        </form>
        <div style={S.tokenInfo} className="animate-fade-up stagger-4">
          <div style={S.pill}><span style={S.mono}>HS256</span></div>
          <span style={{ fontSize:11, color:"var(--text-dim)" }}>15 min access token · rotating refresh</span>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px var(--surface-2) inset!important;-webkit-text-fill-color:var(--text)!important;}`}</style>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  root:        { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", position:"relative", overflow:"hidden", padding:24 },
  gridBg:      { position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(200,169,110,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(200,169,110,0.03) 1px,transparent 1px)", backgroundSize:"48px 48px", pointerEvents:"none" },
  orb1:        { position:"absolute", top:"-20%", left:"-10%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(123,111,232,0.06) 0%,transparent 70%)", pointerEvents:"none" },
  orb2:        { position:"absolute", bottom:"-20%", right:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(200,169,110,0.07) 0%,transparent 70%)", pointerEvents:"none" },
  card:        { width:"100%", maxWidth:420, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:"40px 36px", position:"relative", zIndex:1, boxShadow:"0 32px 80px rgba(0,0,0,0.6)" },
  brand:       { display:"flex", alignItems:"center", gap:10, marginBottom:32 },
  logoWrap:    { width:36, height:36, borderRadius:8, background:"var(--accent-glow)", border:"1px solid rgba(200,169,110,0.25)", display:"flex", alignItems:"center", justifyContent:"center" },
  brandName:   { fontFamily:"var(--font-mono)", fontSize:13, fontWeight:500, letterSpacing:"0.18em", color:"var(--accent)" },
  title:       { fontFamily:"var(--font-display)", fontSize:28, fontWeight:400, color:"var(--text)", margin:"0 0 6px" },
  subtitle:    { fontSize:14, color:"var(--text-muted)", margin:0, fontWeight:300 },
  form:        { display:"flex", flexDirection:"column", gap:16 },
  field:       { display:"flex", flexDirection:"column", gap:6 },
  label:       { fontSize:12, fontWeight:500, color:"var(--text-muted)", letterSpacing:"0.03em" },
  inputWrap:   { position:"relative", display:"flex", alignItems:"center" },
  input:       { width:"100%", padding:"11px 13px 11px 38px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text)", fontSize:14, fontFamily:"var(--font-body)", outline:"none" },
  eyeBtn:      { position:"absolute", right:12, background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", display:"flex", padding:4 },
  checkLabel:  { display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-muted)", cursor:"pointer" },
  errorBox:    { display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:"rgba(224,85,85,0.08)", border:"1px solid rgba(224,85,85,0.25)", borderRadius:8, color:"var(--danger)", fontSize:13 },
  submitBtn:   { display:"flex", alignItems:"center", justifyContent:"center", padding:13, background:"var(--accent)", color:"#0a0a0f", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)", marginTop:4 },
  spinner:     { width:15, height:15, border:"2px solid rgba(10,10,15,0.3)", borderTopColor:"#0a0a0f", borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block", marginRight:10 },
  tokenInfo:   { display:"flex", alignItems:"center", gap:8, marginTop:24, paddingTop:20, borderTop:"1px solid var(--border)" },
  pill:        { padding:"3px 7px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:4 },
  mono:        { fontFamily:"var(--font-mono)", fontSize:10, color:"var(--accent)", letterSpacing:"0.08em" },
};
