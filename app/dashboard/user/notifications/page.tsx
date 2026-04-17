"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import NavBar from "@/components/NavBar";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { Bell, Shield, Info, AlertTriangle, Settings2, Trash2, CheckCheck } from "lucide-react";
import { NotifType } from "@/lib/api";

const typeIcon: Record<NotifType, React.ReactNode> = {
  security: <Shield size={15} color="#e05555"/>,
  system:   <Settings2 size={15} color="#7b6fe8"/>,
  info:     <Info size={15} color="#60a5fa"/>,
  warning:  <AlertTriangle size={15} color="#e0a055"/>,
};
const typeBadge: Record<NotifType, "danger"|"admin"|"info"|"warning"> = { security:"danger", system:"admin", info:"info", warning:"warning" };

export default function NotificationsPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<"all"|"unread">("all");

  useEffect(() => { setMounted(true); if (!isLoading && !session) router.replace("/login"); }, [session, isLoading, router]);

  const { items, unreadCount, loading, error, read, readAll, remove, refresh } = useNotifications(session?.access_token ?? "");

  useEffect(() => { if (session?.access_token) refresh(); }, [session?.access_token]);

  const filtered = filter === "unread" ? items.filter(n => !n.read) : items;

  if (!mounted || isLoading || !session) return null;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <NavBar/>
      <main style={{ maxWidth:800, margin:"0 auto", padding:"32px 24px 64px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }} className="animate-fade-up stagger-1">
          <div>
            <h1 style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:400, margin:"0 0 4px", color:"var(--text)" }}>Notifications</h1>
            <p style={{ fontSize:13, color:"var(--text-muted)", margin:0 }}>{unreadCount>0?`${unreadCount} unread`:"You're all caught up"}</p>
          </div>
          {unreadCount > 0 && <button style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:7, color:"var(--success)", fontSize:12, cursor:"pointer", fontFamily:"var(--font-body)" }} onClick={readAll}><CheckCheck size={14}/> Mark all as read</button>}
        </div>

        {error && <div style={{ padding:"12px 16px", background:"rgba(224,85,85,0.08)", border:"1px solid rgba(224,85,85,0.2)", borderRadius:8, color:"var(--danger)", fontSize:13, marginBottom:16 }}>{error}</div>}

        <div style={{ display:"flex", gap:6, marginBottom:16 }} className="animate-fade-up stagger-2">
          {(["all","unread"] as const).map(f => (
            <button key={f} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:7, border:"1px solid var(--border)", background:filter===f?"var(--surface-2)":"var(--surface)", color:filter===f?"var(--text)":"var(--text-muted)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)", borderColor:filter===f?"var(--accent)":"var(--border)" }} onClick={()=>setFilter(f)}>
              {f==="all"?"All":"Unread"}{f==="unread"&&unreadCount>0&&<span style={{ padding:"1px 6px", borderRadius:10, background:"var(--danger)", color:"#fff", fontSize:10, fontWeight:700 }}>{unreadCount}</span>}
            </button>
          ))}
        </div>

        <div className="animate-fade-up stagger-3">
          {loading && <div style={{ color:"var(--text-muted)", fontSize:13, padding:"20px 0" }}>Loading…</div>}
          {!loading && filtered.length === 0
            ? <EmptyState icon={<Bell size={32}/>} title="No notifications" description={filter==="unread"?"No unread notifications.":"Nothing here yet."}/>
            : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {filtered.map(n => (
                  <div key={n.id} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"16px 18px", background:n.read?"var(--surface)":"rgba(200,169,110,0.03)", border:`1px solid ${n.read?"var(--border)":"rgba(200,169,110,0.2)"}`, borderRadius:10, position:"relative" }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:"var(--surface-2)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>{typeIcon[n.type]}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                        <span style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>{n.title}</span>
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                          <Badge variant={typeBadge[n.type]}>{n.type}</Badge>
                          <span style={{ fontSize:11, color:"var(--text-dim)" }}>{n.time}</span>
                          {!n.read && <button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", display:"flex", padding:3 }} onClick={()=>read(n.id)}><CheckCheck size={13} color="var(--success)"/></button>}
                          <button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--danger)", display:"flex", padding:3 }} onClick={()=>remove(n.id)}><Trash2 size={13}/></button>
                        </div>
                      </div>
                      <p style={{ fontSize:13, color:"var(--text-muted)", margin:0, lineHeight:1.5 }}>{n.message}</p>
                    </div>
                    {!n.read && <div style={{ position:"absolute", top:18, right:18, width:8, height:8, borderRadius:"50%", background:"var(--accent)" }}/>}
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </main>
    </div>
  );
}
