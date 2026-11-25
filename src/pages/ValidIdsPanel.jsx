// Settings → Valid IDs & Permits: every ID as a card · Add / Edit in a popup: Upload (read by the system) → Type → ID number → dates
import { useEffect, useMemo, useRef, useState } from "react";
import SearchSelect from "../components/SearchSelect";
import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import { apiFetch } from "../context/AuthContext";
import { IdFile, DocViewer, shrinkImage, MAX_UPLOAD, apiUpload } from "./SettingsDocs";
import "./ValidIdsPanel.css";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
const TIN_RE = /^\d{3}-\d{3}-\d{3}$/;
const isBir = (inst) => String(inst || "").toUpperCase() === "BIR";
const fmtTin = (v) => String(v || "").replace(/\D/g, "").slice(0, 9).replace(/(\d{3})(?=\d)/g, "$1-");
const fmtIdFor = (inst, v) => (isBir(inst) ? fmtTin(v) : v);

const fmtDate = (v) => (v ? new Date(`${String(v).slice(0, 10)}T00:00:00`).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "");
const daysLeft = (v) => (v ? Math.round((new Date(`${String(v).slice(0, 10)}T00:00:00`) - new Date(new Date().toDateString())) / 86400000) : null);

export default function ValidIdsPanel({ ids, setIds, institutions, docs, setDocs, notify }) {
    const [show, setShow] = useState("all");          // all | missing
    const [pop, setPop] = useState(null);             // null | {} (new) | the ID row (edit)
    const [del, setDel] = useState(null);

    const docOf = (v) => docs.find((d) => d.doc_type === "valid_id" && Number(d.valid_id_id) === Number(v.id));
    const missing = ids.filter((v) => !docOf(v)).length;
    const shown = show === "missing" ? ids.filter((v) => !docOf(v)) : ids;

    const remove = async () => {
        const v = del;
        setDel(null);
        try {
            const r = await apiFetch(`/settings/valid-ids/${v.id}`, { method: "DELETE" });
            setIds(r.valid_ids);
            const f = docOf(v);
            if (f) apiFetch(`/settings/documents/${f.id}`, { method: "DELETE" }).then((x) => setDocs(x.documents || [])).catch(() => { });
            notify("ID removed.");
        } catch (e) { notify(e.message || "Couldn't remove the ID.", "error"); }
    };

    return (
        <div className="vi">
            <header className="vi-head">
                <div>
                    <h2 className="st-h st-h-tight">Valid IDs &amp; Permits</h2>
                    <p className="vi-sub">Every ID or permit of the business with a copy of it. The <b>BIR</b> ID is the client's TIN (BIR Return, E-Sub Report and reports read it).</p>
                </div>
                <div className="vi-head-right">
                    {ids.length > 0 && (
                        <div className="vi-stats" role="radiogroup" aria-label="Show">
                            <button type="button" role="radio" aria-checked={show === "all"} className={show === "all" ? "is-on" : ""} onClick={() => setShow("all")}>All <b>{ids.length}</b></button>
                            <button type="button" role="radio" aria-checked={show === "missing"} className={`${show === "missing" ? "is-on" : ""} ${missing ? "is-warn" : ""}`} onClick={() => setShow("missing")}>No file yet <b>{missing}</b></button>
                        </div>
                    )}
                    <button type="button" className="btn btn-primary" onClick={() => setPop({})}>＋ Add ID</button>
                </div>
            </header>

            {!ids.length ? (
                <div className="vi-empty">
                    <b>No IDs yet</b>
                    <span>Start with the BIR TIN, then add the DTI / SEC / CDA, Mayor's permit and the others the business has.</span>
                    <button type="button" className="btn btn-primary" onClick={() => setPop({})}>＋ Add ID</button>
                </div>
            ) : !shown.length ? (
                <div className="vi-empty"><b>Every ID has its file.</b></div>
            ) : (
                <div className="vi-table" role="table" aria-label="Valid IDs & Permits">
                    <div className="vi-tr vi-th" role="row">
                        <span role="columnheader">Copy</span>
                        <span role="columnheader">ID / permit</span>
                        <span role="columnheader">Issued</span>
                        <span role="columnheader">Valid until</span>
                        <span role="columnheader">File</span>
                        <span role="columnheader" className="vi-sr">Actions</span>
                    </div>
                    {shown.map((v) => {
                        const doc = docOf(v);
                        const left = daysLeft(doc?.expires_at);
                        const tone = !doc ? "is-missing" : left !== null && left < 0 ? "is-bad" : left !== null && left <= 30 ? "is-warn" : "";
                        return (
                            <div key={v.id} className={`vi-tr ${tone}`} role="row">
                                <span role="cell" className="vi-td-thumb">
                                    <Thumb doc={doc} onOpen={() => setPop(v)} label={v.institution} />
                                </span>
                                <span role="cell" className="vi-td-id">
                                    <span className={`vi-inst ${isBir(v.institution) ? "is-bir" : ""}`} title={v.institution}>{v.institution}</span>
                                    <span className="vi-num mono">{v.id_num}</span>
                                </span>
                                <span role="cell" className="vi-td-date" data-label="Issued">{doc?.issued_at ? fmtDate(doc.issued_at) : <i className="vi-none">—</i>}</span>
                                <span role="cell" className="vi-td-date" data-label="Valid until">
                                    {doc?.expires_at
                                        ? <>{fmtDate(doc.expires_at)}<i className={`vi-exp ${left < 0 ? "is-bad" : left <= 30 ? "is-warn" : ""}`}>{left < 0 ? "Expired" : left <= 30 ? `${left} day(s) left` : "Valid"}</i></>
                                        : <i className="vi-none">—</i>}
                                </span>
                                <span role="cell" className="vi-td-file">
                                    {!doc && <span className="vi-state">No file yet</span>}
                                    <IdFile validId={v} docs={docs} setDocs={setDocs} notify={notify} />
                                </span>
                                <span role="cell" className="vi-td-act">
                                    <button className="tm-icon" onClick={() => setPop(v)} aria-label={`Edit ${v.institution}`} title="Edit">
                                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                    </button>
                                    <button className="tm-icon tm-icon-danger" onClick={() => setDel(v)} aria-label={`Remove ${v.institution}`} title="Remove">
                                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>
                                    </button>
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {pop && (
                <IdPopup row={pop.id ? pop : null} doc={pop.id ? docOf(pop) : null} institutions={institutions} used={ids}
                    onClose={() => setPop(null)} notify={notify}
                    onSaved={(validIds, documents, msg) => { if (validIds) setIds(validIds); if (documents) setDocs(documents); setPop(null); notify(msg); }} />
            )}
            {del && (
                <ConfirmDialog title="Remove this ID?" message={`${del.institution} ${del.id_num} and its file will be removed from this client.`}
                    confirmLabel="Remove" onCancel={() => setDel(null)} onConfirm={remove} />
            )}
        </div>
    );
}

/* ---------- small picture of the copy (click = view in a popup) ---------- */
function Thumb({ doc, onOpen, label }) {
    const [src, setSrc] = useState(null);
    const [view, setView] = useState(false);
    const isImg = doc && doc.mime && doc.mime.startsWith("image/");
    useEffect(() => {
        if (!isImg) return undefined;
        let alive = true;
        let blobUrl = null;
        apiFetch(`/settings/documents/${doc.id}/file`).then((r) => {
            if (!alive) return;
            if (r.url) { setSrc(r.url); return; }
            const bin = atob(r.data);
            blobUrl = URL.createObjectURL(new Blob([Uint8Array.from(bin, (c) => c.charCodeAt(0))], { type: r.mime || doc.mime }));
            setSrc(blobUrl);
        }).catch(() => { });
        return () => { alive = false; if (blobUrl) URL.revokeObjectURL(blobUrl); };
    }, [doc?.id, isImg]); // eslint-disable-line react-hooks/exhaustive-deps
    if (!doc) {
        return (
            <button type="button" className="vi-thumb is-empty" onClick={onOpen} title={`Upload a copy of ${label}`} aria-label={`Upload a copy of ${label}`}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
            </button>
        );
    }
    return (
        <>
            <button type="button" className={`vi-thumb ${isImg ? "" : "is-pdf"}`} onClick={() => setView(true)} title={`View ${doc.file_name}`} aria-label={`View the copy of ${label}`}>
                {isImg ? (src ? <img src={src} alt="" /> : <span className="vi-thumb-load" />) : <b>PDF</b>}
            </button>
            {view && <DocViewer doc={doc} onClose={() => setView(false)} />}
        </>
    );
}

/* ---------- Add / Edit popup: Upload → Type → ID number → Date issued → Valid until ---------- */
function IdPopup({ row, doc, institutions, used, onClose, onSaved, notify }) {
    const [f, setF] = useState({
        // new: the first type the client doesn't have yet (BIR first)
        institution: row?.institution || institutions.find((x) => !used.some((v) => String(v.institution).toUpperCase() === x)) || "OTHERS",
        id_num: row ? fmtIdFor(row.institution, row.id_num) : "",
        issued_at: doc?.issued_at ? String(doc.issued_at).slice(0, 10) : "",
        expires_at: doc?.expires_at ? String(doc.expires_at).slice(0, 10) : "",
    });
    const [file, setFile] = useState(null);            // { name, size, type, data }
    const [drag, setDrag] = useState(false);
    const [scan, setScan] = useState("");              // "" | reading | message
    const [scanKind, setScanKind] = useState("ok");    // ok (details read) · warn (nothing read) · bad (failed)
    const [busy, setBusy] = useState(false);
    const fileRef = useRef(null);
    const set = (patch) => setF((x) => ({ ...x, ...patch }));

    // preview of the saved copy (S3 link) – a newly picked file shows from memory
    const [savedSrc, setSavedSrc] = useState(null);
    useEffect(() => {
        if (!doc) return undefined;
        let alive = true;
        let blobUrl = null;
        apiFetch(`/settings/documents/${doc.id}/file`).then((r) => {
            if (!alive) return;
            if (r.url) { setSavedSrc(r.url); return; }
            const bin = atob(r.data);
            blobUrl = URL.createObjectURL(new Blob([Uint8Array.from(bin, (c) => c.charCodeAt(0))], { type: r.mime || doc.mime }));
            setSavedSrc(blobUrl);
        }).catch(() => { });
        return () => { alive = false; if (blobUrl) URL.revokeObjectURL(blobUrl); };
    }, [doc]);
    const preview = file
        ? { src: file.blob, pdf: file.type === "application/pdf", name: file.name }
        : doc && savedSrc ? { src: savedSrc, pdf: doc.mime === "application/pdf", name: doc.file_name } : null;
    const has = useMemo(() => new Set(used.filter((v) => v.id !== row?.id).map((v) => String(v.institution).toUpperCase())), [used, row]);
    const instOpts = (institutions.includes(f.institution) ? institutions : [f.institution, ...institutions])
        .map((x) => ({ value: x, label: has.has(x) ? `${x} (already added)` : x }));

    const take = async (picked) => {
        if (!picked) return;
        if (!ACCEPT.split(",").includes(picked.type)) { notify("Upload a PDF, JPG, PNG or WEBP file.", "error"); return; }
        setScan("reading");
        try {
            const fl = await shrinkImage(picked);      // big phone photos → smaller JPEG
            if (fl.size > MAX_UPLOAD) { setScan(""); notify("The file is too big (20 MB at most). For a PDF, save it smaller first.", "error"); return; }
            setFile((old) => { if (old?.blob) URL.revokeObjectURL(old.blob); return { name: fl.name, size: fl.size, type: fl.type, obj: fl, blob: URL.createObjectURL(fl) }; });
            // the system reads the number and the dates; you check them (COR / 2303 has its own layout)
            const cor = /2303|\bCOR\b|CERTIFICATE OF REGISTRATION/i.test(f.institution);
            const r = await apiUpload("/settings/documents/scan", { doc_type: cor ? "bir_2303" : "valid_id" }, fl);
            const x = r.fields || {};
            setF((cur) => {
                const number = isBir(cur.institution) ? (x.tin || "") : (x.doc_no || x.tin || "");
                return {
                    ...cur,
                    id_num: cur.id_num || (number ? fmtIdFor(cur.institution, number) : ""),
                    issued_at: cur.issued_at || x.issued_at || x.date_registered || "",
                    expires_at: cur.expires_at || x.expires_at || "",
                };
            });
            setScanKind(r.found > 0 ? "ok" : "warn");
            setScan(r.message || "");
        } catch (e) {
            setScanKind("bad");
            setScan(e.message || "Couldn't read the file.");
        }
    };

    const save = async () => {
        const n = f.id_num.trim();
        if (!n) { notify("Enter the ID number.", "error"); return; }
        if (isBir(f.institution) && !TIN_RE.test(n)) { notify("Enter the TIN as 000-000-000 (9 digits).", "error"); return; }
        setBusy(true);
        try {
            let list;
            let vid = row;
            if (row) {
                list = (await apiFetch(`/settings/valid-ids/${row.id}`, { method: "PUT", body: JSON.stringify({ institution: f.institution, id_num: n }) })).valid_ids;
                vid = { ...row, institution: f.institution, id_num: n };
            } else {
                list = (await apiFetch("/settings/valid-ids", { method: "POST", body: JSON.stringify({ institution: f.institution, id_num: n }) })).valid_ids;
                vid = [...(list || [])].filter((v) => String(v.institution).toUpperCase() === f.institution.toUpperCase() && String(v.id_num) === n)
                    .sort((a, b) => Number(b.id) - Number(a.id))[0];
            }
            let documents = null;
            const dates = { issued_at: f.issued_at || null, expires_at: f.expires_at || null };
            if (file && vid) {
                documents = (await apiUpload("/settings/documents", { doc_type: "valid_id", valid_id_id: vid.id, label: f.institution, doc_no: n, ...dates }, file.obj)).documents;
            } else if (doc) {
                documents = (await apiFetch(`/settings/documents/${doc.id}`, { method: "PUT", body: JSON.stringify({ label: f.institution, doc_no: n, ...dates }) })).documents;
            }
            onSaved(list, documents, row ? `${f.institution} updated.` : `${f.institution} added${file ? " with its file" : ""}.`);
        } catch (e) {
            notify(e.message || "Couldn't save the ID.", "error");
        } finally { setBusy(false); }
    };

    const canDate = !!file || !!doc;
    return (
        <Modal title={row ? `Edit ${row.institution}` : "Add ID / permit"} onClose={onClose}
            footer={<div className="tm-foot"><button className="btn" onClick={onClose} disabled={busy}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={busy || scan === "reading"}>{busy ? "Saving…" : row ? "Save" : "Add ID"}</button></div>}>
            <div className="vi-pop">
                {/* 1 upload */}
                <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
                <button type="button" className={`vi-up ${drag ? "is-drag" : ""} ${file || doc ? "has-file" : ""}`}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                    onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0]); }}>
                    {scan === "reading" ? (
                        <><span className="vi-spin" aria-hidden="true" /><b>Reading the file…</b></>
                    ) : preview ? (
                        <>
                            {preview.pdf
                                ? <iframe className="vi-prev vi-prev-pdf" src={`${preview.src}#toolbar=0&view=FitH`} title={preview.name} tabIndex={-1} />
                                : <img className="vi-prev" src={preview.src} alt={preview.name} />}
                            <b>{preview.name}</b><small>Click or drop a file to replace it</small>
                        </>
                    ) : file || doc ? (
                        <><span className="vi-up-ok" aria-hidden="true">✓</span><b>{file ? file.name : doc.file_name}</b><small>Click or drop a file to replace it</small></>
                    ) : (
                        <><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></svg>
                            <b>Upload a copy of the ID</b><small>Drop the file here or click to browse · PDF, JPG, PNG · up to 20 MB</small></>
                    )}
                </button>
                {scan && scan !== "reading" && <p className={`vi-scan is-${scanKind}`} role={scanKind === "ok" ? "status" : "alert"}>{scan}</p>}

                {/* 2 details */}
                <div className="field">
                    <span className="field-label">Type</span>
                    <SearchSelect value={f.institution} options={instOpts} searchPlaceholder="Search BIR, SSS, Mayor's permit…"
                        onChange={(v) => set({ institution: v, id_num: fmtIdFor(v, f.id_num) })} aria-label="Type" />
                </div>
                <label className="field">
                    <span className="field-label">{isBir(f.institution) ? "TIN" : "ID number"}</span>
                    <input className="input mono" value={f.id_num} inputMode={isBir(f.institution) ? "numeric" : "text"} maxLength={isBir(f.institution) ? 11 : 60}
                        placeholder={isBir(f.institution) ? "000-000-000" : "e.g. 2026-004512"} onChange={(e) => set({ id_num: fmtIdFor(f.institution, e.target.value) })}
                        onKeyDown={(e) => { if (e.key === "Enter") save(); }} />
                </label>
                <div className="vi-pop-2">
                    <label className="field">
                        <span className="field-label">Date issued</span>
                        <input type="date" className="input" value={f.issued_at} disabled={!canDate} onChange={(e) => set({ issued_at: e.target.value })} />
                    </label>
                    <label className="field">
                        <span className="field-label">Valid until</span>
                        <input type="date" className="input" value={f.expires_at} disabled={!canDate} onChange={(e) => set({ expires_at: e.target.value })} />
                    </label>
                </div>
                {!canDate && <p className="vi-hint">Upload the copy to save the dates with it.</p>}
            </div>
        </Modal>
    );
}