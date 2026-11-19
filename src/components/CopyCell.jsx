// Table cell text with a copy-to-clipboard icon that shows on hover → "Copied: …" toast
import { useState } from "react";
import { useToast } from "./Toast";
import "./CopyCell.css";

export default function Copyable({ text, children }) {
    const [done, setDone] = useState(false);
    const notify = useToast();
    const copy = async (e) => {
        e.stopPropagation();                       // don't open the row
        const v = String(text || "");
        if (!v) return;
        try {
            await navigator.clipboard.writeText(v);
        } catch {
            const t = Object.assign(document.createElement("textarea"), { value: v });
            document.body.append(t); t.select(); document.execCommand("copy"); t.remove();
        }
        setDone(true);
        notify(`Copied: ${v}`);
        setTimeout(() => setDone(false), 1200);
    };
    return (
        <span className="copy-cell">
            {children}
            {text && (
                <button type="button" className={`copy-btn ${done ? "is-done" : ""}`} onClick={copy}
                    onKeyDown={(e) => e.stopPropagation()} aria-label={`Copy ${text}`} title={done ? "Copied!" : "Copy"}>
                    {done ? (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7" /></svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
                        </svg>
                    )}
                </button>
            )}
        </span>
    );
}