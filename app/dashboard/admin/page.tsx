"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import NavBar from "@/components/NavBar";
import { usersApi, AdminStats } from "@/lib/api";
import { Users, Activity, TrendingUp, Cpu, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Clock, ChevronRight } from "lucide-react";

const statusIcon: Record<string, React.ReactNode> = {
  success: <CheckCircle2 size={13} color="var(--success)"/>,
  failed:  <XCircle size={13} color="var(--danger)"/>,
  warning: <AlertTriangle size={13} color="var(--warning)"/>,
};
const statusStyle: Record<string, React.CSSProperties> = {
  success: { color:"var(--success)", background:"rgba(85,184,130,0.08)", border:"1px solid rgba(85,184,130,0.2)" },
  failed:  { color:"var(--danger)",  background:"rgba(224,85,85,0.08)",  border:"1px solid rgba(224,85,85,0.2)" },
  warning: { color:"var(--warning)", background:"rgba(224,160,85,0.08)", border:"1px solid rgba(224,160,85,0.2)" },
};

export default function AdminDashboard() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [fetching, setFetching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isLoading && !session) { router.replace("/login"); return; }
    if (!isLoading && session && !session.user.roles.includes("ADMIN")) router.replace("/dashboard/user");
  }, [session, isLoading, router]);

  async function load() {
    if (!session) return;
    setFetching(true); setApiError(null);
    const r = await usersApi.getAdminStats(session.access_token);
    setFetching(false);
    if (r.data) setStats(r.data);
    else setApiError(r.error ?? "Failed to load stats");
  }

  useEffect(() => { if (session) load(); }, [session]);

  if (!mounted || isLoading || !session) return null;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <NavBar />
      <main style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px 64px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }} className="animate-fade-up stagger-1">
          <div>
            <h1 style={{ fontFamily:"var(--font-display)", fontSize:30, fontWeight:400, margin:"0 0 4px", color:"var(--text)" }}>Admin Console</h1>
            <p style={{ fontSize:12, color:"var(--text-muted)", margin:0 }}><Clock size={12} style={{ marginRight:4, verticalAlign:"middle" }}/>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</p>
          </div>
          <button style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text-muted)", fontSize:12, cursor:"pointer", fontFamily:"var(--font-body)" }} onClick={load}>
            <RefreshCw size={14}/> Refresh
          </button>
        </div>

        {apiError && <div style={{ padding:"12px 16px", background:"rgba(224,85,85,0.08)", border:"1px solid rgba(224,85,85,0.25)", borderRadius:8, color:"var(--danger)", fontSize:13, marginBottom:20 }}>{apiError}</div>}

        {fetching && !stats && <div style={{ color:"var(--text-muted)", fontSize:13, marginBottom:20 }}>Loading stats…</div>}

        {stats && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14, marginBottom:24 }} className="animate-fade-up stagger-2">
              {[
                { label:"Total Users",   value:stats.totalUsers.toLocaleString(),  sub:"+12% from last month",  color:"var(--admin)",   icon:<Users size={20}/> },
                { label:"Active Today",  value:stats.activeToday.toLocaleString(), sub:"42% of total base",      color:"var(--success)", icon:<Activity size={20}/> },
                { label:"New This Week", value:stats.newThisWeek,                  sub:"+8 from last week",      color:"var(--accent)",  icon:<TrendingUp size={20}/> },
                { label:"System Load",   value:`${stats.systemLoad}%`,             sub:"4 cores · 8 GB RAM",     color:"var(--warning)", icon:<Cpu size={20}/> },
              ].map(c => (
                <div key={c.label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderTop:`3px solid ${c.color}`, borderRadius:10, padding:"18px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <div>
                      <p style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"var(--font-mono)", letterSpacing:"0.06em", margin:"0 0 6px" }}>{c.label}</p>
                      <p style={{ fontFamily:"var(--font-display)", fontSize:28, margin:"0 0 4px", color:"var(--text)" }}>{c.value}</p>
                      <p style={{ fontSize:11, color:"var(--text-dim)", margin:0 }}>{c.sub}</p>
                    </div>
                    <div style={{ color:c.color, opacity:0.7 }}>{c.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:14, marginBottom:24 }}>
              <section style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:20 }} className="animate-fade-up stagger-3">
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <h2 style={{ fontSize:14, fontWeight:600, margin:0 }}>Recent Activity</h2>
                  <span style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 8px", background:"rgba(85,184,130,0.1)", border:"1px solid rgba(85,184,130,0.2)", borderRadius:4, color:"var(--success)", fontSize:10, fontFamily:"var(--font-mono)" }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--success)", display:"inline-block" }}/>LIVE
                  </span>
                </div>
                {stats.recentActivity.map(item => (
                  <div key={item.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:7 }}>
                    {statusIcon[item.status]}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontFamily:"var(--font-mono)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.user}</div>
                      <div style={{ fontSize:11, color:"var(--text-muted)" }}>{item.action}</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                      <span style={{ ...statusStyle[item.status], padding:"2px 7px", borderRadius:4, fontSize:10, fontFamily:"var(--font-mono)" }}>{item.status}</span>
                      <span style={{ fontSize:10, color:"var(--text-dim)" }}>{item.time}</span>
                    </div>
                  </div>
                ))}
                <button style={{ width:"100%", marginTop:12, padding:9, background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text-muted)", fontSize:12, cursor:"pointer", fontFamily:"var(--font-body)", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}
                  onClick={() => router.push("/dashboard/admin/audit-logs")}>
                  View all activity <ChevronRight size={13}/>
                </button>
              </section>

              <section style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:20 }} className="animate-fade-up stagger-4">
                <h2 style={{ fontSize:14, fontWeight:600, margin:"0 0 16px" }}>Token Config</h2>
                {[["algorithm","HS256"],["access_ttl","15 min"],["refresh_ttl","7 days"],["remember_me","30 days"],["lockout","5 attempts"]].map(([k,v]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                    <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{k}</span>
                    <span style={{ fontSize:12, color:"var(--accent)", fontFamily:"var(--font-mono)" }}>{v}</span>
                  </div>
                ))}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
