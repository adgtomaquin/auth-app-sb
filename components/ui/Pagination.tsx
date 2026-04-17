import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onPage: (p: number) => void;
  total: number;
  pageSize: number;
}

export default function Pagination({ page, totalPages, onPrev, onNext, onPage, total, pageSize }: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div style={styles.root}>
      <span style={styles.info}>{start}–{end} of {total}</span>
      <div style={styles.controls}>
        <button style={{ ...styles.btn, ...(page === 1 ? styles.disabled : {}) }} onClick={onPrev} disabled={page === 1}>
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) => (
          <React.Fragment key={p}>
            {i > 0 && pages[i - 1] !== p - 1 && <span style={styles.ellipsis}>…</span>}
            <button
              style={{ ...styles.btn, ...(p === page ? styles.active : {}) }}
              onClick={() => onPage(p)}
            >
              {p}
            </button>
          </React.Fragment>
        ))}
        <button style={{ ...styles.btn, ...(page === totalPages ? styles.disabled : {}) }} onClick={onNext} disabled={page === totalPages}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, marginTop: 8, borderTop: "1px solid var(--border)" },
  info: { fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" },
  controls: { display: "flex", alignItems: "center", gap: 4 },
  btn: { minWidth: 30, height: 30, borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)" },
  active: { background: "var(--accent)", color: "#0a0a0f", borderColor: "var(--accent)", fontWeight: 700 },
  disabled: { opacity: 0.3, cursor: "not-allowed" },
  ellipsis: { color: "var(--text-dim)", fontSize: 12, padding: "0 4px" },
};
