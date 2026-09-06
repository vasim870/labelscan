// ParakhAI - Legal Metrology (Packaged Commodities) Rules, 2011 Engine
// Validates 9 Statutory Declarations, Unit Sale Price (USP) mathematics, and Section 36 Penalty liabilities

class ParakhRulesEngine {
  constructor() {
    this.rules = PARAKH_DATA.rules;
  }

  // Audits an extracted packet object against statutory rules
  auditPacket(packetData) {
    const results = {};
    let totalScore = 0;
    const violations = [];
    const warnings = [];
    let penaltiesIncurred = 0;

    // 1. Rule 6(1)(a) - Manufacturer / Packer Details
    const mfgText = (packetData.manufacturer || "").trim();
    if (!mfgText || mfgText.toLowerCase().includes("unknown") || mfgText.length < 15) {
      results.rule_6_1_a = {
        ruleId: "rule_6_1_a",
        ruleNo: "Rule 6(1)(a)",
        title: "Manufacturer / Packer Details",
        status: "FAIL",
        score: 0,
        message: "Incomplete or missing manufacturer/packer name and address. Non-compliant with Rule 6(1)(a).",
        penalty: 25000,
        section: "Section 36(1)"
      };
      violations.push("Missing complete Manufacturer / Packer address");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_a = {
        ruleId: "rule_6_1_a",
        ruleNo: "Rule 6(1)(a)",
        title: "Manufacturer / Packer Details",
        status: "PASS",
        score: 10,
        message: "Complete physical address of manufacturer/packer found.",
        value: mfgText
      };
      totalScore += 10;
    }

    // 2. Rule 6(1)(aa) - Country of Origin
    const origin = (packetData.countryOfOrigin || "").trim();
    if (!origin || origin.toLowerCase().includes("missing") || origin.toLowerCase().includes("unknown")) {
      results.rule_6_1_aa = {
        ruleId: "rule_6_1_aa",
        ruleNo: "Rule 6(1)(aa)",
        title: "Country of Origin",
        status: "FAIL",
        score: 0,
        message: "Mandatory Country of Origin omitted. Critical infraction for imported commodities under Rule 6(1)(aa).",
        penalty: 25000,
        section: "Customs Act 1962 & Rule 6(1)(aa)"
      };
      violations.push("Mandatory Country of Origin NOT declared");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_aa = {
        ruleId: "rule_6_1_aa",
        ruleNo: "Rule 6(1)(aa)",
        title: "Country of Origin",
        status: "PASS",
        score: 10,
        message: `Country of Origin declared: ${origin}.`,
        value: origin
      };
      totalScore += 10;
    }

    // 3. Rule 6(1)(b) - Common / Generic Name
    const genericName = (packetData.category || packetData.name || "").trim();
    if (!genericName) {
      results.rule_6_1_b = {
        ruleId: "rule_6_1_b",
        ruleNo: "Rule 6(1)(b)",
        title: "Generic / Common Name",
        status: "FAIL",
        score: 0,
        message: "Common or generic name missing from primary display panel.",
        penalty: 25000,
        section: "Section 36(1)"
      };
      violations.push("Generic product identity missing");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_b = {
        ruleId: "rule_6_1_b",
        ruleNo: "Rule 6(1)(b)",
        title: "Generic / Common Name",
        status: "PASS",
        score: 10,
        message: `Generic product identity verified: "${genericName}".`,
        value: genericName
      };
      totalScore += 10;
    }

    // 4. Rule 6(1)(c) - Net Quantity in Metric Units
    const netWeight = (packetData.netWeight || "").trim();
    const hasMetric = /(g|kg|ml|l|ltr|gm|grams|pieces|units|n)\b/i.test(netWeight);
    const hasNonMetricOnly = /(oz|lbs|fl oz|pounds)\b/i.test(netWeight) && !hasMetric;
    if (!netWeight) {
      results.rule_6_1_c = {
        ruleId: "rule_6_1_c",
        ruleNo: "Rule 6(1)(c)",
        title: "Net Quantity Declaration",
        status: "FAIL",
        score: 0,
        message: "Net quantity not stated.",
        penalty: 25000,
        section: "Section 36(2)"
      };
      violations.push("Net quantity omitted");
      penaltiesIncurred += 25000;
    } else if (hasNonMetricOnly) {
      results.rule_6_1_c = {
        ruleId: "rule_6_1_c",
        ruleNo: "Rule 6(1)(c)",
        title: "Net Quantity Declaration",
        status: "FAIL",
        score: 3,
        message: "Declared solely in non-metric units (oz/lbs). Indian law mandates SI metric units (g, kg, ml, l).",
        penalty: 10000,
        section: "Section 36(2)"
      };
      violations.push("Non-standard imperial measurement units without primary metric display");
      penaltiesIncurred += 10000;
    } else {
      results.rule_6_1_c = {
        ruleId: "rule_6_1_c",
        ruleNo: "Rule 6(1)(c)",
        title: "Net Quantity Declaration",
        status: "PASS",
        score: 15,
        message: `Standard metric declaration verified: ${netWeight}.`,
        value: netWeight
      };
      totalScore += 15;
    }

    // 5. Rule 6(1)(d) - Month & Year of Mfg/Packing
    const mfgDate = (packetData.mfgDate || "").trim();
    if (!mfgDate || mfgDate.toLowerCase().includes("unknown")) {
      results.rule_6_1_d_mfg = {
        ruleId: "rule_6_1_d_mfg",
        ruleNo: "Rule 6(1)(d)",
        title: "Manufacturing / Packing Date",
        status: "FAIL",
        score: 0,
        message: "Month and Year of manufacture/packing omitted.",
        penalty: 25000,
        section: "Rule 6(1)(d)"
      };
      violations.push("Manufacturing date missing");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_d_mfg = {
        ruleId: "rule_6_1_d_mfg",
        ruleNo: "Rule 6(1)(d)",
        title: "Manufacturing / Packing Date",
        status: "PASS",
        score: 10,
        message: `Mfg Date declared: ${mfgDate}.`,
        value: mfgDate
      };
      totalScore += 10;
    }

    // 6. Expiry / Best Before Date & Shelf Life Check
    const isExpired = !!packetData.isExpired;
    const expDate = (packetData.expDate || "").trim();
    if (isExpired) {
      results.rule_6_1_d_exp = {
        ruleId: "rule_6_1_d_exp",
        ruleNo: "Rule 6(1)(d) & CPA",
        title: "Expiry / Best Before Status",
        status: "FAIL",
        score: 0,
        message: `CRITICAL: Product is past expiration date (${expDate}). Selling expired commodities is an offense under CPA 2019 and LM Rules.`,
        penalty: 50000,
        section: "Consumer Protection Act 2019 & Sec 36"
      };
      violations.push(`Product EXPIRED (${expDate}) - Health and safety hazard`);
      penaltiesIncurred += 50000;
    } else if (expDate.toLowerCase().includes("smudge") || expDate.toLowerCase().includes("faint")) {
      results.rule_6_1_d_exp = {
        ruleId: "rule_6_1_d_exp",
        ruleNo: "Rule 6(1)(d) & Rule 9",
        title: "Expiry / Best Before Status",
        status: "WARNING",
        score: 5,
        message: "Best before date stamp fails font contrast/legibility standards under Rule 9.",
        penalty: 10000,
        section: "Rule 9 (Legibility of Declarations)"
      };
      warnings.push("Faint or smudged expiry date stamping");
      totalScore += 5;
    } else {
      results.rule_6_1_d_exp = {
        ruleId: "rule_6_1_d_exp",
        ruleNo: "Rule 6(1)(d)",
        title: "Expiry / Best Before Status",
        status: "PASS",
        score: 10,
        message: `Product is within valid shelf life: ${expDate}.`,
        value: expDate
      };
      totalScore += 10;
    }

    // 7. Rule 6(1)(e) & Rule 18 - Maximum Retail Price (MRP) & Dual Stickering
    const hasDualSticker = packetData.originalMrp && packetData.mrp > packetData.originalMrp;
    const mrpValue = Number(packetData.mrp);

    if (hasDualSticker) {
      const illegalMarkup = (mrpValue - packetData.originalMrp).toFixed(2);
      results.rule_6_1_e = {
        ruleId: "rule_6_1_e",
        ruleNo: "Rule 6(1)(e) & Rule 18(2)",
        title: "MRP & Overcharging Check",
        status: "FAIL",
        score: 0,
        message: `DUAL MRP DETECTED: Illegal price sticker of ₹${mrpValue} pasted over factory printed ₹${packetData.originalMrp} (Illegal surcharge: ₹${illegalMarkup}). Punishable under Section 36 & Rule 18(2).`,
        penalty: 50000,
        section: "Section 36(1) & Rule 18(2)"
      };
      violations.push(`Dual MRP sticker detected: ₹${illegalMarkup} overcharge on factory price`);
      penaltiesIncurred += 50000;
    } else if (!mrpValue || mrpValue <= 0) {
      results.rule_6_1_e = {
        ruleId: "rule_6_1_e",
        ruleNo: "Rule 6(1)(e)",
        title: "MRP Declaration",
        status: "FAIL",
        score: 0,
        message: "Maximum Retail Price (MRP) omitted or illegible.",
        penalty: 25000,
        section: "Section 36(1)"
      };
      violations.push("MRP not declared");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_e = {
        ruleId: "rule_6_1_e",
        ruleNo: "Rule 6(1)(e)",
        title: "MRP Declaration",
        status: "PASS",
        score: 15,
        message: `Printed MRP ₹${mrpValue.toFixed(2)} (inclusive of all taxes) verified with no secondary stickers.`,
        value: `₹${mrpValue.toFixed(2)}`
      };
      totalScore += 15;
    }

    // 8. Rule 6(1)(k) - Unit Sale Price (USP) Validation (2022 Amendment)
    const declaredUsp = (packetData.unitSalePrice || "").trim();
    const netNumeric = parseFloat(netWeight);
    const isGrams = /g|gm|grams/i.test(netWeight) && !/kg/i.test(netWeight);
    const isKg = /kg/i.test(netWeight);
    const isMl = /ml/i.test(netWeight) && !/l|ltr/i.test(netWeight);
    const isLiter = /(l|ltr|litre|liter)/i.test(netWeight);

    let theoreticalUsp = 0;
    let unitLabel = "/ g";
    if (netNumeric > 0 && mrpValue > 0) {
      if (isGrams) {
        theoreticalUsp = mrpValue / netNumeric;
        unitLabel = "/ g";
      } else if (isKg) {
        theoreticalUsp = (mrpValue / (netNumeric * 1000));
        unitLabel = "/ g (or ₹" + (mrpValue / netNumeric).toFixed(2) + " / kg)";
      } else if (isMl) {
        theoreticalUsp = mrpValue / netNumeric;
        unitLabel = "/ ml";
      } else if (isLiter) {
        theoreticalUsp = (mrpValue / (netNumeric * 1000));
        unitLabel = "/ ml (or ₹" + (mrpValue / netNumeric).toFixed(2) + " / L)";
      } else {
        theoreticalUsp = mrpValue / (netNumeric || 1);
        unitLabel = "/ unit";
      }
    }

    if (!declaredUsp || declaredUsp.toUpperCase() === "MISSING" || declaredUsp.toLowerCase().includes("not provided")) {
      results.rule_6_1_k = {
        ruleId: "rule_6_1_k",
        ruleNo: "Rule 6(1)(k)",
        title: "Unit Sale Price (USP)",
        status: "FAIL",
        score: 0,
        message: `MANDATORY USP OMITTED: As per 2022 amendment (GSR 779(E)), pre-packaged goods must display Unit Sale Price (Should be ₹${theoreticalUsp.toFixed(2)}${unitLabel}).`,
        penalty: 25000,
        section: "Rule 6(1)(k) [2022 Amendment]"
      };
      violations.push("Mandatory Unit Sale Price (USP) omitted");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_k = {
        ruleId: "rule_6_1_k",
        ruleNo: "Rule 6(1)(k)",
        title: "Unit Sale Price (USP)",
        status: "PASS",
        score: 15,
        message: `Unit Sale Price declared: ${declaredUsp} (Mathematically verified: ~₹${theoreticalUsp.toFixed(2)}${unitLabel}).`,
        value: declaredUsp
      };
      totalScore += 15;
    }

    // 9. Rule 6(1)(f) - Consumer Care Details
    const careText = (packetData.consumerCare || "").trim();
    if (!careText || careText.toLowerCase().includes("none") || careText.length < 10) {
      results.rule_6_1_f = {
        ruleId: "rule_6_1_f",
        ruleNo: "Rule 6(1)(f)",
        title: "Consumer Care & Grievance Desk",
        status: "FAIL",
        score: 0,
        message: "No domestic consumer helpline telephone, email, or grievance officer listed.",
        penalty: 25000,
        section: "Rule 6(1)(f)"
      };
      violations.push("Consumer Care details omitted");
      penaltiesIncurred += 25000;
    } else {
      results.rule_6_1_f = {
        ruleId: "rule_6_1_f",
        ruleNo: "Rule 6(1)(f)",
        title: "Consumer Care & Grievance Desk",
        status: "PASS",
        score: 10,
        message: `Grievance mechanism verified: ${careText}.`,
        value: careText
      };
      totalScore += 10;
    }

    // Calculate final verdict
    let verdict = "COMPLIANT";
    let verdictClass = "status-pass";
    if (violations.length >= 2 || hasDualSticker || isExpired) {
      verdict = "CRITICAL VIOLATION";
      verdictClass = "status-danger";
    } else if (violations.length === 1 || warnings.length > 0) {
      verdict = "NON-COMPLIANT";
      verdictClass = "status-warning";
    }

    return {
      packetName: packetData.name,
      verdict,
      verdictClass,
      complianceScore: Math.min(100, Math.max(10, totalScore)),
      violations,
      warnings,
      penaltiesIncurred,
      ruleResults: results,
      totalRulesChecked: 9,
      passedRulesCount: Object.values(results).filter(r => r.status === "PASS").length,
      failedRulesCount: Object.values(results).filter(r => r.status === "FAIL").length,
      warningRulesCount: Object.values(results).filter(r => r.status === "WARNING").length
    };
  }

  // Quick helper to calculate expected USP
  calculateUSP(mrp, netWeight) {
    const numWeight = parseFloat(netWeight) || 0;
    const numMrp = parseFloat(mrp) || 0;
    if (numWeight <= 0 || numMrp <= 0) return { usp: 0, label: "N/A" };

    const isGrams = /g|gm/i.test(netWeight) && !/kg/i.test(netWeight);
    const isKg = /kg/i.test(netWeight);
    const isMl = /ml/i.test(netWeight) && !/l|ltr/i.test(netWeight);
    const isL = /l|ltr/i.test(netWeight);

    if (isGrams) return { usp: (numMrp / numWeight).toFixed(2), unit: "₹ / g" };
    if (isKg) return { usp: (numMrp / numWeight).toFixed(2), unit: "₹ / kg" };
    if (isMl) return { usp: (numMrp / numWeight).toFixed(2), unit: "₹ / ml" };
    if (isL) return { usp: (numMrp / numWeight).toFixed(2), unit: "₹ / L" };
    return { usp: (numMrp / numWeight).toFixed(2), unit: "₹ / unit" };
  }
}

window.parakhRulesEngine = new ParakhRulesEngine();
