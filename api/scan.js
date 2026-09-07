// LabelScan Backend API: /api/scan
// High-Precision Legal Metrology Parser & OCR Artifact Normalizer

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

    const rawText = (body && body.text) ? body.text : "";
    const productName = (body && body.name) ? body.name : "Packaged Commodity";

    const parsed = parseLegalMetrologyText(rawText, productName);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      extractedData: parsed
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: err.message }));
  }
};

function normalizeOcrArtifacts(rawText) {
  if (!rawText) return "";

  // 1. Spaced uppercase acronyms
  let text = rawText
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
  // E.g. '2O.OO' -> '20.00', '5Og' -> '50g', '15O/-' -> '150/-'
  text = text.replace(/(\d+)[Oo]/g, function(_, digits) { return digits + '0'; });
  text = text.replace(/(\d+)[Oo]/g, function(_, digits) { return digits + '0'; });
  text = text.replace(/\.([Oo]{1,2})\b/g, '.00');
  text = text.replace(/([Oo])(\d+)/g, function(_, __, digits) { return '0' + digits; });

  return text;
}

function parseLegalMetrologyText(rawText, hintName) {
  const normalizedText = normalizeOcrArtifacts(rawText);
  const lines = normalizedText.split("\n").map(l => l.trim()).filter(Boolean);

  // A. Unit Sale Price (USP)
  let unitSalePrice = "MISSING";
  let uspVal = 0;
  const uspRegex = /(?:USP|UNIT\s*SALE\s*PRICE|UNIT\s*PRICE)[\s:\.\-]*(?:RS\.?|₹|INR)?[\s]*([0-9]+(?:\.[0-9]+)?)[\s]*(?:\/|per)[\s]*([a-zA-Z]+)/i;
  const uspMatch = normalizedText.match(uspRegex);
  if (uspMatch) {
    uspVal = parseFloat(uspMatch[1]);
    unitSalePrice = `₹ ${uspMatch[1]} / ${uspMatch[2]}`;
  } else {
    const generalUspRegex = /(?:RS\.?|₹)[\s]*([0-9]+(?:\.[0-9]+)?)[\s]*(?:\/|per)[\s]*(g|gm|kg|ml|l|ltr|unit|piece|pcs|N)\b/i;
    const generalMatch = normalizedText.match(generalUspRegex);
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
    while ((m = standalonePriceRegex.exec(normalizedText)) !== null) {
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
  const netMatch = normalizedText.match(netQtyRegex);
  if (netMatch) {
    netWeight = netMatch[1].trim();
  } else {
    const standaloneWeightRegex = /\b([0-9]+(?:\.[0-9]+)?[\s]*(?:g|gm|grams?|kg|ml|l|ltr|litres?|units?|pcs?|pieces?|N))\b/i;
    const standaloneMatch = normalizedText.match(standaloneWeightRegex);
    if (standaloneMatch) {
      netWeight = standaloneMatch[1].trim();
    }
  }

  // Calculate theoretical statutory USP
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
  const mfgMatch = normalizedText.match(mfgRegex);
  if (mfgMatch) {
    mfgDate = mfgMatch[1].trim();
  } else {
    const dateRegex = /\b([0-9]{1,2}[\/\.\-][0-9]{2,4})\b/;
    const dMatch = normalizedText.match(dateRegex);
    if (dMatch) mfgDate = dMatch[1];
  }

  // E. Expiry / Best Before Date
  let expDate = "";
  let isExpired = false;
  const expRegex = /(?:EXP(?:\s*DATE)?|EXPIRY|USE\s*BY|BEST\s*BEFORE)[\s:\.\-]*([0-9]{1,2}[\/\.\-][0-9]{2,4}|[A-Za-z]{3}[\/\s\-][0-9]{2,4}|\d+[\s]*(?:MONTHS|DAYS|YEARS)[\s]*FROM[\s]*MFG)/i;
  const expMatch = normalizedText.match(expRegex);
  if (expMatch) {
    expDate = expMatch[1].trim();
  } else {
    const bestBeforeRegex = /BEST\s*BEFORE\s*([^\n\.,]+)/i;
    const bbMatch = normalizedText.match(bestBeforeRegex);
    if (bbMatch) expDate = bbMatch[0].trim();
  }

  if (expDate) {
    const yearMatch = expDate.match(/20(1[5-9]|2[0-5])/);
    if (yearMatch) isExpired = true;
  }

  // F. Country of Origin
  let countryOfOrigin = "India";
  const originRegex = /(?:COUNTRY\s*OF\s*ORIGIN|MADE\s*IN|PRODUCT\s*OF|ORIGIN)[\s:\.\-]*([A-Za-z\s]+)/i;
  const originMatch = normalizedText.match(originRegex);
  if (originMatch) {
    countryOfOrigin = originMatch[1].trim().split(/[\n,;]/)[0].trim();
  } else if (/INDIA|INDIAN\b/i.test(normalizedText)) {
    countryOfOrigin = "India";
  } else if (/IMPORTED|IMPORT/i.test(normalizedText)) {
    countryOfOrigin = "MISSING";
  }

  // G. Manufacturer / Packer Details
  let manufacturer = "";
  const mfgDetailsRegex = /(?:MFD\s*BY|MFG\s*BY|MANUFACTURED\s*(?:AND|&)?\s*PACKED\s*BY|PACKED\s*BY|PRODUCED\s*BY|MARKETED\s*BY)[\s:\.\-]*([^\n]+(?:\n[^\n]+){0,2})/i;
  const mfgDetailsMatch = normalizedText.match(mfgDetailsRegex);
  if (mfgDetailsMatch) {
    manufacturer = mfgDetailsMatch[1].split(/\n/)[0].trim();
  } else {
    const pinLine = lines.find(l => /\b[1-9][0-9]{5}\b/.test(l) || /(?:Pvt|Ltd|Limited|Industrial|Estate)/i.test(l));
    manufacturer = pinLine ? pinLine.trim() : "MISSING";
  }

  // H. Consumer Care Details
  let consumerCare = "";
  const carePhoneMatch = normalizedText.match(/(?:1800[-\s]?[0-9]{3}[-\s]?[0-9]{3,4}|[0-9]{10,11}|\+91[-\s]?[0-9]{10})/);
  const careEmailMatch = normalizedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (carePhoneMatch || careEmailMatch) {
    const parts = [];
    if (carePhoneMatch) parts.push("Tel: " + carePhoneMatch[0]);
    if (careEmailMatch) parts.push("Email: " + careEmailMatch[0]);
    consumerCare = parts.join(" | ");
  } else {
    const careTextMatch = normalizedText.match(/(?:CUSTOMER|CONSUMER)\s*(?:CARE|SERVICE|FEEDBACK|HELPLINE)[^\n]*/i);
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
