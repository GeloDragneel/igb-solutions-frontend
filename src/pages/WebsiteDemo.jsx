import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./WebsiteDemo.css";

/* =========================================================
   Website → "See it in action": an auto-playing walkthrough of FEMS,
   drawn like the real screens (Dashboard, Add Product, Purchase Order, Receive Inventory,
   Sales / Invoicing, Purchases / Vendor Invoice, Expenses, Scanned Receipts,
   BIR & Tax, Trial Balance, Balance Sheet, Working Trial Balance).
   Sample data only. A fake cursor moves, fields type themselves, SAVE is clicked,
   then what FEMS records is shown.
   ========================================================= */

const P = {
    box: "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
    sales: "M3 3h18v4H3zM5 7v14h14V7M9 11h6M9 15h4",
    buy: "M3 4h2l2.4 11h11.2L21 7H6.2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    po: "M7 3h10v18H7zM10 7h4M10 11h4M10 15h2",
    truck: "M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
    bill: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3",
    scan: "M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10",
    play: "M7 5v14l12-7z",
    pause: "M8 5v14M16 5v14",
    check: "M5 12l5 5 9-10",
    home: "M3 11 12 4l9 7M5 10v10h14V10",
    book: "M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3zM18 20h2V7",
    chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    file: "M7 3h7l5 5v13H7zM14 3v5h5",
    expand: "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5",
    shrink: "M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5",
    sound: "M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12",
    mute: "M4 9h4l5-4v14l-5-4H4zM17 9l5 6M22 9l-5 6",
};
const Ico = ({ d, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

/* field: { label, value, col (1-3), select, num, ro (fixed, not typed), auto: { after: index } (filled when that one is picked), done (value after SAVE) } */
const NONE = "No file chosen";
const CHAPTERS = [
    {
        key: "dash", title: "Dashboard", icon: "home", crumb: ["Home"], layout: "dashboard",
        heading: "Home", company: "SAMPLE FUEL STATION", user: "MARIA",
        period: "1 JUL 2026 – 30 SEP 2026", sales: 1610328.35, spent: 4187787.24,
        actions: ["+ New Sales Invoice", "New purchase", "New expense", "New Inventory Item", "Journal entry"],
        dues: [
            { top: "FOLLOWING DUE", n: 14, form: "Form 1601-C / 0619-E", cov: "Period Covered : Nov 2026", due: "Due : 10 Dec 2026" },
            { top: "NEXT DUE", n: 3, form: "Form 1702Q", cov: "Period Covered : Q3 2026", due: "Due : 29 Nov 2026" },
        ],
        cards: [
            { label: "Sales", value: 1610328.35, sub: "3537 invoices", tone: "c1", spark: [3, 2, 4, 3, 7, 2, 8, 3] },
            { label: "Purchases & expenses", value: 4187787.24, sub: "41 records", tone: "c2", spark: [3, 4, 3, 5, 4, 6, 4, 7] },
            { label: "Accounts receivable", value: 125430, sub: "4 unpaid invoices", tone: "c3" },
            { label: "Accounts payable", value: 321880.5, sub: "5 unpaid bills", tone: "c4" },
            { label: "Excess input VAT", value: 73691.52, sub: "Sep 2026 · Output – Input VAT", tone: "c5", tag: "Not filed" },
            { label: "Withholding tax payable", value: 13527.43, sub: "Sep 2026 · 0619-E", tone: "c6", tag: "Not filed" },
            { label: "Income tax payable", value: 6910.1, sub: "Q3 2026 · Quarterly ITR", tone: "c7" },
            { label: "Compensation payable", value: 24180, sub: "Sep 2026 · 1601-C", tone: "c8", tag: "Not filed" },
        ],
        months: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
        salesM: [0.45, 0.48, 1.05, 0.62, 0.55, 2.85, 0.5, 0.48, 3.5, 0.6, 0.5, 0.55],
        costM: [0.9, 0.82, 0.86, 1.25, 0.62, 1.2, 1.4, 1.05, 0.95, 1.6, 0.85, 1.05],
        vat: { output: 84399.64, input: 158091.16 },
        calendar: [
            ["NOV", "29", "1702Q", "Quarterly Income Tax (Corporation) · Q3 2026", "in 3 days", true],
            ["DEC", "10", "1601-C", "Withholding Tax on Compensation · Nov 2026", "in 14 days"],
            ["DEC", "10", "0619-E", "Expanded Withholding Tax remittance · Nov 2026", "in 14 days"],
            ["JAN", "10", "1601-C", "Withholding Tax on Compensation · Dec 2026", "in 45 days"],
        ],
        customers: [["Walk In", "₱1.6M", 100, "3519 invoices"], ["Northpoint Logistics", "₱3.6K", 6, "1 invoice"], ["City Government", "₱2.8K", 5, "1 invoice"], ["Bayview Telecom", "₱2.7K", 5, "2 invoices"]],
        invoices: [["Harbor Business Services", "21 Sep 2026 · PAID", "₱250.00"], ["Walk In", "21 Sep 2026 · PAID", "₱350.00"], ["Walk In", "21 Sep 2026 · PAID", "₱300.00"], ["Walk In", "20 Sep 2026 · PAID", "₱500.00"]],
        toast: "Everything at a glance",
        captions: {
            hero: "Home: your period, sales and spending, quick actions and the next BIR due dates.",
            cards: "Sales, purchases, receivables, payables and every tax payable, live.",
            charts: "Sales vs costs month by month, and this month's VAT position.",
            lists: "BIR calendar, top customers and the latest invoices.",
            done: "Open FEMS and you know where the business stands.",
        },
    },
    {
        key: "product", title: "Create a product", icon: "box", crumb: ["Setup", "Products"], layout: "product",
        heading: "Add Product",
        fields: [
            { label: "Item ID *", value: "002" },
            { label: "Description *", value: "Diesel" },
            { label: "Barcode", value: "4800016644221" },
            { label: "Item Class *", value: "Stock Item", select: true },
            { label: "Tax Type", value: "VAT", select: true },
        ],
        lines: { title: "Unit List", cols: ["Unit", "Value", "Price", "Cost"], num: 1, rows: [["★ Liter", "1", "95.3000", "94.2000"]] },
        buttons: ["Close"], button: "SAVE", toast: "Product saved",
        result: {
            type: "list", title: "Accounts set up for you",
            rows: [["40010 · Sales – Diesel", "NEW"], ["11301 · Inventory – Diesel", "NEW"], ["50010 · Cost of Sales – Diesel", "NEW"]],
        },
        captions: {
            fields: "Add New Product: type the Item ID and description, then pick the Item Class and Tax Type.",
            lines: "Add its unit with the price and cost. ★ is the default unit on invoices.",
            save: "Click SAVE.",
            done: "Its Sales, Inventory and Cost of Sales accounts are added to the chart of accounts for you.",
        },
    },
    {
        key: "po", title: "Purchase order", icon: "po", crumb: ["Task", "Purchases", "Purchase Order"], layout: "invoice",
        heading: "Purchase Order",
        fields: [
            { col: 1, label: "Vendor *", value: "VEPCO Group Distribution Corp", select: true },
            { col: 1, label: "", value: "Osmeña St Brgy 24", auto: { after: 0 } },
            { col: 1, label: "TIN", value: "008-123-456-00000", auto: { after: 0 } },
            { col: 1, label: "Payment Terms", value: "30 days", select: true },
            { col: 2, label: "PO Date *", value: "26/11/2026" },
            { col: 2, label: "Currency", value: "PHP", ro: true, select: true },
            { col: 2, label: "Exchange Rate", value: "1", ro: true, num: true },
            { col: 2, label: "PO Status", value: "NEW", ro: true, done: "OPEN" },
            { col: 3, label: "PO Number *", value: "PO-261126-0001" },
            { col: 3, label: "Ship To", value: "Station", select: true },
            { col: 3, label: "Accounts *", value: "21100 - Accounts Payable", ro: true, select: true },
            { col: 3, label: "Attachment", value: NONE, ro: true, file: true },
        ],
        lines: {
            cols: ["Item ID *", "Accounts *", "Qty", "Price *", "Total", "Input VAT", "Net of VAT"], num: 2,
            rows: [
                ["002 · Diesel", "50010 - Cost of Sales – Diesel", "2,000", "100.30", "200,600.00", "21,492.86", "179,107.14"],
                ["001 · Regular", "50020 - Cost of Sales – Regular", "6,000", "84.30", "505,800.00", "54,192.86", "451,607.14"],
            ],
        },
        summary: [["Total", "706,400.00"]],
        buttons: ["Close", "VOID", "LOGS", "ADD ITEM", "PRINT"], button: "SAVE", toast: "Purchase order saved",
        result: {
            type: "list", title: "PO-261126-0001",
            rows: [["Status", "OPEN"], ["Items", "Diesel 2,000 · Regular 6,000"], ["Next", "Receive Inventory"]],
        },
        captions: {
            fields: "Pick the vendor. The address and TIN fill in, then set the PO number and where to ship.",
            lines: "Add the items you're ordering. VAT is split out per line.",
            save: "Click SAVE.",
            done: "Nothing is posted yet: the PO waits until the goods are received.",
        },
    },
    {
        key: "grn", title: "Receive inventory", icon: "truck", crumb: ["Task", "Inventory", "Receive Inventory"], layout: "invoice",
        heading: "Receive Inventory",
        fields: [
            { col: 1, label: "Vendor *", value: "VEPCO Group Distribution Corp", select: true },
            { col: 1, label: "", value: "Osmeña St Brgy 24", auto: { after: 0 } },
            { col: 1, label: "", value: "Cagayan de Oro City", auto: { after: 0 } },
            { col: 2, label: "Date *", value: "28/11/2026" },
            { col: 2, label: "Transaction No", value: "(assigned when saved)", ro: true, done: "GRN-261128-001" },
            { col: 2, label: "Invoice Status", value: "NEW", ro: true, done: "UNPAID" },
            { col: 3, label: "Apply PO#", value: "PO-261126-0001", select: true },
            { col: 3, label: "Location *", value: "Station", select: true },
            { col: 3, label: "Attachment", value: NONE, ro: true, file: true },
        ],
        lines: {
            cols: ["Item *", "Accounts", "Qty", "Price", "Total", "Input VAT", "Net of VAT"], num: 2,
            rows: [
                ["002 · Diesel", "50010 - Cost of Sales – Diesel", "2,000", "100.30", "200,600.00", "21,492.86", "179,107.14"],
                ["001 · Regular", "50020 - Cost of Sales – Regular", "6,000", "84.30", "505,800.00", "54,192.86", "451,607.14"],
            ],
        },
        summary: [["Sub Total", "630,714.29"], ["ATC (IT)", "WC158 (1%)"], ["2307 (IT)", "6,307.14"], ["Input VAT", "75,685.71"]],
        buttons: ["+ Receive New", "Close", "VOID"], button: "SAVE", toast: "Inventory received",
        result: {
            type: "list", title: "GRN-261128-001",
            rows: [["Stock in", "Diesel +2,000 · Regular +6,000"], ["Status", "UNPAID"], ["PO-261126-0001", "Received"]],
        },
        captions: {
            fields: "Pick the vendor and apply the PO. Its items come in by themselves.",
            lines: "Check the quantities received. 2307 is worked out from the ATC.",
            save: "Click SAVE.",
            done: "Stock goes up. This receipt is the cost used for FIFO or Weighted Average.",
        },
    },
    {
        key: "sales", title: "Sales invoice", icon: "sales", crumb: ["Task", "Sales", "Invoice"], layout: "invoice",
        heading: "Sales / Invoicing", badge: "NEW",
        fields: [
            { col: 1, label: "Customer ID *", value: "Dela Cruz Trading", select: true },
            { col: 1, label: "", value: "Osmeña St Brgy 24", auto: { after: 0 } },
            { col: 1, label: "TIN", value: "123-456-789-00000", auto: { after: 0 } },
            { col: 1, label: "Branch Code", value: "00000", auto: { after: 0 } },
            { col: 2, label: "Invoice Date *", value: "26/11/2026" },
            { col: 2, label: "Currency", value: "PHP", ro: true, select: true },
            { col: 2, label: "Exchange Rate", value: "1", ro: true, num: true },
            { col: 2, label: "Invoice Status", value: "NEW", ro: true, done: "PAID" },
            { col: 3, label: "Invoice No", value: "(assigned when saved)", ro: true, done: "INV-261126-09153" },
            { col: 3, label: "Document # *", value: "SI# 30810" },
            { col: 3, label: "Document Type", value: "Sales Invoice", select: true },
            { col: 3, label: "Accounts *", value: "11101 - Cash on Hand", ro: true, select: true },
        ],
        lines: {
            cols: ["Item ID *", "Accounts *", "Qty", "Price *", "Total", "Output VAT", "Net of VAT"], num: 2,
            rows: [
                ["002 · Diesel", "40010 - Sales – Diesel", "40", "95.30", "3,812.00", "408.43", "3,403.57"],
                ["001 · Regular", "40020 - Sales – Regular", "20", "87.35", "1,747.00", "187.18", "1,559.82"],
            ],
        },
        summary: [["Sub Total", "4,963.39"], ["Discount Amt", "0.00"], ["Output VAT", "595.61"], ["Total", "5,559.00"]],
        buttons: ["Close", "VOID", "CANCEL", "PRINT", "+ Add New Sales"], button: "SAVE", toast: "Invoice saved · INV-261126-09153",
        result: {
            type: "journal", title: "Journal · INV-261126-09153",
            rows: [
                ["11101 · Cash on Hand", "5,559.00", ""],
                ["21606 · Output VAT", "", "595.61"],
                ["40010 · Sales – Diesel", "", "3,403.57"],
                ["40020 · Sales – Regular", "", "1,559.82"],
                { total: ["5,559.00", "5,559.00"] },
                { section: "INVENTORY / COST OF SALES" },
                ["50010 · Cost of Sales – Diesel", "3,768.00", ""],
                ["50020 · Cost of Sales – Regular", "1,642.00", ""],
                ["11301 · Inventory – Diesel", "", "3,768.00"],
                ["11303 · Inventory – Regular", "", "1,642.00"],
            ],
        },
        captions: {
            fields: "Pick the customer. Address, TIN and branch code fill in. Type the Document #.",
            lines: "Add the items. Output VAT and Net of VAT are worked out per line.",
            save: "Click SAVE.",
            done: "The invoice number is assigned and the journal is posted, with the cost of the Stock Items sold.",
        },
    },
    {
        key: "purchase", title: "Vendor invoice", icon: "buy", crumb: ["Task", "Purchases", "Vendor Invoices"], layout: "invoice",
        heading: "Purchases / Vendor Invoice", badge: "NEW",
        fields: [
            { col: 1, label: "Vendor *", value: "Petron Corporation", select: true },
            { col: 1, label: "", value: "Bonifacio Global City", auto: { after: 0 } },
            { col: 1, label: "TIN", value: "000-168-801-00000", auto: { after: 0 } },
            { col: 1, label: "Branch Code", value: "00000", auto: { after: 0 } },
            { col: 2, label: "Invoice Date *", value: "26/11/2026" },
            { col: 2, label: "Currency", value: "PHP", ro: true, select: true },
            { col: 2, label: "Exchange Rate", value: "1", ro: true, num: true },
            { col: 2, label: "Invoice Status", value: "NEW", ro: true, done: "PAID" },
            { col: 3, label: "Invoice No", value: "(assigned when saved)", ro: true, done: "PUR-261126-04411" },
            { col: 3, label: "Document # *", value: "INV-88123" },
            { col: 3, label: "Document Type", value: "Sales Invoice", select: true },
            { col: 3, label: "Accounts *", value: "11101 - Cash on Hand", ro: true, select: true },
        ],
        lines: {
            cols: ["Item ID *", "Accounts *", "Qty", "Price *", "Total", "Input VAT", "Net of VAT"], num: 2,
            rows: [["Various Purchase - VAT", "51000 - Costs of Goods Sold", "1", "94,200.00", "94,200.00", "10,092.86", "84,107.14"]],
        },
        summary: [["Sub Total", "84,107.14"], ["Discount Amt", "0.00"], ["Input VAT", "10,092.86"], ["Total", "94,200.00"]],
        buttons: ["Close", "VOID", "CANCEL", "PRINT", "+ Add New Purchase"], button: "SAVE", toast: "Vendor invoice saved",
        result: {
            type: "journal", title: "Journal · INV-88123",
            rows: [
                ["51000 · Costs of Goods Sold", "84,107.14", ""],
                ["11401 · Input VAT", "10,092.86", ""],
                ["11101 · Cash on Hand", "", "94,200.00"],
                { total: ["94,200.00", "94,200.00"] },
            ],
        },
        captions: {
            fields: "Pick the vendor and type the supplier's invoice number.",
            lines: "Add the line. Input VAT is split out.",
            save: "Click SAVE.",
            done: "Posted. It counts in your VAT summary and the Income Tax Summary's purchases.",
        },
    },
    {
        key: "expense", title: "Expense", icon: "bill", crumb: ["Task", "Expenses", "Expense Transaction"], layout: "invoice",
        heading: "Expenses / Expense Transaction", badge: "NEW",
        fields: [
            { col: 1, label: "Vendor *", value: "Meralco", select: true },
            { col: 1, label: "", value: "Ortigas Ave, Pasig City", auto: { after: 0 } },
            { col: 1, label: "TIN", value: "000-101-528-00000", auto: { after: 0 } },
            { col: 1, label: "Branch Code", value: "00000", auto: { after: 0 } },
            { col: 2, label: "Invoice Date *", value: "15/11/2026" },
            { col: 2, label: "Currency", value: "PHP", ro: true, select: true },
            { col: 2, label: "Exchange Rate", value: "1", ro: true, num: true },
            { col: 2, label: "Invoice Status", value: "NEW", ro: true, done: "PAID" },
            { col: 3, label: "Invoice No", value: "(assigned when saved)", ro: true, done: "EXP-261115-02208" },
            { col: 3, label: "Document # *", value: "OR 556120" },
            { col: 3, label: "Document Type", value: "Official Receipt", select: true },
            { col: 3, label: "Accounts *", value: "11101 - Cash on Hand", ro: true, select: true },
        ],
        lines: {
            cols: ["Item ID *", "Accounts *", "Qty", "Price *", "Total", "Input VAT", "Net of VAT"], num: 2,
            rows: [["Various Expense - VT", "61201 - Utilities Expense", "1", "5,600.00", "5,600.00", "600.00", "5,000.00"]],
        },
        summary: [["Sub Total", "5,000.00"], ["Discount Amt", "0.00"], ["Input VAT", "600.00"], ["Total", "5,600.00"]],
        buttons: ["Close", "VOID", "CANCEL", "PRINT", "+ Add New Expense"], button: "SAVE", toast: "Expense saved",
        result: {
            type: "journal", title: "Journal · OR 556120",
            rows: [
                ["61201 · Utilities Expense", "5,000.00", ""],
                ["11401 · Input VAT", "600.00", ""],
                ["11101 · Cash on Hand", "", "5,600.00"],
                { total: ["5,600.00", "5,600.00"] },
            ],
        },
        captions: {
            fields: "Pick the vendor and type the receipt number.",
            lines: "Pick the expense account. Input VAT is split out.",
            save: "Click SAVE.",
            done: "Posted to the books and counted in 1601-C and your VAT summary.",
        },
    },
    {
        key: "scan", title: "Scan a receipt", icon: "scan", crumb: ["Task", "Expenses", "Scanned Receipts"], layout: "scanflow",
        heading: "Expenses · Scanned Receipts",
        fields: [],
        receipts: [
            { file: "E20261126110214.jpg", vendor: "Shell – Gingoog", amount: "1,120.00", account: "Fuel and Oil", fresh: true },
            { file: "E20261126103355.pdf", vendor: "Meralco", amount: "5,600.00", account: "Utilities Expense" },
            { file: "E20261125171206.jpg", vendor: "PLDT", amount: "1,899.00", account: "Communication Expense" },
        ],
        buttons: [], button: "", toast: "3 receipts posted to Expenses",
        result: {
            type: "list", title: "Scanned receipts posted",
            rows: [["Shell – Gingoog", "1,120.00"], ["Meralco", "5,600.00"], ["PLDT", "1,899.00"], ["Typed by hand", "Nothing"]],
        },
        captions: {
            phone: "On the mobile app: point the camera at the receipt and tap Scan.",
            sent: "Submitted. It goes to Expenses › Scanned Receipts as Pending.",
            web: "On the web, every pending receipt from the phone is listed.",
            post: "Click Scan & Post: each receipt is read (TIN, date, amounts) and posted.",
            done: "Posted to Expenses, with VAT, and in your books. No typing.",
        },
    },




    {
        key: "birret", group: "reports", tab: "BIR Return", title: "BIR Return", icon: "chart", crumb: ["BIR & Tax", "BIR Return"], layout: "report",
        heading: "BIR Return", company: "SAMPLE FUEL STATION", period: "TIN 000-123-456-000 · Gingoog City",
        menu: {
            title: "Returns", pick: 5,
            items: [["0605", "Payment Form", "24"], ["0619-E", "Monthly Remittance – Expanded Withholding", "49"], ["1601-C", "Withholding Tax on Compensation", "70"],
            ["1601-EQ", "Quarterly Remittance – Expanded Withholding", "25"], ["1702-Q", "Quarterly Income Tax – Corporations", "4"], ["2550-Q", "Quarterly VAT Return", "4"]],
        },
        fields: [],
        report: {
            cols: ["Period", "File", "Status", ""], num: 3,
            rows: [
                ["Q3 2026 · Jul – Sep", "000123456000-2550Q-092026.xml", { pill: "Not filed" }, { btns: ["File & submit", "Open", "Download"] }],
                ["Q2 2026 · Apr – Jun", "000123456000-2550Q-062026.xml", { pill: "Filed", tone: "ok" }, { btns: ["Open", "Download"] }],
                ["Q1 2026 · Jan – Mar", "000123456000-2550Q-032026.xml", { pill: "Filed", tone: "ok" }, { btns: ["Open", "Download"] }],
                ["Q4 2025 · Oct – Dec", "000123456000-2550Q-122025.xml", { pill: "Filed", tone: "ok" }, { btns: ["Open", "Download"] }],
            ],
        },
        button: "+ New 2550-Q", toast: "2550-Q ready to file",
        captions: {
            menu: "BIR Return: every form in one place. Pick 2550-Q.",
            search: "Click + New 2550-Q. It is filled from your books.",
            rows: "Saved returns open in the eBIRForms app too. File & submit when ready.",
            done: "No retyping figures into eBIRForms.",
        },
    },
    {
        key: "vat", group: "reports", tab: "VAT Summary", title: "VAT Summary", icon: "chart", crumb: ["BIR & Tax", "VAT Summary"], layout: "report",
        heading: "2550-M/Q Summary", company: "SAMPLE FUEL STATION", period: "From Jul – Sep 2026",
        fields: [
            { label: "Filter by", value: "Declared month", select: true, ro: true },
            { label: "From", value: "July 2026" },
            { label: "To", value: "September 2026" },
            { label: "Accounts", value: "All accounts", select: true, ro: true },
        ],
        report: {
            cols: ["Tag", "Summary Data", "Jul 2026", "Aug 2026", "Sep 2026", "Total"], num: 2,
            rows: [
                ["Sales", "Net of VAT", { link: "512,430.10" }, { link: "548,220.75" }, { link: "561,061.44" }, "1,621,712.29"],
                ["Sales", "VAT Exempt", "0.00", "0.00", "0.00", "0.00"],
                { total: ["Sales", "Total", "512,430.10", "548,220.75", "561,061.44", "1,621,712.29"] },
                ["Purchases", "Net of VAT", { link: "160,812.40" }, { link: "171,903.22" }, { link: "176,212.95" }, "508,928.57"],
                ["Purchases", "VAT Exempt", "0.00", "0.00", "0.00", "0.00"],
                { total: ["Purchases", "Total", "160,812.40", "171,903.22", "176,212.95", "508,928.57"] },
                ["Output VAT", "12%", "61,491.61", "65,786.49", "67,327.37", "194,605.47"],
                ["Input VAT", "12%", "19,297.49", "20,628.39", "21,145.55", "61,071.43"],
                { net: ["VAT Payable", "", "42,194.12", "45,158.10", "46,181.82", "133,534.04"] },
            ],
        },
        button: "Search", toast: "VAT summary ready",
        captions: {
            fields: "Pick the months, by declared month or date range.",
            search: "Click Search.",
            rows: "Sales and purchases by VAT type, output and input VAT, month by month.",
            done: "Click any amount to see the invoices behind it.",
        },
    },
    {
        key: "esub", group: "reports", tab: "E-Sub Report", title: "E-Sub Report", icon: "chart", crumb: ["BIR & Tax", "E-Sub Report"], layout: "report",
        heading: "Purchase Summary", company: "SAMPLE FUEL STATION", period: "2026-07 to 2026-09",
        menu: {
            title: "Reports", pick: 0,
            items: [["Purchases", "Purchase Summary"], ["Sales", "Sales Summary"], ["1601-EQ", "Sales · Income Tax (IT)"], ["1601-EQ", "Purchases & Expenses"], ["1604-E", "Annual Information Return"]],
        },
        fields: [
            { label: "From", value: "July 2026" },
            { label: "To", value: "September 2026" },
        ],
        banner: { title: "Passed the RELIEF checks – the DAT is ready", sub: "TIN, names, amounts, period and header were checked. 1 thing was fixed automatically." },
        report: {
            cols: ["#", "Reference", "Date", "TIN", "Registered Name", "City", "Amount"], num: 6,
            rows: [
                ["1", "AP-260804-0105", "Jul 28 2026", "000-168-801", "NORTHSTAR PETROLEUM CORP.", "CAGAYAN DE ORO", "214,346.00"],
                ["2", "AP-260804-0106", "Jul 28 2026", "000-168-801", "NORTHSTAR PETROLEUM CORP.", "CAGAYAN DE ORO", "605,067.00"],
                ["3", "AP-260804-0115", "Jul 15 2026", "908-312-297", "ISLAND POWER CO-OP", "GINGOOG CITY", "78,120.00"],
                ["4", "AP-260804-0116", "Jul 15 2026", "009-566-975", "METRO FREIGHT EXPRESS", "GINGOOG CITY", "3,700.00"],
                ["5", "AP-260804-0117", "Jul 23 2026", "160-893-600", "GREEN VALLEY HARDWARE", "GINGOOG CITY", "9,850.00"],
                ["6", "AP-260805-0412", "Jul 18 2026", "212-186-731", "BRIGHT OFFICE SUPPLIES", "MAKATI CITY", "1,861.00"],
                ["7", "AP-260805-0417", "Jul 03 2026", "000-293-041", "DELTA WATER DISTRICT", "GINGOOG CITY", "8,759.00"],
            ],
        },
        button: "Search", toast: "DAT files ready",
        captions: {
            menu: "E-Sub Report: Purchases, Sales, 1601-EQ and 1604-E. Pick Purchases.",
            fields: "Pick the declared months.",
            search: "Click Search.",
            rows: "Checked against the BIR RELIEF rules before you export.",
            done: "Download the DAT, PDF or Excel in one click.",
        },
    },
    {
        key: "its", group: "reports", tab: "Income Tax Summary", title: "Income Tax Summary", icon: "chart", crumb: ["BIR & Tax", "Income Tax Summary"], layout: "report",
        heading: "Income Tax Summary", company: "SAMPLE FUEL STATION", period: "July 2026 – September 2026",
        fields: [
            { label: "From", value: "July 2026" },
            { label: "To", value: "September 2026" },
        ],
        report: {
            cols: ["Particulars", "Jul", "Aug", "Sep", "Total"], num: 1,
            rows: [
                { section: "Sales" },
                ["Sales – Diesel", "512,430.10", "548,220.75", "561,061.44", "1,621,712.29"],
                ["Less: Cost of Sales", "(160,812.40)", "(171,903.22)", "(176,212.95)", "(508,928.57)"],
                { total: ["Gross Income", "351,617.70", "376,317.53", "384,848.49", "1,112,783.72"] },
                { section: "Deductions" },
                ["Salaries and Wages", "44,538.46", "44,538.46", "44,538.45", "133,615.37"],
                ["Utilities – Electricity", "45,120.33", "47,882.10", "47,461.31", "140,463.74"],
                { total: ["Taxable Income", "261,958.91", "283,896.97", "292,848.73", "838,704.61"] },
                { net: ["Income Tax Due (20%)", "52,391.78", "56,779.39", "58,569.75", "167,740.92"] },
            ],
        },
        button: "Search", toast: "Ready for filing",
        captions: {
            fields: "Pick the months to cover.",
            search: "Click Search.",
            rows: "Built from your sales, cost of sales and expenses. Nothing to compute by hand.",
            done: "Click any figure to see the documents behind it.",
        },
    }, {
        key: "jr", group: "reports", tab: "Journals", title: "Journals", icon: "book", crumb: ["Books & Ledger", "Journals"], layout: "report",
        heading: "Sales Journal", company: "SAMPLE FUEL STATION", period: "For the Period From : 2026-07 to 2026-09",
        subtabs: ["Sales Journal", "Purchase Receipts Journal", "Cash Disbursement Journal", "General Journal"],
        fields: [
            { label: "Filter Type", value: "Declared Month", select: true, ro: true },
            { label: "From", value: "July 2026" },
            { label: "To", value: "September 2026" },
            { label: "Branch", value: "This branch", select: true, ro: true },
        ],
        report: {
            cols: ["Date", "Account ID", "Tran", "Name", "Line Description", "Debit Amnt", "Credit Amnt"], num: 5,
            rows: [
                ["2026-07", "11101", "0461", "Walk In", "Cash", "1,120.00", ""],
                ["2026-07", "40010", "0461", "Walk In", "Sales – Diesel", "", "1,000.00"],
                ["2026-07", "21401", "0461", "Walk In", "Output VAT – Diesel", "", "120.00"],
                ["2026-07", "50010", "0461", "Walk In", "Cost of Sales – Diesel", "942.00", ""],
                ["2026-07", "11301", "0461", "Walk In", "Inventory – Diesel", "", "942.00"],
                ["2026-07", "11201", "0462", "Harbor Logistics", "Accounts Receivable", "5,600.00", ""],
                ["2026-07", "40010", "0462", "Harbor Logistics", "Sales – Diesel", "", "5,000.00"],
                ["2026-07", "21401", "0462", "Harbor Logistics", "Output VAT – Diesel", "", "600.00"],
                { total: ["", "", "", "", "Total", "7,662.00", "7,662.00"] },
            ],
        },
        button: "Search", toast: "Journal balanced",
        captions: {
            fields: "Sales, Purchase Receipts, Cash Disbursement and General Journal. Pick the period.",
            search: "Click Search.",
            rows: "Every invoice already posted as debits and credits, cost of sales included.",
            done: "Debits equal credits. Nothing to post by hand.",
        },
    },
    {
        key: "rpt", group: "reports", tab: "Reports", title: "Reports", icon: "chart", crumb: ["Books & Ledger", "Reports"], layout: "report",
        heading: "Sales Report", company: "SAMPLE FUEL STATION", period: "From : 2026-07 To 2026-09",
        subtabs: ["Sales Report", "Purchase Report", "Expense Report", "Importation Report", "Exportation Report"],
        fields: [
            { label: "Filter Type", value: "Declared Month", select: true, ro: true },
            { label: "From", value: "July 2026" },
            { label: "To", value: "September 2026" },
            { label: "Accounts", value: "All", select: true, ro: true },
        ],
        report: {
            cols: ["#", "Date", "TIN", "Customer", "Document", "Account Title", "Amount"], num: 6,
            rows: [
                ["1", "03-Jul-2026", "000-000-000", "Walk In", "0461", "Cash Sales – Vatable", "1,000.00"],
                ["2", "03-Jul-2026", "000-111-222", "Harbor Logistics", "0462", "Credit Sales – Vatable", "5,000.00"],
                ["3", "09-Jul-2026", "214-552-018", "City Government", "0463", "Credit Sales – Vatable", "12,450.00"],
                ["4", "09-Jul-2026", "208-331-907", "Bayview Telecom", "0464", "Credit Sales – Vatable", "8,320.00"],
                ["5", "16-Jul-2026", "117-904-336", "Northpoint Logistics", "0465", "Credit Sales – Vatable", "3,600.00"],
                ["6", "16-Jul-2026", "000-000-000", "Walk In", "0466", "Cash Sales – Vatable", "2,150.00"],
                ["7", "23-Jul-2026", "301-226-548", "Greenfield Farms", "0467", "Credit Sales – Vatable", "6,780.00"],
                { total: ["", "", "", "", "", "Total", "39,300.00"] },
            ],
        },
        button: "Search", toast: "Report ready",
        captions: {
            fields: "Sales, Purchase, Expense, Importation and Exportation reports. Pick the period.",
            search: "Click Search.",
            rows: "Every document with TIN, account and amount. Filter any column.",
            done: "Print, or export to Excel.",
        },
    },
    {
        key: "gl", group: "reports", tab: "Ledgers", title: "Ledgers", icon: "book", crumb: ["Books & Ledger", "Ledgers"], layout: "report",
        heading: "General Ledger", company: "SAMPLE FUEL STATION", period: "For the Period From 2026-07 to 2026-09",
        subtabs: ["General Ledger", "Summary Ledger", "Customer Ledger", "Vendor Ledger"],
        fields: [
            { label: "Filter Type", value: "Declared Month", select: true, ro: true },
            { label: "From", value: "July 2026" },
            { label: "To", value: "September 2026" },
            { label: "Accounts", value: "Cash on Hand", select: true, ro: true },
        ],
        report: {
            wide: true, cols: ["Account ID", "Account Description", "Date", "Reference", "Jrnl", "Trans Description", "Debit Amount", "Credit Amount", "Balance"], num: 6,
            rows: [
                ["11101", "Cash on Hand", "2026-07", "", "", "Beginning Balance", "", "", "4,215,300.50"],
                ["11101", "Cash on Hand", "2026-07", { link: "0461" }, "SJ", "Walk In", "1,120.00", "", "4,216,420.50"],
                ["11101", "Cash on Hand", "2026-07", { link: "VI-10465" }, "CDJ", "Delta Water District", "", "8,250.00", "4,208,170.50"],
                ["11101", "Cash on Hand", "2026-07", { link: "0466" }, "SJ", "Walk In", "2,408.00", "", "4,210,578.50"],
                ["11101", "Cash on Hand", "2026-08", { link: "VI-10471" }, "CDJ", "Bayview Telecom", "", "1,899.00", "4,208,679.50"],
                ["11101", "Cash on Hand", "2026-08", { link: "0470" }, "SJ", "Walk In", "3,360.00", "", "4,212,039.50"],
                ["11101", "Cash on Hand", "2026-09", { link: "E-20260912" }, "PJ", "Shell – Gingoog", "", "1,120.00", "4,210,919.50"],
            ],
        },
        button: "Search", toast: "Ledger ready",
        captions: {
            fields: "General, Summary, Customer and Vendor ledgers. Pick the period.",
            search: "Click Search.",
            rows: "Every entry with a running balance. Click a reference to open the document.",
            done: "From any balance straight to the invoice behind it.",
        },
    },
    {
        key: "ar", group: "reports", tab: "Receivable", title: "Receivable", icon: "sales", crumb: ["Other Reports", "Account Receivable"], layout: "report",
        heading: "Accounts Receivable", company: "SAMPLE FUEL STATION", period: "As of Nov 30 2026",
        subtabs: ["Account Receivable", "Aged Receivable"],
        fields: [
            { label: "Transaction month", value: "November 2026" },
            { label: "Branch", value: "This branch", select: true, ro: true },
        ],
        aging: [["0 - 30", "12,450.00", "g"], ["31 - 60", "8,920.00", "y"], ["61 - 90", "5,600.00", "o"], ["Over 90 days", "-", "r"], ["Amount due", "26,970.00", "t"]],
        report: {
            cols: ["Customer / Invoice #", "Date", "Days", "0 - 30", "31 - 60", "61 - 90", "Over 90", "Amount Due"], num: 2,
            rows: [
                { section: "HARBOR LOGISTICS  #36767" },
                ["R-202609-0335", "Sep 22 2026", "65", "", "", "5,600.00", "", "5,600.00"],
                ["R-202610-0342", "Oct 02 2026", "55", "", "3,120.00", "", "", "3,120.00"],
                { total: ["Total Harbor Logistics", "", "", "-", "3,120.00", "5,600.00", "-", "8,720.00"] },
                { section: "CITY GOVERNMENT  #49231" },
                ["PF-202610-0490", "Oct 05 2026", "52", "", "5,800.00", "", "", "5,800.00"],
                ["PF-202611-0511", "Nov 03 2026", "23", "12,450.00", "", "", "", "12,450.00"],
                { total: ["Total City Government", "", "", "12,450.00", "5,800.00", "-", "-", "18,250.00"] },
                { net: ["Grand total · 2 customers", "", "", "12,450.00", "8,920.00", "5,600.00", "-", "26,970.00"] },
            ],
        },
        button: "Search", toast: "Receivables aged",
        captions: {
            fields: "Account Receivable and Aged Receivable. Pick the month.",
            search: "Click Search.",
            rows: "Who owes you, per invoice, aged 0–30, 31–60, 61–90 and over 90 days.",
            done: "Export to Excel or PDF and follow up.",
        },
    },
    {
        key: "ap", group: "reports", tab: "Payables", title: "Payables", icon: "buy", crumb: ["Other Reports", "Account Payable"], layout: "report",
        heading: "Accounts Payable", company: "SAMPLE FUEL STATION", period: "As of Nov 30 2026",
        subtabs: ["Account Payable", "Aged Payable"],
        fields: [
            { label: "Transaction month", value: "November 2026" },
            { label: "Branch", value: "This branch", select: true, ro: true },
        ],
        aging: [["0 - 30", "1,375,864.35", "g"], ["31 - 60", "34,523.97", "y"], ["61 - 90", "7,066.34", "o"], ["Over 90 days", "-", "r"], ["Amount due", "1,417,454.66", "t"]],
        report: {
            cols: ["Vendor / Invoice #", "Date", "Days", "0 - 30", "31 - 60", "61 - 90", "Over 90", "Amount Due"], num: 2,
            rows: [
                { section: "NORTHSTAR PETROLEUM CORP.  #23693" },
                ["VI-10482", "Nov 26 2026", "0", "1,235,400.61", "", "", "", "1,235,400.61"],
                ["VI-10431", "Sep 29 2026", "58", "", "34,523.97", "", "", "34,523.97"],
                { total: ["Total Northstar Petroleum Corp.", "", "", "1,235,400.61", "34,523.97", "-", "-", "1,269,924.58"] },
                { section: "ISLAND POWER CO-OP  #23701" },
                ["VI-10477", "Nov 12 2026", "14", "140,463.74", "", "", "", "140,463.74"],
                ["VI-10402", "Sep 21 2026", "66", "", "", "7,066.34", "", "7,066.34"],
                { total: ["Total Island Power Co-op", "", "", "140,463.74", "-", "7,066.34", "-", "147,530.08"] },
                { net: ["Grand total · 2 vendors", "", "", "1,375,864.35", "34,523.97", "7,066.34", "-", "1,417,454.66"] },
            ],
        },
        button: "Search", toast: "Payables aged",
        captions: {
            fields: "Account Payable and Aged Payable. Pick the month.",
            search: "Click Search.",
            rows: "What you owe each vendor, per invoice, by age.",
            done: "Plan payments before anything goes overdue.",
        },
    },
    {
        key: "bs", group: "reports", tab: "Balance Sheet", title: "Balance sheet", icon: "chart", crumb: ["Financial Reports", "Balance Sheet"], layout: "report",
        heading: "Balance Sheet", company: "SAMPLE FUEL STATION", period: "Year 2025 – 2026",
        fields: [
            { label: "From", value: "2025" },
            { label: "To", value: "2026" },
        ],
        report: {
            cols: ["Code", "Account", "2025", "2026"], num: 2,
            rows: [
                { section: "Current Assets" },
                ["11101", "Cash on Hand", "3,412,880.15", "4,215,300.50"],
                ["11301", "Inventory – Diesel", "2,149,732.14", "2,479,017.86"],
                ["11401", "Input VAT – Diesel", "257,967.86", "358,601.30"],
                { total: ["", "Total Current Assets", "5,820,580.15", "7,052,919.66"] },
                { section: "Liabilities" },
                ["21000", "Accounts Payable", "2,580,116.43", "3,214,880.50"],
                ["21401", "Output VAT – Diesel", "995,870.50", "1,190,475.97"],
                { total: ["", "Total Liabilities", "3,575,986.93", "4,405,356.47"] },
                { section: "Equity" },
                ["30000", "Owner's Capital", "2,244,593.22", "2,647,563.19"],
                { net: ["", "Total Liabilities & Equity", "5,820,580.15", "7,052,919.66"] },
            ],
        },
        button: "Search", toast: "Assets = Liabilities + Equity",
        captions: {
            fields: "Pick the years to compare.",
            search: "Click Search.",
            rows: "Assets, liabilities and equity side by side, year against year.",
            done: "Always balanced, because every entry is double-entry from the start.",
        },
    }, {
        key: "tb", group: "reports", tab: "Trial Balance", title: "Trial balance", icon: "book", crumb: ["Financial Reports", "Trial Balance"], layout: "report",
        heading: "General Ledger Trial Balance", company: "SAMPLE FUEL STATION", period: "For the Period From 2026-07 to 2026-09",
        fields: [
            { label: "Filter Type", value: "Declared Month", select: true, ro: true },
            { label: "From", value: "July 2026" },
            { label: "To", value: "September 2026" },
            { label: "Accounts", value: "All", select: true, ro: true },
        ],
        report: {
            view: true, cols: ["Account ID", "Account Description", "Debit Amount", "Credit Amount", "Balance"], num: 2,
            rows: [
                ["11101", "Cash on Hand", "1,801,107.21", "691,687.09", "1,109,420.12"],
                ["11301", "Inventory – Diesel", "646,785.71", "508,928.57", "137,857.14"],
                ["11401", "Input VAT – Diesel", "99,154.87", "", "99,154.87"],
                ["21000", "Accounts Payable", "3,950.05", "1,235,400.61", "-1,231,450.56"],
                ["21401", "Output VAT – Diesel", "", "194,605.47", "-194,605.47"],
                ["21600", "Withholding Tax Payable", "", "81,671.49", "-81,671.49"],
                ["40010", "Sales – Diesel", "", "1,621,712.29", "-1,621,712.29"],
                ["50010", "Cost of Sales – Diesel", "508,928.57", "", "508,928.57"],
                ["60010", "Salaries and Wages", "1,133,615.37", "", "1,133,615.37"],
                ["60220", "Utilities – Electricity", "140,463.74", "", "140,463.74"],
                { total: ["", "Total", "4,334,005.52", "4,334,005.52", "0.00"] },
            ],
        },
        button: "Search", toast: "Trial balance ready",
        captions: {
            fields: "Pick the period: by declared month or by date.",
            search: "Click Search.",
            rows: "Every account with its debits, credits and balance, straight from the journals.",
            done: "View opens the ledger of any account. Print or export in one click.",
        },
    }, {
        key: "wtb", group: "reports", tab: "Working Trial Balance", title: "Working Trial Balance", icon: "file", crumb: ["Financial Reports", "Working Trial Balance"], layout: "report",
        heading: "Working Trial Balance", company: "SAMPLE FUEL STATION", period: "Year 2026",
        fields: [
            { label: "Year", value: "2026" },
        ],
        report: {
            wide: true, cols: ["Account Titles", "Beg. Balance", "Debit", "Credit", "End Balance", "Income Statement", "Balance Sheet"], num: 1,
            rows: [
                { section: "ASSET" },
                ["Cash on Hand", "4,215,300.50", "1,801,107.21", "691,687.09", "5,324,720.62", "", "5,324,720.62"],
                ["Inventory – Diesel", "3,340,178.57", "646,785.71", "508,928.57", "3,478,035.71", "", "3,478,035.71"],
                ["Input VAT", "527,580.00", "212,534.14", "-", "740,114.14", "", "740,114.14"],
                { section: "LIABILITIES" },
                ["Accounts Payable", "(2,580,116.43)", "3,950.05", "1,235,400.61", "(3,811,566.99)", "", "(3,811,566.99)"],
                ["Output VAT", "(995,870.50)", "-", "194,605.47", "(1,190,475.97)", "", "(1,190,475.97)"],
                { section: "REVENUE" },
                ["Sales – Diesel", "-", "-", "1,621,712.29", "(1,621,712.29)", "1,621,712.29", ""],
                { section: "COS" },
                ["Cost of Sales – Diesel", "-", "508,928.57", "-", "508,928.57", "(508,928.57)", ""],
                { section: "EXPENSES" },
                ["Salaries and Wages", "-", "133,615.37", "-", "133,615.37", "(133,615.37)", ""],
                ["Utilities – Electricity", "-", "140,463.74", "-", "140,463.74", "(140,463.74)", ""],
                { net: ["Net Income / (Loss)", "", "", "", "", "838,704.61", ""] }
            ],
        },
        button: "Search", toast: "Working trial balance ready",
        captions: {
            fields: "Pick the year.",
            search: "Click Search.",
            rows: "Beginning balances, the year's entries and adjustments roll into the Income Statement and Balance Sheet.",
            done: "Net income is worked out for you and flows into the financial statements.",
        },
    }, {
        key: "fs", group: "reports", tab: "Financial Statement", title: "Financial Statement", icon: "file", crumb: ["Financial Reports", "Financial Statement"], layout: "report",
        heading: "Statement of Comprehensive Income", company: "SAMPLE FUEL STATION", period: "For the period Jul – Sep 2026",
        subtabs: ["Income Statement", "Cash Flow", "Retained Earnings", "Changes in Equity"],
        fields: [
            { label: "Year", value: "2026" },
        ],
        report: {
            cols: ["Account", "Amount", "% of Sales"], num: 1,
            rows: [
                { section: "Revenue" },
                ["Sales – Diesel", "1,621,712.29", "100.00%"],
                ["Less: Cost of Sales", "(508,928.57)", "31.38%"],
                { total: ["Gross Profit", "1,112,783.72", "68.62%"] },
                { section: "Operating Expenses" },
                ["Salaries and Wages", "133,615.37", "8.24%"],
                ["Utilities – Electricity", "140,463.74", "8.66%"],
                { total: ["Total Operating Expenses", "274,079.11", "16.90%"] },
                { net: ["Net Income", "838,704.61", "51.72%"] },
            ],
        },
        button: "Search", toast: "Financial statements ready",
        captions: {
            fields: "Income Statement, Cash Flow, Retained Earnings and Changes in Equity. Pick the year.",
            search: "Click Search.",
            rows: "Built from the working trial balance, ready to print.",
            done: "Hand it to your accountant or the bank as it is.",
        },
    },
];

const typeable = (f) => !f.ro && !f.auto;
const kAt0 = (list, k) => list.findIndex((x) => x.k === k);

// left list: the report chapters show as one "Reports" topic (tabs inside)
const NAV = [];
CHAPTERS.forEach((c, i) => {
    if (!c.group) return NAV.push({ key: c.key, title: c.title, icon: c.icon, sub: c.crumb.join(" › "), idx: [i] });
    const g = NAV.find((n) => n.key === c.group);
    if (g) g.idx.push(i);
    else NAV.push({ key: c.group, title: "Reports", icon: "chart", sub: "BIR & Tax · Books · Receivable · Payables · Statements", idx: [i] });
});

/* ---------- each chapter → a list of timed steps ---------- */
// the teacher opens every lesson: what we are about to learn
const INTRO = {
    dash: ["How to read your dashboard", "First, your Home page. Let me show you where your business stands at a glance."],
    product: ["How to add a product", "Let's add a product. Its sales, inventory and cost accounts are set up for you."],
    po: ["How to make a purchase order", "Next, let's order stock from a supplier with a purchase order."],
    grn: ["How to receive inventory", "Your order arrived. Let's receive it into inventory."],
    sales: ["How to enter your sales", "Now let's enter a sale. VAT and cost of sales are worked out for you."],
    purchase: ["How to enter a vendor invoice", "Let's record the supplier's bill, with input VAT and withholding."],
    expense: ["How to enter your expenses", "Let's record an expense, like your electric bill."],
    scan: ["How to scan a receipt", "No typing this time. Let's scan a receipt with your phone."],
    birret: ["How to prepare a BIR return", "Time for taxes. Let's prepare your VAT return straight from your books."],
    vat: ["How to check your VAT", "Let's see your output and input VAT, month by month."],
    esub: ["How to make your e-Sub files", "Let's make the DAT files the BIR needs, checked for you."],
    its: ["How to see your income tax", "Let's work out your income tax from sales, cost of sales and expenses."],
    jr: ["How to read your journals", "Every entry you made is already in the journals. Let's take a look."],
    rpt: ["How to pull your reports", "Let's list your sales, purchases and expenses for the period."],
    gl: ["How to read your ledgers", "Let's follow one account, entry by entry, with its running balance."],
    ar: ["How to track your receivables", "Who owes you money? Let's check, by how long it has been unpaid."],
    ap: ["How to track your payables", "And who do you owe? Let's check your payables before they're due."],
    bs: ["How to read your balance sheet", "Let's see your assets, liabilities and equity, year against year."],
    tb: ["How to run a trial balance", "Let's check that your books balance."],
    wtb: ["How to use the working trial balance", "Let's roll the year into the income statement and balance sheet."],
    fs: ["How to get your financial statements", "Finally, your financial statements, ready to print."],
};

function buildSteps(ch) {
    const intro = INTRO[ch.key];
    const rest = buildLessonSteps(ch);
    return intro ? [{ k: "intro", d: 3000, cap: "intro", text: intro[1], still: true, smooth: true }, ...rest] : rest;
}

function buildLessonSteps(ch) {
    if (ch.layout === "dashboard") return [
        { k: "hero", d: 2800, cap: "hero", still: true, smooth: true },
        { k: "cards", d: 2600, cap: "cards", still: true, smooth: true },
        { k: "charts", d: 3200, cap: "charts", still: true, smooth: true },
        { k: "lists", d: 3400, cap: "lists", still: true, smooth: true },
        { k: "done", d: 3200, cap: "done", still: true },
    ];
    if (ch.layout === "report") {
        const s = [];
        if (ch.menu) {
            s.push({ k: "move", target: `m${ch.menu.pick}`, d: 700, cap: "menu" });
            s.push({ k: "pick", target: `m${ch.menu.pick}`, d: 500, cap: "menu" });
        }
        ch.fields.forEach((f, i) => {
            if (!typeable(f)) return;
            s.push({ k: "move", target: `f${i}`, d: 420, cap: "fields" });
            s.push({ k: "type", field: i, d: Math.min(1100, Math.max(450, f.value.length * 60)), cap: "fields" });
        });
        s.push({ k: "move", target: "save", d: 600, cap: "search" });
        s.push({ k: "click", d: 420, cap: "search" });
        ch.report.rows.forEach((_, i) => s.push({ k: "row", row: i, d: 230, cap: "rows", still: true }));
        s.push({ k: "done", d: 3200, cap: "done", still: true });
        return s;
    }
    if (ch.layout === "scanflow") return [
        { k: "phone", d: 2600, cap: "phone" },
        { k: "send", d: 1500, cap: "sent" },
        { k: "web", d: 1600, cap: "web" },
        { k: "move", target: "postall", d: 650, cap: "post" },
        { k: "click", target: "postall", d: 420, cap: "post" },
        ...ch.receipts.map((_, i) => ({ k: "proc", row: i, target: `rc${i}`, d: 1200, cap: "post" })),
        { k: "done", d: 4400, cap: "done" },
    ];
    const s = [];
    const scan = ch.layout === "scan";
    if (scan) s.push({ k: "scan", d: 2200, cap: "scan" });
    ch.fields.forEach((f, i) => {
        if (!typeable(f)) return;
        if (!scan) s.push({ k: "move", target: `f${i}`, d: 480, cap: "fields" });
        s.push({ k: "type", field: i, d: scan ? 420 : Math.min(1300, Math.max(450, f.value.length * 55)), cap: "fields" });
    });
    (ch.lines?.rows || []).forEach((_, i) => {
        s.push({ k: "move", target: `r${i}`, d: 450, cap: "lines" });
        s.push({ k: "row", row: i, d: 850, cap: "lines" });
    });
    s.push({ k: "move", target: "save", d: 600, cap: "save" });
    s.push({ k: "click", d: 420, cap: "save" });
    s.push({ k: "done", d: 4400, cap: "done" });
    return s;
}

/* ---------- the AI teacher: walks in when the demo scrolls into view and talks you through each lesson ---------- */
function TeacherBot({ show, talk, cheer, big = false, uid = "s" }) {
    const g = `url(#wdBotMetal-${uid})`;
    return (
        <div className={`wd-bot ${big ? "big" : ""} ${show ? "in" : ""} ${talk ? "talk" : ""} ${cheer ? "cheer" : ""}`} aria-hidden="true">
            <svg viewBox="0 0 130 160" overflow="visible">
                <defs>
                    <linearGradient id={`wdBotMetal-${uid}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#f4f7ff" />
                        <stop offset="1" stopColor="#c5d0ea" />
                    </linearGradient>
                </defs>
                <ellipse className="wd-bot-shadow" cx="60" cy="154" rx="30" ry="5" />
                <g className="wd-bot-all">
                    {/* legs */}
                    <rect x="44" y="118" width="12" height="28" rx="6" fill={g} stroke="#2b3a67" strokeWidth="2" />
                    <rect x="64" y="118" width="12" height="28" rx="6" fill={g} stroke="#2b3a67" strokeWidth="2" />
                    <rect x="39" y="142" width="20" height="9" rx="4.5" fill="#8ea0c8" stroke="#2b3a67" strokeWidth="2" />
                    <rect x="61" y="142" width="20" height="9" rx="4.5" fill="#8ea0c8" stroke="#2b3a67" strokeWidth="2" />
                    {/* resting arm */}
                    <rect className="wd-bot-arm-l" x="22" y="78" width="12" height="34" rx="6" fill={g} stroke="#2b3a67" strokeWidth="2" />
                    {/* body */}
                    <rect x="32" y="72" width="56" height="50" rx="16" fill={g} stroke="#2b3a67" strokeWidth="2" />
                    <rect x="42" y="80" width="5" height="26" rx="2.5" fill="#8ea0c8" />
                    <rect x="73" y="80" width="5" height="26" rx="2.5" fill="#8ea0c8" />
                    <circle className="wd-bot-core" cx="60" cy="95" r="9" fill="#7df9ff" stroke="#2b3a67" strokeWidth="2" />
                    {/* pointing arm with a pointer stick */}
                    <g className="wd-bot-arm">
                        <rect x="84" y="76" width="30" height="11" rx="5.5" fill={g} stroke="#2b3a67" strokeWidth="2" />
                        <circle cx="116" cy="81.5" r="6.5" fill={g} stroke="#2b3a67" strokeWidth="2" />
                        <line x1="118" y1="80" x2="150" y2="62" stroke="#b45309" strokeWidth="3.5" strokeLinecap="round" />
                        <circle cx="150" cy="62" r="3" fill="#fbbf24" />
                    </g>
                    {/* head */}
                    <g className="wd-bot-head">
                        <circle cx="28" cy="44" r="8" fill="#8ea0c8" stroke="#2b3a67" strokeWidth="2" />
                        <circle cx="92" cy="44" r="8" fill="#8ea0c8" stroke="#2b3a67" strokeWidth="2" />
                        <rect x="28" y="18" width="64" height="52" rx="24" fill={g} stroke="#2b3a67" strokeWidth="2" />
                        <rect x="37" y="30" width="46" height="22" rx="11" fill="#1e2a52" />
                        <g className="wd-bot-eyes">
                            <ellipse cx="51" cy="41" rx="4.5" ry="5.5" fill="#67e8f9" />
                            <ellipse cx="69" cy="41" rx="4.5" ry="5.5" fill="#67e8f9" />
                        </g>
                        <path className="wd-bot-mouth" d="M53 60 q7 5 14 0" stroke="#2b3a67" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        {/* teacher's cap */}
                        <rect x="45" y="13" width="30" height="9" rx="2" fill="#1f2937" />
                        <polygon points="60,1 97,12 60,23 23,12" fill="#111827" />
                        <path className="wd-bot-tassel" d="M60 12 L90 17 L90 30" stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        <circle cx="90" cy="31" r="3" fill="#fbbf24" />
                    </g>
                </g>
            </svg>
            {cheer && <span className="wd-bot-star">+1 ★</span>}
        </div>
    );
}

export default function WebsiteDemo() {
    const steps = useMemo(() => CHAPTERS.map(buildSteps), []);
    const [ci, setCi] = useState(0);          // chapter
    const [si, setSi] = useState(0);          // step
    const [frac, setFrac] = useState(0);      // 0..1 inside the step (typing / scanning)
    const [playing, setPlaying] = useState(true);
    const [inView, setInView] = useState(false);
    const [cursor, setCursor] = useState({ x: 40, y: 40 });
    const root = useRef(null);
    const win = useRef(null);
    const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);

    const ch = CHAPTERS[ci];
    const list = steps[ci];
    const step = list[si];
    const [full, setFull] = useState(false);
    const wd = useRef(null);
    const run = playing && (inView || full) && !reduced;

    // full screen: the real Fullscreen API where there is one, a fixed overlay otherwise (iPhone)
    const toggleFull = () => {
        const el = wd.current;
        const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
        if (full) {
            if (fsEl) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
            setFull(false);
            return;
        }
        const req = el?.requestFullscreen || el?.webkitRequestFullscreen;
        if (req) Promise.resolve(req.call(el)).catch(() => { });
        setFull(true);
    };
    useEffect(() => {
        const onChange = () => { if (!(document.fullscreenElement || document.webkitFullscreenElement)) setFull(false); };
        const onKey = (e) => { if (e.key === "Escape") setFull(false); };
        document.addEventListener("fullscreenchange", onChange);
        document.addEventListener("webkitfullscreenchange", onChange);
        window.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("fullscreenchange", onChange);
            document.removeEventListener("webkitfullscreenchange", onChange);
            window.removeEventListener("keydown", onKey);
        };
    }, []);
    useEffect(() => {
        document.body.classList.toggle("wd-lock", full);
        return () => document.body.classList.remove("wd-lock");
    }, [full]);

    // only play while the section is on screen
    useEffect(() => {
        const el = root.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    // reduced motion: show every chapter finished
    useEffect(() => { if (reduced) { setSi(list.length - 1); setFrac(1); } }, [reduced, ci, list.length]);

    // voice: while the teacher is still speaking, the last step of a line waits for it (max 12 s)
    const voiceHold = useRef(false);
    const holdSince = useRef(0);

    // the clock: move to the next step / chapter
    useEffect(() => {
        if (!run) return;
        const start = performance.now();
        let raf = 0;
        const smooth = step.smooth || step.k === "type" || step.k === "scan" || step.k === "phone";
        const tick = (now) => {
            const f = Math.min(1, (now - start) / step.d);
            if (smooth) setFrac(f);
            if (f < 1) { raf = requestAnimationFrame(tick); return; }
            const lineEnds = si === list.length - 1 || list[si + 1].cap !== step.cap;
            if (lineEnds && voiceHold.current) {
                if (!holdSince.current) holdSince.current = now;
                if (now - holdSince.current < 12000) { raf = requestAnimationFrame(tick); return; }
            }
            holdSince.current = 0;
            setFrac(0);
            if (si < list.length - 1) setSi(si + 1);
            else { setSi(0); setCi((ci + 1) % CHAPTERS.length); }
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [run, ci, si, step, list.length]);

    // the fake cursor glides to its target
    useLayoutEffect(() => {
        const box = win.current;
        if (!box || step.still) return;
        const target = step.target || (step.k === "type" ? `f${step.field}` : step.k === "row" ? `r${step.row}` : step.k === "click" || step.k === "done" ? "save" : null);
        if (!target) return;
        const el = box.querySelector(`[data-demo="${target}"]`);
        if (!el) return;
        const a = box.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        setCursor({ x: b.left - a.left + Math.min(b.width - 14, 46), y: b.top - a.top + b.height * 0.62 });
    }, [ci, si, step]);

    /* ---------- what is on screen at this step ---------- */
    const typeAt = {};    // field index → its "type" step
    list.forEach((x, i) => { if (x.k === "type") typeAt[x.field] = i; });
    const done = step.k === "done";

    // teacher: appears the first time the demo is on screen, types each line like a game tutorial
    const [botIn, setBotIn] = useState(false);
    useEffect(() => { if (inView || full) setBotIn(true); }, [inView, full]);
    const capText = step.text || ch.captions[step.cap] || "";
    const [typed, setTyped] = useState(0);
    useEffect(() => {
        if (reduced) { setTyped(capText.length); return; }
        setTyped(0);
        let n = 0;
        const t = setInterval(() => { n += 2; setTyped(n); if (n >= capText.length) clearInterval(t); }, 22);
        return () => clearInterval(t);
    }, [capText, reduced]);
    // voice (browser text-to-speech) – off until the visitor turns it on
    const [voice, setVoice] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
    useEffect(() => {
        if (!canSpeak) return;
        const synth = window.speechSynthesis;
        synth.cancel();
        voiceHold.current = false;
        setSpeaking(false);
        if (!voice || !capText || !(inView || full) || !playing) return;
        const u = new SpeechSynthesisUtterance(capText);
        const vs = synth.getVoices();
        u.voice = vs.find((v) => /^en/i.test(v.lang) && /google us english|samantha|zira|aria|jenny|female/i.test(v.name))
            || vs.find((v) => /^en-(US|PH|GB)/i.test(v.lang)) || null;
        u.lang = u.voice?.lang || "en-US";
        u.rate = 1.02;
        u.pitch = 1.1;
        u.onstart = () => setSpeaking(true);
        u.onend = u.onerror = () => { voiceHold.current = false; setSpeaking(false); };
        voiceHold.current = true;
        synth.speak(u);
        return () => { u.onend = u.onerror = u.onstart = null; };
    }, [voice, capText, ci, inView, full, playing, canSpeak]);
    useEffect(() => () => { if (canSpeak) window.speechSynthesis.cancel(); }, [canSpeak]);
    const toggleVoice = () => setVoice((v) => !v);
    const talking = botIn && (typed < capText.length || speaking);
    // a star for every lesson finished
    const starred = useRef(new Set());
    const [stars, setStars] = useState(0);
    useEffect(() => {
        if (done && !starred.current.has(ch.key)) { starred.current.add(ch.key); setStars(starred.current.size); }
    }, [done, ch.key]);
    const fieldText = (f, i) => {
        if (f.ro) return done && f.done ? f.done : f.value;
        if (f.auto) return si > (typeAt[f.auto.after] ?? -1) ? f.value : "";
        const at = typeAt[i];
        if (at === undefined || si < at) return "";
        if (si > at) return f.value;
        return f.value.slice(0, Math.ceil(f.value.length * frac));
    };
    const activeField = step.k === "type" ? step.field : step.k === "move" && step.target?.startsWith("f") ? Number(step.target.slice(1)) : -1;
    const rowAt = list.map((x, i) => (x.k === "row" ? i : -1)).filter((i) => i >= 0);
    const rowsShown = rowAt.filter((i) => si >= i).length;
    const afterRows = !ch.lines || si > (rowAt.length ? rowAt[rowAt.length - 1] : -1);
    const clicking = step.k === "click";
    const scanning = step.k === "scan";
    const scanned = ch.layout === "scan" && si > 0;

    // progress of the whole chapter (for the left list)
    const total = list.reduce((n, x) => n + x.d, 0);
    const passed = list.slice(0, si).reduce((n, x) => n + x.d, 0) + step.d * (step.smooth || step.k === "type" || step.k === "scan" || step.k === "phone" ? frac : 0);
    const pct = Math.min(100, (passed / total) * 100);

    const pick = (i) => { setCi(i); setSi(0); setFrac(0); };
    const navAt = NAV.findIndex((n) => n.idx.includes(ci));

    /* ---------- pieces (plain functions, not components) ---------- */
    const input = (f, i) => {
        const v = fieldText(f, i);
        const typing = activeField === i && step.k === "type";
        return (
            <span className={`wd-in ${f.num ? "num" : ""} ${f.select ? "sel" : ""} ${f.ro || f.auto ? "ro" : ""} ${f.file ? "file" : ""} ${ch.layout === "scan" && v ? "auto" : ""} ${done && f.done ? "new" : ""}`}>
                {f.file && <em>Browse</em>}
                {v}{typing && <i className="wd-caret" />}
            </span>
        );
    };

    const lines = () => {
        const L = ch.lines;
        if (!L) return null;
        const inv = ch.layout === "invoice";
        return (
            <>
                {L.title && <div className="wd-legend">{L.title}</div>}
                <div className="wd-lines-wrap">
                    <table className="wd-lines">
                        <thead><tr>
                            {inv && <th className="hash">#</th>}
                            {L.cols.map((c, j) => <th key={c} className={j >= L.num ? "num" : ""}>{c}</th>)}
                        </tr></thead>
                        <tbody>
                            {L.rows.map((r, i) => (
                                <tr key={i} data-demo={`r${i}`} className={i < rowsShown ? "in" : "out"}>
                                    {inv && <td className="hash">{i + 1}</td>}
                                    {r.map((c, j) => <td key={j} className={j >= L.num ? "num" : ""}>{i < rowsShown ? c : ""}</td>)}
                                </tr>
                            ))}
                            {inv && (
                                <tr className="foot">
                                    <td className="hash">+</td>
                                    <td colSpan={L.cols.length}>{rowsShown} item(s)</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </>
        );
    };

    const buttons = () => (
        <div className="wd-btns">
            {ch.buttons.map((b) => (
                <span key={b} className={`wd-b ${/VOID/.test(b) ? "warn" : /CANCEL/.test(b) ? "bad" : /PRINT|LOGS|ADD ITEM/.test(b) ? "info" : /^\+/.test(b) ? "soft" : ""}`}>{b}</span>
            ))}
            <span className={`wd-save ${clicking ? "press" : ""} ${done ? "ok" : ""}`} data-demo="save">
                {done ? <><Ico d={P.check} size={14} /> Saved</> : ch.button}
                {clicking && <i className="wd-ripple" />}
            </span>
        </div>
    );

    const sideOn = ch.group ? 5 : { dash: 0, product: 4, po: 2, grn: 4, sales: 1, purchase: 2, expense: 2, scan: 2 }[ch.key];

    // dashboard / reports
    const picking = step.k === "pick";
    const pickAt = kAt0(list, "pick");
    const picked = pickAt >= 0 && si > pickAt;
    // dashboard: how far each part has played (0..1)
    const dbOrder = ["hero", "cards", "charts", "lists", "done"];
    const dbPart = (k) => {
        const a = dbOrder.indexOf(step.k), b = dbOrder.indexOf(k);
        return a > b ? 1 : a < b ? 0 : frac;
    };
    const easeOut = (x) => 1 - Math.pow(1 - x, 3);
    const money = (n) => n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const clickAt = kAt0(list, "click");
    const searched = ch.layout === "report" && clickAt >= 0 && si > clickAt;

    // scan flow: phone first, then the web list of pending receipts
    const kAt = (k) => list.findIndex((x) => x.k === k);
    const onPhone = ch.layout === "scanflow" && si < kAt("web");
    const procAt = list.map((x, i) => (x.k === "proc" ? i : -1)).filter((i) => i >= 0);
    const procDone = procAt.filter((i) => si > i).length;
    const procNow = step.k === "proc" ? step.row : -1;

    const cell = (c) => {
        if (c == null || typeof c !== "object") return c;
        if (c.link) return <u className="wd-lnk">{c.link}</u>;
        if (c.pill) return <span className={`wd-st ${c.tone || "wait"}`}>{c.pill}</span>;
        if (c.btns) return <span className="wd-rp-acts">{c.btns.map((b, k) => <i key={b} className={k === 0 && c.btns.length > 2 ? "go" : /Open/.test(b) ? "pri" : ""}>{b}</i>)}</span>;
        return null;
    };

    // keep the active report tab in view (13 tabs)
    const rtabs = useRef(null);
    useEffect(() => {
        const bar = rtabs.current;
        const on = bar?.querySelector("button.on");
        if (!bar || !on) return;
        bar.scrollTo({ left: on.offsetLeft - bar.clientWidth / 2 + on.offsetWidth / 2, behavior: "smooth" });
    }, [ci]);

    /* ---------- dashboard, drawn like FEMS Home ---------- */
    const dashScroll = useRef(null);
    const [dbY, setDbY] = useState(0);
    useLayoutEffect(() => {
        const box = dashScroll.current;
        if (!box || ch.layout !== "dashboard") { setDbY(0); return; }
        const inner = box.firstElementChild;
        const max = Math.max(0, inner.scrollHeight - box.clientHeight);
        const at = (sel) => Math.min(max, Math.max(0, (box.querySelector(sel)?.offsetTop ?? 0) - 6));
        const k = step.k;
        const cardsEl = box.querySelector(".wd-db-cards");
        const fitCards = cardsEl ? Math.min(max, Math.max(0, cardsEl.offsetTop + cardsEl.offsetHeight - box.clientHeight + 6)) : 0;
        setDbY(k === "cards" ? fitCards : k === "charts" ? at(".wd-db-charts") : k === "lists" || k === "done" ? max : 0);
    }, [ch.layout, step.k]);

    const curve = (vals, w, h, top) => {
        const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - (v / top) * h]);
        let d = `M${pts[0][0]},${pts[0][1]}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
            d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
        }
        return { d, pts };
    };

    const dashboard = () => {
        const hero = easeOut(dbPart("hero"));
        const cards = easeOut(dbPart("cards"));
        const charts = easeOut(dbPart("charts"));
        const lists = dbPart("lists");
        const W = 520, H = 150, TOP = 3.8;
        const sL = curve(ch.salesM, W, H, TOP), cL = curve(ch.costM, W, H, TOP);
        const vatOut = ch.vat.output, vatIn = ch.vat.input;
        const share = vatOut / (vatOut + vatIn);
        return (
            <div className="wd-db" ref={dashScroll} key="dash">
                <div className="wd-db-in" style={{ transform: `translateY(${-dbY}px)` }}>
                    <div className="wd-db-hero">
                        <div className="wd-db-hl">
                            <span className="wd-db-chip">{ch.period}</span>
                            <h4>Good morning, {ch.user} <span aria-hidden="true">👋</span></h4>
                            <p>You made <b>₱{money(ch.sales * hero)}</b> in sales and spent <b>₱{money(ch.spent * hero)}</b> this period.</p>
                            <div className="wd-db-acts">
                                {ch.actions.map((a, i) => <span key={a} className={i === 0 ? "first" : ""}>{a}</span>)}
                            </div>
                        </div>
                        <div className="wd-db-dues">
                            {ch.dues.map((d) => (
                                <div key={d.form} className="wd-db-due">
                                    <small>{d.top}</small>
                                    <b>{Math.round(d.n * hero)}<em>days</em></b>
                                    <strong>{d.form}</strong>
                                    <span>{d.cov}</span>
                                    <span>{d.due}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="wd-db-cards">
                        {ch.cards.map((c, i) => {
                            const t = Math.min(1, Math.max(0, cards * 1.6 - i * 0.08));
                            return (
                                <div key={c.label} className={`wd-db-card ${c.tone}`} style={{ opacity: 0.25 + t * 0.75 }}>
                                    <span className="wd-db-ct"><i><Ico d={i % 2 ? P.buy : P.bill} size={12} /></i>{c.label}</span>
                                    <b>₱{money(c.value * t)}</b>
                                    <span className="wd-db-cs">{c.sub}</span>
                                    {c.tag && <em>{c.tag}</em>}
                                    {c.spark && (
                                        <svg className="wd-db-spark" viewBox="0 0 70 24" preserveAspectRatio="none">
                                            <polyline points={c.spark.map((v, j) => `${j * 10},${22 - v * 2.4}`).join(" ")} pathLength="1"
                                                style={{ strokeDasharray: 1, strokeDashoffset: 1 - t }} />
                                        </svg>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="wd-db-charts">
                        <div className="wd-db-panel">
                            <div className="wd-db-ph"><b>Sales vs costs</b><span><i className="s" />Sales<i className="c" />Purchases &amp; expenses</span></div>
                            <svg className="wd-db-chart" viewBox={`-34 -8 ${W + 44} ${H + 30}`}>
                                <defs>
                                    <linearGradient id="wdS" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6366f1" stopOpacity=".35" /><stop offset="1" stopColor="#6366f1" stopOpacity="0" /></linearGradient>
                                    <linearGradient id="wdC" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f97316" stopOpacity=".28" /><stop offset="1" stopColor="#f97316" stopOpacity="0" /></linearGradient>
                                    <clipPath id="wdClip"><rect x="-2" y="-10" width={(W + 4) * charts} height={H + 20} /></clipPath>
                                </defs>
                                {[0, 1, 2, 3].map((g) => (
                                    <g key={g}>
                                        <line x1="0" x2={W} y1={H - (g / 3) * H} y2={H - (g / 3) * H} className="grid" />
                                        <text x="-6" y={H - (g / 3) * H + 3} className="ax" textAnchor="end">{g === 0 ? "0" : `${(TOP * g / 3).toFixed(1)}M`}</text>
                                    </g>
                                ))}
                                {ch.months.map((m, i) => <text key={m} x={(i / 11) * W} y={H + 16} className="ax" textAnchor="middle">{m}</text>)}
                                <g clipPath="url(#wdClip)">
                                    <path d={`${cL.d} L${W},${H} L0,${H}Z`} fill="url(#wdC)" />
                                    <path d={`${sL.d} L${W},${H} L0,${H}Z`} fill="url(#wdS)" />
                                    <path d={cL.d} className="ln c" />
                                    <path d={sL.d} className="ln s" />
                                    {cL.pts.map(([x, y], i) => <circle key={`c${i}`} cx={x} cy={y} r="3" className="dt c" />)}
                                    {sL.pts.map(([x, y], i) => <circle key={`s${i}`} cx={x} cy={y} r="3" className="dt s" />)}
                                </g>
                            </svg>
                        </div>
                        <div className="wd-db-panel wd-db-vat">
                            <div className="wd-db-ph"><b>VAT · Sep 2026</b></div>
                            <div className="wd-db-donut">
                                <svg viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" className="trk" />
                                    <circle cx="50" cy="50" r="40" className="in" pathLength="100" style={{ strokeDasharray: `${(1 - share) * 100 * charts} 100` }} />
                                    <circle cx="50" cy="50" r="40" className="out" pathLength="100" style={{ strokeDasharray: `${share * 100 * charts} 100`, strokeDashoffset: -(1 - share) * 100 * charts }} />
                                </svg>
                                <span><small>Excess</small><b>₱{((vatIn - vatOut) * charts / 1000).toFixed(1)}K</b></span>
                            </div>
                            <ul>
                                <li><i className="out" />Output VAT<b>₱{money(vatOut)}</b></li>
                                <li><i className="in" />Input VAT<b>₱{money(vatIn)}</b></li>
                            </ul>
                            <span className="wd-db-link">Open VAT Summary →</span>
                        </div>
                    </div>

                    <div className="wd-db-lists">
                        <div className="wd-db-panel">
                            <div className="wd-db-ph"><b>BIR calendar</b><span className="wd-db-seg"><i className="on">VAT</i><i>Non-VAT</i></span></div>
                            {ch.calendar.map((r, i) => (
                                <div key={i} className={`wd-db-cal ${r[5] ? "hot" : ""}`} style={{ opacity: lists * 4 > i ? 1 : 0 }}>
                                    <span className="d"><small>{r[0]}</small><b>{r[1]}</b></span>
                                    <span className="t"><b>{r[2]}</b><small>{r[3]}</small></span>
                                    <em>{r[4]}</em>
                                </div>
                            ))}
                        </div>
                        <div className="wd-db-panel">
                            <div className="wd-db-ph"><b>Top customers</b></div>
                            {ch.customers.map((c, i) => (
                                <div key={c[0]} className="wd-db-cu">
                                    <span className="t"><i>{i + 1}</i>{c[0]}<b>{c[1]}</b></span>
                                    <span className="bar"><u style={{ width: `${c[2] * Math.min(1, lists * 1.5)}%` }} /></span>
                                    <small>{c[3]}</small>
                                </div>
                            ))}
                        </div>
                        <div className="wd-db-panel">
                            <div className="wd-db-ph"><b>Recent invoices</b><span className="wd-db-link">All →</span></div>
                            {ch.invoices.map((v, i) => (
                                <div key={i} className="wd-db-inv" style={{ opacity: lists * 4 > i ? 1 : 0 }}>
                                    <i>{v[0][0]}</i>
                                    <span><b>{v[0]}</b><small>{v[1]}</small></span>
                                    <em>{v[2]}</em>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <section className="ws-section ws-demo" id="demo" ref={root}>
            <div className="ws-wrap">
                <div className="ws-head">
                    <span className="ws-eyebrow">See it in action</span>
                    <h2>Watch FEMS <span className="ws-grad-text">do the work</span></h2>
                    <p>From the dashboard to your financial statements, every step below plays by itself. Pick a topic or pause any time.</p>
                </div>

                <div className={`wd ${full ? "wd-full" : ""}`} ref={wd}>
                    {/* chapters */}
                    <nav className="wd-chapters" aria-label="Demo topics">
                        {NAV.map((n, ni) => {
                            const on = ni === navAt;
                            const w = on ? ((n.idx.indexOf(ci) + pct / 100) / n.idx.length) * 100 : ni < navAt ? 100 : 0;
                            return (
                                <button key={n.key} type="button" className={`wd-ch ${on ? "on" : ""}`} onClick={() => pick(n.idx[0])} aria-current={on}>
                                    <span className="wd-ch-ic"><Ico d={P[n.icon]} /></span>
                                    <span className="wd-ch-txt">
                                        <b>{n.title}</b>
                                        <small>{n.sub}</small>
                                    </span>
                                    <span className="wd-ch-bar"><i style={{ width: `${w}%` }} /></span>
                                </button>
                            );
                        })}
                        <div className="wd-ctrl">
                            <button type="button" className="wd-play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
                                <Ico d={playing ? P.pause : P.play} size={16} /> {playing ? "Pause" : "Play"}
                            </button>
                            {canSpeak && (
                                <button type="button" className={`wd-play wd-play-voice ${voice ? "on" : ""}`} onClick={toggleVoice} aria-pressed={voice} aria-label={voice ? "Turn voice off" : "Turn voice on"}>
                                    <Ico d={voice ? P.sound : P.mute} size={16} /> Voice
                                </button>
                            )}
                            <button type="button" className="wd-play" onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"}>
                                <Ico d={full ? P.shrink : P.expand} size={16} /> {full ? "Exit" : "Full screen"}
                            </button>
                        </div>
                    </nav>

                    {/* the app window */}
                    <div className="wd-win" ref={win}>
                        <div className="wd-bar"><i /><i /><i /><span>igb-solutions.com</span>
                            <button type="button" className="wd-fsbtn" onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"} title={full ? "Exit full screen (Esc)" : "Full screen"}>
                                <Ico d={full ? P.shrink : P.expand} size={15} />
                            </button>
                        </div>
                        <div className="wd-app">
                            <aside className="wd-side" aria-hidden="true">
                                <span className="wd-logo">IGB</span>
                                {[P.home, P.sales, P.buy, P.book, P.box, P.chart].map((d, i) => (
                                    <span key={i} className={`wd-side-i ${i === sideOn ? "on" : ""}`}><Ico d={d} size={16} /></span>
                                ))}
                            </aside>
                            <div className="wd-main">
                                {ch.group && (
                                    <div className="wd-rtabs" role="tablist" ref={rtabs}>
                                        {CHAPTERS.map((c, i) => c.group !== ch.group ? null : (
                                            <button key={c.key} type="button" role="tab" aria-selected={i === ci} className={i === ci ? "on" : ""} onClick={() => pick(i)}>{c.tab}</button>
                                        ))}
                                    </div>
                                )}
                                <div className="wd-crumb">
                                    {ch.crumb.map((c, i) => <span key={c} className={i === ch.crumb.length - 1 ? "on" : ""}>{c}</span>)}
                                </div>

                                {/* scan flow: the mobile app, then the web list */}
                                {ch.layout === "scanflow" && onPhone && (
                                    <div className="wd-phone-stage" key="phone">
                                        <div className="wd-phone">
                                            <div className="wd-ph-top"><span>←</span><b>Expenses</b></div>
                                            <div className="wd-ph-body">
                                                <b>Scan your documents</b>
                                                <small>Align your receipt within the frame</small>
                                                <div className="wd-ph-frame">
                                                    <div className={`wd-receipt ${step.k === "phone" ? "scanning" : "read"}`} style={{ "--f": step.k === "phone" ? frac : 1 }}>
                                                        <b>OFFICIAL RECEIPT</b>
                                                        <small>SHELL – GINGOOG</small>
                                                        <span /><span /><span />
                                                        <em><span>TOTAL</span><span>1,120.00</span></em>
                                                        <u />
                                                        {step.k === "phone" && <i className="wd-laser" />}
                                                    </div>
                                                    {step.k === "send" && (
                                                        <div className="wd-ph-done"><span><Ico d={P.check} size={26} /></span><b>Submitted</b><small>Pending in Scanned Receipts</small></div>
                                                    )}
                                                </div>
                                                <span className={`wd-ph-btn ${step.k === "send" ? "press" : ""}`}>⛶ Scan</span>
                                                <span className="wd-ph-btn2">Upload from Device</span>
                                            </div>
                                        </div>
                                        <div className="wd-phone-note">
                                            <span className="wd-pill">Mobile app</span>
                                            <p>Receipts scanned on the phone show up on the web as <b>Pending</b>.</p>
                                        </div>
                                    </div>
                                )}

                                {ch.layout === "scanflow" && !onPhone && (
                                    <div className="wd-card wd-scanflow" key="web">
                                        <div className="wd-tabs">
                                            <span>Expense Transaction</span><span className="on">Scanned Receipts</span><span>Invalid - Partially Invalid - Cancel</span>
                                        </div>
                                        <div className="wd-sf-bar">
                                            <span className="wd-sf-search">Search filename…</span>
                                            <span className={`wd-save wd-postall ${step.k === "click" ? "press" : ""} ${done ? "ok" : ""}`} data-demo="postall">
                                                {done ? <><Ico d={P.check} size={14} /> All posted</> : <><Ico d={P.scan} size={14} /> Scan &amp; Post</>}
                                                {step.k === "click" && <i className="wd-ripple" />}
                                            </span>
                                        </div>
                                        <table className="wd-lines wd-sf">
                                            <thead><tr><th className="hash">#</th><th>File</th><th>Vendor</th><th>Account</th><th className="num">Amount</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {ch.receipts.map((r, i) => {
                                                    const posted = i < procDone;
                                                    const reading = i === procNow;
                                                    return (
                                                        <tr key={r.file} data-demo={`rc${i}`} className={`${r.fresh ? "fresh" : ""} ${reading ? "reading" : ""}`}>
                                                            <td className="hash">{i + 1}</td>
                                                            <td><span className="wd-pdf">{r.file.endsWith("pdf") ? "PDF" : "IMG"}</span>{r.file}{r.fresh && <em className="wd-newtag">From phone</em>}</td>
                                                            <td>{posted ? r.vendor : ""}</td>
                                                            <td>{posted ? r.account : ""}</td>
                                                            <td className="num">{posted ? r.amount : ""}</td>
                                                            <td>
                                                                <span className={`wd-st ${posted ? "ok" : reading ? "busy" : "wait"}`}>
                                                                    {reading && <i className="wd-spin" />}{posted ? "Posted" : reading ? "Reading…" : "Pending"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        <div className="wd-sf-foot">{ch.receipts.length - procDone} pending · {procDone} posted</div>

                                        <div className={`wd-result ${done ? "on" : ""}`} aria-hidden={!done}>
                                            <div className="wd-result-h"><Ico d={P.check} size={15} /> {ch.result.title}</div>
                                            <ul className="wd-list">
                                                {ch.result.rows.map(([a, b], i) => <li key={a} style={{ "--i": i }}><span>{a}</span><b>{b}</b></li>)}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {ch.layout === "dashboard" && dashboard()}

                                {ch.layout === "report" && (
                                    <div className={`wd-card wd-report ${ch.menu ? "has-menu" : ""}`} key={ch.key}>
                                        {ch.menu && (
                                            <div className="wd-rp-menu">
                                                <div className="wd-rp-menu-h">{ch.menu.title}</div>
                                                {ch.menu.items.map((m, i) => (
                                                    <span key={i} data-demo={`m${i}`} className={`${i === ch.menu.pick && (picking || picked) ? "on" : ""} ${i === ch.menu.pick && picking ? "press" : ""}`}>
                                                        <b>{m[0]}</b><small>{m[1]}</small>{m[2] && <em>{m[2]}</em>}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="wd-rp-main">
                                            {ch.menu && !picked ? (
                                                <div className="wd-rp-empty"><Ico d={P.chart} size={30} /><span>Pick a report</span></div>
                                            ) : (
                                                <>
                                                    {ch.subtabs && <div className="wd-rp-sub">{ch.subtabs.map((t, i) => <span key={t} className={i === 0 ? "on" : ""}>{t}</span>)}</div>}
                                                    <div className="wd-rp-title"><b>{ch.company}</b><span>{ch.heading}</span><small>{ch.period}</small></div>
                                                    {ch.aging && (
                                                        <div className="wd-rp-aging">
                                                            {ch.aging.map(([k, v, t]) => <span key={k} className={t}><small>{k}</small><b>{searched ? v : "-"}</b></span>)}
                                                        </div>
                                                    )}
                                                    <div className="wd-rp-bar">
                                                        {ch.fields.map((f, i) => (
                                                            <label key={i} className={`wd-f ${activeField === i ? "focus" : ""}`} data-demo={`f${i}`}>
                                                                <span>{f.label}</span>
                                                                {input(f, i)}
                                                            </label>
                                                        ))}
                                                        <span className="wd-rp-btns">
                                                            <span className={`wd-save ${clicking ? "press" : ""}`} data-demo="save">{ch.button || "Search"}{clicking && <i className="wd-ripple" />}</span>
                                                            <span className="wd-b">Print ▾</span>
                                                        </span>
                                                    </div>
                                                    {ch.banner && searched && (
                                                        <div className="wd-rp-banner"><i><Ico d={P.check} size={14} /></i><span><b>{ch.banner.title}</b><small>{ch.banner.sub}</small></span><em>See details</em></div>
                                                    )}
                                                    <div className={`wd-rp-table ${ch.report.wide ? "wide" : ""}`}>
                                                        <table>
                                                            <thead><tr>
                                                                {ch.report.view && <th />}
                                                                {ch.report.cols.map((c, j) => <th key={c} className={j >= ch.report.num ? "num" : ""}>{c}</th>)}
                                                            </tr></thead>
                                                            <tbody>
                                                                {(searched || ch.fields.length === 0) && searched && ch.report.rows.slice(0, rowsShown).map((r, i) => {
                                                                    const n = ch.report.cols.length + (ch.report.view ? 1 : 0);
                                                                    if (r.section) return <tr key={i} className="sec"><td colSpan={n}>{r.section}</td></tr>;
                                                                    const cells = r.total || r.net || r;
                                                                    return (
                                                                        <tr key={i} className={r.total ? "tot" : r.net ? "net" : ""}>
                                                                            {ch.report.view && <td className="view">{r.total ? "" : "View"}</td>}
                                                                            {cells.map((c, j) => <td key={j} className={`${j >= ch.report.num ? "num" : ""} ${typeof c === "string" && /^(\(|-\d)/.test(c) ? "neg" : ""}`}>{cell(c)}</td>)}
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                        {!searched && <div className="wd-rp-wait">Set the filters, then Search.</div>}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* the popup, drawn like the real one */}
                                {ch.layout !== "scanflow" && ch.layout !== "dashboard" && ch.layout !== "report" && (
                                    <div className={`wd-card wd-${ch.layout}`} key={ch.key}>
                                        <div className="wd-card-h">
                                            <b>{ch.heading}</b>
                                            {ch.badge && <span className={`wd-badge ${done ? "ok" : ""}`}>{done ? "SAVED" : ch.badge}</span>}
                                            <span className="wd-x">×</span>
                                        </div>

                                        {ch.layout === "invoice" && (
                                            <>
                                                <div className="wd-head3">
                                                    {[1, 2, 3].map((c) => (
                                                        <div className="wd-col" key={c}>
                                                            {ch.fields.map((f, i) => f.col !== c ? null : (
                                                                <label key={i} className={`wd-row ${activeField === i ? "focus" : ""}`} data-demo={`f${i}`}>
                                                                    <span className="wd-lbl">{f.label}</span>
                                                                    {input(f, i)}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                                {lines()}
                                                {ch.summary && (
                                                    <div className={`wd-sum ${afterRows ? "on" : ""}`}>
                                                        {ch.summary.map(([k, v], i) => (
                                                            <div key={k} className={i === ch.summary.length - 1 ? "last" : ""}>
                                                                <span>{k} :</span><b>{afterRows ? v : /%/.test(v) ? "None" : "0.00"}</b>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {ch.layout === "product" && (
                                            <>
                                                <div className="wd-prod">
                                                    <div className="wd-img">
                                                        <span className="wd-img-box"><Ico d={P.file} size={30} /></span>
                                                        <span className="wd-img-btn">Upload Image</span>
                                                    </div>
                                                    <div className="wd-fields one">
                                                        {ch.fields.map((f, i) => (
                                                            <label key={i} className={`wd-f ${activeField === i ? "focus" : ""}`} data-demo={`f${i}`}>
                                                                <span>{f.label}</span>
                                                                {input(f, i)}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                {lines()}
                                            </>
                                        )}

                                        {ch.layout === "scan" && (
                                            <div className="wd-scanbox">
                                                <div className={`wd-receipt ${scanning ? "scanning" : ""} ${scanned ? "read" : ""}`} style={{ "--f": scanning ? frac : 1 }}>
                                                    <b>OFFICIAL RECEIPT</b>
                                                    <small>SHELL – GINGOOG</small>
                                                    <span /><span /><span />
                                                    <em><span>TOTAL</span><span>1,120.00</span></em>
                                                    <u />
                                                    {scanning && <i className="wd-laser" />}
                                                </div>
                                                <div className="wd-fields">
                                                    {ch.fields.map((f, i) => (
                                                        <label key={i} className={`wd-f ${i === 0 ? "wide" : ""}`} data-demo={`f${i}`}>
                                                            <span>{f.label}</span>
                                                            {input(f, i)}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {buttons()}

                                        {/* result: journal / list */}
                                        <div className={`wd-result ${done ? "on" : ""}`} aria-hidden={!done}>
                                            <div className="wd-result-h"><Ico d={P.check} size={15} /> {ch.result.title}</div>
                                            {ch.result.type === "journal" ? (
                                                <table className="wd-jr">
                                                    <thead><tr><th>Account</th><th className="num">Debit</th><th className="num">Credit</th></tr></thead>
                                                    <tbody>
                                                        {ch.result.rows.map((r, i) =>
                                                            r.section ? <tr key={i} className="sec"><td colSpan={3}>{r.section}</td></tr>
                                                                : r.total ? <tr key={i} className="tot"><td /><td className="num">{r.total[0]}</td><td className="num">{r.total[1]}</td></tr>
                                                                    : <tr key={i} style={{ "--i": i }}><td>{r[0]}</td><td className="num">{r[1]}</td><td className="num">{r[2]}</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <ul className="wd-list">
                                                    {ch.result.rows.map(([a, b], i) => <li key={a} style={{ "--i": i }}><span>{a}</span><b>{b}</b></li>)}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* toast */}
                                <div className={`wd-toast ${done ? "on" : ""} ${ch.layout === "report" || ch.layout === "dashboard" ? "top" : ""}`}><Ico d={P.check} size={15} /> {ch.toast}</div>
                            </div>
                        </div>

                        {/* lesson title card: the teacher introduces the module */}
                        {step.k === "intro" && INTRO[ch.key] && (
                            <div className="wd-intro" key={`intro-${ci}`}>
                                <div className="wd-intro-card">
                                    <span className="wd-intro-lv">Lesson {navAt + 1}{ch.tab ? ` · ${ch.tab}` : ""}</span>
                                    <h4>{INTRO[ch.key][0]}</h4>
                                    <p>{INTRO[ch.key][1]}</p>
                                    <span className="wd-intro-bar"><i style={{ width: `${frac * 100}%` }} /></span>
                                </div>
                            </div>
                        )}

                        {/* fake cursor */}
                        <span className={`wd-cursor ${clicking || picking ? "click" : ""} ${onPhone || ch.layout === "dashboard" ? "hide" : ""}`} style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }} aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 2l15 9-7 1.5L8.5 20z" fill="#111827" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                        </span>

                        {/* the AI teacher + what it says */}
                        <TeacherBot show={botIn} talk={talking} cheer={done} />
                        <div className={`wd-caption wd-bubble ${botIn ? "in" : ""}`} key={`${ci}-${step.cap}`}>
                            <span className="wd-bubble-h">
                                <span className="wd-step">Lesson {navAt + 1}/{NAV.length}</span>
                                <b>{ch.title}</b>
                                <span className="wd-stars" title="Lessons finished">★ {stars}</span>
                            </span>
                            <span className="wd-bubble-t">{capText.slice(0, typed)}{talking && <i className="wd-type" />}</span>
                        </div>
                    </div>

                    {/* big AI teacher beside the window (wide screens) */}
                    <aside className={`wd-coach ${botIn ? "in" : ""}`} aria-live="polite">
                        <div className="wd-coach-bubble" key={`${ci}-${step.cap}`}>
                            <span className="wd-bubble-h">
                                <span className="wd-step">Lesson {navAt + 1}/{NAV.length}</span>
                                <span className="wd-stars" title="Lessons finished">★ {stars}</span>
                            </span>
                            <b className="wd-coach-title">{ch.title}</b>
                            <span className="wd-bubble-t">{capText.slice(0, typed)}{talking && <i className="wd-type" />}</span>
                        </div>
                        <TeacherBot big uid="b" show={botIn} talk={talking} cheer={done} />
                        {canSpeak && (
                            <button type="button" className={`wd-voice ${voice ? "on" : ""}`} onClick={toggleVoice} aria-pressed={voice}>
                                <Ico d={voice ? P.sound : P.mute} size={16} /> {voice ? "Voice on" : "Turn on voice"}
                            </button>
                        )}
                    </aside>
                </div>
            </div>
        </section>
    );
}