"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import NavBar from "@/components/NavBar";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { usePagination } from "@/lib/hooks/usePagination";
import { auditApi, AuditLog, AuditSeverity, AuditStats } from "@/lib/api";
import { FileText, Search, AlertTriangle, CheckCircle2, XCircle, Download } from "lucide-react";

const sevIcon: Record<AuditSeverity, React.ReactNode> = {
  info:     <CheckCircle2 size={13} color="var(--success)"/>,
  warning:  <AlertTriangle size={13} color="var(--warning)"/>,
  critical: <XCircle size={13} color="var(--danger)"/>,
};
const sevVariant: Record<AuditSeverity, "success"|"warning"|"danger"> = { info:"success", warning:"warning", critical:"danger" };
const responseColors: Record<number, string> = { 200:"#55b882", 204:"#55b882", 400:"#e0a055", 401:"#e05555", 403:"#e05555", 422:"#e0a055", 423:"#e0a055", 500:"#e05555" };

function fmt(ts: string) { return ts==="—"?ts:new Date(ts).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); }

export default function AuditLogsPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs]   = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [statsData, setStatsData] = useState<AuditStats|null>(null);
  const [fetching, setFetching] = useState(false);
  const [apiError, setApiError] = useState<string|null>(null);
  const [search, setSearch]   = useState("");
  const [severity, setSeverity] = useState<AuditSeverity|"all">("all");
  const [expanded, setExpanded] = useState<string|null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isLoading && !session) router.replace("/login");
    if (!isLoading && session && !session.user.roles.includes("ADMIN")) router.replace("/dashboard/user");
  }, [session, isLoading, router]);

  const load = useCallback(async () => {
    if (!session) return;
    setFetching(true); setApiError(null);
    const [logsRes, statsRes] = await Promise.all([
      auditApi.list(session.access_token, { severity: severity==="all"?undefined:severity, search:search||undefined }),
      auditApi.stats(session.access_token),
    ]);
    setFetching(false);
    if (logsRes.data) { setLogs(logsRes.data.logs); setTotal(logsRes.data.total); }
    else setApiError(logsRes.error ?? "Failed to load logs");
    if (statsRes.data) setStatsData(statsRes.data);
  }, [session, severity, search]);

  useEffect(() => { if (session) load(); }, [session, severity]);

  const filtered = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter(l => l.actor.includes(q) || l.details.toLowerCase().includes(q) || (l.target??'').includes(q));
  }, [logs, search]);

  const { page, totalPages, pageItems, setPage, prev, next } = usePagination(filtered, 8);

  if (!mounted || isLoading || !session) return null;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <NavBar/>
      <main style={{ maxWidth:1200, margin:"0 auto", padding:"32px 24px 64px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }} className="animate-fade-up stagger-1">
          <div>
            <h1 style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:400, margin:"0 0 4px", color:"var(--text)" }}>Audit Logs</h1>
            <p style={{ fontSize:13, color:"var(--text-muted)", margin:0 }}>Complete record of all authentication events</p>
          </div>
          <button style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text-muted)", fontSize:12, cursor:"pointer", fontFamily:"var(--font-body)" }}>
            <Download size={14}/> Export CSV
          </button>
        </div>

        {apiError && <div style={{ padding:"12px 16px", background:"rgba(224,85,85,0.08)", border:"1px solid rgba(224,85,85,0.2)", borderRadius:8, color:"var(--danger)", fontSize:13, marginBottom:16 }}>{apiError}</div>}

        {statsData && (
          <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }} className="animate-fade-up stagger-2">
            {[{label:"Total",value:statsData.total,color:"var(--text-muted)"},{label:"Info",value:statsData.info,color:"var(--success)"},{label:"Warning",value:statsData.warning,color:"var(--warning)"},{label:"Critical",value:statsData.critical,color:"var(--danger)"}].map(s => (
              <div key={s.label} style={{ display:"flex", flexDirection:"column", padding:"12px 20px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, minWidth:100 }}>
                <span style={{ fontFamily:"var(--font-display)", fontSize:24, color:s.color, lineHeight:1 }}>{s.value}</span>
                <span style={{ fontSize:11, color:"var(--text-dim)", marginTop:4, fontFamily:"var(--font-mono)" }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }} className="animate-fade-up stagger-3">
          <div style={{ position:"relative", flex:1, minWidth:200 }}>
            <Search size={14} color="var(--text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}/>
            <input style={{ width:"100%", padding:"9px 12px 9px 36px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text)", fontSize:13, fontFamily:"var(--font-body)", outline:"none" }}
              placeholder="Search actor, target, details…" value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}/>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {(["all","info","warning","critical"] as const).map(s => (
              <button key={s} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:7, border:"1px solid var(--border)", background:severity===s?"var(--surface-2)":"var(--surface)", color:severity===s?"var(--text)":"var(--text-muted)", fontSize:12, cursor:"pointer", fontFamily:"var(--font-body)", borderColor:severity===s?"var(--accent)":"var(--border)" }}
                onClick={()=>{ setSeverity(s); setPage(1); }}>
                {s!=="all" && sevIcon[s as AuditSeverity]}{s}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }} className="animate-fade-up stagger-4">
          {fetching && <div style={{ padding:"12px 16px", fontSize:12, color:"var(--text-muted)" }}>Loading…</div>}
          {!fetching && pageItems.length === 0
            ? <EmptyState icon={<FileText size={32}/>} title="No logs found" description="Try adjusting your filters."/>
            : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>{["","Timestamp","Action","Actor","IP / Location","Severity"].map(h=><th key={h} style={{ textAlign:"left", padding:"10px 16px", fontSize:11, color:"var(--text-dim)", fontFamily:"var(--font-mono)", letterSpacing:"0.06em", borderBottom:"1px solid var(--border)", background:"var(--surface-2)" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {pageItems.map((log: AuditLog) => (
                    <>
                      <tr key={log.id} style={{ borderBottom:"1px solid var(--border)", cursor:"pointer" }} onClick={()=>setExpanded(expanded===log.id?null:log.id)}>
                        <td style={{ padding:"11px 16px", width:28, paddingRight:0 }}>{sevIcon[log.severity]}</td>
                        <td style={{ padding:"11px 16px", fontFamily:"var(--font-mono)", fontSize:11, whiteSpace:"nowrap" }}>{fmt(log.timestamp)}</td>
                        <td style={{ padding:"11px 16px", fontFamily:"var(--font-mono)", fontSize:12, color:"var(--accent)" }}>{log.action}</td>
                        <td style={{ padding:"11px 16px", fontSize:12 }}>
                          <div style={{ fontFamily:"var(--font-mono)" }}>{log.actor}</div>
                          {log.target && <div style={{ fontSize:11, color:"var(--text-muted)" }}>→ {log.target}</div>}
                        </td>
                        <td style={{ padding:"11px 16px", fontSize:11, color:"var(--text-muted)" }}>
                          <div style={{ fontFamily:"var(--font-mono)" }}>{log.ip}</div>
                          <div>{log.location}</div>
                        </td>
                        <td style={{ padding:"11px 16px" }}><Badge variant={sevVariant[log.severity]}>{log.severity}</Badge></td>
                      </tr>
                      {expanded === log.id && (
                        <tr key={`${log.id}-d`} style={{ background:"var(--surface-2)" }}>
                          <td colSpan={6} style={{ padding:"10px 16px 14px 44px" }}>
                            <div style={{ display:"flex", gap:12, marginBottom:4 }}><span style={{ fontSize:11, color:"var(--text-dim)", fontFamily:"var(--font-mono)", width:60 }}>Device</span><span style={{ fontSize:12, color:"var(--text-muted)" }}>{log.device}</span></div>
                            <div style={{ display:"flex", gap:12 }}><span style={{ fontSize:11, color:"var(--text-dim)", fontFamily:"var(--font-mono)", width:60 }}>Details</span><span style={{ fontSize:12, color:"var(--text-muted)" }}>{log.details}</span></div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )
          }
          {filtered.length > 8 && <div style={{ padding:"0 16px 8px" }}><Pagination page={page} totalPages={totalPages} onPrev={prev} onNext={next} onPage={setPage} total={filtered.length} pageSize={8}/></div>}
        </div>
      </main>
    </div>
  );
}
