// LabelScan Backend API: /api/scan
// High-Precision Legal Metrology Parser + Server-Side Tesseract OCR
// Handles both: (1) pre-extracted OCR text, (2) raw base64 image for independent server-side OCR

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) {}
    }

    let rawText = (body && body.text) ? body.text.trim() : '';
    const imageData = (body && body.image) ? body.image : null;
    const productName = (body && body.name) ? body.name : 'Packaged Commodity';

    let serverOcrText = '';

    // === SERVER-SIDE OCR: Run Tesseract if client OCR text is empty/minimal ===
    if ((!rawText || rawText.length < 20) && imageData) {
      try {
        const Tesseract = require('tesseract.js');
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const imgBuffer = Buffer.from(base64Data, 'base64');

        const { data: { text } } = await Tesseract.recognize(imgBuffer, 'eng', {
          tessedit_pageseg_mode: '11', // SPARSE_TEXT - best for product labels
        });
        serverOcrText = text || '';
        if (serverOcrText.trim().length > rawText.length) {
          rawText = serverOcrText.trim();
        }
      } catch (ocrErr) {
        console.warn('[Server OCR] Tesseract error:', ocrErr.message);
      }
    }

    const parsed = parseLegalMetrologyText(rawText, productName);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      serverOcrText: serverOcrText ? serverOcrText.substring(0, 300) : undefined,
      extractedData: parsed
    }));
  } catch (err) {
    console.error('[scan.js] Handler error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: err.message }));
  }
};

// ================================================================
// OCR Artifact Normalizer — corrects common Tesseract misreads
// ================================================================
function normalizeOcrArtifacts(rawText) {
  if (!rawText) return '';

  let text = rawText;

  // Fix spaced-out acronyms
  text = text
    .replace(/M\s*R\s*P\.?/gi, 'MRP')
    .replace(/N\s*E\s*T\s*W\s*T\.?/gi, 'NET WT')
    .replace(/N\s*E\s*T\s*Q\s*T\s*Y\.?/gi, 'NET QTY')
    .replace(/N\s*E\s*T\s*W\s*E\s*I\s*G\s*H\s*T\.?/gi, 'NET WEIGHT')
    .replace(/M\s*F\s*D\.?/gi, 'MFD')
    .replace(/M\s*R\s*D\.?/gi, 'MRD')
    .replace(/M\s*F\s*G\.?/gi, 'MFG')
    .replace(/U\s*S\s*P\.?/gi, 'USP')
    .replace(/E\s*X\s*P\.?/gi, 'EXP')
    .replace(/P\s*K\s*D\.?/gi, 'PKD')
    .replace(/B\s*E\s*S\s*T\s*B\s*E\s*F\s*O\s*R\s*E/gi, 'BEST BEFORE');

  // Fix OCR 'O'/'o' -> '0' in numeric contexts
  text = text.replace(/(\d)[Oo](\d)/g, '$10$2');
  text = text.replace(/(\d+)[Oo](?!\w)/g, '$10');
  text = text.replace(/(?<!\w)[Oo](\d+)/g, '0$1');
  text = text.replace(/\.([Oo])\b/g, '.0');

  // Normalize rupee symbols
  text = text.replace(/Rs\.?\s*/gi, '₹').replace(/INR\s*/gi, '₹');

  return text;
}

// ================================================================
// Main Legal Metrology Parser
// ================================================================
function parseLegalMetrologyText(rawText, hintName) {
  const normalizedText = normalizeOcrArtifacts(rawText);
  const lines = normalizedText.split('\n').map(l => l.trim()).filter(Boolean);

  // ── A. MRP ─────────────────────────────────────────────────────────────
  let mrp = 0;
  let originalMrp = 0;
  let allPrices = [];
  let uspVal = 0;

  // First extract USP to exclude from MRP candidates
  const uspQuickMatch = normalizedText.match(/(?:USP|UNIT\s*SALE\s*PRICE|UNIT\s*PRICE)[\s:.\-]*(?:₹)?[\s]*([0-9]+(?:\.[0-9]+)?)[\s]*(?:\/|per)/i);
  if (uspQuickMatch) uspVal = parseFloat(uspQuickMatch[1]);

  const mrpPatterns = [
    /M\.?R\.?P\.?\s*[:\-]?\s*₹?\s*([0-9]+(?:[.,][0-9]{1,2})?)(?:\s*\/\-)?/gi,
    /MAX(?:IMUM)?\s+RETAIL\s+PRICE\s*[:\-]?\s*₹?\s*([0-9]+(?:[.,][0-9]{1,2})?)/gi,
    /INCL\.?\s*(?:OF\s*)?ALL\s*TAXES\s*[:\-]?\s*₹?\s*([0-9]+(?:[.,][0-9]{1,2})?)/gi,
    /\bPRICE\b\s*[:\-]?\s*₹\s*([0-9]+(?:[.,][0-9]{1,2})?)/gi,
  ];

  for (const pattern of mrpPatterns) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(normalizedText)) !== null) {
      const val = parseFloat(m[1].replace(',', '.'));
      if (val > 0 && val < 100000 && val !== uspVal) allPrices.push(val);
    }
    if (allPrices.length > 0) break;
  }

  // Fallback: standalone ₹ amounts on non-USP lines
  if (allPrices.length === 0) {
    for (const line of lines) {
      if (/USP|unit\s*sale|\/\s*g\b|\/\s*ml\b|\/\s*kg\b|per\s+g|per\s+ml/i.test(line)) continue;
      const m = line.match(/₹\s*([0-9]+(?:[.,][0-9]{1,2})?)(?:\s*\/\-)?/);
      if (m) {
        const val = parseFloat(m[1].replace(',', '.'));
        if (val > 0 && val < 100000 && val !== uspVal) allPrices.push(val);
      }
    }
  }

  if (allPrices.length === 1) {
    mrp = allPrices[0]; originalMrp = allPrices[0];
  } else if (allPrices.length > 1) {
    const uniquePrices = [...new Set(allPrices)].sort((a, b) => a - b);
    mrp = uniquePrices[uniquePrices.length - 1];
    originalMrp = uniquePrices.length > 1 ? uniquePrices[0] : mrp;
  }

  // ── B. Net Quantity ─────────────────────────────────────────────────────
  let netWeight = '';
  const netQtyPatterns = [
    /NET\s*(?:WT\.?|WEIGHT|QTY\.?|QUANTITY|CONTENTS?|VOL\.?|VOLUME)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:g|gm|grams?|kg|ml|l|ltr|litres?|liters?))/i,
    /NETTO\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:g|gm|kg|ml|l|ltr))/i,
  ];
  for (const p of netQtyPatterns) {
    const m = normalizedText.match(p);
    if (m && m[1]) { netWeight = m[1].trim(); break; }
  }
  if (!netWeight) {
    const standaloneWt = normalizedText.match(/\b([0-9]+(?:\.[0-9]+)?\s*(?:g|gm|grams?|kg|ml|l\b|ltr|litres?|liters?))\b/i);
    if (standaloneWt) netWeight = standaloneWt[1].trim();
  }

  // ── C. Unit Sale Price (USP) ────────────────────────────────────────────
  let unitSalePrice = 'MISSING';
  const uspExplicit = normalizedText.match(/(?:USP|UNIT\s*SALE\s*PRICE|UNIT\s*PRICE)\s*[:\-]?\s*₹?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:\/|per)\s*([a-zA-Z]+)/i);
  if (uspExplicit) {
    uspVal = parseFloat(uspExplicit[1]);
    unitSalePrice = `₹ ${uspExplicit[1]} / ${uspExplicit[2]}`;
  } else {
    const uspInline = normalizedText.match(/₹\s*([0-9]+(?:\.[0-9]+)?)\s*(?:\/|per)\s*(g|gm|kg|ml|l|ltr)\b/i);
    if (uspInline) {
      uspVal = parseFloat(uspInline[1]);
      unitSalePrice = `₹ ${uspInline[1]} / ${uspInline[2]}`;
    }
  }

  // Derive USP from MRP / Net Qty
  let derivedUsp = '';
  if (mrp > 0 && netWeight) {
    const numQty = parseFloat(netWeight) || 0;
    if (numQty > 0) {
      if (/kg/i.test(netWeight))                                  derivedUsp = `₹ ${(mrp / (numQty * 1000)).toFixed(2)} / g`;
      else if (/g|gm/i.test(netWeight))                           derivedUsp = `₹ ${(mrp / numQty).toFixed(2)} / g`;
      else if (/ml/i.test(netWeight) && !/ltr|litre/i.test(netWeight)) derivedUsp = `₹ ${(mrp / numQty).toFixed(2)} / ml`;
      else if (/l\b|ltr|litre/i.test(netWeight))                  derivedUsp = `₹ ${(mrp / (numQty * 1000)).toFixed(2)} / ml`;
      else                                                         derivedUsp = `₹ ${(mrp / numQty).toFixed(2)} / unit`;
    }
  }

  // ── D. Manufacturing / Packing Date ─────────────────────────────────────
  let mfgDate = '';
  const mfgDatePatterns = [
    /(?:MFG(?:\s*DATE)?|MFD|MRD|MED|PKD|PACKED|MFGD|Mfd\.?|Mfg\.?)\s*[:\-.\/]?\s*([0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
    /(?:MFG(?:\s*DATE)?|MFD|MRD|PKD|Mfd\.?|Mfg\.?)\s*[:\-.]?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*[0-9]{2,4})/i,
    /DATE\s*OF\s*(?:MFG|MFD|MFRD|PKG|PACKING|MANUFACTURE)\s*[:\-.]?\s*([0-9]{1,2}[\/\-][0-9]{2,4})/i,
  ];
  for (const p of mfgDatePatterns) {
    const m = normalizedText.match(p);
    if (m && m[1]) { mfgDate = m[1].trim(); break; }
  }

  // ── E. Expiry / Best Before ──────────────────────────────────────────────
  let expDate = '';
  let isExpired = false;
  const expDatePatterns = [
    /(?:EXP(?:IRY)?(?:\s*DATE)?|USE\s*BY|BEST\s*BEFORE|BB\s*[:\-]?)\s*[:\-.]?\s*([0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
    /(?:EXP(?:IRY)?(?:\s*DATE)?|USE\s*BY|BEST\s*BEFORE)\s*[:\-.]?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*[0-9]{2,4})/i,
    /(?:EXP(?:IRY)?|BEST\s*BEFORE)\s*[:\-.]?\s*([0-9]+\s*(?:MONTHS?|DAYS?|YEARS?)\s*(?:FROM\s*(?:MFG|DATE\s*OF\s*MFG))?)/i,
  ];
  for (const p of expDatePatterns) {
    const m = normalizedText.match(p);
    if (m && m[1]) { expDate = m[1].trim(); break; }
  }
  if (expDate) {
    const yearMatch = expDate.match(/20(1[5-9]|2[0-5])\b/);
    if (yearMatch) isExpired = true;
  }

  // ── F. Country of Origin ─────────────────────────────────────────────────
  let countryOfOrigin = 'India';
  const originMatch = normalizedText.match(/(?:COUNTRY\s*OF\s*ORIGIN|MADE\s*IN|PRODUCT\s*OF|ORIGIN)\s*[:\-]?\s*([A-Za-z][A-Za-z\s]{1,30}?)(?:\n|,|;|$)/im);
  if (originMatch && originMatch[1]) {
    const c = originMatch[1].trim().replace(/[,.;]+$/, '').trim();
    if (c.length > 1 && c.length < 40) countryOfOrigin = c;
  } else if (/IMPORTED|IMPORT FROM/i.test(normalizedText)) {
    countryOfOrigin = 'MISSING';
  }

  // ── G. Manufacturer / Packer ─────────────────────────────────────────────
  let manufacturer = 'MISSING';
  const mfrMatch = normalizedText.match(/(?:MFD\s*BY|MFG\s*BY|MANUFACTURED\s*(?:AND|&)?\s*PACKED\s*BY|PACKED\s*BY|PRODUCED\s*BY|MARKETED\s*BY)\s*[:\-]?\s*([^\n]{5,80})/i);
  if (mfrMatch && mfrMatch[1]) {
    manufacturer = mfrMatch[1].trim();
  } else {
    const pinLine = lines.find(l => /\b[1-9][0-9]{5}\b/.test(l) || /(?:Pvt\.?\s*Ltd|Private\s*Limited|Industries|Foods|Enterprises)/i.test(l));
    if (pinLine) manufacturer = pinLine.trim();
  }

  // ── H. Consumer Care ─────────────────────────────────────────────────────
  let consumerCare = 'MISSING';
  const phoneMatch = normalizedText.match(/(?:1800[-\s]?[0-9]{3}[-\s]?[0-9]{3,4}|[6-9][0-9]{9}|\+91[-\s]?[0-9]{10})/);
  const emailMatch = normalizedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (phoneMatch || emailMatch) {
    const parts = [];
    if (phoneMatch) parts.push('Tel: ' + phoneMatch[0]);
    if (emailMatch) parts.push('Email: ' + emailMatch[0]);
    consumerCare = parts.join(' | ');
  } else {
    const careText = normalizedText.match(/(?:CUSTOMER|CONSUMER)\s*(?:CARE|SERVICE|FEEDBACK|HELPLINE)[^\n]*/i);
    if (careText) consumerCare = careText[0].trim();
  }

  // ── I. Product Name ──────────────────────────────────────────────────────
  let name = hintName || '';
  const isAutoName = !name || /user.upload|live.capture|scan_|\.jpg|\.png|\.jpeg|\.webp/i.test(name);
  if (isAutoName) {
    const candidate = lines.find(l =>
      l.length > 3 && l.length < 80 &&
      !/MRP|M\.R\.P|₹|NET|MFG|MFD|MRD|EXP|BATCH|INGREDIENT|MADE IN|ORIGIN|NUTRITION|TEL|EMAIL|FSSAI|LICENSE|PACKED|ADDRESS/i.test(l)
    );
    name = candidate || 'Packaged Retail Commodity';
  }

  return {
    name,
    category: 'Packaged Retail Commodity',
    mrp: mrp || 0,
    originalMrp: originalMrp || mrp || 0,
    netWeight: netWeight || '',
    unitSalePrice: unitSalePrice || 'MISSING',
    derivedUsp,
    mfgDate: mfgDate || '',
    expDate: expDate || '',
    isExpired,
    countryOfOrigin: countryOfOrigin || 'India',
    manufacturer: manufacturer || 'MISSING',
    consumerCare: consumerCare || 'MISSING'
  };
}
