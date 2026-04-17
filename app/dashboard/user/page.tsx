"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import NavBar from "@/components/NavBar";
import { authApi, UserProfile } from "@/lib/api";
import { Laptop, Smartphone, Monitor, ShieldCheck, Key, RefreshCw, LogOut, Clock, Lock, CheckCircle2 } from "lucide-react";

const mockActivity = [
  { date:"Apr 10", logins:2 },{ date:"Apr 11", logins:1 },{ date:"Apr 12", logins:3 },
  { date:"Apr 13", logins:0 },{ date:"Apr 14", logins:2 },{ date:"Apr 15", logins:1 },{ date:"Apr 16", logins:2 },
];

export default function UserDashboard() {
  const { session, isLoading, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [expiresIn, setExpiresIn] = useState(900);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoading && !session) router.replace("/login");
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session) return;
    authApi.me(session.access_token).then(r => { if (r.data) setProfile(r.data); });
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const update = () => setExpiresIn(Math.max(0, Math.floor((session.expires_at - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [session]);

  function copyToken() {
    if (session?.access_token) { navigator.clipboard.writeText(session.access_token); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  }
  function handleLogout() { logout(); router.push("/login"); }

  const deviceIcon = (d: string) => d.includes("iPhone")||d.includes("Android") ? <Smartphone size={14}/> : d.includes("Mac")||d.includes("PC") ? <Laptop size={14}/> : <Monitor size={14}/>;

  if (!mounted || isLoading || !session) return null;
  const user = profile ?? session.user;
  const expiryPct = Math.max(0, (expiresIn / 900) * 100);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <NavBar />
      <main style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px 64px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--surface)", border:"1px solid var(--border)", borderLeft:"3px solid var(--user)", borderRadius:10, padding:"20px 24px", marginBottom:24, flexWrap:"wrap", gap:12 }} className="animate-fade-up stagger-1">
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:48, height:48, borderRadius:"50%", background:"var(--user-dim)", color:"var(--user)", border:"2px solid rgba(85,184,130,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700 }}>{user.avatar}</div>
            <div>
              <h1 style={{ fontFamily:"var(--font-display)", fontSize:24, fontWeight:400, margin:"0 0 4px", color:"var(--text)" }}>Hello, {user.name.split(" ")[0]}</h1>
              <p style={{ fontSize:12, color:"var(--text-muted)", margin:0 }}><Clock size={11} style={{ marginRight:3, verticalAlign:"middle" }}/>Last login · {user.lastLogin ? new Date(user.lastLogin).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"}</p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", background:"var(--user-dim)", border:"1px solid rgba(85,184,130,0.2)", borderRadius:20, fontSize:12, color:"var(--user)", fontWeight:500 }}>
            <ShieldCheck size={14} color="var(--user)"/><span>Authenticated</span>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <section style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:20 }} className="animate-fade-up stagger-2">
            <h2 style={{ fontSize:14, fontWeight:600, margin:"0 0 16px" }}>Profile</h2>
            {[
              { label:"User ID",       val:user.id.substring(0,18)+"…", mono:true },
              { label:"Email",         val:user.email, mono:true },
              { label:"Department",    val:user.department??"—", mono:false },
              { label:"Account created", val:new Date(user.created_at).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}), mono:false },
            ].map(row => (
              <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:12, marginBottom:12, borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontSize:12, color:"var(--text-muted)" }}>{row.label}</span>
                <span style={{ fontSize:row.mono?12:13, color:"var(--text)", fontFamily:row.mono?"var(--font-mono)":undefined, textAlign:"right" }}>{row.val}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"var(--text-muted)" }}>Roles</span>
              <div style={{ display:"flex", gap:5 }}>{user.roles.map(r => <span key={r} style={{ padding:"3px 9px", borderRadius:4, fontSize:10, fontFamily:"var(--font-mono)", background:r==="ADMIN"?"rgba(123,111,232,0.15)":"rgba(85,184,130,0.15)", color:r==="ADMIN"?"#7b6fe8":"#55b882" }}>{r}</span>)}</div>
            </div>
          </section>

          <section style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:20 }} className="animate-fade-up stagger-3">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <h2 style={{ fontSize:14, fontWeight:600, margin:0 }}>Active Token</h2>
              <span style={{ padding:"3px 8px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:4, fontSize:10, fontFamily:"var(--font-mono)", color:"var(--accent)" }}>HS256</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:8, padding:"11px 14px", marginBottom:14, gap:10 }}>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-muted)", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{session.access_token.substring(0,36)}…</p>
              <button style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:5, color:"var(--text-muted)", fontSize:11, cursor:"pointer", fontFamily:"var(--font-body)", flexShrink:0 }} onClick={copyToken}>
                {copied?<CheckCircle2 size={13} color="var(--success)"/>:<Key size={13}/>}{copied?"Copied!":"Copy"}
              </button>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, color:"var(--text-muted)" }}>Expires in</span>
                <span style={{ fontSize:12, fontFamily:"var(--font-mono)", fontWeight:500, color:expiryPct<25?"var(--danger)":"var(--accent)" }}>{expiresIn>0?`${Math.floor(expiresIn/60)}m ${expiresIn%60}s`:"Expired"}</span>
              </div>
              <div style={{ height:4, background:"var(--surface-2)", borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:2, width:`${expiryPct}%`, background:expiryPct<25?"var(--danger)":"var(--accent)", transition:"width 1s linear" }}/>
              </div>
            </div>
            {[{icon:<Lock size={12}/>,label:"Token type",val:"Bearer"},{icon:<RefreshCw size={12}/>,label:"Refresh TTL",val:"7 days"}].map(m => (
              <div key={m.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--text-muted)" }}>{m.icon}{m.label}</span>
                <span style={{ fontSize:12, fontFamily:"var(--font-mono)" }}>{m.val}</span>
              </div>
            ))}
          </section>

          <section style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:20 }} className="animate-fade-up stagger-4">
            <h2 style={{ fontSize:14, fontWeight:600, margin:"0 0 16px" }}>Login Activity — Past 7 Days</h2>
            <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80, marginBottom:12 }}>
              {mockActivity.map(d => (
                <div key={d.date} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6, height:"100%" }}>
                  <div style={{ flex:1, width:"100%", display:"flex", alignItems:"flex-end" }}>
                    <div style={{ width:"100%", background:"var(--user)", borderRadius:"3px 3px 0 0", minHeight:2, height:`${(d.logins/3)*100}%`, opacity:d.logins===0?0.15:1 }}/>
                  </div>
                  <span style={{ fontSize:10, color:"var(--text-dim)", fontFamily:"var(--font-mono)" }}>{d.date.split(" ")[1]}</span>
                </div>
              ))}
            </div>
          </section>

          <section style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:20 }} className="animate-fade-up stagger-5">
            <h2 style={{ fontSize:14, fontWeight:600, margin:"0 0 16px" }}>Active Sessions</h2>
            <p style={{ fontSize:12, color:"var(--text-muted)", marginBottom:12 }}>Session data is managed server-side. Use the logout button to end your current session.</p>
            <button style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:10, background:"rgba(224,85,85,0.07)", border:"1px solid rgba(224,85,85,0.2)", borderRadius:7, color:"var(--danger)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)" }} onClick={handleLogout}>
              <LogOut size={14}/> Sign out all devices
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
