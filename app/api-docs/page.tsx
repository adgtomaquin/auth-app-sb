"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import NavBar from "@/components/NavBar";
import Badge from "@/components/ui/Badge";
import { API_ENDPOINTS, API_SCHEMAS, ApiEndpoint } from "@/lib/mock-api-docs";
import { ChevronDown, Lock, Unlock, BookOpen, Send, CheckCircle2 } from "lucide-react";

const methodColors: Record<string, React.CSSProperties> = {
  GET:    { background: "rgba(85,184,130,0.12)",  color: "#55b882", border: "1px solid rgba(85,184,130,0.25)" },
  POST:   { background: "rgba(37,99,235,0.12)",   color: "#60a5fa", border: "1px solid rgba(37,99,235,0.25)" },
  PUT:    { background: "rgba(224,160,85,0.12)",  color: "#e0a055", border: "1px solid rgba(224,160,85,0.25)" },
  DELETE: { background: "rgba(224,85,85,0.12)",   color: "#e05555", border: "1px solid rgba(224,85,85,0.25)" },
  PATCH:  { background: "rgba(123,111,232,0.12)", color: "#7b6fe8", border: "1px solid rgba(123,111,232,0.25)" },
};

const responseColors: Record<number, string> = {
  200: "#55b882", 201: "#55b882", 204: "#55b882",
  400: "#e0a055", 401: "#e05555", 403: "#e05555",
  422: "#e0a055", 423: "#e0a055", 500: "#e05555",
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span style={{ ...methodColors[method], padding: "3px 8px", borderRadius: 4, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.04em" }}>
      {method}
    </span>
  );
}

function TryItPanel({ endpoint }: { endpoint: ApiEndpoint }) {
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    (endpoint.requestBody ?? []).forEach(p => { init[p.name] = p.example ?? ""; });
    return init;
  });
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock responses based on endpoint
  const mockResponses: Record<string, { status: number; body: object }> = {
    login: {
      status: 200,
      body: {
        access_token: "access_abc123xyz_" + Date.now(),
        refresh_token: "550e8400-e29b-41d4-a716-446655440000",
        token_type: "Bearer",
        expires_in: 900,
        refresh_expires_in: 604800,
      },
    },
    refresh: { status: 200, body: { access_token: "access_new_" + Date.now(), refresh_token: "new-uuid-token", token_type: "Bearer", expires_in: 900, refresh_expires_in: 604800 } },
    logout:  { status: 204, body: {} },
    getMe:   { status: 200, body: { id: "a0000000-0000-0000-0000-000000000001", email: "admin@example.com", roles: ["ADMIN", "USER"], created_at: "2026-04-15T09:00:00Z" } },
  };

  async function handleSend() {
    setLoading(true);
    setResponse(null);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
      const isGet = endpoint.method === "GET";
      const res = await fetch(`${API_BASE}${endpoint.path}`, {
        method: endpoint.method,
        headers: { "Content-Type": "application/json" },
        body: isGet ? undefined : JSON.stringify(fields),
      });
      const text = await res.text();
      let body = "";
      try { body = JSON.stringify(JSON.parse(text), null, 2); } catch { body = text || "(empty)"; }
      setResponse({ status: res.status, body });
    } catch {
      setResponse({ status: 0, body: "Network error — is the API server running?" });
    }
    setLoading(false);
  }

  return (
    <div style={tryStyles.root}>
      <div style={tryStyles.header}>
        <span style={tryStyles.title}>Try it out</span>
        {endpoint.requiresAuth && (
          <div style={tryStyles.authNote}>
            <Lock size={11} /> Requires Bearer token
          </div>
        )}
      </div>

      {(endpoint.requestBody ?? []).length > 0 && (
        <div style={tryStyles.fields}>
          {(endpoint.requestBody ?? []).map(param => (
            <div key={param.name} style={tryStyles.field}>
              <label style={tryStyles.label}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{param.name}</span>
                <span style={tryStyles.type}>{param.type}</span>
                {param.required && <span style={tryStyles.required}>required</span>}
              </label>
              <input
                style={tryStyles.input}
                placeholder={param.example ?? param.description}
                value={fields[param.name]}
                onChange={e => setFields(p => ({ ...p, [param.name]: e.target.value }))}
              />
              <span style={tryStyles.desc}>{param.description}</span>
            </div>
          ))}
        </div>
      )}

      <button style={{ ...tryStyles.sendBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSend} disabled={loading}>
        {loading ? "Sending…" : <><Send size={13} /> Execute</>}
      </button>

      {response && (
        <div style={tryStyles.response}>
          <div style={tryStyles.responseHeader}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: responseColors[response.status] ?? "#55b882", fontWeight: 700 }}>
              {response.status} {response.status === 204 ? "No Content" : "OK"}
            </span>
            <CheckCircle2 size={13} color={responseColors[response.status] ?? "#55b882"} />
          </div>
          {response.body !== "{}" && (
            <pre style={tryStyles.responseBody}>{response.body}</pre>
          )}
        </div>
      )}
    </div>
  );
}

const tryStyles: Record<string, React.CSSProperties> = {
  root: { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, marginTop: 16 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  title: { fontSize: 12, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" },
  authNote: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--warning)", fontFamily: "var(--font-mono)" },
  fields: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 },
  type: { fontSize: 10, color: "var(--text-dim)", fontFamily: "var(--font-mono)", background: "var(--surface)", padding: "1px 5px", borderRadius: 3 },
  required: { fontSize: 10, color: "var(--danger)", fontFamily: "var(--font-mono)" },
  input: { padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: 12, fontFamily: "var(--font-mono)", outline: "none" },
  desc: { fontSize: 11, color: "var(--text-dim)" },
  sendBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: 6, color: "#0a0a0f", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" },
  response: { marginTop: 14, border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" },
  responseHeader: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(85,184,130,0.06)", borderBottom: "1px solid var(--border)" },
  responseBody: { margin: 0, padding: "12px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", overflowX: "auto", lineHeight: 1.6, background: "var(--surface)" },
};

export default function ApiDocsPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState<string | null>("login");
  const [activeTab, setActiveTab] = useState<"endpoints" | "schemas">("endpoints");

  useEffect(() => {
    setMounted(true);
    if (!isLoading && !session) router.replace("/login");
  }, [session, isLoading, router]);

  if (!mounted || isLoading || !session) return null;

  const tags = Array.from(new Set(API_ENDPOINTS.map(e => e.tag)));

  return (
    <div style={styles.root}>
      <NavBar />
      <main style={styles.main}>
        {/* Hero */}
        <div style={styles.hero} className="animate-fade-up stagger-1">
          <div style={styles.heroLeft}>
            <div style={styles.heroIcon}><BookOpen size={20} color="var(--accent)" /></div>
            <div>
              <h1 style={styles.title}>Authentication API</h1>
              <p style={styles.subtitle}>JWT-based auth using HS256-signed access tokens and rotating refresh tokens</p>
            </div>
          </div>
          <div style={styles.heroBadges}>
            <span style={styles.versionBadge}>v1.0.0</span>
            <span style={styles.serverBadge}>http://localhost:8080</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabRow} className="animate-fade-up stagger-2">
          {(["endpoints", "schemas"] as const).map(t => (
            <button key={t} style={{ ...styles.tab, ...(activeTab === t ? styles.tabActive : {}) }} onClick={() => setActiveTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Endpoints */}
        {activeTab === "endpoints" && (
          <div className="animate-fade-up stagger-3">
            {tags.map(tag => (
              <div key={tag} style={styles.tagSection}>
                <div style={styles.tagHeader}>
                  <span style={styles.tagName}>{tag}</span>
                  <span style={styles.tagCount}>{API_ENDPOINTS.filter(e => e.tag === tag).length} endpoints</span>
                </div>
                <div style={styles.endpointList}>
                  {API_ENDPOINTS.filter(e => e.tag === tag).map(endpoint => {
                    const isOpen = expanded === endpoint.id;
                    return (
                      <div key={endpoint.id} style={{ ...styles.endpointCard, ...(isOpen ? styles.endpointCardOpen : {}) }}>
                        {/* Endpoint header row */}
                        <button style={styles.endpointRow} onClick={() => setExpanded(isOpen ? null : endpoint.id)}>
                          <MethodBadge method={endpoint.method} />
                          <span style={styles.path}>{endpoint.path}</span>
                          <span style={styles.summary}>{endpoint.summary}</span>
                          <div style={styles.endpointMeta}>
                            {endpoint.requiresAuth
                              ? <Lock size={12} color="var(--warning)" />
                              : <Unlock size={12} color="var(--text-dim)" />
                            }
                            <Badge variant={endpoint.status === "stable" ? "success" : "warning"}>{endpoint.status}</Badge>
                            <ChevronDown size={14} color="var(--text-muted)" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "0.2s", flexShrink: 0 }} />
                          </div>
                        </button>

                        {/* Expanded detail */}
                        {isOpen && (
                          <div style={styles.endpointDetail}>
                            <p style={styles.description}>{endpoint.description}</p>

                            {/* Request body */}
                            {(endpoint.requestBody ?? []).length > 0 && (
                              <div style={styles.section}>
                                <h4 style={styles.sectionTitle}>Request Body</h4>
                                <table style={styles.paramTable}>
                                  <thead>
                                    <tr>{["Parameter","Type","Required","Description"].map(h => <th key={h} style={styles.paramTh}>{h}</th>)}</tr>
                                  </thead>
                                  <tbody>
                                    {(endpoint.requestBody ?? []).map(p => (
                                      <tr key={p.name} style={styles.paramTr}>
                                        <td style={{ ...styles.paramTd, fontFamily: "var(--font-mono)", color: "var(--accent)", fontSize: 12 }}>{p.name}</td>
                                        <td style={{ ...styles.paramTd, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{p.type}</td>
                                        <td style={styles.paramTd}><Badge variant={p.required ? "danger" : "neutral"}>{p.required ? "yes" : "no"}</Badge></td>
                                        <td style={{ ...styles.paramTd, fontSize: 12, color: "var(--text-muted)" }}>{p.description}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Responses */}
                            <div style={styles.section}>
                              <h4 style={styles.sectionTitle}>Responses</h4>
                              <div style={styles.responseList}>
                                {endpoint.responses.map(r => (
                                  <div key={r.code} style={styles.responseRow}>
                                    <span style={{ ...styles.responseCode, color: responseColors[r.code] ?? "var(--text-muted)" }}>{r.code}</span>
                                    <span style={styles.responseDesc}>{r.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <TryItPanel endpoint={endpoint} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Schemas */}
        {activeTab === "schemas" && (
          <div style={styles.schemasGrid} className="animate-fade-up stagger-3">
            {API_SCHEMAS.map(schema => (
              <div key={schema.name} style={styles.schemaCard}>
                <div style={styles.schemaHeader}>
                  <span style={styles.schemaName}>{schema.name}</span>
                  <span style={styles.schemaObject}>object</span>
                </div>
                <table style={styles.paramTable}>
                  <thead>
                    <tr>{["Field","Type","Required"].map(h => <th key={h} style={styles.paramTh}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {schema.fields.map(f => (
                      <tr key={f.name} style={styles.paramTr}>
                        <td style={{ ...styles.paramTd, fontFamily: "var(--font-mono)", color: "var(--accent)", fontSize: 12 }}>{f.name}</td>
                        <td style={{ ...styles.paramTd, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{f.type}</td>
                        <td style={styles.paramTd}><Badge variant={f.required ? "danger" : "neutral"}>{f.required ? "yes" : "no"}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", background: "var(--bg)" },
  main: { maxWidth: 1000, margin: "0 auto", padding: "32px 24px 64px" },
  hero: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 24px" },
  heroLeft: { display: "flex", alignItems: "flex-start", gap: 14 },
  heroIcon: { width: 40, height: 40, borderRadius: 8, background: "var(--accent-glow)", border: "1px solid rgba(200,169,110,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  title: { fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, margin: "0 0 4px", color: "var(--text)" },
  subtitle: { fontSize: 13, color: "var(--text-muted)", margin: 0, maxWidth: 480 },
  heroBadges: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  versionBadge: { padding: "4px 10px", background: "var(--accent-glow)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: 4, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--accent)" },
  serverBadge: { padding: "4px 10px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" },
  tabRow: { display: "flex", gap: 4, marginBottom: 20 },
  tab: { padding: "7px 18px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" },
  tabActive: { background: "var(--surface-2)", color: "var(--text)", borderColor: "var(--accent)" },
  tagSection: { marginBottom: 24 },
  tagHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  tagName: { fontSize: 13, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" },
  tagCount: { fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--font-mono)" },
  endpointList: { display: "flex", flexDirection: "column", gap: 6 },
  endpointCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" },
  endpointCardOpen: { border: "1px solid rgba(200,169,110,0.25)" },
  endpointRow: { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" },
  path: { fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text)", flexShrink: 0 },
  summary: { fontSize: 13, color: "var(--text-muted)", flex: 1, textAlign: "left" },
  endpointMeta: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  endpointDetail: { padding: "0 16px 20px", borderTop: "1px solid var(--border)", marginTop: 0 },
  description: { fontSize: 13, color: "var(--text-muted)", margin: "16px 0 0", lineHeight: 1.6 },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 11, fontWeight: 600, color: "var(--text-dim)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" },
  paramTable: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  paramTh: { textAlign: "left", padding: "7px 12px", fontSize: 10, color: "var(--text-dim)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" },
  paramTr: { borderBottom: "1px solid var(--border)" },
  paramTd: { padding: "9px 12px", color: "var(--text)", verticalAlign: "middle" },
  responseList: { display: "flex", flexDirection: "column", gap: 4 },
  responseRow: { display: "flex", alignItems: "center", gap: 12, padding: "6px 0" },
  responseCode: { fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, width: 40, flexShrink: 0 },
  responseDesc: { fontSize: 13, color: "var(--text-muted)" },
  schemasGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 },
  schemaCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" },
  schemaHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" },
  schemaName: { fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--accent)" },
  schemaObject: { fontSize: 10, color: "var(--text-dim)", fontFamily: "var(--font-mono)", padding: "2px 6px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3 },
};
