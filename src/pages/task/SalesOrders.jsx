// Task → Sales → Sales Order (list) · same table as Sales → Invoice
//   SO No · Invoice No (the sales invoice made with "Create Invoice") · click a row → the order form (/task/sales-orders/:no)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SearchCard from "../../components/SearchCard";
import DataTable from "../../components/DataTable";
import Badge from "../../components/Badge";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";
import { SALES_TABS } from "../../components/routesMeta";
import { useAuth, apiFetch } from "../../context/AuthContext";
import { usePeriod } from "../../context/PeriodContext";
import { ORDER_PATH } from "./sales/SalesDetail";

const SEARCH_KEY = "sales-orders.search";
const readSearch = () => { try { return sessionStorage.getItem(SEARCH_KEY) || ""; } catch { return ""; } };
const saveSearch = (v) => { try { v ? sessionStorage.setItem(SEARCH_KEY, v) : sessionStorage.removeItem(SEARCH_KEY); } catch { /* ignore */ } };
const rowsCache = new Map();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TABLE_HEIGHT = "calc(100vh - 375px)";
const fmtDay = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
    return `${MONTHS[m - 1]} ${String(d).padStart(2, "0")} ${y}`;
};
const fmt4 = (n) => Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const orderTone = (s) => (s === "INVOICED" ? "green" : s === "VOID" ? "gray" : "blue");

export default function SalesOrders() {
    const { user } = useAuth();
    const { from, to } = usePeriod();
    const navigate = useNavigate();
    const location = useLocation();
    const notify = useToast();

    const fromMonth = from.slice(0, 7);
    const toMonth = to.slice(0, 7);
    const cacheKey = `${user?.id}:${user?.caid}:${fromMonth}:${toMonth}`;

    const [rows, setRows] = useState(() => rowsCache.get(cacheKey) || []);
    const [loading, setLoading] = useState(true);
    const [loadedOnce, setLoadedOnce] = useState(() => rowsCache.has(cacheKey));
    const [error, setError] = useState("");
    const [query, setQueryState] = useState(readSearch);
    const setQuery = useCallback((v) => {
        setQueryState((cur) => {
            const next = typeof v === "function" ? v(cur) : v;
            saveSearch(next);
            return next;
        });
    }, []);
    const [invoiceFor, setInvoiceFor] = useState(null);   // row → Create Invoice confirm
    const [busy, setBusy] = useState(false);
    const reqId = useRef(0);

    const load = useCallback(async () => {
        const id = ++reqId.current;
        if (rowsCache.has(cacheKey)) setRows(rowsCache.get(cacheKey));
        setLoading(true);
        setError("");
        try {
            const data = await apiFetch(`/sales-orders?from=${fromMonth}&to=${toMonth}`);
            if (id !== reqId.current) return;
            rowsCache.set(cacheKey, data);
            setRows(data);
        } catch (e) {
            if (id !== reqId.current) return;
            setError(e.message || "Couldn't load the sales orders.");
            if (!rowsCache.has(cacheKey)) setRows([]);
        } finally {
            if (id === reqId.current) { setLoading(false); setLoadedOnce(true); }
        }
    }, [fromMonth, toMonth, cacheKey]);

    useEffect(() => { load(); }, [load, user?.id, user?.caid]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) => [r.customer_name, r.so_number, r.invoice_no, r.document_no, r.status, r.account].join(" ").toLowerCase().includes(q));
    }, [rows, query]);

    const openOrder = (r) => navigate(`${ORDER_PATH}/${encodeURIComponent(r.so_number)}`, { state: { from: location.pathname } });
    const openInvoice = (no) => navigate(`/task/sales/${encodeURIComponent(no)}`, { state: { from: location.pathname } });

    const createInvoice = async () => {
        setBusy(true);
        try {
            const r = await apiFetch(`/sales-orders/${invoiceFor.id}/create-invoice`, { method: "POST" });
            notify(r.message);
            setInvoiceFor(null);
            openInvoice(r.invoice_no);
        } catch (e) {
            notify(e.message || "Couldn't create the invoice.", "error");
            setInvoiceFor(null);
        } finally {
            setBusy(false);
        }
    };

    const columns = [
        { key: "customer_name", label: "Customer Name", render: (r) => <span className="cell-trunc strong" style={{ maxWidth: 240 }} title={r.customer_name}>{r.customer_name}</span> },
        { key: "so_number", label: "SO No", render: (r) => <span className="mono">{r.so_number}</span> },
        {
            key: "invoice_no",
            label: "Invoice No",
            render: (r) => r.invoice_no
                ? <button type="button" className="link-btn mono" style={{ border: 0, background: "none", padding: 0, color: "var(--brand)", cursor: "pointer", font: "inherit" }}
                    onClick={(e) => { e.stopPropagation(); openInvoice(r.invoice_no); }}>{r.invoice_no}</button>
                : <span className="muted">—</span>,
        },
        { key: "document_no", label: "Document No", render: (r) => r.document_no || "—" },
        { key: "transaction_date", label: "Order Date", render: (r) => fmtDay(r.transaction_date) },
        { key: "account", label: "Accounts", render: (r) => <span className="cell-trunc" style={{ maxWidth: 220 }} title={r.account}>{r.account || "—"}</span> },
        { key: "total", label: "Total", align: "right", value: (r) => Number(r.total), render: (r) => <span className="mono">{fmt4(r.total)}</span> },
        { key: "status", label: "Status", render: (r) => <Badge tone={orderTone(r.status)}>{r.status}</Badge> },
    ];

    const rowActions = (r) => [
        { label: "Open", onClick: () => openOrder(r) },
        ...(r.status === "OPEN" ? [{ label: "Create Invoice", onClick: () => setInvoiceFor(r) }] : []),
        ...(r.invoice_no ? [{ label: `Open ${r.invoice_no}`, onClick: () => openInvoice(r.invoice_no) }] : []),
    ];

    const actions = [
        { label: loading ? "Loading…" : "Refresh", icon: "refresh", onClick: load, disabled: loading },
        { label: "Add Sales Order", icon: "plus", variant: "primary", onClick: () => navigate(`${ORDER_PATH}/new`, { state: { from: location.pathname } }) },
    ];

    return (
        <>
            <SearchCard query={query} setQuery={setQuery} placeholder="Search customer, SO no, invoice or document no..." navTabs={SALES_TABS} actions={actions} sticky />

            {error && <div className="alert-error" role="alert">{error} <button className="btn btn-sm" onClick={load}>Try again</button></div>}

            <div className="sales-table">
                <DataTable
                    bodyHeight={TABLE_HEIGHT}
                    columns={columns}
                    rows={loading && !loadedOnce ? [] : filtered}
                    rowKey="id"
                    exportName={`sales-orders-${fromMonth}-to-${toMonth}`}
                    showToolbar={false}
                    stateKey="sales-orders"
                    resetKey={query}
                    emptyText={loading && !loadedOnce ? "Loading…" : "No sales orders for this period."}
                    onRowClick={openOrder}
                    rowActions={rowActions}
                />
            </div>

            {invoiceFor && (
                <ConfirmDialog
                    title={`Create an invoice from ${invoiceFor.so_number}?`}
                    message={`A sales invoice is saved with the same customer, items and amounts (total ${fmt4(invoiceFor.total)}). The order then can't be edited.`}
                    confirmLabel={busy ? "Creating…" : "Create Invoice"}
                    onCancel={() => !busy && setInvoiceFor(null)}
                    onConfirm={createInvoice}
                />
            )}
        </>
    );
}