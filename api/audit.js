// LabelScan Backend API: /api/audit
// Audits commodities against Legal Metrology Rules 2011 & Section 36 Penalty Engine

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

    const packet = body && body.packet ? body.packet : body;
    if (!packet) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing commodity packet data' }));
    }

    const results = {};
    let totalScore = 0;
    const violations = [];
    const warnings = [];
    let penaltiesIncurred = 0;

    // 1. Rule 6(1)(a) - Manufacturer
    const mfgText = (packet.manufacturer || "").trim();
    if (!mfgText || mfgText === "MISSING" || mfgText.length < 10) {
      results.rule_6_1_a = { status: "FAIL", score: 0, penalty: 25000, message: "Missing or incomplete manufacturer/packer physical address." };
      violations.push("Manufacturer/Packer address omitted (Rule 6(1)(a))");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_a = { status: "PASS", score: 10, value: mfgText, message: "Valid physical manufacturer address identified." };
      totalScore += 10;
    }

    // 2. Rule 6(1)(aa) - Country of Origin
    const origin = (packet.countryOfOrigin || "").trim();
    if (!origin || origin === "MISSING") {
      results.rule_6_1_aa = { status: "FAIL", score: 0, penalty: 25000, message: "Mandatory Country of Origin omitted." };
      violations.push("Mandatory Country of Origin NOT declared (Rule 6(1)(aa))");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_aa = { status: "PASS", score: 10, value: origin, message: `Country of Origin declared: ${origin}.` };
      totalScore += 10;
    }

    // 3. Rule 6(1)(b) - Generic Name
    const genericName = (packet.name || "").trim();
    if (!genericName) {
      results.rule_6_1_b = { status: "FAIL", score: 0, penalty: 25000, message: "Generic product identity missing." };
      violations.push("Generic product identity missing");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_b = { status: "PASS", score: 10, value: genericName, message: `Product identity verified: "${genericName}".` };
      totalScore += 10;
    }

    // 4. Rule 6(1)(c) - Net Quantity
    const netWeight = (packet.netWeight || "").trim();
    if (!netWeight || netWeight === "MISSING") {
      results.rule_6_1_c = { status: "FAIL", score: 0, penalty: 25000, message: "Net quantity not declared on display panel." };
      violations.push("Net quantity omitted (Rule 6(1)(c))");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_c = { status: "PASS", score: 15, value: netWeight, message: `Metric net quantity verified: ${netWeight}.` };
      totalScore += 15;
    }

    // 5. Rule 6(1)(d) - Mfg Date
    const mfgDate = (packet.mfgDate || "").trim();
    if (!mfgDate || mfgDate === "MISSING") {
      results.rule_6_1_d_mfg = { status: "FAIL", score: 0, penalty: 25000, message: "Month & Year of manufacture omitted." };
      violations.push("Manufacturing date missing (Rule 6(1)(d))");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_d_mfg = { status: "PASS", score: 10, value: mfgDate, message: `Mfg/Pkg Date declared: ${mfgDate}.` };
      totalScore += 10;
    }

    // 6. Expiry Date & Shelf Life
    const isExpired = !!packet.isExpired;
    const expDate = (packet.expDate || "").trim();
    if (isExpired) {
      results.rule_6_1_d_exp = { status: "FAIL", score: 0, penalty: 50000, message: `CRITICAL: Commodity is past expiration date (${expDate}).` };
      violations.push(`Product EXPIRED (${expDate}) - Sale prohibited under CPA 2019`);
      penaltiesIncurred += 50000;
    } else {
      results.rule_6_1_d_exp = { status: "PASS", score: 10, value: expDate || "Valid Shelf Life", message: `Valid shelf life verified: ${expDate || 'Current'}.` };
      totalScore += 10;
    }

    // 7. Rule 6(1)(e) - MRP & Dual Stickering
    const mrp = Number(packet.mrp) || 0;
    const originalMrp = Number(packet.originalMrp) || mrp;
    const hasDualSticker = originalMrp > 0 && mrp > originalMrp;

    if (hasDualSticker) {
      const illegalMarkup = (mrp - originalMrp).toFixed(2);
      results.rule_6_1_e = { status: "FAIL", score: 0, penalty: 50000, message: `DUAL MRP STICKER DETECTED: ₹${mrp} sticker over ₹${originalMrp} (Illegal surcharge: ₹${illegalMarkup}).` };
      violations.push(`Dual MRP sticker: ₹${illegalMarkup} overcharge on factory printed price`);
      penaltiesIncurred += 50000;
    } else if (mrp <= 0) {
      results.rule_6_1_e = { status: "FAIL", score: 0, penalty: 25000, message: "Maximum Retail Price (MRP) omitted." };
      violations.push("MRP not declared (Rule 6(1)(e))");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_e = { status: "PASS", score: 15, value: `₹${mrp.toFixed(2)}`, message: `Printed MRP ₹${mrp.toFixed(2)} (incl. all taxes) verified.` };
      totalScore += 15;
    }

    // 8. Rule 6(1)(k) - Unit Sale Price (USP)
    const usp = (packet.unitSalePrice || "").trim();
    if (!usp || usp === "MISSING") {
      results.rule_6_1_k = { status: "FAIL", score: 0, penalty: 25000, message: `MANDATORY USP OMITTED: Pre-packaged goods must display per-gram/per-ml Unit Sale Price (2022 Amendment).` };
      violations.push("Mandatory Unit Sale Price (USP) omitted (Rule 6(1)(k))");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_k = { status: "PASS", score: 15, value: usp, message: `Unit Sale Price declared: ${usp}.` };
      totalScore += 15;
    }

    // 9. Rule 6(1)(f) - Consumer Care
    const care = (packet.consumerCare || "").trim();
    if (!care || care === "MISSING" || care.length < 8) {
      results.rule_6_1_f = { status: "FAIL", score: 0, penalty: 25000, message: "No domestic consumer helpline telephone or email listed." };
      violations.push("Consumer Care details omitted (Rule 6(1)(f))");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_f = { status: "PASS", score: 10, value: care, message: `Grievance mechanism verified: ${care}.` };
      totalScore += 10;
    }

    let verdict = "COMPLIANT";
    let verdictClass = "status-pass";
    if (violations.length >= 2 || hasDualSticker || isExpired) {
      verdict = "CRITICAL VIOLATION";
      verdictClass = "status-danger";
    } else if (violations.length === 1 || warnings.length > 0) {
      verdict = "NON-COMPLIANT";
      verdictClass = "status-warning";
    }

    const auditResponse = {
      success: true,
      packetName: packet.name,
      verdict,
      verdictClass,
      complianceScore: Math.min(100, Math.max(10, totalScore)),
      violations,
      warnings,
      penaltiesIncurred,
      ruleResults: results,
      totalRulesChecked: 9,
      passedRulesCount: Object.values(results).filter(r => r.status === "PASS").length,
      failedRulesCount: Object.values(results).filter(r => r.status === "FAIL").length
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(auditResponse));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: err.message }));
  }
};
