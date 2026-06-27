/* ═══════════════════════════════════════════════════
   InspectIC – app.js
   All application logic for the InspectIC search page.
   Linked from: index.html
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   DATA
   Sample inspection records. In a real system
   this would be fetched from an API/database.
═══════════════════════════════════════════ */
const inspectionData = [
  {
    id: 1,
    partNumber: "TDA21470AUMA1",
    manufacturer: "Infineon",
    lotNumber: "WR036002W41",
    dateCode: "2023",
    status: "PASS",
    confidence: 96.5,
    barcodeText: "[)>06X988289961TWR036002W419D2023Q50001PTDA21470AUMA1",
    ocrText: "INFINEON TDA21470AUMA1 DC2023 LOT WR036002W41",
    remarks: "Label and barcode matched."
  },
  {
    id: 2,
    partNumber: "STM32F103C8T6",
    manufacturer: "STMicroelectronics",
    lotNumber: "A9K23",
    dateCode: "2022",
    status: "REVIEW",
    confidence: 72.3,
    barcodeText: "P:STM32F103C8T6;LOT:A9K23;DC:2022",
    ocrText: "STM32F103C8T6 marking partially unclear",
    remarks: "OCR confidence is low. Manual review required."
  },
  {
    id: 3,
    partNumber: "ADUM1201ARZ",
    manufacturer: "Analog Devices",
    lotNumber: "LTC8842",
    dateCode: "2024",
    status: "FAIL",
    confidence: 45.8,
    barcodeText: "1P ADUM1201BRZ 1T LTC8842 9D 2024",
    ocrText: "ADUM1201ARZ but barcode indicates ADUM1201BRZ",
    remarks: "Part number mismatch between OCR and barcode."
  },
  {
    id: 4,
    partNumber: "TPS54331DR",
    manufacturer: "Texas Instruments",
    lotNumber: "TI55391",
    dateCode: "2021",
    status: "PASS",
    confidence: 91.2,
    barcodeText: "P TPS54331DR Q 2500 1T TI55391 D 2021",
    ocrText: "TI TPS54331DR 2021",
    remarks: "All key fields matched."
  }
];

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */

/** Session start time for hero display */
const SESSION_START = new Date();

/**
 * Returns a colour hex string based on confidence level:
 *  ≥ 80 → green (pass threshold)
 *  ≥ 60 → amber (borderline)
 *  < 60 → red (low)
 */
function confColor(v) {
  if (v >= 80) return '#22C55E';
  if (v >= 60) return '#F59E0B';
  return '#DC1505';
}

/** Zero-pads a number to 2 digits */
function pad(n) { return String(n).padStart(2, '0'); }

/** Formats a Date as YYYY-MM-DD */
function fmt(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Formats a Date as HH:MM:SS */
function fmtTime(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/* ═══════════════════════════════════════════
   REAL-TIME CLOCK
   Updates the header clock and hero timestamp
   every second.
═══════════════════════════════════════════ */
function tickClock() {
  const now = new Date();
  document.getElementById('clockDate').textContent = fmt(now);
  document.getElementById('clockTime').textContent = fmtTime(now);
  document.getElementById('hDate').textContent     = now.toDateString();
  document.getElementById('hSession').textContent  = fmtTime(SESSION_START);
}
tickClock();
setInterval(tickClock, 1000);

/* ═══════════════════════════════════════════
   STATISTICS
   Populates stat cards, avg confidence band,
   donut chart, and confidence bar chart.
═══════════════════════════════════════════ */
function initStats() {
  const pass   = inspectionData.filter(d => d.status === 'PASS').length;
  const fail   = inspectionData.filter(d => d.status === 'FAIL').length;
  const review = inspectionData.filter(d => d.status === 'REVIEW').length;
  const avg    = inspectionData.reduce((s, d) => s + d.confidence, 0) / inspectionData.length;

  // Update stat card numbers
  document.getElementById('sTotal').textContent = inspectionData.length;
  document.getElementById('sPass').textContent  = pass;
  document.getElementById('sFail').textContent  = fail;
  document.getElementById('sRev').textContent   = review;

  // Average confidence band
  const col = confColor(avg);
  document.getElementById('avgVal').textContent            = avg.toFixed(1) + '%';
  document.getElementById('avgVal').style.color            = col;
  document.getElementById('avgFill').style.cssText         = `width:${avg}%;background:${col};`;
  document.getElementById('avgDesc').textContent           =
    avg >= 80
      ? 'Overall confidence is within acceptable range.'
      : 'Overall confidence is below threshold — review flagged records.';

  drawDonut(pass, fail, review);
  drawConfBars();
  populateMfg();
}

/* ═══════════════════════════════════════════
   DONUT CHART (Canvas API)
   Draws a colour-coded donut chart showing
   the pass/fail/review split.
═══════════════════════════════════════════ */
function drawDonut(pass, fail, review) {
  const canvas = document.getElementById('donutCanvas');
  const ctx    = canvas.getContext('2d');
  const total  = pass + fail + review;

  // Build slices (only include non-zero values)
  const slices = [
    { label: 'PASS',   count: pass,   color: '#22C55E' },
    { label: 'FAIL',   count: fail,   color: '#DC1505' },
    { label: 'REVIEW', count: review, color: '#F59E0B' }
  ].filter(s => s.count > 0);

  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R  = Math.min(W, H) / 2 - 8;  // outer radius
  const r  = R * 0.58;                  // inner radius (hole)

  ctx.clearRect(0, 0, W, H);

  // Draw slices
  let startAngle = -Math.PI / 2;
  slices.forEach(s => {
    const sweep = (s.count / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startAngle, startAngle + sweep);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    startAngle += sweep;
  });

  // Punch out centre hole
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#181B1E';
  ctx.fill();

  // Centre label (total count)
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#F0F2F4';
  ctx.font         = 'bold 22px Inter, sans-serif';
  ctx.fillText(total, cx, cy - 7);
  ctx.fillStyle = '#5E6878';
  ctx.font      = '9px Inter, sans-serif';
  ctx.fillText('RECORDS', cx, cy + 10);

  // Build legend below the donut
  const lg = document.getElementById('donutLegend');
  lg.innerHTML = '';
  slices.forEach(s => {
    const pct = ((s.count / total) * 100).toFixed(0);
    lg.innerHTML += `
      <div class="dl-row">
        <div class="dl-dot" style="background:${s.color};"></div>
        <span>${s.label}</span>
        <span class="dl-num" style="color:${s.color};">
          ${s.count}
          <span style="color:var(--td);font-weight:400;font-size:9px;">(${pct}%)</span>
        </span>
      </div>`;
  });
}

/* ═══════════════════════════════════════════
   CONFIDENCE BAR CHART
   Renders horizontal bars sorted by confidence
   score, colour-coded by threshold.
═══════════════════════════════════════════ */
function drawConfBars() {
  const container = document.getElementById('confBars');
  const sorted    = [...inspectionData].sort((a, b) => b.confidence - a.confidence);

  container.innerHTML = '';
  sorted.forEach(item => {
    const col  = confColor(item.confidence);
    const name = item.partNumber.length > 12
      ? item.partNumber.slice(0, 12) + '…'
      : item.partNumber;

    container.innerHTML += `
      <div class="bar-row">
        <span class="bar-name" title="${item.partNumber}">${name}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${item.confidence}%;background:${col};"></div>
        </div>
        <span class="bar-pct" style="color:${col};">${item.confidence}%</span>
      </div>`;
  });
}

/* ═══════════════════════════════════════════
   POPULATE MANUFACTURER FILTER
   Dynamically fills the <select> with unique
   manufacturers from the dataset.
═══════════════════════════════════════════ */
function populateMfg() {
  const mfgs = [...new Set(inspectionData.map(d => d.manufacturer))].sort();
  const sel  = document.getElementById('mfgFilter');
  mfgs.forEach(m => {
    const o   = document.createElement('option');
    o.value   = m;
    o.textContent = m;
    sel.appendChild(o);
  });
}

/* ═══════════════════════════════════════════
   FILTER + SORT
   Reads active search/filter values and returns
   the matching subset of inspectionData.
═══════════════════════════════════════════ */
function getResults() {
  const q   = document.getElementById('searchInput').value.trim().toLowerCase();
  const st  = document.getElementById('statusFilter').value;
  const mfg = document.getElementById('mfgFilter').value;
  const srt = document.getElementById('sortSelect').value;

  let res = inspectionData.filter(item => {
    // Searchable fields concatenated for a single .includes() check
    const hay = [item.partNumber, item.manufacturer, item.lotNumber, item.ocrText]
      .join(' ').toLowerCase();
    return (!q || hay.includes(q))
        && (st  === 'ALL' || item.status === st)
        && (mfg === 'ALL' || item.manufacturer === mfg);
  });

  // Optional sorting
  if (srt === 'conf-desc') res.sort((a, b) => b.confidence - a.confidence);
  if (srt === 'conf-asc')  res.sort((a, b) => a.confidence - b.confidence);

  return res;
}

/* ═══════════════════════════════════════════
   BUILD CARD
   Creates and returns a single inspection card
   DOM element for a given data record.
═══════════════════════════════════════════ */
function buildCard(item) {
  const isLow = item.confidence < 80;          // flag low-confidence records
  const col   = confColor(item.confidence);

  const card  = document.createElement('div');
  card.className = `card s-${item.status}${isLow ? ' low-conf' : ''}`;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');

  card.innerHTML = `
    <div class="card-stripe"></div>
    <div class="card-img">
      <svg width="30" height="30" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1">
        <rect x="4" y="4" width="14" height="14" rx="2"/>
        <rect x="7" y="7" width="8" height="8" rx="1"/>
        <line x1="1" y1="8"  x2="4" y2="8"/><line x1="1" y1="11" x2="4" y2="11"/><line x1="1" y1="14" x2="4" y2="14"/>
        <line x1="18" y1="8" x2="21" y2="8"/><line x1="18" y1="11" x2="21" y2="11"/><line x1="18" y1="14" x2="21" y2="14"/>
        <line x1="8"  y1="1" x2="8"  y2="4"/><line x1="11" y1="1" x2="11" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
        <line x1="8"  y1="18" x2="8" y2="21"/><line x1="11" y1="18" x2="11" y2="21"/><line x1="14" y1="18" x2="14" y2="21"/>
      </svg>
      <div class="card-img-id">#${String(item.id).padStart(4, '0')}</div>
    </div>

    <div class="card-body">
      <div class="card-top">
        <div>
          <div class="card-pn">${item.partNumber}</div>
          <div class="card-mfg">${item.manufacturer}</div>
        </div>
        <span class="badge b-${item.status}">${item.status}</span>
      </div>

      <div class="card-meta">
        <div class="mf"><span class="mk">Lot Number</span><span class="mv">${item.lotNumber}</span></div>
        <div class="mf"><span class="mk">Date Code</span><span class="mv">${item.dateCode}</span></div>
      </div>

      <div class="ocr-prev">${item.ocrText}</div>

      ${isLow ? `<div><span class="low-pill">⚠ Low confidence</span></div>` : ''}
    </div>

    <div class="card-footer">
      <span class="cf-lbl">Confidence</span>
      <div class="cf-track">
        <div class="cf-fill" style="width:${item.confidence}%;background:${col};"></div>
      </div>
      <span class="cf-pct" style="color:${col};">${item.confidence}%</span>
    </div>`;

  // Open detail modal on click or keyboard Enter/Space
  const open = () => openModal(item);
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });

  return card;
}

/* ═══════════════════════════════════════════
   RENDER
   Re-renders the cards grid based on current
   filter/sort state.
═══════════════════════════════════════════ */
function render() {
  const data = getResults();
  const grid = document.getElementById('cardsGrid');
  const cnt  = document.getElementById('resultsCount');
  grid.innerHTML = '';

  if (!data.length) {
    // Empty state message
    grid.innerHTML = `
      <div class="empty">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
        <h3>No matching inspection record found.</h3>
        <p>Try adjusting your search terms or clearing the active filters.</p>
      </div>`;
    cnt.innerHTML = 'Showing <strong>0</strong> records';
  } else {
    cnt.innerHTML = `Showing <strong>${data.length}</strong> of ${inspectionData.length} records`;
    data.forEach(item => grid.appendChild(buildCard(item)));
  }
}

/* ═══════════════════════════════════════════
   MODAL – OPEN
   Populates and shows the inspection detail
   modal for the clicked record.
═══════════════════════════════════════════ */
function openModal(item) {
  const col = confColor(item.confidence);

  // Header
  document.getElementById('mPN').textContent = item.partNumber;

  // Status badge
  const badge   = document.getElementById('mBadge');
  badge.textContent = item.status;
  badge.className   = `badge b-${item.status}`;

  // Confidence bar
  document.getElementById('mConfVal').textContent   = `${item.confidence}%`;
  document.getElementById('mConfVal').style.color   = col;
  document.getElementById('mConfBar').style.cssText = `width:${item.confidence}%;background:${col};`;

  // Low confidence warning strip
  document.getElementById('warnStrip').style.display = item.confidence < 80 ? 'flex' : 'none';

  // Detail metadata grid
  document.getElementById('mDetailGrid').innerHTML = `
    <div class="dc"><div class="mk">Manufacturer</div><div class="mv">${item.manufacturer}</div></div>
    <div class="dc"><div class="mk">Lot Number</div>  <div class="mv">${item.lotNumber}</div></div>
    <div class="dc"><div class="mk">Date Code</div>   <div class="mv">${item.dateCode}</div></div>`;

  // Verification checklist
  const checks = [
    { ok: item.status === 'PASS', label: 'Part Number Match',    desc: 'OCR vs. barcode part number' },
    { ok: item.status !== 'FAIL', label: 'Barcode Integrity',    desc: '2D barcode decoded without error' },
    { ok: item.confidence >= 80,  label: 'OCR Confidence ≥ 80%', desc: `Score: ${item.confidence}%`, warn: item.confidence < 80 && item.status !== 'FAIL' },
    { ok: item.status !== 'FAIL', label: 'Manufacturer Verified',desc: 'Manufacturer field matches label' },
  ];
  document.getElementById('mChkList').innerHTML = checks.map(c => {
    const cls  = !c.ok ? 'chk-fail' : c.warn ? 'chk-warn' : 'chk-ok';
    const icon = !c.ok ? '✕' : c.warn ? '!' : '✓';
    return `<div class="chk ${cls}">
      <div class="chk-icon">${icon}</div>
      <span>${c.label}</span>
      <span class="chk-desc">${c.desc}</span>
    </div>`;
  }).join('');

  // Remarks
  document.getElementById('mRemarks').textContent = item.remarks;

  // Raw data tab
  document.getElementById('mBarcode').innerHTML = `<span class="code-type">RAW BARCODE / 2D CODE</span>${item.barcodeText}`;
  document.getElementById('mOcr').innerHTML     = `<span class="code-type">OCR OUTPUT</span>${item.ocrText}`;

  // Inspection timeline
  const steps = [
    { cls: 'tl-ok',  title: 'Image Captured',   desc: 'Device image captured by inspection camera at 4032×3024 px resolution.' },
    { cls: 'tl-ok',  title: 'Barcode Decoded',   desc: `2D barcode decoded. Raw string extracted (${item.barcodeText.length} characters).` },
    { cls: item.status === 'FAIL' ? 'tl-bad' : 'tl-ok',
      title: 'OCR Processing',
      desc:  `OCR engine returned: "${item.ocrText}"` },
    { cls: item.confidence >= 80 ? 'tl-ok' : 'tl-warn',
      title: 'Confidence Scoring',
      desc:  `Score: ${item.confidence}%. ${item.confidence < 80 ? 'Flagged for manual review.' : 'Within acceptable threshold.'}` },
    { cls: item.status === 'PASS' ? 'tl-ok' : item.status === 'FAIL' ? 'tl-bad' : 'tl-warn',
      title: `Final Status: ${item.status}`,
      desc:  item.remarks }
  ];
  document.getElementById('mTimeline').innerHTML = steps.map(s => `
    <div class="tl-item">
      <div class="tl-line">
        <div class="tl-dot ${s.cls}">●</div>
        <div class="tl-conn"></div>
      </div>
      <div class="tl-body">
        <div class="tl-title">${s.title}</div>
        <div class="tl-desc">${s.desc}</div>
      </div>
    </div>`).join('');

  switchTab('overview');
  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* ═══════════════════════════════════════════
   MODAL – CLOSE
═══════════════════════════════════════════ */
function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════════════
   TABS
   Switches between Overview / Raw Data /
   Timeline panels inside the modal.
═══════════════════════════════════════════ */
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-pane').forEach(p =>
    p.classList.toggle('active', p.id === `tab-${name}`));
}
document.querySelectorAll('.tab-btn')
  .forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

/* ═══════════════════════════════════════════
   TOAST NOTIFICATION
   Shows a brief success message after an action.
═══════════════════════════════════════════ */
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

/* ═══════════════════════════════════════════
   EXPORT: CSV
   Downloads current filtered results as CSV.
═══════════════════════════════════════════ */
function exportCSV() {
  const data   = getResults();
  const now    = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const header = ['ID', 'Part Number', 'Manufacturer', 'Lot Number', 'Date Code',
                   'Status', 'Confidence (%)', 'Barcode Text', 'OCR Text', 'Remarks'];

  const rows = data.map(d => [
    d.id,
    `"${d.partNumber}"`,
    `"${d.manufacturer}"`,
    `"${d.lotNumber}"`,
    d.dateCode,
    d.status,
    d.confidence,
    `"${d.barcodeText.replace(/"/g, '""')}"`,
    `"${d.ocrText.replace(/"/g, '""')}"`,
    `"${d.remarks.replace(/"/g, '""')}"`
  ].join(','));

  const csv  = `# InspectIC Export — ${now}\n` + header.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `InspectIC_Report_${now.replace(/[: ]/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV report downloaded.');
}

/* ═══════════════════════════════════════════
   EXPORT: HTML REPORT
   Downloads current filtered results as a
   self-contained HTML file.
═══════════════════════════════════════════ */
function exportHTMLReport() {
  const data   = getResults();
  const now    = new Date().toLocaleString();
  const pass   = data.filter(d => d.status === 'PASS').length;
  const fail   = data.filter(d => d.status === 'FAIL').length;
  const review = data.filter(d => d.status === 'REVIEW').length;
  const avg    = data.length
    ? (data.reduce((s, d) => s + d.confidence, 0) / data.length).toFixed(1)
    : 'N/A';

  const statusColor = { PASS: '#22C55E', FAIL: '#DC1505', REVIEW: '#F59E0B' };

  const rows = data.map(d => `
    <tr>
      <td>${d.id}</td>
      <td><b>${d.partNumber}</b></td>
      <td>${d.manufacturer}</td>
      <td>${d.lotNumber}</td>
      <td>${d.dateCode}</td>
      <td><span style="background:${statusColor[d.status]}22;color:${statusColor[d.status]};border:1px solid ${statusColor[d.status]}55;padding:2px 9px;border-radius:4px;font-weight:700;font-size:11px;letter-spacing:.8px;">${d.status}</span></td>
      <td style="color:${d.confidence >= 80 ? '#22C55E' : d.confidence >= 60 ? '#F59E0B' : '#DC1505'};font-weight:700;">${d.confidence}%</td>
      <td style="color:#888;font-size:11px;font-family:monospace;">${d.barcodeText}</td>
      <td style="font-size:11px;color:#aaa;">${d.ocrText}</td>
      <td style="font-size:11px;font-style:italic;color:#999;">${d.remarks}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>InspectIC – Report ${now}</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0D0F10;color:#F0F2F4;padding:40px 32px;margin:0;}
  h1{font-size:24px;font-weight:900;letter-spacing:-.3px;}
  h1 em{font-style:normal;color:#DC1505;}
  .meta{font-size:12px;color:#5E6878;margin:6px 0 28px;}
  .stats{display:flex;gap:16px;margin-bottom:28px;flex-wrap:wrap;}
  .s{background:#181B1E;border:1px solid #2C3137;border-radius:10px;padding:14px 20px;min-width:110px;}
  .s .lbl{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#5E6878;margin-bottom:4px;}
  .s .val{font-size:28px;font-weight:900;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th{background:#181B1E;border:1px solid #2C3137;padding:9px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#5E6878;}
  td{border:1px solid #2C3137;padding:9px 10px;vertical-align:top;}
  tr:hover td{background:#181B1E;}
  .footer{margin-top:32px;font-size:11px;color:#5E6878;border-top:1px solid #2C3137;padding-top:16px;}
</style>
</head>
<body>
<h1>Inspect<em>IC</em> Inspection Report</h1>
<div class="meta">Generated: ${now} &nbsp;|&nbsp; Records shown: ${data.length}</div>
<div class="stats">
  <div class="s"><div class="lbl">Total</div><div class="val" style="color:#F0F2F4;">${data.length}</div></div>
  <div class="s"><div class="lbl">PASS</div><div class="val" style="color:#22C55E;">${pass}</div></div>
  <div class="s"><div class="lbl">FAIL</div><div class="val" style="color:#DC1505;">${fail}</div></div>
  <div class="s"><div class="lbl">REVIEW</div><div class="val" style="color:#F59E0B;">${review}</div></div>
  <div class="s"><div class="lbl">Avg Confidence</div><div class="val" style="font-size:22px;color:#F0F2F4;">${avg}%</div></div>
</div>
<table>
  <thead>
    <tr>
      <th>ID</th><th>Part Number</th><th>Manufacturer</th><th>Lot No.</th>
      <th>Date Code</th><th>Status</th><th>Confidence</th>
      <th>Barcode Text</th><th>OCR Text</th><th>Remarks</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">InspectIC Internal Inspection Platform &nbsp;|&nbsp; This report is for internal use only.</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `InspectIC_Report_${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('HTML report downloaded.');
}

/* ═══════════════════════════════════════════
   DOWNLOAD DROPDOWN
   Toggle open/close and wire up export items.
═══════════════════════════════════════════ */
const dlWrap = document.getElementById('dlWrap');
const dlMenu = document.getElementById('dlMenu');

document.getElementById('dlToggle').addEventListener('click', e => {
  e.stopPropagation();
  dlMenu.classList.toggle('open');
});
document.getElementById('dlCSV').addEventListener('click',  () => { dlMenu.classList.remove('open'); exportCSV(); });
document.getElementById('dlHTML').addEventListener('click', () => { dlMenu.classList.remove('open'); exportHTMLReport(); });
// Close dropdown when clicking anywhere else
document.addEventListener('click', e => {
  if (!dlWrap.contains(e.target)) dlMenu.classList.remove('open');
});

/* ═══════════════════════════════════════════
   TOOLBAR EVENTS
   Re-render on any search / filter / sort change.
═══════════════════════════════════════════ */
['searchInput', 'statusFilter', 'mfgFilter', 'sortSelect'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input',  render);
  el.addEventListener('change', render);
});

// Clear button resets all controls
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('searchInput').value  = '';
  document.getElementById('statusFilter').value = 'ALL';
  document.getElementById('mfgFilter').value    = 'ALL';
  document.getElementById('sortSelect').value   = 'none';
  render();
});

/* ═══════════════════════════════════════════
   MODAL EVENTS
═══════════════════════════════════════════ */
document.getElementById('btnClose').addEventListener('click', closeModal);
// Click outside modal to close
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('overlay')) closeModal();
});
// Escape key closes modal
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ═══════════════════════════════════════════
   KEYBOARD SHORTCUTS
   Global hotkeys for power users (also shown
   in the footer shortcuts panel).
═══════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  // Ctrl/Cmd + K → focus the search input
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const s = document.getElementById('searchInput');
    s.focus(); s.select();
    s.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  // Alt + C → clear all filters
  if (e.altKey && e.key === 'c') { document.getElementById('clearBtn').click(); }
  // Alt + E → export CSV
  if (e.altKey && e.key === 'e') { exportCSV(); }
  // Alt + P → filter PASS only
  if (e.altKey && e.key === 'p') { document.getElementById('statusFilter').value = 'PASS'; render(); }
  // Alt + F → filter FAIL only
  if (e.altKey && e.key === 'f') { document.getElementById('statusFilter').value = 'FAIL'; render(); }
  // Alt + R → filter REVIEW only
  if (e.altKey && e.key === 'r') { document.getElementById('statusFilter').value = 'REVIEW'; render(); }
});

/* ═══════════════════════════════════════════
   FOOTER METRICS
   Fills in the live database stats row in the footer.
═══════════════════════════════════════════ */
function updateFooterMetrics() {
  const all      = inspectionData.length;
  const pass     = inspectionData.filter(d => d.status === 'PASS').length;
  const fail     = inspectionData.filter(d => d.status === 'FAIL').length;
  const rev      = inspectionData.filter(d => d.status === 'REVIEW').length;
  const avg      = (inspectionData.reduce((s, d) => s + d.confidence, 0) / all).toFixed(1);
  const passRate = ((pass / all) * 100).toFixed(0);

  const el = id => document.getElementById(id);
  if (el('fm-total'))    el('fm-total').textContent    = all;
  if (el('fm-pass'))     el('fm-pass').textContent     = pass;
  if (el('fm-fail'))     el('fm-fail').textContent     = fail;
  if (el('fm-review'))   el('fm-review').textContent   = rev;
  if (el('fm-avg'))      el('fm-avg').textContent      = avg + '%';
  if (el('fm-passrate')) el('fm-passrate').textContent = passRate + '%';
}

/* ═══════════════════════════════════════════
   FOOTER LIVE CLOCK
   Ticks the timestamp in the footer bottom bar.
═══════════════════════════════════════════ */
(function footerClock() {
  const el = document.getElementById('footer-clock');
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };
  tick();
  setInterval(tick, 1000);
})();

/* ═══════════════════════════════════════════
   INIT
   Boot sequence – run on page load.
═══════════════════════════════════════════ */
initStats();
render();
updateFooterMetrics();