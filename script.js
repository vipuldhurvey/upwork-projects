const sampleRows = [
  { order_id: "NW-2048", customer: "Avery Bennett", product: "Linen Table Runner", category: "Textiles", amount: 68, status: "Paid", date: "2026-10-18" },
  { order_id: "NW-2047", customer: "Samira Patel", product: "Stoneware Mug Set", category: "Kitchen", amount: 54, status: "Paid", date: "2026-10-18" },
  { order_id: "NW-2046", customer: "Jordan Ellis", product: "Oak Desk Tray", category: "Workspace", amount: 92, status: "Processing", date: "2026-10-17" },
  { order_id: "NW-2045", customer: "Maya Turner", product: "Woven Market Tote", category: "Accessories", amount: 46, status: "Paid", date: "2026-10-17" },
  { order_id: "NW-2044", customer: "Noah Kim", product: "Ceramic Pour-over Set", category: "Kitchen", amount: 78, status: "Pending", date: "2026-10-16" },
  { order_id: "NW-2043", customer: "Leo Martin", product: "Soft Cotton Throw", category: "Textiles", amount: 115, status: "Paid", date: "2026-10-15" },
  { order_id: "NW-2042", customer: "Riley Chen", product: "Desk Light Mini", category: "Workspace", amount: 84, status: "Refunded", date: "2026-10-14" },
  { order_id: "NW-2041", customer: "Quinn Brooks", product: "Everyday Canvas Bag", category: "Accessories", amount: 39, status: "Paid", date: "2026-10-13" },
  { order_id: "NW-2040", customer: "Casey James", product: "Hand-thrown Bowl", category: "Kitchen", amount: 42, status: "Processing", date: "2026-10-12" }
];

let records = sampleRows.map((row) => ({ ...row }));
let currentDataset = "Sample ecommerce orders";

const fileInput = document.querySelector("#csv-file");
const dropZone = document.querySelector("#drop-zone");
const statusMessage = document.querySelector("#import-status");
const orderRows = document.querySelector("#order-rows");
const searchInput = document.querySelector("#record-search");
const statusFilter = document.querySelector("#status-filter");
const tableEmpty = document.querySelector("#empty-state");

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function normalizedStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  const known = { paid: "Paid", pending: "Pending", processing: "Processing", refunded: "Refunded" };
  return known[value] || "Pending";
}

function visibleRecords() {
  const term = searchInput.value.trim().toLowerCase();
  const chosenStatus = statusFilter.value;
  return records.filter((record) => {
    const searchMatch = !term || [record.order_id, record.customer, record.product, record.category].some((value) => String(value || "").toLowerCase().includes(term));
    return searchMatch && (chosenStatus === "all" || record.status === chosenStatus);
  });
}

function updateMetrics() {
  const paid = records.filter((record) => record.status === "Paid");
  const revenue = paid.reduce((total, record) => total + record.amount, 0);
  const open = records.filter((record) => record.status === "Pending" || record.status === "Processing").length;
  document.querySelector("#metric-records").textContent = records.length.toLocaleString("en-US");
  document.querySelector("#metric-revenue").textContent = money(revenue);
  document.querySelector("#metric-average").textContent = money(paid.length ? revenue / paid.length : 0);
  document.querySelector("#metric-open").textContent = open.toLocaleString("en-US");
  document.querySelector("#chart-total").textContent = money(revenue);
}

function renderChart() {
  const totals = new Map();
  records.filter((record) => record.status === "Paid").forEach((record) => {
    totals.set(record.category, (totals.get(record.category) || 0) + record.amount);
  });
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;
  const chart = document.querySelector("#category-chart");
  chart.innerHTML = sorted.length ? sorted.map(([category, total]) => `<div class="bar-row"><span class="bar-name">${escapeHTML(category)}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.max(4, Math.round((total / max) * 100))}%"></span></span><span class="bar-value">${money(total)}</span></div>`).join("") : `<p class="chart-empty">No paid orders in this dataset yet.</p>`;
}

function dateLabel(rawDate) {
  const date = new Date(`${rawDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return escapeHTML(rawDate || "—");
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function renderTable() {
  const visible = visibleRecords();
  orderRows.innerHTML = visible.map((record) => {
    const className = record.status.toLowerCase();
    return `<tr><td>${escapeHTML(record.order_id)}</td><td>${escapeHTML(record.customer)}</td><td class="product-cell">${escapeHTML(record.product)}</td><td>${escapeHTML(record.category)}</td><td class="amount-cell">${money(record.amount)}</td><td><span class="status-tag status-${className}">${escapeHTML(record.status)}</span></td><td>${dateLabel(record.date)}</td></tr>`;
  }).join("");
  tableEmpty.hidden = visible.length > 0;
  document.querySelector("#row-count").textContent = visible.length.toLocaleString("en-US");
  document.querySelector("#table-count").textContent = `Showing ${visible.length} of ${records.length} records`;
}

function render() {
  updateMetrics();
  renderChart();
  renderTable();
  document.querySelector("#dataset-label").textContent = currentDataset;
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inQuotes && character === '"' && source[index + 1] === '"') { field += '"'; index += 1; }
    else if (character === '"') inQuotes = !inQuotes;
    else if (character === "," && !inQuotes) { row.push(field.trim()); field = ""; }
    else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = []; field = "";
    } else field += character;
  }
  row.push(field.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  return rows;
}

function normalizeHeader(value) {
  return value.trim().toLowerCase().replace(/^\uFEFF/, "").replace(/[\s-]+/g, "_");
}

function convertCSV(text) {
  const matrix = parseCSV(text);
  if (matrix.length < 2) throw new Error("The CSV needs a header row and at least one record.");
  const headers = matrix[0].map(normalizeHeader);
  const aliases = {
    order_id: ["order_id", "order", "id", "order_number"],
    customer: ["customer", "customer_name", "name"],
    product: ["product", "item", "product_name"],
    category: ["category", "product_category", "type"],
    amount: ["amount", "total", "revenue", "price"],
    status: ["status", "order_status", "payment_status"],
    date: ["date", "order_date", "created_at"]
  };
  const indexes = {};
  Object.entries(aliases).forEach(([key, candidates]) => { indexes[key] = headers.findIndex((header) => candidates.includes(header)); });
  const missing = Object.keys(indexes).filter((key) => indexes[key] < 0);
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}. Include order_id, customer, product, category, amount, status, and date.`);
  const output = matrix.slice(1).map((cells, index) => {
    const value = (key) => cells[indexes[key]] ?? "";
    const amountText = value("amount").replace(/[$,]/g, "").trim();
    const amount = Number(amountText);
    if (!Number.isFinite(amount)) throw new Error(`Amount is not a number on CSV row ${index + 2}.`);
    return {
      order_id: value("order_id"), customer: value("customer"), product: value("product"),
      category: value("category") || "Uncategorized", amount,
      status: normalizedStatus(value("status")), date: value("date")
    };
  }).filter((record) => record.order_id || record.customer || record.product);
  if (!output.length) throw new Error("No usable records were found in the CSV.");
  return output;
}

function setImportStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", isError);
}

async function readFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
    setImportStatus("Choose a .csv file to import.", true);
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    setImportStatus("This demo accepts CSV files up to 10 MB.", true);
    return;
  }
  try {
    const nextRecords = convertCSV(await file.text());
    records = nextRecords;
    currentDataset = file.name;
    searchInput.value = "";
    statusFilter.value = "all";
    render();
    setImportStatus(`${records.length} rows imported from ${file.name}. The file was processed in this browser.`);
  } catch (error) {
    setImportStatus(error.message || "This CSV could not be read.", true);
  } finally {
    fileInput.value = "";
  }
}

function exportFiltered() {
  const current = visibleRecords();
  if (!current.length) { setImportStatus("There are no filtered rows to export.", true); return; }
  const columns = ["order_id", "customer", "product", "category", "amount", "status", "date"];
  const csv = [columns.join(","), ...current.map((record) => columns.map((column) => `"${String(record[column] ?? "").replace(/"/g, '""')}"`).join(","))].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "rowwise-filtered-records.csv";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  setImportStatus(`${current.length} filtered rows exported as CSV.`);
}

document.querySelector("#browse-file").addEventListener("click", () => fileInput.click());
dropZone.addEventListener("click", (event) => { if (!event.target.closest("button")) fileInput.click(); });
fileInput.addEventListener("change", () => readFile(fileInput.files?.[0]));
searchInput.addEventListener("input", renderTable);
statusFilter.addEventListener("change", renderTable);
document.querySelector("#export-csv").addEventListener("click", exportFiltered);
document.querySelector("#load-sample").addEventListener("click", () => {
  records = sampleRows.map((row) => ({ ...row }));
  currentDataset = "Sample ecommerce orders";
  searchInput.value = "";
  statusFilter.value = "all";
  render();
  setImportStatus("Sample data loaded. Import a CSV whenever you’re ready.");
});

["dragenter", "dragover"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
}));
["dragleave", "dragend"].forEach((eventName) => dropZone.addEventListener(eventName, () => dropZone.classList.remove("is-dragging")));
dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  readFile(event.dataTransfer.files?.[0]);
});

render();
