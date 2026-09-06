// ParakhAI Flutter Service - Legal Metrology (Packaged Commodities) Rules 2011 Engine
import '../models/commodity_model.dart';
import '../models/rule_model.dart';

class ComplianceEngine {
  static final List<CommodityItem> sampleCommodities = [
    const CommodityItem(
      id: "demo_compliant",
      name: "Haldiram's Nagpur Aloo Bhujia 200g",
      category: "Packaged Savory Snack (FMCG Food)",
      imagePath: "assets/compliant_pack.jpg",
      mrp: 50.00,
      netWeight: "200 g",
      unitSalePrice: "₹0.25 / g",
      mfgDate: "12/2025",
      expDate: "06/2026",
      isExpired: false,
      countryOfOrigin: "India",
      manufacturer: "Haldiram Foods International Pvt. Ltd., Nagpur - 440008, Maharashtra",
      consumerCare: "care@haldiram.com | +91 712-2779451",
      zones: [
        LabelZone(label: "MRP & USP", status: "pass", text: "MRP ₹50.00 | USP: ₹0.25/g", top: 72, left: 60, width: 32, height: 16),
        LabelZone(label: "Net Qty", status: "pass", text: "Net Wt: 200 g", top: 62, left: 60, width: 30, height: 8),
        LabelZone(label: "Origin", status: "pass", text: "Made in India", top: 22, left: 10, width: 35, height: 8),
      ],
    ),
    const CommodityItem(
      id: "demo_dual_mrp",
      name: "Himalaya Purifying Neem Face Wash 150ml",
      category: "Personal Care & Cosmetics",
      imagePath: "assets/dual_mrp_pack.jpg",
      mrp: 185.00,
      originalMrp: 150.00,
      netWeight: "150 ml",
      unitSalePrice: "MISSING",
      mfgDate: "03/2024",
      expDate: "02/2027",
      isExpired: false,
      countryOfOrigin: "India",
      manufacturer: "The Himalaya Drug Company, Makali, Bengaluru - 562162",
      consumerCare: "contactus@himalayawellness.com | 1-800-208-1930",
      zones: [
        LabelZone(label: "TAMPERED STICKER", status: "violation", text: "STICKER DETECTED: ₹185 (Original ₹150)", top: 68, left: 48, width: 44, height: 20),
        LabelZone(label: "Missing USP", status: "violation", text: "USP Omitted on >100ml pack", top: 60, left: 10, width: 35, height: 10),
      ],
    ),
  ];

  static AuditReport auditCommodity(CommodityItem item) {
    final Map<String, RuleAuditVerdict> results = {};
    final List<String> violations = [];
    int penalty = 0;
    int score = 0;

    // 1. Manufacturer / Packer Address
    if (item.manufacturer.length < 15) {
      results['rule_6_1_a'] = const RuleAuditVerdict(
        ruleNo: "Rule 6(1)(a)",
        title: "Manufacturer Details",
        status: "FAIL",
        message: "Incomplete manufacturer address.",
        penalty: 25000,
      );
      violations.add("Missing complete factory address");
      penalty += 25000;
    } else {
      results['rule_6_1_a'] = RuleAuditVerdict(
        ruleNo: "Rule 6(1)(a)",
        title: "Manufacturer Details",
        status: "PASS",
        message: "Valid manufacturer address found.",
        extractedValue: item.manufacturer,
      );
      score += 15;
    }

    // 2. Country of Origin
    if (item.countryOfOrigin.toLowerCase().contains("missing")) {
      results['rule_6_1_aa'] = const RuleAuditVerdict(
        ruleNo: "Rule 6(1)(aa)",
        title: "Country of Origin",
        status: "FAIL",
        message: "Country of origin omitted on consumer panel.",
        penalty: 25000,
      );
      violations.add("Country of Origin missing");
      penalty += 25000;
    } else {
      results['rule_6_1_aa'] = RuleAuditVerdict(
        ruleNo: "Rule 6(1)(aa)",
        title: "Country of Origin",
        status: "PASS",
        message: "Origin verified: ${item.countryOfOrigin}",
        extractedValue: item.countryOfOrigin,
      );
      score += 15;
    }

    // 3. Dual MRP & Overcharging
    final bool hasDualSticker = item.originalMrp != null && item.mrp > item.originalMrp!;
    if (hasDualSticker) {
      final markup = item.mrp - item.originalMrp!;
      results['rule_6_1_e'] = RuleAuditVerdict(
        ruleNo: "Rule 6(1)(e) & Rule 18",
        title: "MRP & Overcharging",
        status: "FAIL",
        message: "Dual MRP sticker detected: ₹${markup.toStringAsFixed(2)} markup over original ₹${item.originalMrp}",
        penalty: 50000,
      );
      violations.add("Dual MRP sticker: ₹${markup.toStringAsFixed(2)} overcharge");
      penalty += 50000;
    } else {
      results['rule_6_1_e'] = RuleAuditVerdict(
        ruleNo: "Rule 6(1)(e)",
        title: "MRP Declaration",
        status: "PASS",
        message: "Printed MRP ₹${item.mrp.toStringAsFixed(2)} incl. all taxes.",
        extractedValue: "₹${item.mrp.toStringAsFixed(2)}",
      );
      score += 20;
    }

    // 4. Unit Sale Price (USP)
    if (item.unitSalePrice.toUpperCase() == "MISSING" || item.unitSalePrice.isEmpty) {
      results['rule_6_1_k'] = const RuleAuditVerdict(
        ruleNo: "Rule 6(1)(k)",
        title: "Unit Sale Price (USP)",
        status: "FAIL",
        message: "Mandatory USP missing under Dec 2022 amendment.",
        penalty: 25000,
      );
      violations.add("Unit Sale Price (USP) omitted");
      penalty += 25000;
    } else {
      results['rule_6_1_k'] = RuleAuditVerdict(
        ruleNo: "Rule 6(1)(k)",
        title: "Unit Sale Price (USP)",
        status: "PASS",
        message: "Valid USP declared: ${item.unitSalePrice}",
        extractedValue: item.unitSalePrice,
      );
      score += 20;
    }

    // 5. Expiry Check
    if (item.isExpired) {
      results['rule_6_1_d_exp'] = const RuleAuditVerdict(
        ruleNo: "Rule 6(1)(d)",
        title: "Expiry Date",
        status: "FAIL",
        message: "Product is past shelf-life date (Expired item).",
        penalty: 50000,
      );
      violations.add("Commodity past expiration date");
      penalty += 50000;
    } else {
      results['rule_6_1_d_exp'] = RuleAuditVerdict(
        ruleNo: "Rule 6(1)(d)",
        title: "Expiry Date",
        status: "PASS",
        message: "Valid shelf life: ${item.expDate}",
        extractedValue: item.expDate,
      );
      score += 15;
    }

    // 6. Consumer Care
    results['rule_6_1_f'] = RuleAuditVerdict(
      ruleNo: "Rule 6(1)(f)",
      title: "Consumer Desk",
      status: item.consumerCare.length > 10 ? "PASS" : "FAIL",
      message: item.consumerCare.length > 10 ? "Grievance desk verified." : "Missing consumer helpline.",
      extractedValue: item.consumerCare,
    );
    if (item.consumerCare.length > 10) score += 15;

    String verdict = "COMPLIANT";
    if (violations.length >= 2 || hasDualSticker || item.isExpired) {
      verdict = "CRITICAL VIOLATION";
    } else if (violations.length == 1) {
      verdict = "NON-COMPLIANT";
    }

    return AuditReport(
      packetName: item.name,
      verdict: verdict,
      complianceScore: score.clamp(10, 100),
      violations: violations,
      penaltiesIncurred: penalty,
      ruleResults: results,
    );
  }
}
