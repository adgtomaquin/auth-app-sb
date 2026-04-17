"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import NavBar from "@/components/NavBar";
import { settingsApi, SystemSettings } from "@/lib/api";
import { Shield, Clock, Users, Database, Save, CheckCircle2, RotateCcw } from "lucide-react";

const defaults: SystemSettings = { lockoutThreshold:5, lockoutDurationMinutes:15, accessTokenTtlSeconds:900, refreshTokenTtlDays:7, rememberMeTtlDays:30, requireMfa:false, allowedDomains:"example.com, corp.com", sessionConcurrencyLimit:5, auditRetentionDays:90 };

export default function AdminSettingsPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({...defaults});
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("auth");
  const [apiError, setApiError] = useState<string|null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isLoading && !session) router.replace("/login");
    if (!isLoading && session && !session.user.roles.includes("ADMIN")) router.replace("/dashboard/user");
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session) return;
    settingsApi.get(session.access_token).then(r => { if (r.data) setSettings(r.data); });
  }, [session]);

  async function handleSave() {
    if (!session) return;
    const r = await settingsApi.update(session.access_token, settings);
    if (r.data) { setSettings(r.data); setSaved(true); setTimeout(()=>setSaved(false), 2000); }
    else setApiError(r.error ?? "Save failed");
  }

  if (!mounted || isLoading || !session) return null;

  const sections = [
    { id:"auth",   icon:<Shield size={14}/>,   label:"Authentication" },
    { id:"tokens", icon:<Clock size={14}/>,    label:"Token Policy" },
    { id:"users",  icon:<Users size={14}/>,    label:"User Policy" },
    { id:"system", icon:<Database size={14}/>, label:"System" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <NavBar/>
      <main style={{ maxWidth:1000, margin:"0 auto", padding:"32px 24px 64px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }} className="animate-fade-up stagger-1">
          <div>
            <h1 style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:400, margin:"0 0 4px", color:"var(--text)" }}>System Settings</h1>
            <p style={{ fontSize:13, color:"var(--text-muted)", margin:0 }}>Configure authentication policies and system behaviour</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text-muted)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)" }} onClick={()=>setSettings({...defaults})}><RotateCcw size={14}/> Reset Defaults</button>
            <button style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", border:"none", borderRadius:7, color:"#0a0a0f", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)", background:saved?"var(--success)":"var(--accent)", transition:"background 0.3s" }} onClick={handleSave}>
              {saved?<CheckCircle2 size={14}/>:<Save size={14}/>}{saved?"Saved!":"Save Changes"}
            </button>
          </div>
        </div>
        {apiError && <div style={{ padding:"12px 16px", background:"rgba(224,85,85,0.08)", border:"1px solid rgba(224,85,85,0.2)", borderRadius:8, color:"var(--danger)", fontSize:13, marginBottom:16 }}>{apiError}</div>}
        <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:24, alignItems:"start" }}>
          <nav style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:8, display:"flex", flexDirection:"column", gap:2 }} className="animate-fade-up stagger-2">
            {sections.map(s => (
              <button key={s.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderRadius:7, border:"none", background:activeSection===s.id?"var(--surface-2)":"none", color:activeSection===s.id?"var(--text)":"var(--text-muted)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)", fontWeight:activeSection===s.id?500:400 }} onClick={()=>setActiveSection(s.id)}>
                {s.icon}{s.label}
              </button>
            ))}
          </nav>
          <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:24 }} className="animate-fade-up stagger-3">
            {activeSection==="auth" && <>
              <h2 style={{ fontSize:16, fontWeight:600, margin:"0 0 4px" }}>Authentication Policy</h2>
              <p style={{ fontSize:12, color:"var(--text-muted)", margin:"0 0 20px" }}>Control login behaviour and account security</p>
              <Row label="MFA Required" desc="Force all users to enable multi-factor authentication"><Toggle checked={settings.requireMfa} onChange={v=>setSettings(p=>({...p,requireMfa:v}))}/></Row>
              <Row label="Allowed Email Domains" desc="Comma-separated list of permitted email domains"><input style={inputStyle} value={settings.allowedDomains} onChange={e=>setSettings(p=>({...p,allowedDomains:e.target.value}))}/></Row>
              <Row label="Max Concurrent Sessions" desc="Maximum simultaneous active sessions per user"><NumInput value={settings.sessionConcurrencyLimit} min={1} max={20} onChange={v=>setSettings(p=>({...p,sessionConcurrencyLimit:v}))} suffix="sessions"/></Row>
            </>}
            {activeSection==="tokens" && <>
              <h2 style={{ fontSize:16, fontWeight:600, margin:"0 0 4px" }}>Token Policy</h2>
              <p style={{ fontSize:12, color:"var(--text-muted)", margin:"0 0 20px" }}>Configure JWT and refresh token lifetimes</p>
              <Row label="Access Token TTL" desc="How long access tokens remain valid (seconds)"><NumInput value={settings.accessTokenTtlSeconds} min={60} max={3600} step={60} onChange={v=>setSettings(p=>({...p,accessTokenTtlSeconds:v}))} suffix="sec"/></Row>
              <Row label="Refresh Token TTL" desc="Default refresh token lifetime"><NumInput value={settings.refreshTokenTtlDays} min={1} max={90} onChange={v=>setSettings(p=>({...p,refreshTokenTtlDays:v}))} suffix="days"/></Row>
              <Row label="Remember Me TTL" desc="Extended refresh TTL when remember_me is enabled"><NumInput value={settings.rememberMeTtlDays} min={7} max={365} onChange={v=>setSettings(p=>({...p,rememberMeTtlDays:v}))} suffix="days"/></Row>
            </>}
            {activeSection==="users" && <>
              <h2 style={{ fontSize:16, fontWeight:600, margin:"0 0 4px" }}>User Policy</h2>
              <p style={{ fontSize:12, color:"var(--text-muted)", margin:"0 0 20px" }}>Account lockout and access controls</p>
              <Row label="Lockout Threshold" desc="Consecutive failed logins before account is locked"><NumInput value={settings.lockoutThreshold} min={1} max={20} onChange={v=>setSettings(p=>({...p,lockoutThreshold:v}))} suffix="attempts"/></Row>
              <Row label="Lockout Duration" desc="How long a locked account stays locked"><NumInput value={settings.lockoutDurationMinutes} min={1} max={1440} onChange={v=>setSettings(p=>({...p,lockoutDurationMinutes:v}))} suffix="min"/></Row>
            </>}
            {activeSection==="system" && <>
              <h2 style={{ fontSize:16, fontWeight:600, margin:"0 0 4px" }}>System</h2>
              <p style={{ fontSize:12, color:"var(--text-muted)", margin:"0 0 20px" }}>Data retention and system configuration</p>
              <Row label="Audit Log Retention" desc="How long audit log entries are kept"><NumInput value={settings.auditRetentionDays} min={7} max={365} onChange={v=>setSettings(p=>({...p,auditRetentionDays:v}))} suffix="days"/></Row>
              <Row label="Algorithm" desc="JWT signing algorithm (read-only)"><span style={{ padding:"7px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, fontSize:12, fontFamily:"var(--font-mono)", color:"var(--accent)" }}>HS256</span></Row>
            </>}
          </div>
        </div>
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width:260, padding:"8px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text)", fontSize:13, fontFamily:"var(--font-mono)", outline:"none" };

function Row({ label, desc, children }: { label:string; desc:string; children:React.ReactNode }) {
  return <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 0", borderBottom:"1px solid var(--border)", gap:20 }}>
    <div><div style={{ fontSize:13, fontWeight:500, color:"var(--text)", marginBottom:3 }}>{label}</div><div style={{ fontSize:12, color:"var(--text-muted)" }}>{desc}</div></div>
    <div style={{ flexShrink:0 }}>{children}</div>
  </div>;
}
function Toggle({ checked, onChange }: { checked:boolean; onChange:(v:boolean)=>void }) {
  return <button onClick={()=>onChange(!checked)} style={{ width:44, height:24, borderRadius:12, background:checked?"var(--success)":"var(--border)", border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
    <span style={{ position:"absolute", width:18, height:18, borderRadius:"50%", background:"#fff", top:3, left:checked?23:3, transition:"left 0.2s" }}/>
  </button>;
}
function NumInput({ value, min, max, step=1, onChange, suffix }: { value:number; min:number; max:number; step?:number; onChange:(v:number)=>void; suffix?:string }) {
  return <div style={{ display:"flex", alignItems:"center", gap:6 }}>
    <input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} style={{ width:80, padding:"7px 10px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text)", fontSize:13, fontFamily:"var(--font-mono)", outline:"none", textAlign:"right" }}/>
    {suffix && <span style={{ fontSize:12, color:"var(--text-muted)" }}>{suffix}</span>}
  </div>;
}
