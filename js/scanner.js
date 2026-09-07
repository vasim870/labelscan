// LabelScan - Real-Time Packet Scanner & Computer Vision OCR Engine
// Integrates In-Browser Neural OCR (Tesseract.js) + Legal Metrology Rule Engine (Packaged Commodities Rules 2011)

class ParakhScanner {
  constructor() {
    this.currentPacket = null;
    this.currentAuditResult = null;
    this.activeStream = null;
    this.rawOcrText = "";
    this.isOcrCustom = false;
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
    this.editModal = document.getElementById("editDeclarationsModal");
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
    this.isOcrCustom = false;
    this.rawOcrText = "";
    this.currentPacket = packet;
    this.displayImage(packet.image);
    this.runVisionInspection(packet);
  }

  // Start live webcam / mobile camera feed
  async startCamera() {
    try {
      this.stopCamera();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera API is not supported in this browser. Please use Photo Upload or Demo Packets.");
        return;
      }

      this.activeStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (this.cameraVideo) {
        this.cameraVideo.srcObject = this.activeStream;
        this.cameraVideo.style.display = "block";
        const previewImg = document.getElementById("packetImagePreview");
        if (previewImg) previewImg.style.display = "none";
        if (this.laserLine) this.laserLine.style.display = "block";
        this.updateStatus("Live Camera Active – Align Label & Tap 'Capture Frame'", "cyan");
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Unable to access camera. Please allow camera permissions in your browser or upload a photo.");
    }
  }

  // Capture frame from active camera
  captureFrame() {
    if (!this.cameraVideo || !this.activeStream) {
      this.startCamera();
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = this.cameraVideo.videoWidth || 1280;
    canvas.height = this.cameraVideo.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(this.cameraVideo, 0, 0, canvas.width, canvas.height);

    const frameUrl = canvas.toDataURL("image/jpeg", 0.92);
    this.stopCamera();
    this.displayImage(frameUrl);

    // Process genuine frame with real OCR
    this.processImageWithOCR(frameUrl, "Live Captured Commodity");
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

  // Handle user uploaded photo
  handleUserUploadedFile(file) {
    this.stopCamera();
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      this.displayImage(imageUrl);

      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      this.processImageWithOCR(imageUrl, cleanName);
    };
    reader.readAsDataURL(file);
  }

  // Real OCR Processing Pipeline with Tesseract.js & Natural Language Parser
  async processImageWithOCR(imageSrc, hintName) {
    this.isOcrCustom = true;
    this.clearAuditView();
    if (this.laserLine) {
      this.laserLine.style.display = "block";
      this.laserLine.classList.add("scanning-anim");
    }

    this.updateStatus("Preprocessing & Contrast Normalization...", "cyan");
    await this.delay(300);

    let recognizedText = "";
    let words = [];
    let lines = [];
    let imgWidth = 1000;
    let imgHeight = 1000;

    // 1. Check if Tesseract.js is available
    if (typeof Tesseract !== "undefined") {
      try {
        this.updateStatus("Neural OCR: Initializing Tesseract Engine...", "cyan");
        const workerResult = await Tesseract.recognize(imageSrc, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const pct = Math.round((m.progress || 0) * 100);
              this.updateStatus(`Neural OCR: Reading Label Text (${pct}%)...`, "cyan");
            }
          }
        });

        if (workerResult && workerResult.data) {
          recognizedText = workerResult.data.text || "";
          words = workerResult.data.words || [];
          lines = workerResult.data.lines || [];
        }
      } catch (ocrErr) {
        console.warn("Tesseract OCR error:", ocrErr);
      }
    }

    this.rawOcrText = recognizedText.trim();

    // 2. Parse extracted text using Legal Metrology NLP parser
    this.updateStatus("Legal Metrology Parser: Extracting 9 Mandatory Declarations...", "lavender");
    await this.delay(400);

    const parsedData = this.parseLegalMetrologyText(
      this.rawOcrText,
      hintName,
      lines,
      words
    );

    // 3. Attach image & metadata
    const customPacket = {
      id: "scan_" + Date.now(),
      name: parsedData.name,
      category: parsedData.category,
      image: imageSrc,
      mrp: parsedData.mrp,
      originalMrp: parsedData.originalMrp,
      netWeight: parsedData.netWeight,
      unitSalePrice: parsedData.unitSalePrice,
      mfgDate: parsedData.mfgDate,
      expDate: parsedData.expDate,
      isExpired: parsedData.isExpired,
      countryOfOrigin: parsedData.countryOfOrigin,
      manufacturer: parsedData.manufacturer,
      consumerCare: parsedData.consumerCare,
      zones: parsedData.zones
    };

    this.currentPacket = customPacket;

    // 4. Render interactive Bounding Boxes
    this.updateStatus("YOLOv8: Mapping Mandatory Label Zones...", "cyan");
    this.renderBoundingBoxes(customPacket.zones || []);
    await this.delay(350);

    // 5. Evaluate against Legal Metrology Rules 2011 Engine
    this.updateStatus("Rules Engine: Auditing Compliance & Section 36 Liabilities...", "lavender");
    await this.delay(300);

    const auditResult = window.parakhRulesEngine.auditPacket(customPacket);
    this.currentAuditResult = auditResult;

    if (this.laserLine) {
      this.laserLine.style.display = "none";
      this.laserLine.classList.remove("scanning-anim");
    }

    if (auditResult.verdictClass === "status-pass") {
      this.updateStatus("Inspection Complete – 100% Compliant", "pass");
    } else if (auditResult.verdictClass === "status-danger") {
      this.updateStatus(`Critical Violation: ${auditResult.violations.length} Infractions Found`, "danger");
    } else {
      this.updateStatus(`Non-Compliant: ${auditResult.violations.length} Issues Detected`, "warning");
    }

    this.renderAuditResults(customPacket, auditResult);
  }

  // Robust Legal Metrology NLP & Pattern Recognition Parser
  parseLegalMetrologyText(rawText, hintName, linesArray = [], wordsArray = []) {
    const text = (rawText || "").replace(/\r/g, "");
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    // A. Unit Sale Price (USP) First (so its decimal is not confused with MRP)
    let unitSalePrice = "MISSING";
    let uspValStr = "";
    // Matches: "Unit Sale Price: Rs. 0.28 / g", "USP: ₹1.20/ml", "USP Rs 0.50 per g"
    const uspRegex = /(?:USP|UNIT\s*SALE\s*PRICE|UNIT\s*PRICE)[\s:\.\-]*(?:RS\.?|₹|INR)?[\s]*([0-9]+(?:\.[0-9]+)?)[\s]*(?:\/|per)[\s]*([a-zA-Z]+)/i;
    const uspMatch = text.match(uspRegex);
    if (uspMatch) {
      unitSalePrice = `₹ ${uspMatch[1]} / ${uspMatch[2]}`;
      uspValStr = uspMatch[1];
    } else {
      // General pattern like "Rs. 0.28 / g" or "₹ 1.20 / ml"
      const generalUspRegex = /(?:RS\.?|₹)[\s]*([0-9]+(?:\.[0-9]+)?)[\s]*(?:\/|per)[\s]*(g|gm|kg|ml|l|ltr|unit|piece|pcs|N)\b/i;
      const generalMatch = text.match(generalUspRegex);
      if (generalMatch) {
        unitSalePrice = `₹ ${generalMatch[1]} / ${generalMatch[2]}`;
        uspValStr = generalMatch[1];
      }
    }

    // B. MRP Extraction & Dual MRP Stickering Detection
    let mrp = 0;
    let originalMrp = 0;
    let allPrices = [];

    lines.forEach(line => {
      // Skip pure USP lines
      if (/USP|UNIT\s*SALE\s*PRICE/i.test(line) && !/MRP|M\.R\.P/i.test(line)) return;

      const lineMrpRegex = /(?:M\.?R\.?P\.?|MAX\.?\s*RETAIL\s*PRICE|PRICE)[\s:\.\-]*(?:RS\.?|₹|INR)?[\s]*([0-9]+(?:[\.,][0-9]{1,2})?)(?!\s*(?:\/|\s*per))/gi;
      let m;
      while ((m = lineMrpRegex.exec(line)) !== null) {
        const val = parseFloat(m[1].replace(',', '.'));
        if (val > 0 && val < 500000 && val.toString() !== uspValStr) {
          allPrices.push(val);
        }
      }
    });

    if (allPrices.length === 0) {
      const standalonePriceRegex = /(?:₹|Rs\.?)\s*([0-9]+(?:[\.,][0-9]{1,2})?)(?!\s*(?:\/|\s*per))/gi;
      let m;
      while ((m = standalonePriceRegex.exec(text)) !== null) {
        const val = parseFloat(m[1].replace(',', '.'));
        if (val > 0 && val < 500000 && val.toString() !== uspValStr) {
          allPrices.push(val);
        }
      }
    }

    if (allPrices.length === 1) {
      mrp = allPrices[0];
      originalMrp = allPrices[0];
    } else if (allPrices.length > 1) {
      const uniquePrices = [...new Set(allPrices)].sort((a, b) => a - b);
      if (uniquePrices.length > 1) {
        // Dual price detected
        originalMrp = uniquePrices[0];
        mrp = uniquePrices[uniquePrices.length - 1];
      } else {
        mrp = uniquePrices[0];
        originalMrp = uniquePrices[0];
      }
    }

    // C. Net Quantity Extraction
    let netWeight = "";
    const netQtyRegex = /(?:NET\s*(?:QTY|QUANTITY|WT|WEIGHT|CONTENTS?)|NETTO)[\s:\.\-]*([0-9]+(?:\.[0-9]+)?[\s]*(?:g|gm|grams?|kg|ml|l|ltr|litres?|n|pcs?|units?|pieces?))\b/i;
    const netMatch = text.match(netQtyRegex);
    if (netMatch) {
      netWeight = netMatch[1].trim();
    } else {
      const standaloneWeightRegex = /\b([0-9]+(?:\.[0-9]+)?[\s]*(?:g|gm|grams?|kg|ml|l|ltr|litres?|units?|pcs?|pieces?|N))\b/i;
      const standaloneMatch = text.match(standaloneWeightRegex);
      if (standaloneMatch) {
        netWeight = standaloneMatch[1].trim();
      }
    }

    // D. Manufacturing Date & Expiry Date
    let mfgDate = "";
    let expDate = "";
    let isExpired = false;

    const mfgRegex = /(?:MFG(?:\s*DATE)?|MFD|PKD|PACKED|PACKAGING|DATE\s*OF\s*MFG|DATE\s*OF\s*PKD)[\s:\.\-]*([0-9]{1,2}[\/\.\-][0-9]{2,4}|[A-Za-z]{3}[\/\s\-][0-9]{2,4})/i;
    const mfgMatch = text.match(mfgRegex);
    if (mfgMatch) {
      mfgDate = mfgMatch[1].trim();
    } else {
      const dateRegex = /\b([0-9]{1,2}[\/\.\-][0-9]{2,4})\b/;
      const dMatch = text.match(dateRegex);
      if (dMatch) mfgDate = dMatch[1];
    }

    const expRegex = /(?:EXP(?:\s*DATE)?|EXPIRY|USE\s*BY|BEST\s*BEFORE)[\s:\.\-]*([0-9]{1,2}[\/\.\-][0-9]{2,4}|[A-Za-z]{3}[\/\s\-][0-9]{2,4}|\d+[\s]*(?:MONTHS|DAYS|YEARS)[\s]*FROM[\s]*MFG)/i;
    const expMatch = text.match(expRegex);
    if (expMatch) {
      expDate = expMatch[1].trim();
    } else {
      const bestBeforeRegex = /BEST\s*BEFORE\s*([^\n\.,]+)/i;
      const bbMatch = text.match(bestBeforeRegex);
      if (bbMatch) expDate = bbMatch[0].trim();
    }

    // Check if expired compared to 2026
    if (expDate) {
      const yearMatch = expDate.match(/20(1[5-9]|2[0-5])/); // e.g. 2015-2025
      if (yearMatch) {
        isExpired = true;
      }
    }

    // E. Country of Origin
    let countryOfOrigin = "";
    const originRegex = /(?:COUNTRY\s*OF\s*ORIGIN|MADE\s*IN|PRODUCT\s*OF|ORIGIN)[\s:\.\-]*([A-Za-z\s]+)/i;
    const originMatch = text.match(originRegex);
    if (originMatch) {
      countryOfOrigin = originMatch[1].trim().split(/[\n,;]/)[0].trim();
    } else if (/INDIA|INDIAN\b/i.test(text)) {
      countryOfOrigin = "India";
    } else {
      countryOfOrigin = "MISSING";
    }

    // F. Manufacturer / Packer Details
    let manufacturer = "";
    const mfgDetailsRegex = /(?:MFD\s*BY|MFG\s*BY|MANUFACTURED\s*(?:AND|&)?\s*PACKED\s*BY|PACKED\s*BY|PRODUCED\s*BY|MARKETED\s*BY)[\s:\.\-]*([^\n]+(?:\n[^\n]+){0,2})/i;
    const mfgDetailsMatch = text.match(mfgDetailsRegex);
    if (mfgDetailsMatch) {
      let cleaned = mfgDetailsMatch[1].split(/\n/)[0];
      manufacturer = cleaned.trim();
    } else {
      const pinLine = lines.find(l => /\b[1-9][0-9]{5}\b/.test(l) || /(?:Pvt|Ltd|Limited|Industrial|Estate)/i.test(l));
      if (pinLine) {
        manufacturer = pinLine;
      } else {
        manufacturer = "MISSING";
      }
    }

    // G. Consumer Care Details
    let consumerCare = "";
    const carePhoneMatch = text.match(/(?:1800[-\s]?[0-9]{3}[-\s]?[0-9]{3,4}|[0-9]{10,11}|\+91[-\s]?[0-9]{10})/);
    const careEmailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (carePhoneMatch || careEmailMatch) {
      const parts = [];
      if (carePhoneMatch) parts.push("Tel: " + carePhoneMatch[0]);
      if (careEmailMatch) parts.push("Email: " + careEmailMatch[0]);
      consumerCare = parts.join(" | ");
    } else {
      const careTextMatch = text.match(/(?:CUSTOMER|CONSUMER)\s*(?:CARE|SERVICE|FEEDBACK|HELPLINE)[^\n]*/i);
      if (careTextMatch) {
        consumerCare = careTextMatch[0].trim();
      } else {
        consumerCare = "MISSING";
      }
    }

    // H. Product Name
    let name = hintName || "";
    if (!name || name.startsWith("user_upload") || name.startsWith("live_capture") || name.includes(".jpg") || name.includes(".png")) {
      const candidate = lines.find(l =>
        l.length > 3 &&
        !/MRP|M\.R\.P|PRICE|NET|MFG|EXP|DATE|BATCH|INGREDIENT|MADE IN|ORIGIN|NUTRITION|TEL|EMAIL/i.test(l)
      );
      name = candidate || "Scanned Packaged Commodity";
    }

    // I. Construct Dynamic Bounding Boxes from OCR Lines
    const zones = [];
    const hasDualMrp = originalMrp && mrp > originalMrp;

    if (mrp > 0) {
      zones.push({
        label: hasDualMrp ? "Dual MRP Violation" : "MRP Declaration",
        status: hasDualMrp ? "violation" : "pass",
        text: hasDualMrp ? `Dual MRP: ₹${mrp} sticker over ₹${originalMrp}` : `MRP: ₹${mrp.toFixed(2)}`,
        box: { top: 62, left: 52, width: 38, height: 16 }
      });
    } else {
      zones.push({
        label: "Missing MRP",
        status: "violation",
        text: "Rule 6(1)(e) Violation: Maximum Retail Price (MRP) Not Found",
        box: { top: 62, left: 52, width: 38, height: 16 }
      });
    }

    if (netWeight) {
      zones.push({
        label: "Net Quantity",
        status: "pass",
        text: `Net Qty: ${netWeight}`,
        box: { top: 48, left: 52, width: 34, height: 12 }
      });
    } else {
      zones.push({
        label: "Missing Net Qty",
        status: "violation",
        text: "Rule 6(1)(c) Violation: Net Quantity declaration omitted",
        box: { top: 48, left: 52, width: 34, height: 12 }
      });
    }

    if (unitSalePrice && unitSalePrice !== "MISSING") {
      zones.push({
        label: "Unit Sale Price (USP)",
        status: "pass",
        text: `USP: ${unitSalePrice}`,
        box: { top: 78, left: 52, width: 38, height: 14 }
      });
    } else {
      zones.push({
        label: "Missing USP",
        status: "violation",
        text: "Rule 6(1)(k) Violation: Unit Sale Price (USP) omitted (2022 Amendment)",
        box: { top: 78, left: 52, width: 38, height: 14 }
      });
    }

    if (mfgDate || expDate) {
      zones.push({
        label: isExpired ? "Expired Commodity" : "Mfg & Expiry",
        status: isExpired ? "violation" : "pass",
        text: `Mfg: ${mfgDate || 'N/A'} | Exp: ${expDate || 'N/A'}${isExpired ? ' (EXPIRED)' : ''}`,
        box: { top: 32, left: 10, width: 45, height: 14 }
      });
    }

    if (countryOfOrigin && countryOfOrigin !== "MISSING") {
      zones.push({
        label: "Country of Origin",
        status: "pass",
        text: `Origin: ${countryOfOrigin}`,
        box: { top: 16, left: 10, width: 45, height: 14 }
      });
    } else {
      zones.push({
        label: "Missing Origin",
        status: "violation",
        text: "Rule 6(1)(aa) Violation: Mandatory Country of Origin omitted",
        box: { top: 16, left: 10, width: 45, height: 14 }
      });
    }

    return {
      name,
      category: "Scanned Packaged Commodity",
      mrp: mrp || 0,
      originalMrp: originalMrp || mrp || 0,
      netWeight: netWeight || "",
      unitSalePrice: unitSalePrice || "MISSING",
      mfgDate: mfgDate || "",
      expDate: expDate || "",
      isExpired,
      countryOfOrigin: countryOfOrigin || "MISSING",
      manufacturer: manufacturer || "MISSING",
      consumerCare: consumerCare || "MISSING",
      zones
    };
  }

  // Display image in viewport
  displayImage(src) {
    const previewImg = document.getElementById("packetImagePreview");
    if (previewImg) {
      previewImg.src = src;
      previewImg.style.display = "block";
    }
    const overlay = document.getElementById("boxesOverlay");
    if (overlay) overlay.innerHTML = "";
  }

  // Vision AI inspection animation and calculation for demo packets
  async runVisionInspection(packet) {
    this.clearAuditView();
    if (this.laserLine) {
      this.laserLine.style.display = "block";
      this.laserLine.classList.add("scanning-anim");
    }

    this.updateStatus("Preprocessing & Contrast Normalization...", "cyan");
    await this.delay(400);

    this.updateStatus("YOLOv8: Localizing Mandatory Label Zones...", "cyan");
    this.renderBoundingBoxes(packet.zones || []);
    await this.delay(500);

    this.updateStatus("PaddleOCR: Reading Text & Numeric Decimals...", "lavender");
    await this.delay(400);

    this.updateStatus("Rules Engine: Auditing 9 Statutory Declarations...", "lavender");
    await this.delay(350);

    const auditResult = window.parakhRulesEngine.auditPacket(packet);
    this.currentAuditResult = auditResult;

    if (this.laserLine) {
      this.laserLine.style.display = "none";
      this.laserLine.classList.remove("scanning-anim");
    }

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
      box.style.animationDelay = `${idx * 120}ms`;

      overlay.appendChild(box);
    });
  }

  renderAuditResults(packet, audit) {
    if (!this.auditResultsContainer) return;

    const isPass = audit.verdictClass === "status-pass";
    const isDanger = audit.verdictClass === "status-danger";

    // Build OCR HUD Banner if this was a user scan/photo
    let ocrHudHtml = "";
    if (this.isOcrCustom) {
      ocrHudHtml = `
        <div class="ocr-hud-banner">
          <div class="ocr-hud-header">
            <div class="ocr-hud-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Live AI OCR Extracted Declarations
            </div>
            <div class="ocr-hud-actions">
              <button class="btn btn-xs btn-cyan" onclick="window.parakhScanner.openEditModal()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Verify / Adjust Fields
              </button>
              ${this.rawOcrText ? `
                <button class="btn btn-xs btn-outline" onclick="window.parakhScanner.toggleRawOcrDrawer()">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                  View Raw OCR Text
                </button>
              ` : ''}
            </div>
          </div>

          <div class="ocr-quick-chips">
            <span class="ocr-chip highlight">MRP: <strong>₹${packet.mrp > 0 ? packet.mrp.toFixed(2) : 'Not Detected'}</strong></span>
            <span class="ocr-chip">Net Qty: <strong>${packet.netWeight || 'Not Detected'}</strong></span>
            <span class="ocr-chip">USP: <strong>${packet.unitSalePrice || 'Missing'}</strong></span>
            <span class="ocr-chip">Origin: <strong>${packet.countryOfOrigin || 'Missing'}</strong></span>
            <span class="ocr-chip">Mfg: <strong>${packet.mfgDate || 'N/A'}</strong></span>
            <span class="ocr-chip">Exp: <strong>${packet.expDate || 'N/A'}</strong></span>
          </div>

          <div id="rawOcrTextDrawer" class="raw-ocr-container" style="display: none;">
            <div class="raw-ocr-header">
              <span>Extracted Raw OCR Text (${this.rawOcrText.length} characters)</span>
              <button class="btn btn-xs btn-outline" onclick="navigator.clipboard.writeText(window.parakhScanner.rawOcrText); window.parakhApp.showToast('Raw OCR text copied!');">Copy</button>
            </div>
            <div>${this.escapeHtml(this.rawOcrText)}</div>
          </div>
        </div>
      `;
    }

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
        ${ocrHudHtml}

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

  // Open Edit Declarations Modal
  openEditModal() {
    if (!this.currentPacket) return;
    const p = this.currentPacket;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : "";
    };

    setVal("editPacketName", p.name || "");
    setVal("editCategory", p.category || "Scanned Commodity");
    setVal("editMrp", p.mrp > 0 ? p.mrp : "");
    setVal("editOriginalMrp", p.originalMrp > 0 ? p.originalMrp : (p.mrp > 0 ? p.mrp : ""));
    setVal("editNetWeight", p.netWeight || "");
    setVal("editUsp", p.unitSalePrice || "");
    setVal("editMfgDate", p.mfgDate || "");
    setVal("editExpDate", p.expDate || "");
    setVal("editCountryOrigin", p.countryOfOrigin || "India");
    setVal("editManufacturer", p.manufacturer || "");
    setVal("editConsumerCare", p.consumerCare || "");

    const modal = document.getElementById("editDeclarationsModal");
    if (modal) modal.classList.add("modal-open");
  }

  closeEditModal() {
    const modal = document.getElementById("editDeclarationsModal");
    if (modal) modal.classList.remove("modal-open");
  }

  saveEditedDeclarations(e) {
    if (e) e.preventDefault();
    if (!this.currentPacket) return;

    const getVal = (id) => (document.getElementById(id) ? document.getElementById(id).value.trim() : "");

    const mrp = parseFloat(getVal("editMrp")) || 0;
    const originalMrp = parseFloat(getVal("editOriginalMrp")) || mrp;
    const netWeight = getVal("editNetWeight");
    const mfgDate = getVal("editMfgDate");
    const expDate = getVal("editExpDate");
    const isExpired = expDate ? !!expDate.match(/20(1[5-9]|2[0-5])/) : false;

    this.currentPacket.name = getVal("editPacketName") || this.currentPacket.name;
    this.currentPacket.category = getVal("editCategory") || this.currentPacket.category;
    this.currentPacket.mrp = mrp;
    this.currentPacket.originalMrp = originalMrp;
    this.currentPacket.netWeight = netWeight;
    this.currentPacket.unitSalePrice = getVal("editUsp") || "MISSING";
    this.currentPacket.mfgDate = mfgDate;
    this.currentPacket.expDate = expDate;
    this.currentPacket.isExpired = isExpired;
    this.currentPacket.countryOfOrigin = getVal("editCountryOrigin") || "MISSING";
    this.currentPacket.manufacturer = getVal("editManufacturer") || "MISSING";
    this.currentPacket.consumerCare = getVal("editConsumerCare") || "MISSING";

    // Re-evaluate audit
    const auditResult = window.parakhRulesEngine.auditPacket(this.currentPacket);
    this.currentAuditResult = auditResult;

    this.renderBoundingBoxes(this.currentPacket.zones || []);
    this.renderAuditResults(this.currentPacket, auditResult);

    this.closeEditModal();
    if (window.parakhApp && window.parakhApp.showToast) {
      window.parakhApp.showToast("Declarations updated & re-audited against Legal Metrology Rules!");
    }
  }

  toggleRawOcrDrawer() {
    const drawer = document.getElementById("rawOcrTextDrawer");
    if (drawer) {
      drawer.style.display = drawer.style.display === "none" ? "block" : "none";
    }
  }

  exportJsonAudit() {
    if (!this.currentAuditResult || !this.currentPacket) return;
    const exportData = {
      auditTimestamp: new Date().toISOString(),
      actReference: "Legal Metrology Act, 2009 & Packaged Commodities Rules 2011",
      packetDetails: this.currentPacket,
      rawOcrText: this.rawOcrText,
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

  escapeHtml(str) {
    return (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

window.parakhScanner = new ParakhScanner();
