import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Website.css";
import shotDesktop from "../assets/website/igb-desktop.jpg";
import shotLogin from "../assets/website/app-login.jpg";
import shotScan from "../assets/website/app-scan.jpg";
import shotSales from "../assets/website/app-sales.jpg";

// Public website shown at "/" when nobody is logged in.
// Every "Login" button goes to /login (the system's sign-in page).

const I = {
    sales: "M3 3h18v4H3zM5 7v14h14V7M9 11h6M9 15h4",
    buy: "M3 4h2l2.4 11h11.2L21 7H6.2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    book: "M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3zM18 20h2V7M8 8h6M8 12h6",
    bir: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
    people: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3",
    scan: "M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10",
    lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
    log: "M12 8v5l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9z",
    check: "M5 12l5 5 9-10",
    box: "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
    bill: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3",
    chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    cal: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4",
    arrow: "M5 12h14M13 6l6 6-6 6",
    menu: "M4 7h16M4 12h16M4 17h16",
    close: "M6 6l12 12M18 6 6 18",
    plus: "M12 5v14M5 12h14",
};
const Svg = ({ d, size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
    </svg>
);

// ---------- content (everything here is a real module of the system) ----------
const JOBS = [
    { icon: "sales", title: "Record a sale", text: "Invoice with VAT per line" },
    { icon: "buy", title: "Log an expense", text: "Bills, receipts and petty cash" },
    { icon: "scan", title: "Scan a receipt", text: "Camera or upload, details filled in" },
    { icon: "bir", title: "Prepare 2307", text: "Withholding certificates, ready to print" },
    { icon: "chart", title: "VAT summary", text: "Output less input, per month" },
    { icon: "people", title: "Run payroll", text: "From attendance to payslip" },
    { icon: "bill", title: "Bill a client", text: "Recurring services and collections" },
    { icon: "cal", title: "Close the month", text: "Trial balance and statements" },
];

// FEMS modules (client side only, no staff/HR modules)
const G = {
    sales: { label: "Sales", color: "#5b5bf0", icon: "sales" },
    buy: { label: "Purchases", color: "#f97316", icon: "buy" },
    stock: { label: "Inventory", color: "#0d9488", icon: "box" },
    books: { label: "Books", color: "#2563eb", icon: "book" },
    bir: { label: "BIR & Tax", color: "#db2777", icon: "bir" },
};
const MODULES = [
    { g: "sales", name: "Sales invoices", text: "VAT worked out per line, ready to print." },
    { g: "sales", name: "Sales orders", text: "Take the order first, invoice when delivered." },
    { g: "sales", name: "POS", text: "Quick counter sales that post straight to the books." },
    { g: "buy", name: "Purchases", text: "Supplier bills with input VAT and withholding." },
    { g: "buy", name: "Purchase orders", text: "Order from suppliers and track what arrives." },
    { g: "buy", name: "Expenses", text: "Every bill and receipt, tied to the right account." },
    { g: "buy", name: "Scanned receipts", text: "Snap or upload, and the details are read for you." },
    { g: "stock", name: "Inventory", text: "Stocks per warehouse, adjustments and transfers." },
    { g: "stock", name: "Import & export", text: "Importation and exportation tied to your books." },
    { g: "books", name: "Banking", text: "Deposits, payments and petty cash in one place." },
    { g: "books", name: "General journal", text: "Adjusting entries that always balance." },
    { g: "books", name: "Ledgers & trial balance", text: "Every account's movement and balance." },
    { g: "books", name: "Financial statements", text: "Balance sheet, cash flow and changes in equity." },
    { g: "bir", name: "BIR returns", text: "Prepared from the entries you already recorded." },
    { g: "bir", name: "2307", text: "Certificates of tax withheld, ready to print." },
    { g: "bir", name: "VAT summary", text: "Output less input VAT, month by month." },
    { g: "bir", name: "e-Submission", text: "Files ready for BIR e-submission." },
    { g: "bir", name: "Percentage & withholding tax", text: "Summaries for percentage and expanded withholding tax." },
    { g: "bir", name: "Income tax summary", text: "Quarterly and annual income tax at a glance." },
];

// card carousel: swipe / arrows, moves by itself, pauses on hover
function ModuleCarousel() {
    const track = useRef(null);
    const paused = useRef(false);
    const step = (dir) => {
        const el = track.current;
        if (!el) return;
        const card = el.querySelector(".ws-mod");
        const w = card ? card.offsetWidth + 16 : 280;
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
        const atStart = el.scrollLeft <= 4;
        if (dir > 0 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
        else if (dir < 0 && atStart) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
        else el.scrollBy({ left: dir * w, behavior: "smooth" });
    };
    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const t = setInterval(() => { if (!paused.current && !document.hidden) step(1); }, 3200);
        return () => clearInterval(t);
    }, []);
    const hold = (v) => () => { paused.current = v; };

    // drag with the mouse (touch already swipes natively)
    const drag = useRef(null);
    const onDown = (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        const el = track.current;
        drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
        el.classList.add("dragging");
    };
    const onMove = (e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 4) d.moved = true;
        track.current.scrollLeft = d.left - dx;
    };
    const onUp = () => {
        if (!drag.current) return;
        const el = track.current;
        el.classList.remove("dragging");   // snap back on, lands on the nearest card
        setTimeout(() => { if (drag.current) drag.current = null; }, 0);
    };
    // a drag should not count as a click on a card
    const onClickCapture = (e) => { if (drag.current?.moved) { e.preventDefault(); e.stopPropagation(); } };
    return (
        <div className="ws-carousel" onMouseEnter={hold(true)} onMouseLeave={hold(false)} onTouchStart={hold(true)} onFocus={hold(true)} onBlur={hold(false)}>
            <div className="ws-carousel-head">
                <div>
                    <h3>Everything inside FEMS</h3>
                    <p>{MODULES.length} modules for your sales, purchases, books and BIR.</p>
                </div>
                <div className="ws-carousel-btns">
                    <button onClick={() => step(-1)} aria-label="Previous"><Svg d={I.arrow} size={18} /></button>
                    <button onClick={() => step(1)} aria-label="Next"><Svg d={I.arrow} size={18} /></button>
                </div>
            </div>
            <div className="ws-carousel-track" ref={track}
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
                onClickCapture={onClickCapture} onDragStart={(e) => e.preventDefault()}>
                {MODULES.map((m) => {
                    const g = G[m.g];
                    return (
                        <article className="ws-mod" key={m.name} style={{ "--c": g.color }}>
                            <div className="ws-mod-top">
                                <span className="ws-mod-ic"><Svg d={I[g.icon]} size={20} /></span>
                                <span className="ws-mod-tag">{g.label}</span>
                            </div>
                            <h4>{m.name}</h4>
                            <p>{m.text}</p>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

const HIGHLIGHTS = [
    { icon: "bir", title: "BIR reports from your entries", text: "Returns, 2307, VAT summary, e-Submission, percentage and withholding tax summaries." },
    { icon: "sales", title: "VAT and withholding per line", text: "Every invoice line carries its own tax, so totals always tie to the details." },
    { icon: "book", title: "Books and statements", text: "Journals, ledgers, trial balance, balance sheet, cash flow and changes in equity." },
    { icon: "log", title: "Every change is logged", text: "User logs show who added, edited or voided what, and when." },
];

const STEPS = [
    { n: "01", title: "Set up the client", text: "Add the company, its tax type and chart of accounts once. Every module uses the same setup.", ui: "setup" },
    { n: "02", title: "Record or scan", text: "Encode sales, purchases and expenses on familiar forms, or scan the receipt and check what was read.", ui: "record" },
    { n: "03", title: "Post to the books", text: "Entries post to the journal with debits and credits that balance, ready for the ledgers.", ui: "post" },
    { n: "04", title: "Review and report", text: "Monitoring pages flag what needs attention. When the month is clean, pull the BIR and financial reports.", ui: "report" },
];

const AUDIENCE = [
    { title: "Accounting firms", text: "Handle many clients from one login. Switch client, and every page follows.", tags: ["Client masterlist", "Billing", "Monitoring"] },
    { title: "VAT-registered businesses", text: "Output and input VAT per line, VAT summary and the reports behind your returns.", tags: ["VAT summary", "2307", "e-Submission"] },
    { title: "Non-VAT businesses", text: "Percentage tax and income summaries straight from your sales and expenses.", tags: ["Percentage tax", "Income summary"] },
    { title: "Retail and trading", text: "POS, inventory per warehouse, receiving and transfers, with COGS in the books.", tags: ["POS", "Inventory", "COGS"] },
    { title: "Importers and exporters", text: "Importation and exportation records tied to their purchases and sales.", tags: ["Importation", "Exportation"] },
    { title: "Companies with staff", text: "Attendance, leave, overtime and payroll beside the books.", tags: ["Payroll", "Attendance", "Lending"] },
];

// ---------- Pricing: SET YOUR REAL PRICES HERE (₱ per month) ----------
const CONTACT_EMAIL = "sales@igb-solutions.com";   // ← change to your real email
const ANNUAL_OFF = 0.10;                            // annual billing discount
const PLANS = [
    {
        name: "Non-VAT", price: 499,
        for: "Sole proprietors and small businesses on percentage tax.",
        features: ["Sales, purchases and expenses", "Scan receipts on web and mobile", "Percentage tax and income summaries", "Books of accounts and financial statements", "1 company"],
    },
    {
        name: "VAT", price: 999, popular: true,
        for: "VAT-registered businesses that need every BIR report.",
        features: ["Everything in Non-VAT", "VAT per line and VAT summary", "2307 and withholding tax summaries", "e-Submission files", "Inventory and POS"],
    },
    {
        name: "Firms & Bookkeepers", price: null,
        for: "Accounting firms handling many clients and a team.",
        features: ["Many clients from one login", "Client masterlist and billing", "Monitoring for your whole team", "HR, payroll and lending", "Access set per user and page"],
    },
];

function Pricing() {
    const [annual, setAnnual] = useState(false);
    const fmt = (n) => "₱" + Math.round(n).toLocaleString("en-PH");
    return (
        <section className="ws-section ws-alt" id="pricing">
            <div className="ws-wrap">
                <div className="ws-head">
                    <span className="ws-eyebrow">Pricing</span>
                    <h2>Simple plans, no surprises</h2>
                    <p>Try it free for 15 days. No payment needed to start.</p>
                </div>
                <div className="ws-bill" role="tablist" aria-label="Billing period">
                    <button role="tab" aria-selected={!annual} className={!annual ? "on" : ""} onClick={() => setAnnual(false)}>Monthly</button>
                    <button role="tab" aria-selected={annual} className={annual ? "on" : ""} onClick={() => setAnnual(true)}>
                        Annual <span>Save {Math.round(ANNUAL_OFF * 100)}%</span>
                    </button>
                    <i className={annual ? "right" : ""} />
                </div>
                <div className="ws-plans">
                    {PLANS.map((p) => {
                        const month = p.price == null ? null : Math.round(p.price * (annual ? 1 - ANNUAL_OFF : 1));
                        return (
                            <article className={`ws-plan ${p.popular ? "pop" : ""}`} key={p.name}>
                                {p.popular && <span className="ws-plan-badge">Most popular</span>}
                                <h3>{p.name}</h3>
                                <p className="ws-plan-for">{p.for}</p>
                                <div className="ws-plan-price">
                                    {month == null ? <b className="ws-plan-custom">Custom</b> : <><b>{fmt(month)}</b><span>/ month</span></>}
                                </div>
                                <p className="ws-plan-note">
                                    {month == null ? "Priced by number of clients" : annual ? `Billed ${fmt(month * 12)} a year` : "Billed monthly"}
                                </p>
                                {month == null
                                    ? <a href={`mailto:${CONTACT_EMAIL}?subject=IGB%20for%20firms`} className="ws-btn ws-btn-ghost ws-plan-btn">Contact us</a>
                                    : <Link to="/login" className={`ws-btn ${p.popular ? "ws-btn-primary" : "ws-btn-ghost"} ws-plan-btn`}>Get started</Link>}
                                <ul>
                                    {p.features.map((f) => <li key={f}><Svg d={I.check} size={16} /> {f}</li>)}
                                </ul>
                            </article>
                        );
                    })}
                </div>
                <p className="ws-plan-fine">Prices are in Philippine pesos. You can change or cancel your plan anytime.</p>
            </div>
        </section>
    );
}

// ---------- AI team: animated robots + a looping demo of what each one does ----------
function Robot({ tone, prop }) {
    return (
        <svg className={`ws-bot ws-bot-${tone}`} viewBox="0 0 160 170" aria-hidden="true">
            <defs>
                <linearGradient id={`bot-${tone}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={tone === "a" ? "#7c7cff" : "#f472b6"} />
                    <stop offset="1" stopColor={tone === "a" ? "#5b3ff0" : "#c026d3"} />
                </linearGradient>
            </defs>
            <ellipse className="ws-bot-shadow" cx="80" cy="162" rx="38" ry="6" />
            <g className="ws-bot-body">
                {/* antenna */}
                <line x1="80" y1="22" x2="80" y2="8" stroke="#cbd5ff" strokeWidth="3" strokeLinecap="round" />
                <circle className="ws-bot-light" cx="80" cy="7" r="6" />
                {/* head */}
                <rect x="34" y="22" width="92" height="66" rx="22" fill={`url(#bot-${tone})`} />
                <rect x="22" y="44" width="12" height="22" rx="6" fill={`url(#bot-${tone})`} />
                <rect x="126" y="44" width="12" height="22" rx="6" fill={`url(#bot-${tone})`} />
                <rect x="45" y="35" width="70" height="40" rx="16" fill="#0b1020" />
                <g className="ws-bot-eyes">
                    <ellipse cx="66" cy="55" rx="7" ry="8" fill="#7df9ff" />
                    <ellipse cx="94" cy="55" rx="7" ry="8" fill="#7df9ff" />
                </g>
                <path d="M70 67 q10 6 20 0" stroke="#7df9ff" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* body */}
                <rect x="50" y="94" width="60" height="50" rx="18" fill={`url(#bot-${tone})`} />
                <circle className="ws-bot-core" cx="80" cy="117" r="9" />
                {/* arms */}
                <rect className="ws-bot-arm-l" x="30" y="98" width="14" height="36" rx="7" fill={`url(#bot-${tone})`} />
                <g className="ws-bot-arm-r">
                    <rect x="116" y="98" width="14" height="36" rx="7" fill={`url(#bot-${tone})`} />
                    {prop === "check" && (
                        <g transform="translate(112 126)">
                            <rect width="30" height="36" rx="5" fill="#fff" />
                            <rect x="6" y="7" width="18" height="3" rx="1.5" fill="#c7cbe0" />
                            <rect x="6" y="13" width="14" height="3" rx="1.5" fill="#c7cbe0" />
                            <circle cx="15" cy="26" r="7" fill="#16a34a" />
                            <path d="M11.5 26l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
                        </g>
                    )}
                    {prop === "lens" && (
                        <g transform="translate(118 122)">
                            <circle cx="12" cy="12" r="11" fill="rgba(125,249,255,.25)" stroke="#fff" strokeWidth="4" />
                            <line x1="20" y1="20" x2="30" y2="30" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
                        </g>
                    )}
                </g>
            </g>
        </svg>
    );
}

const AI_AGENTS = [
    {
        tone: "a", prop: "check", name: "AI Data Analyst", role: "Confirms scanned receipts",
        text: "Goes through your pending scanned receipts, reads them and confirms them for you, so they land in your books without the manual checking.",
        rows: ["S20261105051948.pdf", "S20261105051920.pdf", "P20261105051855.pdf", "E20261105051839.pdf"],
        idle: "Pending", busy: "Reading…", done: "Confirmed",
    },
    {
        tone: "b", prop: "lens", name: "AI Auditor", role: "Audits your entries",
        text: "Reviews your Sales, Purchases and Expenses entries and points out the ones that need a second look, before they reach your reports.",
        rows: ["Sales · INV-0412", "Purchase · PUR-0207", "Expense · EXP-0131", "Sales · INV-0413"],
        idle: "Queued", busy: "Auditing…", done: "Passed", flag: 2,
    },
];

function AiDemo({ agent }) {
    const [step, setStep] = useState(0);
    const n = agent.rows.length;
    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStep(n * 2); return; }
        const t = setInterval(() => setStep((x) => (x >= n * 2 + 2 ? 0 : x + 1)), 900);
        return () => clearInterval(t);
    }, [n]);
    const doneCount = Math.min(n, Math.floor(step / 2));
    return (
        <div className="ws-ai-demo">
            {agent.rows.map((r, i) => {
                const state = i < doneCount ? "done" : i === doneCount && step % 2 === 1 ? "busy" : "idle";
                const flagged = state === "done" && agent.flag === i;
                return (
                    <div className={`ws-ai-row ${state} ${flagged ? "flag" : ""}`} key={r}>
                        <span className="ws-ai-file">{r}</span>
                        <span className="ws-ai-st">
                            {state === "busy" && <i className="ws-ai-spin" />}
                            {state === "done" ? (flagged ? "Needs review" : agent.done) : state === "busy" ? agent.busy : agent.idle}
                        </span>
                    </div>
                );
            })}
            <div className="ws-ai-foot">
                <span>{doneCount} of {n} done</span>
                <span className="ws-ai-bar"><i style={{ width: `${(doneCount / n) * 100}%` }} /></span>
            </div>
        </div>
    );
}

function AiTeam() {
    return (
        <section className="ws-ai" id="ai">
            <div className="ws-wrap">
                <div className="ws-head">
                    <span className="ws-eyebrow ws-eyebrow-dark">New · AI team</span>
                    <h2>Two AI helpers that <span className="ws-grad-text">never get tired</span></h2>
                    <p>They work through the boring part of bookkeeping so your team can focus on the numbers that matter.</p>
                </div>
                <div className="ws-ai-grid">
                    {AI_AGENTS.map((a) => (
                        <article className={`ws-ai-card ws-ai-${a.tone}`} key={a.name}>
                            <div className="ws-ai-top">
                                <Robot tone={a.tone} prop={a.prop} />
                                <div>
                                    <span className="ws-ai-role">{a.role}</span>
                                    <h3>{a.name}</h3>
                                    <p>{a.text}</p>
                                </div>
                            </div>
                            <AiDemo agent={a} />
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

const NAV = [["features", "Features"], ["ai", "AI team"], ["how", "How it works"], ["mobile", "Mobile app"], ["pricing", "Pricing"], ["faq", "FAQ"]];

const FAQ = [
    { q: "How do I get an account?", a: "Accounts are created by your administrator or by IGB. Once you have a username and password, use the Login button on this page." },
    { q: "Can one firm handle many clients?", a: "Yes. Clients are kept in the client masterlist; choose a client and every page shows that client's records only." },
    { q: "Which BIR reports can I get?", a: "BIR returns, 2307, VAT summary, e-Submission, income tax summary, percentage tax and expanded withholding tax summaries, all from your recorded entries." },
    { q: "Can I scan receipts instead of typing?", a: "Yes. Scanned receipts and documents are read for you, so details like TIN, dates and numbers fill in on their own. You review them before saving." },
    { q: "Who can see my data?", a: "Only users with a login, and only the pages their access allows. Files are stored privately and opened through short-lived links." },
];

// ---------- faded receipts behind the hero (decoration only) ----------
// [left %, top %, rotate deg, scale, rows]
const RECEIPTS = [
    [1, 8, -14, 1, 4], [15, -4, 9, .8, 3], [29, 6, -6, .7, 5], [44, -6, 12, .9, 4], [60, 2, -10, .75, 3], [76, -5, 7, 1, 5], [91, 6, -12, .85, 4],
    [-3, 46, 11, .9, 5], [8, 74, -8, 1.1, 4], [24, 84, 14, .8, 3], [40, 72, -12, .95, 5], [56, 86, 6, .8, 4], [72, 76, -7, 1, 3], [88, 70, 13, .9, 5],
    [96, 36, 15, .85, 3], [36, 38, -4, .7, 4], [50, 44, 9, .65, 3],
];
function HeroReceipts() {
    return (
        <div className="ws-receipts" aria-hidden="true">
            {RECEIPTS.map(([x, y, r, sc, rows], i) => (
                <div className="ws-rc" key={i} style={{ left: `${x}%`, top: `${y}%`, "--r": `${r}deg`, "--s": sc, "--d": `${-i * 1.3}s` }}>
                    <div className="ws-rc-paper">
                        <span className="ws-rc-shop" />
                        <span className="ws-rc-sub" />
                        <hr />
                        {Array.from({ length: rows }, (_, k) => <span className="ws-rc-row" key={k}><i style={{ width: `${45 + ((i * 7 + k * 13) % 30)}%` }} /><i /></span>)}
                        <hr />
                        <span className="ws-rc-row ws-rc-total"><i /><i /></span>
                        <span className="ws-rc-bar" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ---------- floating phone: loops scan → submit → checked, all the time ----------
function ScanPhone() {
    return (
        <figure className="ws-float play">
            <div className="ws-scanner">
                <img src={shotScan} alt="Mobile app scan screen" draggable="false" />
                {/* the camera frame area of the screenshot */}
                <div className="ws-sc-frame">
                    <div className="ws-sc-receipt">
                        <b>OFFICIAL RECEIPT</b>
                        <span><i /><i /></span><span><i /><i /></span><span><i /><i /></span>
                        <em><i /><i /></em>
                        <u />
                    </div>
                    <div className="ws-sc-laser" />
                    <span className="ws-sc-chip c1">TIN ✓</span>
                    <span className="ws-sc-chip c2">Date ✓</span>
                    <span className="ws-sc-chip c3">Total ✓</span>
                </div>
                <div className="ws-sc-btn" />
                <div className="ws-sc-done">
                    <span className="ws-sc-check"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-16" /></svg></span>
                    <b>Submitted</b>
                    <small>Saved to Sales</small>
                </div>
            </div>
        </figure>
    );
}

// ---------- small product mockups (illustration only) ----------
function StepUi({ kind }) {
    if (kind === "setup") return (
        <div className="ws-mini">
            {[["Tax type", "VAT"], ["Chart of accounts", "Preset"], ["Invoice series", "INV-0001"]].map(([a, b]) => (
                <div className="ws-mini-row" key={a}><span>{a}</span><b>{b}</b></div>
            ))}
        </div>
    );
    if (kind === "record") return (
        <div className="ws-mini">
            <div className="ws-mini-row"><span>Gross</span><b>₱ 8,960.00</b></div>
            <div className="ws-mini-row"><span>Net of VAT</span><b>8,000.00</b></div>
            <div className="ws-mini-row hi"><span>VAT 12%</span><b>960.00</b></div>
        </div>
    );
    if (kind === "post") return (
        <div className="ws-mini">
            <div className="ws-mini-row head"><span>Account</span><span>Debit</span><span>Credit</span></div>
            <div className="ws-mini-row"><span>Accounts receivable</span><b>8,960.00</b><b /></div>
            <div className="ws-mini-row"><span>Sales</span><b /><b>8,000.00</b></div>
            <div className="ws-mini-row"><span>Output VAT</span><b /><b>960.00</b></div>
            <div className="ws-mini-row ok"><span>Balanced</span><b>8,960.00</b><b>8,960.00</b></div>
        </div>
    );
    return (
        <div className="ws-mini">
            {["VAT summary", "2307", "Trial balance", "Balance sheet"].map((x) => (
                <div className="ws-mini-row" key={x}><span>{x}</span><span className="ws-tag ok">Ready</span></div>
            ))}
        </div>
    );
}

function Faq() {
    const [open, setOpen] = useState(0);
    return (
        <div className="ws-faq">
            {FAQ.map((f, i) => (
                <div className={`ws-faq-item ${open === i ? "open" : ""}`} key={f.q}>
                    <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                        <span>{f.q}</span><Svg d={I.plus} size={18} />
                    </button>
                    {open === i && <p>{f.a}</p>}
                </div>
            ))}
        </div>
    );
}

export default function Website() {
    const [menu, setMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [active, setActive] = useState("");
    const stage = useRef(null);

    // nav: shadow after scrolling + highlight the section on screen
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
        }, { rootMargin: "-45% 0px -50% 0px" });
        ["top", ...NAV.map(([id]) => id)].forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
        return () => { window.removeEventListener("scroll", onScroll); io.disconnect(); };
    }, []);
    const year = new Date().getFullYear();

    useEffect(() => {
        const prev = document.title;
        document.title = "IGB Solutions";
        return () => { document.title = prev; };
    }, []);

    // 0 = slanted (top of page) → 0.55 = less slanted (scrolled to it); never fully flat
    useEffect(() => {
        const el = stage.current;
        if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        let raf = 0;
        const update = () => {
            raf = 0;
            const r = el.getBoundingClientRect();
            const p = Math.min(0.55, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight * 0.9) - 0.35));
            el.style.setProperty("--p", p.toFixed(3));
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
    }, []);

    const go = (id) => (e) => {
        e.preventDefault();
        setMenu(false);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="ws">
            {/* Top bar */}
            <header className={`ws-nav ${scrolled ? "scrolled" : ""} ${menu ? "menu-open" : ""}`}>
                <div className="ws-nav-in">
                    <a href="#top" className="ws-logo" onClick={go("top")}>
                        <span className="ws-mark">IGB</span>
                        <span className="ws-logo-text">
                            <span className="ws-logo-name">IGB Solutions</span>
                            <span className="ws-logo-sub">Accounting · BIR · Payroll</span>
                        </span>
                    </a>
                    <nav className="ws-links">
                        {NAV.map(([id, label]) => (
                            <a key={id} href={`#${id}`} className={active === id ? "on" : ""} onClick={go(id)}>{label}</a>
                        ))}
                    </nav>
                    <div className="ws-nav-actions">
                        <Link to="/login" className="ws-btn ws-btn-primary ws-nav-login">Login <Svg d={I.arrow} size={16} /></Link>
                        <button className="ws-burger" onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu}>
                            <Svg d={menu ? I.close : I.menu} />
                        </button>
                    </div>
                </div>
                {/* phone menu */}
                <nav className="ws-drawer">
                    {NAV.map(([id, label]) => (
                        <a key={id} href={`#${id}`} className={active === id ? "on" : ""} onClick={go(id)}>{label}</a>
                    ))}
                    <Link to="/login" className="ws-btn ws-btn-primary">Login <Svg d={I.arrow} size={16} /></Link>
                </nav>
            </header>

            {/* Hero */}
            <section className="ws-hero" id="top">
                <HeroReceipts />
                <div className="ws-wrap ws-hero-in">
                    <div className="ws-hero-copy">
                        <span className="ws-eyebrow">Bookkeeping & BIR for Philippine businesses</span>
                        <h1>Record it once. <em>The books follow.</em></h1>
                        <p>Sales, purchases, expenses, inventory, payroll and BIR reports in one system. Every entry posts to balanced books with VAT and withholding worked out per line.</p>
                        <div className="ws-cta">
                            <Link to="/login" className="ws-btn ws-btn-primary ws-btn-lg">Login to IGB <Svg d={I.arrow} size={18} /></Link>
                            <a href="#how" className="ws-btn ws-btn-ghost ws-btn-lg" onClick={go("how")}>See how it works</a>
                        </div>
                        <ul className="ws-points">
                            <li><Svg d={I.check} size={16} /> BIR-ready reports</li>
                            <li><Svg d={I.check} size={16} /> Balanced books</li>
                            <li><Svg d={I.check} size={16} /> Web and mobile</li>
                        </ul>
                    </div>
                    {/* slanted screenshot that straightens as you scroll */}
                    <div className="ws-stage" ref={stage}>
                        <div className="ws-shot">
                            <div className="ws-shot-bar"><i /><i /><i /><span>igb-solutions.com</span></div>
                            <img src={shotDesktop} alt="IGB home page: sales, purchases, receivables, payables and tax payable at a glance, with the next BIR due dates" />
                        </div>
                        <ScanPhone />
                    </div>
                </div>
            </section>

            {/* Quick tasks + modules */}
            <section className="ws-jobs">
                <div className="ws-wrap">
                    <div className="ws-head">
                        <span className="ws-eyebrow">One click away</span>
                        <h2>Your whole month's work, <span className="ws-grad-text">in one place</span></h2>
                        <p>From the first receipt to the last BIR form, jump straight to what needs doing today.</p>
                    </div>
                    <div className="ws-tasks">
                        {JOBS.map((j) => (
                            <Link to="/login" className="ws-task" key={j.title}>
                                <span className="ws-task-ic"><Svg d={I[j.icon]} size={20} /></span>
                                <span className="ws-task-txt"><b>{j.title}</b><small>{j.text}</small></span>
                                <span className="ws-task-go"><Svg d={I.arrow} size={16} /></span>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="ws-wrap">
                    <ModuleCarousel />
                </div>
            </section>

            {/* Highlights */}
            <section className="ws-section" id="features">
                <div className="ws-wrap">
                    <div className="ws-head">
                        <span className="ws-eyebrow">Built for BIR compliance</span>
                        <h2>Not a black box</h2>
                        <p>Every report comes from entries you can open, trace and correct.</p>
                    </div>
                    <div className="ws-hl">
                        {HIGHLIGHTS.map((h) => (
                            <article className="ws-card" key={h.title}>
                                <span className="ws-ic"><Svg d={I[h.icon]} /></span>
                                <h3>{h.title}</h3>
                                <p>{h.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <AiTeam />

            {/* Statement */}
            <section className="ws-statement">
                <div className="ws-wrap">
                    <h2>Encode once. <span>IGB does the rest.</span></h2>
                    <p>Balanced books, VAT and withholding, BIR reports and financial statements, from the same entries.</p>
                </div>
            </section>

            {/* How it works */}
            <section className="ws-section ws-alt" id="how">
                <div className="ws-wrap">
                    <div className="ws-head">
                        <span className="ws-eyebrow">How it works</span>
                        <h2>From first entry to filed</h2>
                    </div>
                    <div className="ws-steps">
                        {STEPS.map((s) => (
                            <div className="ws-step" key={s.n}>
                                <span className="ws-step-n">{s.n}</span>
                                <h3>{s.title}</h3>
                                <p>{s.text}</p>
                                <StepUi kind={s.ui} />
                            </div>
                        ))}
                    </div>
                    <div className="ws-center">
                        <Link to="/login" className="ws-btn ws-btn-primary ws-btn-lg">Login to get started <Svg d={I.arrow} size={18} /></Link>
                    </div>
                </div>
            </section>

            {/* Mobile app */}
            <section className="ws-app" id="mobile">
                <div className="ws-wrap ws-app-in">
                    <div className="ws-app-copy">
                        <span className="ws-eyebrow ws-eyebrow-dark">Mobile app</span>
                        <h2>Scan receipts from your phone</h2>
                        <p>Point the camera at a receipt or upload a file. It goes straight to your Sales, Purchases or Expenses, and you can see when each one is confirmed.</p>
                        <ul className="ws-points ws-points-col">
                            <li><Svg d={I.check} size={16} /> Scan with the camera or upload from your phone</li>
                            <li><Svg d={I.check} size={16} /> Every receipt listed by month, with its status</li>
                            <li><Svg d={I.check} size={16} /> Sign in with Google, Facebook, password or fingerprint</li>
                        </ul>
                    </div>
                    <div className="ws-phones">
                        <figure className="ws-phone"><img src={shotLogin} alt="Mobile app sign-in screen" /></figure>
                        <figure className="ws-phone ws-phone-main"><img src={shotScan} alt="Mobile app scan screen" /></figure>
                        <figure className="ws-phone"><img src={shotSales} alt="Mobile app list of scanned sales receipts" /></figure>
                    </div>
                </div>
            </section>

            {/* Who it's for */}
            <section className="ws-section" id="who">
                <div className="ws-wrap">
                    <div className="ws-head">
                        <span className="ws-eyebrow">Who it's for</span>
                        <h2>One system, every set of books</h2>
                    </div>
                    <div className="ws-aud">
                        {AUDIENCE.map((a) => (
                            <article className="ws-card" key={a.title}>
                                <h3>{a.title}</h3>
                                <p>{a.text}</p>
                                <div className="ws-tags">{a.tags.map((t) => <span key={t}>{t}</span>)}</div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust */}
            <section className="ws-section ws-dark" id="security">
                <div className="ws-wrap ws-trust">
                    <div>
                        <span className="ws-eyebrow ws-eyebrow-dark">Security</span>
                        <h2>Your books stay yours</h2>
                        <ul className="ws-points ws-points-col">
                            <li><Svg d={I.check} size={16} /> Each client's records are kept apart</li>
                            <li><Svg d={I.check} size={16} /> Access is set per user and per page</li>
                            <li><Svg d={I.check} size={16} /> User logs record every change</li>
                            <li><Svg d={I.check} size={16} /> Files are private and opened by short-lived links</li>
                        </ul>
                    </div>
                    <div className="ws-ledger" aria-hidden="true">
                        <div className="ws-ledger-h"><Svg d={I.lock} size={16} /> User logs</div>
                        {[
                            ["10:42", "maria", "Posted INV-0414", "ok"],
                            ["10:45", "jose", "Edited EXP-0207 amount", "warn"],
                            ["10:51", "maria", "Voided INV-0409", "bad"],
                            ["11:03", "ana", "Generated VAT summary", "ok"],
                        ].map(([t, u, a, k]) => (
                            <div className="ws-ledger-r" key={t}>
                                <span className="mono">{t}</span><span>{u}</span><span>{a}</span><i className={k} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Pricing />

            {/* FAQ */}
            <section className="ws-section" id="faq">
                <div className="ws-wrap ws-faq-wrap">
                    <div className="ws-head ws-head-left">
                        <span className="ws-eyebrow">FAQ</span>
                        <h2>Questions, answered</h2>
                    </div>
                    <Faq />
                </div>
            </section>

            {/* Closing */}
            <section className="ws-band">
                <div className="ws-wrap ws-band-in">
                    <div>
                        <h2>Your books, ready when you are.</h2>
                        <p>Sign in to continue where you left off.</p>
                    </div>
                    <Link to="/login" className="ws-btn ws-btn-white ws-btn-lg">Login <Svg d={I.arrow} size={18} /></Link>
                </div>
            </section>

            <footer className="ws-foot">
                <div className="ws-wrap ws-foot-grid">
                    <div className="ws-foot-brand">
                        <span className="ws-logo"><span className="ws-mark">IGB</span><span className="ws-logo-name">IGB Solutions</span></span>
                        <p>Bookkeeping, BIR reports, inventory and payroll in one system.</p>
                    </div>
                    <div>
                        <h4>Product</h4>
                        <a href="#features" onClick={go("features")}>Features</a>
                        <a href="#how" onClick={go("how")}>How it works</a>
                        <a href="#ai" onClick={go("ai")}>AI team</a>
                        <a href="#mobile" onClick={go("mobile")}>Mobile app</a>
                        <a href="#who" onClick={go("who")}>Who it's for</a>
                        <a href="#pricing" onClick={go("pricing")}>Pricing</a>
                        <a href="#security" onClick={go("security")}>Security</a>
                        <a href="#faq" onClick={go("faq")}>FAQ</a>
                    </div>
                    <div>
                        <h4>Account</h4>
                        <Link to="/login">Login</Link>
                    </div>
                </div>
                <div className="ws-wrap ws-foot-bottom">
                    <span>© {year} IGB. All rights reserved.</span>
                    <span>Made in the Philippines</span>
                </div>
            </footer>
        </div>
    );
}