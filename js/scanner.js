// ParakhAI - Interactive Packet Scanner & Vision Inspection Module
// Simulates YOLOv8 Object Localization + PaddleOCR Extraction with Interactive Bounding Boxes

class ParakhScanner {
  constructor() {
    this.currentPacket = null;
    this.currentAuditResult = null;
    this.activeStream = null;
    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.viewport = document.getElementById("scannerViewport");
    this.scanCanvas = document.getElementById("scanOverlayCanvas");
    this.laserLine = document.getElementById("scanLaserLine");
    this.statusPill = document.getElementById("scanStatusPill");
    this.auditResultsContainer = document.getElementById("auditResultsContainer");
    this.fileInput = document.getElementById("packetFileInput");
    this.cameraVideo = document.getElementById("cameraFeed");
  }

  bindEvents() {
    if (!this.fileInput) return;

    this.fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleUserUploadedFile(file);
      }
    });

    // Drag and drop onto viewport
    if (this.viewport) {
      this.viewport.addEventListener("dragover", (e) => {
        e.preventDefault();
        this.viewport.classList.add("drag-hover");
      });
      this.viewport.addEventListener("dragleave", () => {
        this.viewport.classList.remove("drag-hover");
      });
      this.viewport.addEventListener("drop", (e) => {
        e.preventDefault();
        this.viewport.classList.remove("drag-hover");
        const file = e.dataTransfer.files[0];
        if (file) this.handleUserUploadedFile(file);
      });
    }
  }

  // Load one of the 4 pre-loaded realistic test packets
  loadDemoPacket(demoId) {
    const packet = PARAKH_DATA.demoPackets.find(p => p.id === demoId);
    if (!packet) return;

    this.stopCamera();
    this.currentPacket = packet;
    this.displayImage(packet.image);
    this.runVisionInspection(packet);
  }

  // Handle user uploaded photo
  handleUserUploadedFile(file) {
    this.stopCamera();
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      this.displayImage(imageUrl);

      // Create a simulated custom packet object based on user image
      const customPacket = {
        id: "user_upload_" + Date.now(),
        name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        category: "User Uploaded Packaged Commodity",
        image: imageUrl,
        mrp: 120.00,
        originalMrp: 120.00,
        netWeight: "100 g",
        unitSalePrice: "₹1.20 / g",
        mfgDate: "11/2025",
        expDate: "11/2026",
        isExpired: false,
        countryOfOrigin: "India",
        manufacturer: "Certified Packaged Goods Mfg Ltd, Industrial Estate, Hyderabad - 500037",
        consumerCare: "help@consumerpack.in | 1800-111-222",
        zones: [
          { label: "MRP Zone", status: "pass", text: "MRP ₹120.00 (Incl. all taxes)", box: { top: 65, left: 55, width: 35, height: 16 } },
          { label: "Net Quantity", status: "pass", text: "Net Qty: 100 g", box: { top: 52, left: 55, width: 30, height: 10 } },
          { label: "Mfg & Exp", status: "pass", text: "Mfg: 11/2025 | Exp: 11/2026", box: { top: 38, left: 10, width: 45, height: 12 } },
          { label: "Origin & Packer", status: "pass", text: "Made in India | Hyderabad - 500037", box: { top: 20, left: 10, width: 45, height: 15 } }
        ]
      };
      this.currentPacket = customPacket;
      this.runVisionInspection(customPacket);
    };
    reader.readAsDataURL(file);
  }

  // Start live webcam / mobile camera feed
  async startCamera() {
    try {
      this.stopCamera();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera API is not supported in this browser environment. Please use Image Upload or Demo Packets.");
        return;
      }

      this.activeStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      if (this.cameraVideo) {
        this.cameraVideo.srcObject = this.activeStream;
        this.cameraVideo.style.display = "block";
        const previewImg = document.getElementById("packetImagePreview");
        if (previewImg) previewImg.style.display = "none";
        this.laserLine.style.display = "block";
        this.statusPill.innerHTML = `<span class="pill-dot dot-cyan"></span> Live Camera Active – Align Packet Panel`;
        this.statusPill.className = "status-pill status-active";
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Unable to access camera. Please check camera permissions or use pre-loaded demo packets.");
    }
  }

  // Capture frame from active camera
  captureFrame() {
    if (!this.cameraVideo || !this.activeStream) {
      this.startCamera();
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = this.cameraVideo.videoWidth || 640;
    canvas.height = this.cameraVideo.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(this.cameraVideo, 0, 0, canvas.width, canvas.height);

    const frameUrl = canvas.toDataURL("image/jpeg");
    this.stopCamera();
    this.displayImage(frameUrl);

    // Run audit on captured frame
    const capturedPacket = {
      id: "live_capture_" + Date.now(),
      name: "Live Captured Commodity",
      category: "Packaged Retail Item",
      image: frameUrl,
      mrp: 99.00,
      originalMrp: 99.00,
      netWeight: "150 g",
      unitSalePrice: "MISSING",
      mfgDate: "01/2026",
      expDate: "01/2027",
      isExpired: false,
      countryOfOrigin: "India",
      manufacturer: "Retail Packed Commodity, Secunderabad, Telangana",
      consumerCare: "support@packcare.org | 1800-425-0000",
      zones: [
        { label: "Detected MRP", status: "pass", text: "MRP ₹99.00", box: { top: 60, left: 50, width: 35, height: 18 } },
        { label: "Net Quantity", status: "pass", text: "Net Qty: 150 g", box: { top: 45, left: 50, width: 30, height: 12 } },
        { label: "Missing USP", status: "violation", text: "Rule 6(1)(k) Violation: USP Not Provided", box: { top: 78, left: 50, width: 38, height: 14 } }
      ]
    };

    this.currentPacket = capturedPacket;
    this.runVisionInspection(capturedPacket);
  }

  stopCamera() {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => track.stop());
      this.activeStream = null;
    }
    if (this.cameraVideo) {
      this.cameraVideo.style.display = "none";
    }
  }

  // Display image in viewport
  displayImage(src) {
    const previewImg = document.getElementById("packetImagePreview");
    if (previewImg) {
      previewImg.src = src;
      previewImg.style.display = "block";
    }
    // Clear previous bounding boxes
    const overlay = document.getElementById("boxesOverlay");
    if (overlay) overlay.innerHTML = "";
  }

  // Simulated Vision AI inspection animation and calculation
  async runVisionInspection(packet) {
    this.clearAuditView();
    this.laserLine.style.display = "block";
    this.laserLine.classList.add("scanning-anim");

    // Phase 1: Pre-processing
    this.updateStatus("Preprocessing & Contrast Normalization...", "cyan");
    await this.delay(600);

    // Phase 2: YOLOv8 Object Localization
    this.updateStatus("YOLOv8: Localizing Mandatory Label Zones...", "cyan");
    this.renderBoundingBoxes(packet.zones || []);
    await this.delay(800);

    // Phase 3: PaddleOCR Text Recognition
    this.updateStatus("PaddleOCR: Reading Text & Numeric Decimals...", "lavender");
    await this.delay(700);

    // Phase 4: Legal Metrology Rule Engine Audit
    this.updateStatus("Rules Engine: Auditing 9 Statutory Declarations...", "lavender");
    await this.delay(500);

    // Complete audit
    const auditResult = window.parakhRulesEngine.auditPacket(packet);
    this.currentAuditResult = auditResult;
    this.laserLine.style.display = "none";
    this.laserLine.classList.remove("scanning-anim");

    if (auditResult.verdictClass === "status-pass") {
      this.updateStatus("Inspection Complete – 100% Compliant", "pass");
    } else if (auditResult.verdictClass === "status-danger") {
      this.updateStatus(`Critical Violation: ${auditResult.violations.length} Infractions Found`, "danger");
    } else {
      this.updateStatus(`Non-Compliant: ${auditResult.violations.length} Issues Detected`, "warning");
    }

    this.renderAuditResults(packet, auditResult);
  }

  renderBoundingBoxes(zones) {
    const overlay = document.getElementById("boxesOverlay");
    if (!overlay) return;
    overlay.innerHTML = "";

    zones.forEach((zone, idx) => {
      const box = document.createElement("div");
      box.className = `bbox bbox-${zone.status}`;
      box.style.top = `${zone.box.top}%`;
      box.style.left = `${zone.box.left}%`;
      box.style.width = `${zone.box.width}%`;
      box.style.height = `${zone.box.height}%`;

      const tag = document.createElement("span");
      tag.className = "bbox-tag";
      tag.innerText = zone.label;

      const tooltip = document.createElement("div");
      tooltip.className = "bbox-tooltip";
      tooltip.innerHTML = `<strong>${zone.label}</strong><p>${zone.text.replace(/\n/g, "<br>")}</p>`;

      box.appendChild(tag);
      box.appendChild(tooltip);

      // Pulse animation staggered
      box.style.animationDelay = `${idx * 150}ms`;

      overlay.appendChild(box);
    });
  }

  renderAuditResults(packet, audit) {
    if (!this.auditResultsContainer) return;

    const isPass = audit.verdictClass === "status-pass";
    const isDanger = audit.verdictClass === "status-danger";

    let violationsHtml = "";
    if (audit.violations.length > 0) {
      violationsHtml = `
        <div class="violations-banner">
          <h4><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Detected Statutory Violations (${audit.violations.length})</h4>
          <ul>
            ${audit.violations.map(v => `<li><strong>${v}</strong></li>`).join("")}
          </ul>
        </div>
      `;
    }

    let penaltyNoticeHtml = "";
    if (audit.penaltiesIncurred > 0) {
      penaltyNoticeHtml = `
        <div class="penalty-estimate-card">
          <div class="penalty-header">
            <span class="penalty-label">Statutory Penalty Exposure (Section 36)</span>
            <span class="penalty-amount">₹ ${audit.penaltiesIncurred.toLocaleString("en-IN")}</span>
          </div>
          <p class="penalty-caption">Liable under Legal Metrology Act, 2009 for commercial sale of non-standard pre-packaged commodities.</p>
        </div>
      `;
    }

    // Generate rule items for 9 declarations
    const ruleKeys = Object.keys(audit.ruleResults);
    const ruleCardsHtml = ruleKeys.map(key => {
      const r = audit.ruleResults[key];
      const badgeClass = r.status === "PASS" ? "badge-pass" : (r.status === "WARNING" ? "badge-warning" : "badge-fail");
      const iconSvg = r.status === "PASS"
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

      return `
        <div class="rule-audit-item ${r.status.toLowerCase()}">
          <div class="rule-audit-header">
            <div class="rule-title-group">
              <span class="rule-no">${r.ruleNo}</span>
              <span class="rule-title">${r.title}</span>
            </div>
            <span class="rule-badge ${badgeClass}">${iconSvg} ${r.status}</span>
          </div>
          <p class="rule-msg">${r.message}</p>
          ${r.value ? `<div class="rule-detected-val"><span>Extracted:</span> <code>${r.value}</code></div>` : ""}
        </div>
      `;
    }).join("");

    this.auditResultsContainer.innerHTML = `
      <div class="audit-summary-card">
        <div class="summary-top">
          <div>
            <span class="commodity-tag">${packet.category}</span>
            <h3 class="packet-heading">${packet.name}</h3>
          </div>
          <div class="verdict-pill ${audit.verdictClass}">
            ${audit.verdict}
          </div>
        </div>

        <div class="metrics-row">
          <div class="metric-box">
            <span class="metric-label">Trust Score</span>
            <div class="score-display">
              <span class="score-num ${isPass ? 'text-cyan' : (isDanger ? 'text-red' : 'text-lavender')}">${audit.complianceScore}%</span>
              <div class="score-bar-track">
                <div class="score-bar-fill ${isPass ? 'bg-cyan' : (isDanger ? 'bg-red' : 'bg-lavender')}" style="width: ${audit.complianceScore}%"></div>
              </div>
            </div>
          </div>

          <div class="metric-box">
            <span class="metric-label">Rule Checks</span>
            <span class="metric-val text-cyan">${audit.passedRulesCount} / ${audit.totalRulesChecked} Passed</span>
          </div>

          <div class="metric-box">
            <span class="metric-label">Unit Sale Price</span>
            <span class="metric-val text-lavender">${packet.unitSalePrice || 'Not Declared'}</span>
          </div>
        </div>

        ${violationsHtml}
        ${penaltyNoticeHtml}

        <div class="audit-actions-bar">
          <button class="btn btn-primary" onclick="window.parakhGrievance.openNoticeModal(window.parakhScanner.currentPacket, window.parakhScanner.currentAuditResult)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            1-Click Legal Notice (Section 36)
          </button>

          <button class="btn btn-secondary" onclick="window.parakhMap.openReportModal(window.parakhScanner.currentPacket, window.parakhScanner.currentAuditResult)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Tag to Hyderabad Map
          </button>

          <button class="btn btn-outline" onclick="window.parakhScanner.exportJsonAudit()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Audit Log
          </button>
        </div>

        <div class="rules-breakdown-section">
          <div class="breakdown-title-row">
            <h4>Statutory 9-Declaration Matrix (LM Rules 2011)</h4>
            <span class="breakdown-subtitle">Ministry of Consumer Affairs Benchmarks</span>
          </div>
          <div class="rules-grid">
            ${ruleCardsHtml}
          </div>
        </div>
      </div>
    `;

    // Smooth scroll into view on mobile
    if (window.innerWidth < 768) {
      this.auditResultsContainer.scrollIntoView({ behavior: "smooth" });
    }
  }

  exportJsonAudit() {
    if (!this.currentAuditResult || !this.currentPacket) return;
    const exportData = {
      auditTimestamp: new Date().toISOString(),
      actReference: "Legal Metrology Act, 2009 & Packaged Commodities Rules 2011",
      packetDetails: this.currentPacket,
      auditVerdict: this.currentAuditResult
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LabelScan_Audit_${(this.currentPacket.name || 'commodity').replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  updateStatus(text, type = "cyan") {
    if (!this.statusPill) return;
    const dotClass = type === "pass" ? "dot-green" : (type === "danger" ? "dot-red" : (type === "lavender" ? "dot-lavender" : "dot-cyan"));
    this.statusPill.innerHTML = `<span class="pill-dot ${dotClass}"></span> ${text}`;
  }

  clearAuditView() {
    if (this.auditResultsContainer) {
      this.auditResultsContainer.innerHTML = `
        <div class="audit-placeholder">
          <div class="spinner-radar"></div>
          <p>Running Computer Vision & OCR Analysis against Legal Metrology Rules 2011...</p>
        </div>
      `;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

window.parakhScanner = new ParakhScanner();
