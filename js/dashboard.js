// ParakhAI - Dashboard Module (Citizen vs. Legal Metrology Inspector Mode)
// Provides Real-time USP Calculator, Enforcement Logs, Seizure Queues, and Brand Analytics

class ParakhDashboard {
  constructor() {
    this.currentMode = "citizen"; // 'citizen' or 'inspector'
    this.initModeToggle();
    this.bindCalculator();
    this.renderInspectorTable();
    this.renderRecentScansFeed();
  }

  initModeToggle() {
    const citizenBtn = document.getElementById("citizenModeBtn");
    const inspectorBtn = document.getElementById("inspectorModeBtn");

    if (citizenBtn && inspectorBtn) {
      citizenBtn.addEventListener("click", () => this.switchMode("citizen"));
      inspectorBtn.addEventListener("click", () => this.switchMode("inspector"));
    }
  }

  switchMode(mode) {
    this.currentMode = mode;
    const citizenBtn = document.getElementById("citizenModeBtn");
    const inspectorBtn = document.getElementById("inspectorModeBtn");
    const citizenViews = document.querySelectorAll(".view-citizen-only");
    const inspectorViews = document.querySelectorAll(".view-inspector-only");
    const modeBadge = document.getElementById("currentModeBadge");

    if (mode === "inspector") {
      if (citizenBtn) citizenBtn.classList.remove("active");
      if (inspectorBtn) inspectorBtn.classList.add("active");
      citizenViews.forEach(el => el.style.display = "none");
      inspectorViews.forEach(el => el.style.display = "block");

      if (modeBadge) {
        modeBadge.innerHTML = `<span class="badge-dot dot-cyan"></span> Legal Metrology Officer HUD`;
        modeBadge.className = "header-mode-badge badge-officer";
      }

      if (window.parakhApp) {
        window.parakhApp.showToast("Switched to Legal Metrology Inspector Mode – Enforcement HUD active.");
      }
    } else {
      if (inspectorBtn) inspectorBtn.classList.remove("active");
      if (citizenBtn) citizenBtn.classList.add("active");
      inspectorViews.forEach(el => el.style.display = "none");
      citizenViews.forEach(el => el.style.display = "block");

      if (modeBadge) {
        modeBadge.innerHTML = `<span class="badge-dot dot-lavender"></span> Citizen Consumer Mode`;
        modeBadge.className = "header-mode-badge badge-citizen";
      }

      if (window.parakhApp) {
        window.parakhApp.showToast("Switched to Citizen Mode – Consumer rights & easy scanner active.");
      }
    }
  }

  // Bind interactive "Am I Being Cheated?" Unit Price Calculator
  bindCalculator() {
    const mrpInput = document.getElementById("calcMrp");
    const qtyInput = document.getElementById("calcQty");
    const unitSelect = document.getElementById("calcUnit");
    const resultBox = document.getElementById("calcResultBox");

    if (!mrpInput || !qtyInput || !unitSelect || !resultBox) return;

    const compute = () => {
      const mrp = parseFloat(mrpInput.value) || 0;
      const qty = parseFloat(qtyInput.value) || 0;
      const unit = unitSelect.value;

      if (mrp <= 0 || qty <= 0) {
        resultBox.innerHTML = `<p class="calc-hint">Enter MRP and Quantity above to verify fair unit price.</p>`;
        return;
      }

      let pricePerBase = 0;
      let displayUnit = "";
      let alternativeUnit = "";

      if (unit === "g") {
        pricePerBase = mrp / qty;
        displayUnit = `₹ ${pricePerBase.toFixed(2)} / g`;
        alternativeUnit = `(₹ ${(pricePerBase * 1000).toFixed(2)} / kg)`;
      } else if (unit === "kg") {
        pricePerBase = mrp / qty;
        displayUnit = `₹ ${pricePerBase.toFixed(2)} / kg`;
        alternativeUnit = `(₹ ${(pricePerBase / 1000).toFixed(2)} / g)`;
      } else if (unit === "ml") {
        pricePerBase = mrp / qty;
        displayUnit = `₹ ${pricePerBase.toFixed(2)} / ml`;
        alternativeUnit = `(₹ ${(pricePerBase * 1000).toFixed(2)} / Liter)`;
      } else if (unit === "l") {
        pricePerBase = mrp / qty;
        displayUnit = `₹ ${pricePerBase.toFixed(2)} / Liter`;
        alternativeUnit = `(₹ ${(pricePerBase / 1000).toFixed(2)} / ml)`;
      } else {
        pricePerBase = mrp / qty;
        displayUnit = `₹ ${pricePerBase.toFixed(2)} / piece`;
      }

      resultBox.innerHTML = `
        <div class="calc-output-card">
          <div class="calc-usp-primary">${displayUnit}</div>
          ${alternativeUnit ? `<div class="calc-usp-sec">${alternativeUnit}</div>` : ""}
          <div class="calc-rule-status">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Mandatory to be printed on packet as per Rule 6(1)(k) (2022 Amendment)
          </div>
        </div>
      `;
    };

    mrpInput.addEventListener("input", compute);
    qtyInput.addEventListener("input", compute);
    unitSelect.addEventListener("change", compute);
  }

  // Render Officer Inspection Audit Queue Table
  renderInspectorTable() {
    const tableBody = document.getElementById("officerAuditTableBody");
    if (!tableBody) return;

    const audits = PARAKH_DATA.inspectorStats.recentAudits;
    tableBody.innerHTML = audits.map(a => `
      <tr>
        <td><code>${a.id}</code></td>
        <td><strong>${a.store}</strong></td>
        <td><span class="table-tag tag-${a.type.toLowerCase().replace(/\s+/g, '-')}">${a.type}</span></td>
        <td>${a.officer}</td>
        <td><span class="action-status-pill">${a.action}</span></td>
        <td><small class="text-muted">${a.date}</small></td>
        <td>
          <button class="btn btn-xs btn-cyan" onclick="window.parakhDashboard.viewAuditRecord('${a.id}')">Review</button>
        </td>
      </tr>
    `).join("");
  }

  // Render live crowdsourced scan feed
  renderRecentScansFeed() {
    const feedContainer = document.getElementById("recentScansFeed");
    if (!feedContainer) return;

    const sampleFeed = [
      { item: "Haldiram's Bhujia 200g", loc: "Madhapur, Hyd", status: "PASS", score: "98%", time: "3m ago" },
      { item: "Himalaya Face Wash 150ml", loc: "Ameerpet Metro", status: "DUAL MRP", score: "28%", time: "12m ago" },
      { item: "Sunfeast Dark Fantasy 300g", loc: "Begumpet Road", status: "NO USP", score: "48%", time: "24m ago" },
      { item: "Artisan Belgian Choco", loc: "Banjara Hills", status: "EXPIRED", score: "32%", time: "45m ago" },
      { item: "Amul Taaza Milk 500ml", loc: "Secunderabad", status: "PASS", score: "100%", time: "1h ago" }
    ];

    feedContainer.innerHTML = sampleFeed.map(f => {
      const isPass = f.status === "PASS";
      return `
        <div class="feed-item">
          <div class="feed-status-dot ${isPass ? 'dot-pass' : 'dot-fail'}"></div>
          <div class="feed-info">
            <span class="feed-title">${f.item}</span>
            <span class="feed-sub">${f.loc} • <small class="text-muted">${f.time}</small></span>
          </div>
          <div class="feed-badge ${isPass ? 'badge-pass' : 'badge-fail'}">
            ${f.status} (${f.score})
          </div>
        </div>
      `;
    }).join("");
  }

  viewAuditRecord(auditId) {
    const audit = PARAKH_DATA.inspectorStats.recentAudits.find(a => a.id === auditId);
    if (!audit) return;
    if (window.parakhApp) {
      window.parakhApp.showToast(`Loading case file ${auditId}: ${audit.store} - Action: ${audit.action}`);
    }
  }

  // Export full officer enforcement log to CSV
  exportEnforcementCsv() {
    const headers = "CaseID,StoreName,ViolationType,ReportingOfficer,EnforcementAction,Timestamp\n";
    const rows = PARAKH_DATA.inspectorStats.recentAudits.map(a =>
      `"${a.id}","${a.store}","${a.type}","${a.officer}","${a.action}","${a.date}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LabelScan_Inspector_Log_Hyderabad_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.parakhApp) {
      window.parakhApp.showToast("Inspector enforcement log exported to CSV successfully.");
    }
  }
}

window.parakhDashboard = new ParakhDashboard();
