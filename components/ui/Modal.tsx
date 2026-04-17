"use client";
import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, children, width = 480 }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, width }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>{title}</span>
          <button style={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>
        <div style={styles.body}>{children}</div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  modal: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 24px 64px rgba(0,0,0,0.6)", animation: "modalIn 0.2s ease", maxHeight: "90vh", overflowY: "auto" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)" },
  title: { fontSize: 15, fontWeight: 600, color: "var(--text)" },
  closeBtn: { background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", padding: 4, borderRadius: 4 },
  body: { padding: "20px" },
};
