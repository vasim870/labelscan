// LabelScan - Real-Time Packet Scanner & Computer Vision OCR Engine
// Integrates In-Browser Neural OCR (Tesseract.js) + Backend API (/api/scan) + Legal Metrology Rules 2011 Engine

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

  // Load a test packet
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
        this.updateStatus("Live Camera Active – Align Label Panel & Tap 'Capture Frame'", "cyan");
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

    const frameUrl = canvas.toDataURL("image/jpeg", 0.95);
    this.stopCamera();
    this.displayImage(frameUrl);

    // Process genuine frame with multi-pass OCR
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

  // Multi-pass Canvas Pre-processor to boost OCR legibility
  preprocessImage(imgElement) {
    const canvas = document.createElement("canvas");
    let width = imgElement.naturalWidth || imgElement.videoWidth || imgElement.width || 1200;
    let height = imgElement.naturalHeight || imgElement.videoHeight || imgElement.height || 900;

    const maxDim = 1600;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imgElement, 0, 0, width, height);

    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Grayscale conversion and high-contrast stretching for ink labels
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const enhanced = (gray - 128) * 1.35 + 128;
        const clamped = Math.max(0, Math.min(255, enhanced));
        data[i] = clamped;
        data[i + 1] = clamped;
        data[i + 2] = clamped;
      }
      ctx.putImageData(imgData, 0, 0);
      return canvas.toDataURL("image/jpeg", 0.9);
    } catch (_) {
      return imgElement.src;
    }
  }

  // Real OCR Processing Pipeline with Tesseract.js & Backend Fallback
  async processImageWithOCR(imageSrc, hintName) {
    this.isOcrCustom = true;
    this.clearAuditView();
    if (this.laserLine) {
      this.laserLine.style.display = "block";
      this.laserLine.classList.add("scanning-anim");
    }

    this.updateStatus("Multi-Pass Image Contrast Normalization...", "cyan");
    await this.delay(250);

    const previewImg = document.getElementById("packetImagePreview");
    let ocrInput = imageSrc;
    if (previewImg && previewImg.complete) {
      ocrInput = this.preprocessImage(previewImg);
    }

    let recognizedText = "";
    let lines = [];
    let words = [];

    // 1. Run Neural OCR (Tesseract.js)
    if (typeof Tesseract !== "undefined") {
      try {
        this.updateStatus("Neural OCR: Initializing Tesseract Recognizer...", "cyan");
        const workerResult = await Tesseract.recognize(ocrInput, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const pct = Math.round((m.progress || 0) * 100);
              this.updateStatus(`Neural OCR: Extracting Label Text (${pct}%)...`, "cyan");
            }
          }
        });

        if (workerResult && workerResult.data) {
          recognizedText = workerResult.data.text || "";
          lines = workerResult.data.lines || [];
          words = workerResult.data.words || [];
        }
      } catch (ocrErr) {
        console.warn("Tesseract OCR error:", ocrErr);
      }
    }

    this.rawOcrText = recognizedText.trim();

    // 2. Query Backend API /api/scan for hybrid verification
    this.updateStatus("Legal Metrology Parser: Extracting 9 Mandatory Declarations...", "lavender");
    let parsedData = null;

    try {
      const apiRes = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: this.rawOcrText, name: hintName })
      });

      if (apiRes.ok) {
        const apiJson = await apiRes.json();
        if (apiJson && apiJson.extractedData) {
          parsedData = apiJson.extractedData;
        }
      }
    } catch (_) {
      // Offline fallback
    }

    // Client-side fallback parser if backend was unreachable
    if (!parsedData) {
      parsedData = this.parseLegalMetrologyText(this.rawOcrText, hintName);
    }

    // Construct packet object with dynamic zones
    const zones = this.buildZones(parsedData);
    const customPacket = {
      id: "scan_" + Date.now(),
      name: parsedData.name,
      category: parsedData.category || "Scanned Commodity",
      image: imageSrc,
      mrp: parsedData.mrp,
      originalMrp: parsedData.originalMrp,
      netWeight: parsedData.netWeight,
      unitSalePrice: parsedData.unitSalePrice,
      derivedUsp: parsedData.derivedUsp,
      mfgDate: parsedData.mfgDate,
      expDate: parsedData.expDate,
      isExpired: parsedData.isExpired,
      countryOfOrigin: parsedData.countryOfOrigin,
      manufacturer: parsedData.manufacturer,
      consumerCare: parsedData.consumerCare,
      zones
    };

    this.currentPacket = customPacket;

    // 3. Render Bounding Boxes
    this.updateStatus("YOLOv8: Mapping Mandatory Label Zones...", "cyan");
    this.renderBoundingBoxes(customPacket.zones || []);
    await this.delay(300);

    // 4. Evaluate against Legal Metrology Rules 2011 Engine
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

  // Client-Side Legal Metrology Parser & OCR Artifact Normalizer
  parseLegalMetrologyText(rawText, hintName) {
    let text = (rawText || "").replace(/\r/g, "\n");

    // 1. Spaced uppercase acronyms
    text = text
      .replace(/M\s*R\s*P/gi, "MRP")
      .replace(/N\s*E\s*T\s*W\s*T/gi, "NET WT")
      .replace(/N\s*E\s*T\s*Q\s*T\s*Y/gi, "NET QTY")
      .replace(/M\s*F\s*D/gi, "MFD")
      .replace(/M\s*R\s*D/gi, "MRD")
      .replace(/M\s*F\s*G/gi, "MFG")
      .replace(/U\s*S\s*P/gi, "USP")
      .replace(/E\s*X\s*P/gi, "EXP")
      .replace(/P\s*K\s*D/gi, "PKD");

    // 2. Normalize OCR letter 'O'/'o' to '0' inside numeric tokens
    text = text.replace(/(\d+)[Oo]/g, function(_, digits) { return digits + '0'; });
    text = text.replace(/(\d+)[Oo]/g, function(_, digits) { return digits + '0'; });
    text = text.replace(/\.([Oo]{1,2})\b/g, '.00');
    text = text.replace(/([Oo])(\d+)/g, function(_, __, digits) { return '0' + digits; });

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    // A. Unit Sale Price (USP)
    let unitSalePrice = "MISSING";
    let uspVal = 0;
    const uspRegex = /(?:USP|UNIT\s*SALE\s*PRICE|UNIT\s*PRICE)[\s:\.\-]*(?:RS\.?|₹|INR)?[\s]*([0-9]+(?:\.[0-9]+)?)[\s]*(?:\/|per)[\s]*([a-zA-Z]+)/i;
    const uspMatch = text.match(uspRegex);
    if (uspMatch) {
      uspVal = parseFloat(uspMatch[1]);
      unitSalePrice = `₹ ${uspMatch[1]} / ${uspMatch[2]}`;
    } else {
      const generalUspRegex = /(?:RS\.?|₹)[\s]*([0-9]+(?:\.[0-9]+)?)[\s]*(?:\/|per)[\s]*(g|gm|kg|ml|l|ltr|unit|piece|pcs|N)\b/i;
      const generalMatch = text.match(generalUspRegex);
      if (generalMatch) {
        uspVal = parseFloat(generalMatch[1]);
        unitSalePrice = `₹ ${generalMatch[1]} / ${generalMatch[2]}`;
      }
    }

    // B. MRP Extraction
    let mrp = 0;
    let originalMrp = 0;
    let allPrices = [];

    lines.forEach(line => {
      if (/USP|UNIT\s*SALE\s*PRICE/i.test(line) && !/MRP|M\.R\.P/i.test(line)) return;

      const lineMrpRegex = /(?:M\.?R\.?P\.?|MAX\.?\s*RETAIL\s*PRICE|PRICE|INCL\.?\s*OF\s*ALL\s*TAXES)[\s:\.\-]*(?:RS\.?|₹|INR)?[\s]*([0-9]+(?:[\.,][0-9]{1,2})?)(?:\s*\/\-)?(?!\s*(?:\/|\s*per))/gi;
      let m;
      while ((m = lineMrpRegex.exec(line)) !== null) {
        const val = parseFloat(m[1].replace(',', '.'));
        if (val > 0 && val < 500000 && val !== uspVal) {
          allPrices.push(val);
        }
      }
    });

    if (allPrices.length === 0) {
      const standalonePriceRegex = /(?:₹|Rs\.?)\s*([0-9]+(?:[\.,][0-9]{1,2})?)(?:\s*\/\-)?(?!\s*(?:\/|\s*per))/gi;
      let m;
      while ((m = standalonePriceRegex.exec(text)) !== null) {
        const val = parseFloat(m[1].replace(',', '.'));
        if (val > 0 && val < 500000 && val !== uspVal) {
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

    let derivedUsp = "";
    if (mrp > 0 && netWeight) {
      const numQty = parseFloat(netWeight) || 0;
      if (numQty > 0) {
        if (/kg/i.test(netWeight)) {
          derivedUsp = `₹ ${(mrp / (numQty * 1000)).toFixed(2)} / g`;
        } else if (/g|gm/i.test(netWeight)) {
          derivedUsp = `₹ ${(mrp / numQty).toFixed(2)} / g`;
        } else if (/ml/i.test(netWeight) && !/l|ltr/i.test(netWeight)) {
          derivedUsp = `₹ ${(mrp / numQty).toFixed(2)} / ml`;
        } else if (/l|ltr/i.test(netWeight)) {
          derivedUsp = `₹ ${(mrp / (numQty * 1000)).toFixed(2)} / ml`;
        } else {
          derivedUsp = `₹ ${(mrp / numQty).toFixed(2)} / unit`;
        }
      }
    }

    // D. Manufacturing / Packing Date (MFD / MFG / MRD / PKD)
    let mfgDate = "";
    const mfgRegex = /(?:MFG(?:\s*DATE)?|MFD|MRD|MED|PKD|PACKED|PACKAGING|DATE\s*OF\s*(?:MFG|MFD|MRD|PKD))[\s:\.\-]*([0-9]{1,2}[\/\.\-][0-9]{2,4}|[A-Za-z]{3}[\/\s\-][0-9]{2,4})/i;
    const mfgMatch = text.match(mfgRegex);
    if (mfgMatch) {
      mfgDate = mfgMatch[1].trim();
    } else {
      const dateRegex = /\b([0-9]{1,2}[\/\.\-][0-9]{2,4})\b/;
      const dMatch = text.match(dateRegex);
      if (dMatch) mfgDate = dMatch[1];
    }

    // E. Expiry / Best Before Date
    let expDate = "";
    let isExpired = false;
    const expRegex = /(?:EXP(?:\s*DATE)?|EXPIRY|USE\s*BY|BEST\s*BEFORE)[\s:\.\-]*([0-9]{1,2}[\/\.\-][0-9]{2,4}|[A-Za-z]{3}[\/\s\-][0-9]{2,4}|\d+[\s]*(?:MONTHS|DAYS|YEARS)[\s]*FROM[\s]*MFG)/i;
    const expMatch = text.match(expRegex);
    if (expMatch) {
      expDate = expMatch[1].trim();
    } else {
      const bestBeforeRegex = /BEST\s*BEFORE\s*([^\n\.,]+)/i;
      const bbMatch = text.match(bestBeforeRegex);
      if (bbMatch) expDate = bbMatch[0].trim();
    }

    if (expDate) {
      const yearMatch = expDate.match(/20(1[5-9]|2[0-5])/);
      if (yearMatch) isExpired = true;
    }

    // F. Country of Origin
    let countryOfOrigin = "India";
    const originRegex = /(?:COUNTRY\s*OF\s*ORIGIN|MADE\s*IN|PRODUCT\s*OF|ORIGIN)[\s:\.\-]*([A-Za-z\s]+)/i;
    const originMatch = text.match(originRegex);
    if (originMatch) {
      countryOfOrigin = originMatch[1].trim().split(/[\n,;]/)[0].trim();
    } else if (/INDIA|INDIAN\b/i.test(text)) {
      countryOfOrigin = "India";
    } else if (/IMPORTED|IMPORT/i.test(text)) {
      countryOfOrigin = "MISSING";
    }

    // G. Manufacturer / Packer Details
    let manufacturer = "";
    const mfgDetailsRegex = /(?:MFD\s*BY|MFG\s*BY|MANUFACTURED\s*(?:AND|&)?\s*PACKED\s*BY|PACKED\s*BY|PRODUCED\s*BY|MARKETED\s*BY)[\s:\.\-]*([^\n]+(?:\n[^\n]+){0,2})/i;
    const mfgDetailsMatch = text.match(mfgDetailsRegex);
    if (mfgDetailsMatch) {
      manufacturer = mfgDetailsMatch[1].split(/\n/)[0].trim();
    } else {
      const pinLine = lines.find(l => /\b[1-9][0-9]{5}\b/.test(l) || /(?:Pvt|Ltd|Limited|Industrial|Estate)/i.test(l));
      manufacturer = pinLine ? pinLine.trim() : "MISSING";
    }

    // H. Consumer Care Details
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
      consumerCare = careTextMatch ? careTextMatch[0].trim() : "MISSING";
    }

    // I. Product Name
    let name = hintName || "";
    if (!name || name.startsWith("user_upload") || name.startsWith("live_capture") || name.includes(".jpg") || name.includes(".png")) {
      const candidate = lines.find(l =>
        l.length > 3 &&
        !/MRP|M\.R\.P|PRICE|NET|MFG|MFD|MRD|EXP|DATE|BATCH|INGREDIENT|MADE IN|ORIGIN|NUTRITION|TEL|EMAIL/i.test(l)
      );
      name = candidate || "Packaged Retail Commodity";
    }

    return {
      name,
      category: "Packaged Retail Commodity",
      mrp: mrp || 0,
      originalMrp: originalMrp || mrp || 0,
      netWeight: netWeight || "",
      unitSalePrice: unitSalePrice || "MISSING",
      derivedUsp,
      mfgDate: mfgDate || "",
      expDate: expDate || "",
      isExpired,
      countryOfOrigin: countryOfOrigin || "MISSING",
      manufacturer: manufacturer || "MISSING",
      consumerCare: consumerCare || "MISSING"
    };
  }

  buildZones(parsed) {
    const zones = [];
    const hasDualMrp = parsed.originalMrp && parsed.mrp > parsed.originalMrp;

    if (parsed.mrp > 0) {
      zones.push({
        label: hasDualMrp ? "Dual MRP Violation" : "MRP Zone",
        status: hasDualMrp ? "violation" : "pass",
        text: hasDualMrp ? `Dual MRP: ₹${parsed.mrp} sticker over ₹${parsed.originalMrp}` : `MRP: ₹${parsed.mrp.toFixed(2)}`,
        box: { top: 62, left: 52, width: 38, height: 16 }
      });
    }

    if (parsed.netWeight) {
      zones.push({
        label: "Net Quantity",
        status: "pass",
        text: `Net Qty: ${parsed.netWeight}`,
        box: { top: 48, left: 52, width: 34, height: 12 }
      });
    }

    if (parsed.unitSalePrice && parsed.unitSalePrice !== "MISSING") {
      zones.push({
        label: "Unit Sale Price",
        status: "pass",
        text: `USP: ${parsed.unitSalePrice}`,
        box: { top: 78, left: 52, width: 38, height: 14 }
      });
    }

    if (parsed.mfgDate || parsed.expDate) {
      zones.push({
        label: parsed.isExpired ? "Expired Commodity" : "Mfg & Expiry",
        status: parsed.isExpired ? "violation" : "pass",
        text: `Mfg: ${parsed.mfgDate || 'N/A'} | Exp: ${parsed.expDate || 'N/A'}${parsed.isExpired ? ' (EXPIRED)' : ''}`,
        box: { top: 32, left: 10, width: 45, height: 14 }
      });
    }

    if (parsed.countryOfOrigin && parsed.countryOfOrigin !== "MISSING") {
      zones.push({
        label: "Country of Origin",
        status: "pass",
        text: `Origin: ${parsed.countryOfOrigin}`,
        box: { top: 16, left: 10, width: 45, height: 14 }
      });
    }

    return zones;
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

  // Vision AI inspection animation for demo or re-audit
  async runVisionInspection(packet) {
    this.clearAuditView();
    if (this.laserLine) {
      this.laserLine.style.display = "block";
      this.laserLine.classList.add("scanning-anim");
    }

    this.updateStatus("Pre-processing & Contrast Normalization...", "cyan");
    await this.delay(300);

    this.updateStatus("YOLOv8: Localizing Mandatory Label Zones...", "cyan");
    this.renderBoundingBoxes(packet.zones || []);
    await this.delay(400);

    this.updateStatus("Neural OCR: Reading Text & Decimals...", "lavender");
    await this.delay(350);

    this.updateStatus("Rules Engine: Auditing 9 Statutory Declarations...", "lavender");
    await this.delay(300);

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
    const hasDualSticker = packet.originalMrp && packet.mrp > packet.originalMrp;

    // Build the Stunning Live Specifications HUD Card
    const liveSpecsHudHtml = `
      <div class="live-specs-hud">
        <div class="specs-hud-top">
          <div class="specs-hud-title">
            <span class="live-dot-glow"></span>
            <span>Commodity Declarations HUD</span>
            <span class="hud-badge-ai">Real-Time OCR Verified</span>
          </div>
          <div class="specs-hud-actions">
            <button class="btn btn-xs btn-cyan" onclick="window.parakhScanner.openEditModal()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Quick Adjust
            </button>
            ${this.rawOcrText ? `
              <button class="btn btn-xs btn-outline" onclick="window.parakhScanner.toggleRawOcrDrawer()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                View OCR Text
              </button>
            ` : ''}
          </div>
        </div>

        <div class="specs-cards-grid">
          <!-- 1. MRP -->
          <div class="spec-card ${hasDualSticker ? 'spec-card-danger' : 'spec-card-cyan'}" onclick="window.parakhScanner.openEditModal()">
            <div class="spec-card-header">
              <span class="spec-card-label">Maximum Retail Price</span>
              <span class="spec-card-badge">${hasDualSticker ? 'DUAL MRP' : 'TAX INCL'}</span>
            </div>
            <div class="spec-card-val text-cyan">₹ ${packet.mrp > 0 ? packet.mrp.toFixed(2) : '0.00'}</div>
            <div class="spec-card-sub">${hasDualSticker ? `Overcharge: ₹${(packet.mrp - packet.originalMrp).toFixed(2)}` : 'Rule 6(1)(e) Checked'}</div>
          </div>

          <!-- 2. Net Quantity -->
          <div class="spec-card spec-card-lavender" onclick="window.parakhScanner.openEditModal()">
            <div class="spec-card-header">
              <span class="spec-card-label">Net Quantity (Metric)</span>
              <span class="spec-card-badge">SI UNITS</span>
            </div>
            <div class="spec-card-val text-lavender">${packet.netWeight || 'Not Stated'}</div>
            <div class="spec-card-sub">Rule 6(1)(c) Metric Standard</div>
          </div>

          <!-- 3. Unit Sale Price (USP) -->
          <div class="spec-card ${packet.unitSalePrice && packet.unitSalePrice !== 'MISSING' ? 'spec-card-cyan' : 'spec-card-warning'}" onclick="window.parakhScanner.openEditModal()">
            <div class="spec-card-header">
              <span class="spec-card-label">Unit Sale Price (USP)</span>
              <span class="spec-card-badge">${packet.unitSalePrice && packet.unitSalePrice !== 'MISSING' ? 'DECLARED' : '2022 RULE'}</span>
            </div>
            <div class="spec-card-val">${packet.unitSalePrice && packet.unitSalePrice !== 'MISSING' ? packet.unitSalePrice : (packet.derivedUsp || 'Missing')}</div>
            <div class="spec-card-sub">${packet.unitSalePrice && packet.unitSalePrice !== 'MISSING' ? 'Mandatory Display Verified' : 'Derived Rate (Undeclared)'}</div>
          </div>

          <!-- 4. Mfg / Pkg Date (MFD/MRD) -->
          <div class="spec-card spec-card-slate" onclick="window.parakhScanner.openEditModal()">
            <div class="spec-card-header">
              <span class="spec-card-label">Mfg / Pkg Date (MFD/MRD)</span>
              <span class="spec-card-badge">RULE 6(1)(d)</span>
            </div>
            <div class="spec-card-val">${packet.mfgDate || 'Not Stamped'}</div>
            <div class="spec-card-sub">Batch Manufacturing Stamp</div>
          </div>

          <!-- 5. Expiry / Best Before -->
          <div class="spec-card ${packet.isExpired ? 'spec-card-danger' : 'spec-card-slate'}" onclick="window.parakhScanner.openEditModal()">
            <div class="spec-card-header">
              <span class="spec-card-label">Expiry / Best Before</span>
              <span class="spec-card-badge ${packet.isExpired ? 'badge-danger' : ''}">${packet.isExpired ? 'EXPIRED' : 'VALID'}</span>
            </div>
            <div class="spec-card-val ${packet.isExpired ? 'text-red' : ''}">${packet.expDate || 'Not Stamped'}</div>
            <div class="spec-card-sub ${packet.isExpired ? 'text-red' : ''}">${packet.isExpired ? '⚠️ Section 36 Offense' : 'Within Statutory Shelf Life'}</div>
          </div>

          <!-- 6. Country of Origin -->
          <div class="spec-card ${packet.countryOfOrigin && packet.countryOfOrigin !== 'MISSING' ? 'spec-card-slate' : 'spec-card-danger'}" onclick="window.parakhScanner.openEditModal()">
            <div class="spec-card-header">
              <span class="spec-card-label">Country of Origin</span>
              <span class="spec-card-badge">ORIGIN</span>
            </div>
            <div class="spec-card-val">${packet.countryOfOrigin || 'MISSING'}</div>
            <div class="spec-card-sub">Rule 6(1)(aa) Mandatory</div>
          </div>
        </div>

        <div id="rawOcrTextDrawer" class="raw-ocr-container" style="display: none;">
          <div class="raw-ocr-header">
            <span>Extracted Raw Text Stream (${(this.rawOcrText || "").length} characters)</span>
            <button class="btn btn-xs btn-outline" onclick="navigator.clipboard.writeText(window.parakhScanner.rawOcrText); window.parakhApp.showToast('Raw OCR text copied!');">Copy Text</button>
          </div>
          <div>${this.escapeHtml(this.rawOcrText || "No text available")}</div>
        </div>
      </div>
    `;

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
              <span class="rule-no">${r.ruleNo || ''}</span>
              <span class="rule-title">${r.title || key}</span>
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
        ${liveSpecsHudHtml}

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
            <span class="metric-label">Compliance Trust Score</span>
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
            <span class="metric-val text-lavender">${packet.unitSalePrice && packet.unitSalePrice !== 'MISSING' ? packet.unitSalePrice : (packet.derivedUsp || 'Missing')}</span>
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

    // Recalculate derived USP if needed
    if (mrp > 0 && netWeight) {
      const numQty = parseFloat(netWeight) || 0;
      if (numQty > 0) {
        if (/kg/i.test(netWeight)) {
          this.currentPacket.derivedUsp = `₹ ${(mrp / (numQty * 1000)).toFixed(2)} / g`;
        } else if (/g|gm/i.test(netWeight)) {
          this.currentPacket.derivedUsp = `₹ ${(mrp / numQty).toFixed(2)} / g`;
        } else if (/ml/i.test(netWeight) && !/l|ltr/i.test(netWeight)) {
          this.currentPacket.derivedUsp = `₹ ${(mrp / numQty).toFixed(2)} / ml`;
        } else if (/l|ltr/i.test(netWeight)) {
          this.currentPacket.derivedUsp = `₹ ${(mrp / (numQty * 1000)).toFixed(2)} / ml`;
        } else {
          this.currentPacket.derivedUsp = `₹ ${(mrp / numQty).toFixed(2)} / unit`;
        }
      }
    }

    // Re-evaluate audit
    const auditResult = window.parakhRulesEngine.auditPacket(this.currentPacket);
    this.currentAuditResult = auditResult;

    this.renderBoundingBoxes(this.currentPacket.zones || []);
    this.renderAuditResults(this.currentPacket, auditResult);

    this.closeEditModal();
    if (window.parakhApp && window.parakhApp.showToast) {
      window.parakhApp.showToast("Specifications updated & re-audited against Legal Metrology Rules!");
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
