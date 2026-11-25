// Settings → scanned documents of the client (kept in S3 → ID_Solutions/{client #}/…)
//   OwnershipDocs  DTI / SEC / CDA certificate (only the one for the chosen ownership type) → date registered
//   BirDocs        BIR Form 2303 → date of operation (when tax compliance starts) + tax types → compliance ticks
//   WhNoticeDocs   notice / publication when the client is a withholding agent
//   PermitDocs     DENR · Bureau of Customs · Board of Investments · others
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import "./SettingsDocs.css";

export const DOC_LABEL = {
    dti: "DTI Certificate of Business Name Registration",
    sec: "SEC Certificate of Incorporation",
    cda: "CDA Certificate of Registration",
    bir_2303: "BIR Certificate of Registration (Form 2303)",
    wh_notice: "Withholding agent notice / publication",
    denr: "DENR permit",
    boc: "Bureau of Customs",
    boi: "Board of Investments",
    other: "Other permit / registration",
};

/** ownership type name → which certificate it needs */
export function ownershipDocType(label) {
    const s = String(label || "").toLowerCase();
    if (s.includes("coop")) return "cda";
    if (/sole|single|individual|proprietor/.test(s)) return "dti";
    if (s) return "sec";   // corporation, partnership, one person corporation …
    return "";
}

/** big photos (phone pictures) are made smaller before the upload: longest side 2400 px, JPEG 85 % – still sharp to read */
export async function shrinkImage(file) {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type) || file.size <= 1.5 * 1024 * 1024) return file;
    try {
        const url = URL.createObjectURL(file);
        const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
        URL.revokeObjectURL(url);
        const k = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * k);
        c.height = Math.round(img.naturalHeight * k);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.85));
        if (!blob || blob.size >= file.size) return file;
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch {
        return file;
    }
}
export const MAX_UPLOAD = 20 * 1024 * 1024;   // 20 MB (after a photo is made smaller)

/** POST a file as multipart/form-data (no base64, no big JSON) with the login token – same errors as apiFetch */
export async function apiUpload(path, fields, file) {
    const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    let token = null;
    try { token = JSON.parse(localStorage.getItem("igb-auth") || sessionStorage.getItem("igb-auth") || "null")?.token; } catch { /* blocked */ }
    const fd = new FormData();
    Object.entries(fields || {}).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== "") fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v)); });
    if (file) { fd.append("file", file, file.name); fd.append("file_name", file.name); }
    let res;
    try {
        res = await fetch(`${API}${path}`, { method: "POST", body: fd, headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    } catch {
        throw new Error("Couldn't reach the server (the file may be too big for the server settings).");
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = res.status === 413 ? "The file is too big for the server." : body.message || Object.values(body.errors || {})[0]?.[0] || `Upload failed (${res.status})`;
        throw Object.assign(new Error(msg), { status: res.status });
    }
    return body;
}

const fmtDate = (v) => (v ? new Date(`${String(v).slice(0, 10)}T00:00:00`).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—");
const daysLeft = (v) => (v ? Math.round((new Date(`${String(v).slice(0, 10)}T00:00:00`) - new Date(new Date().toDateString())) / 86400000) : null);

/* ---------- view a saved document in a popup (PDF or picture) ---------- */
export function DocViewer({ doc, onClose }) {
    const [src, setSrc] = useState(null);
    const [err, setErr] = useState("");
    useEffect(() => {
        let alive = true;
        let blobUrl = null;
        apiFetch(`/settings/documents/${doc.id}/file`)
            .then((r) => {
                if (!alive) return;
                if (r.url) { setSrc(r.url); return; }
                const bin = atob(r.data);
                blobUrl = URL.createObjectURL(new Blob([Uint8Array.from(bin, (c) => c.charCodeAt(0))], { type: r.mime || doc.mime || "application/octet-stream" }));
                setSrc(blobUrl);
            })
            .catch((e) => alive && setErr(e.message || "Couldn't open the file."));
        return () => { alive = false; if (blobUrl) URL.revokeObjectURL(blobUrl); };
    }, [doc.id, doc.mime]);
    const isPdf = doc.mime === "application/pdf";
    const title = doc.doc_type === "valid_id" ? `${doc.label || "ID"}${doc.doc_no ? ` · ${doc.doc_no}` : ""}` : (doc.doc_type === "other" && doc.label) || DOC_LABEL[doc.doc_type] || doc.file_name;
    return (
        <Modal title={title} onClose={onClose} size="lg" footer={<div className="tm-foot"><button className="btn" onClick={onClose}>Close</button></div>}>
            <div className="sd-view">
                {err && <p className="sd-view-msg is-bad">{err}</p>}
                {!err && !src && <p className="sd-view-msg">Loading {doc.file_name}…</p>}
                {src && (isPdf
                    ? <iframe className="sd-view-pdf" src={src} title={doc.file_name} />
                    : <img className="sd-view-img" src={src} alt={doc.file_name} />)}
            </div>
        </Modal>
    );
}

export function DocList({ docs, notify, onChanged, empty = "No document yet." }) {
    const [del, setDel] = useState(null);
    const [view, setView] = useState(null);
    const remove = async () => {
        const d = del;
        setDel(null);
        try {
            const r = await apiFetch(`/settings/documents/${d.id}`, { method: "DELETE" });
            onChanged(r.documents);
            notify("Document removed.");
        } catch (e) { notify(e.message || "Couldn't remove.", "error"); }
    };
    if (!docs.length) return <p className="sd-empty">{empty}</p>;
    return (
        <>
            <ul className="sd-list">
                {docs.map((d) => {
                    const left = daysLeft(d.expires_at);
                    return (
                        <li key={d.id} className="sd-item">
                            <span className={`sd-icon ${d.mime === "application/pdf" ? "is-pdf" : ""}`} aria-hidden="true">{d.mime === "application/pdf" ? "PDF" : "IMG"}</span>
                            <div className="sd-main">
                                <b>{d.doc_type === "other" && d.label ? d.label : DOC_LABEL[d.doc_type] || d.doc_type}</b>
                                <small>
                                    {[d.doc_no && `No. ${d.doc_no}`, d.name_on_doc, d.date_registered && `Registered ${fmtDate(d.date_registered)}`,
                                    d.issued_at && `Issued ${fmtDate(d.issued_at)}`, d.expires_at && `Valid until ${fmtDate(d.expires_at)}`].filter(Boolean).join(" · ") || d.file_name}
                                </small>
                                {d.extracted?.tax_types?.length > 0 && <small className="sd-tax">Tax types: {d.extracted.tax_types.join(", ")}</small>}
                            </div>
                            {left !== null && (
                                <span className={`sd-exp ${left < 0 ? "is-bad" : left <= 30 ? "is-warn" : ""}`}>
                                    {left < 0 ? "Expired" : left <= 30 ? `Expires in ${left} day(s)` : "Valid"}
                                </span>
                            )}
                            <button type="button" className="btn btn-sm" onClick={() => setView(d)}>View</button>
                            <button type="button" className="tm-icon tm-icon-danger" onClick={() => setDel(d)} aria-label={`Remove ${DOC_LABEL[d.doc_type] || "document"}`} title="Remove">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>
                            </button>
                        </li>
                    );
                })}
            </ul>
            {view && <DocViewer doc={view} onClose={() => setView(null)} />}
            {del && (
                <ConfirmDialog title="Remove document?" message={`${DOC_LABEL[del.doc_type] || "This document"} (${del.file_name}) will be deleted from the files.`}
                    confirmLabel="Remove" onCancel={() => setDel(null)} onConfirm={remove} />
            )}
        </>
    );
}

/* ---------- upload → scan → check the details → save ---------- */
function DocUploader({ type, types, notify, onSaved, onRead, fields, applyLabel, buttonLabel = "Upload & scan" }) {
    const input = useRef(null);
    const [docType, setDocType] = useState(type || types?.[0] || "");
    const [file, setFile] = useState(null);       // { name, mime, data }
    const [f, setF] = useState(null);             // details being checked
    const [busy, setBusy] = useState("");
    const [msg, setMsg] = useState("");
    const [apply, setApply] = useState(true);
    const curType = type || docType;

    const pick = async (e) => {
        const picked = e.target.files?.[0];
        e.target.value = "";
        if (!picked) return;
        const fl = await shrinkImage(picked);
        if (fl.size > MAX_UPLOAD) { notify("The file is too big (20 MB at most).", "error"); return; }
        setBusy("scan");
        setMsg("");
        try {
            setFile({ file_name: fl.name, obj: fl });
            const r = await apiUpload("/settings/documents/scan", { doc_type: curType }, fl);
            setF({
                label: "", doc_no: "", name_on_doc: "", date_registered: "", issued_at: "", expires_at: "",
                ...Object.fromEntries(Object.entries(r.fields || {}).map(([k, v]) => [k, v ?? (Array.isArray(v) ? [] : "")]))
            });
            setMsg(r.message);
        } catch (err) {
            setFile(null);
            notify(err.message || "Couldn't read the file.", "error");
        } finally { setBusy(""); }
    };

    const save = async () => {
        setBusy("save");
        try {
            const body = { doc_type: curType, ...Object.fromEntries(["label", "doc_no", "name_on_doc", "date_registered", "issued_at", "expires_at"].map((k) => [k, f[k] || null])) };
            const extracted = Object.fromEntries(Object.entries(f).filter(([k]) => !["label", "doc_no", "name_on_doc", "date_registered", "issued_at", "expires_at"].includes(k)));
            if (Object.keys(extracted).length) body.extracted = extracted;
            const r = await apiUpload("/settings/documents", body, file.obj);
            if (apply && onRead) onRead(f);
            onSaved(r.documents);
            notify(apply && onRead ? "Document saved. The details were filled in below – click Save changes to keep them." : "Document saved.");
            setFile(null); setF(null); setMsg("");
        } catch (err) {
            notify(err.message || "Couldn't save the document.", "error");
        } finally { setBusy(""); }
    };

    const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
    const show = fields || ["doc_no", "date_registered"];
    const LBL = { doc_no: "Registration / document no.", name_on_doc: "Name on the document", date_registered: "Date registered", issued_at: "Date issued", expires_at: "Valid until", tin: "TIN", rdo: "RDO", label: "What permit is it?" };

    return (
        <div className="sd-up">
            {!f ? (
                <div className="sd-up-row">
                    {types && (
                        <select className="input sd-type" value={docType} onChange={(e) => setDocType(e.target.value)} aria-label="Document type">
                            {types.map((t) => <option key={t} value={t}>{DOC_LABEL[t]}</option>)}
                        </select>
                    )}
                    <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" hidden onChange={pick} />
                    <button type="button" className="btn btn-primary" onClick={() => input.current?.click()} disabled={!!busy || !curType}>
                        {busy === "scan" ? "Scanning…" : buttonLabel}
                    </button>
                    <span className="sd-hint">PDF, JPG or PNG · up to 20 MB</span>
                </div>
            ) : (
                <div className="sd-check">
                    <p className="sd-msg">{msg} <span className="sd-file">{file?.file_name}</span></p>
                    <div className="sd-grid">
                        {curType === "other" && (
                            <label className="field"><span className="field-label">{LBL.label}</span><input className="input" value={f.label || ""} onChange={set("label")} placeholder="e.g. FDA License to Operate" /></label>
                        )}
                        {show.map((k) => (
                            <label key={k} className="field">
                                <span className="field-label">{LBL[k] || k}</span>
                                <input className={`input${["doc_no", "tin", "rdo"].includes(k) ? " mono" : ""}`} type={["date_registered", "issued_at", "expires_at"].includes(k) ? "date" : "text"}
                                    value={f[k] || ""} onChange={set(k)} />
                            </label>
                        ))}
                    </div>
                    {Array.isArray(f.tax_types) && (
                        <div className="sd-taxes">
                            <span className="field-label">Tax types read from the 2303</span>
                            {f.tax_types.length ? <div className="sd-chips">{f.tax_types.map((t) => <span key={t} className="sd-chip">{t}</span>)}</div> : <span className="sd-hint">None found</span>}
                        </div>
                    )}
                    {onRead && applyLabel && (
                        <label className="sd-apply"><input type="checkbox" checked={apply} onChange={(e) => setApply(e.target.checked)} /> {applyLabel}</label>
                    )}
                    <div className="sd-actions">
                        <button type="button" className="btn" onClick={() => { setFile(null); setF(null); setMsg(""); }} disabled={!!busy}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={save} disabled={!!busy}>{busy === "save" ? "Saving…" : "Save document"}</button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---------- I.1 registration certificate (only the one for the chosen ownership type) ---------- */
export function OwnershipDocs({ ownershipLabel, docs, setDocs, notify, onRead }) {
    const type = ownershipDocType(ownershipLabel);
    if (!type) return <p className="sd-empty">Pick the business ownership type first.</p>;
    const mine = docs.filter((d) => d.doc_group === "ownership");
    return (
        <div className="sd-box">
            <div className="sd-head"><b>{DOC_LABEL[type]}</b><small>Scan it and the system reads the registration no. and date registered.</small></div>
            <DocList docs={mine} notify={notify} onChanged={setDocs} empty="No certificate uploaded yet." />
            <DocUploader key={type} type={type} notify={notify} onSaved={setDocs} onRead={onRead}
                fields={type === "dti" ? ["doc_no", "name_on_doc", "date_registered", "expires_at"] : ["doc_no", "name_on_doc", "date_registered"]}
                applyLabel="Use the date registered on this certificate" buttonLabel={mine.length ? "Replace certificate" : "Upload & scan"} />
        </div>
    );
}

/* ---------- I.2 BIR 2303 ---------- */
export function BirDocs({ docs, setDocs, notify, onRead }) {
    return (
        <div className="sd-box">
            <div className="sd-head"><b>{DOC_LABEL.bir_2303}</b><small>Gives the date of operation (when tax compliance starts) and the tax types that apply.</small></div>
            <DocList docs={docs.filter((d) => d.doc_type === "bir_2303")} notify={notify} onChanged={setDocs} empty="No 2303 uploaded yet." />
            <DocUploader type="bir_2303" notify={notify} onSaved={setDocs} onRead={onRead}
                fields={["tin", "rdo", "name_on_doc", "date_registered"]}
                applyLabel="Use the registration date as the Date of operation and tick the matching compliance" />
        </div>
    );
}

/* ---------- withholding agent notice / publication ---------- */
export function WhNoticeDocs({ docs, setDocs, notify }) {
    return (
        <div className="sd-box sd-box-tight">
            <div className="sd-head"><b>{DOC_LABEL.wh_notice}</b><small>Upload the BIR notice or the publication that names the client as a withholding agent.</small></div>
            <DocList docs={docs.filter((d) => d.doc_type === "wh_notice")} notify={notify} onChanged={setDocs} empty="No notice uploaded yet." />
            <DocUploader type="wh_notice" notify={notify} onSaved={setDocs} fields={["doc_no", "issued_at"]} buttonLabel="Upload notice" />
        </div>
    );
}

/* ---------- II. permits & registrations ---------- */
export function PermitDocs({ docs, setDocs, notify }) {
    return (
        <div className="sd-box">
            <div className="sd-head"><b>Permits &amp; registrations</b><small>Upload only those that apply to the client.</small></div>
            <DocList docs={docs.filter((d) => d.doc_group === "permit")} notify={notify} onChanged={setDocs} empty="No permit uploaded yet." />
            <DocUploader types={["denr", "boc", "boi", "other"]} notify={notify} onSaved={setDocs} fields={["doc_no", "issued_at", "expires_at"]} />
        </div>
    );
}

/** tax types read from a 2303 → ids of the compliance items whose name matches */
export function complianceFromTaxTypes(taxTypes, compliance) {
    const key = (s) => String(s || "").toLowerCase().replace(/[^a-z]/g, " ").replace(/\s+/g, " ").trim();
    const WORDS = {
        "Income Tax": ["income"], "Value-Added Tax": ["value added", "vat"], "Percentage Tax": ["percentage"],
        "Withholding Tax - Compensation": ["compensation"], "Withholding Tax - Expanded": ["expanded"], "Withholding Tax - Final": ["final"],
        "Withholding Tax - VAT and Other Percentage Taxes": ["withholding vat", "government money"], "Registration Fee": ["registration fee", "annual registration"],
        "Documentary Stamp Tax": ["documentary"], "Excise Tax": ["excise"],
    };
    const ids = new Set();
    (taxTypes || []).forEach((t) => (WORDS[t] || [key(t)]).forEach((w) => (compliance || []).forEach((c) => { if (key(c.label).includes(w)) ids.add(String(c.id)); })));
    return [...ids];
}

/* ---------- file of one Valid ID row (BIR, SSS, DENR, BOC, BOI …) ---------- */
export async function uploadIdFile(original, validId) {
    const file = await shrinkImage(original);
    if (file.size > MAX_UPLOAD) throw new Error("The file is too big (20 MB at most).");
    const r = await apiUpload("/settings/documents", { doc_type: "valid_id", valid_id_id: validId.id, label: validId.institution, doc_no: validId.id_num }, file);
    return r.documents;
}

export function IdFile({ validId, docs, setDocs, notify, disabled }) {
    const input = useRef(null);
    const [busy, setBusy] = useState(false);
    const [view, setView] = useState(false);
    const doc = docs.find((d) => d.doc_type === "valid_id" && Number(d.valid_id_id) === Number(validId.id));
    const pick = async (e) => {
        const fl = e.target.files?.[0];
        e.target.value = "";
        if (!fl) return;
        setBusy(true);
        try {
            setDocs(await uploadIdFile(fl, validId));
            notify(`${validId.institution} file uploaded.`);
        } catch (err) { notify(err.message || "Couldn't upload the file.", "error"); }
        finally { setBusy(false); }
    };
    return (
        <span className="sd-idfile">
            <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" hidden onChange={pick} />
            {doc && (
                <button type="button" className="sd-idfile-chip" onClick={() => setView(true)} title={`View ${doc.file_name}`}>
                    <span className={`sd-icon ${doc.mime === "application/pdf" ? "is-pdf" : ""}`} aria-hidden="true">{doc.mime === "application/pdf" ? "PDF" : "IMG"}</span>
                    View
                </button>
            )}
            <button type="button" className="btn btn-sm" onClick={() => input.current?.click()} disabled={busy || disabled}>
                {busy ? "Uploading…" : doc ? "Replace file" : "Upload file"}
            </button>
            {view && doc && <DocViewer doc={doc} onClose={() => setView(false)} />}
        </span>
    );
}