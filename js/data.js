// ParakhAI - Legal Metrology Compliance Data Store & Knowledge Base
// Citing Legal Metrology Act, 2009 & Legal Metrology (Packaged Commodities) Rules, 2011 (with 2022 Amendments)

const PARAKH_DATA = {
  // Statutory Rules under Legal Metrology (Packaged Commodities) Rules, 2011
  rules: [
    {
      id: "rule_6_1_a",
      ruleNo: "Rule 6(1)(a)",
      name: "Manufacturer / Packer / Importer Details",
      description: "Name and complete physical address of the manufacturer, or where manufacturer is not the packer, name and address of the manufacturer and packer.",
      sectionRef: "Section 36(1) of Legal Metrology Act, 2009",
      penalty: "₹25,000 (1st offense), ₹50,000 (2nd offense), up to ₹1,00,000 or 1 year imprisonment (subsequent)"
    },
    {
      id: "rule_6_1_aa",
      ruleNo: "Rule 6(1)(aa)",
      name: "Country of Origin",
      description: "Mandatory declaration of the country of manufacture or origin for all pre-packaged commodities, especially imported products.",
      sectionRef: "Customs Act, 1962 read with Rule 6(1)(aa) of LM(PC) Rules 2011",
      penalty: "₹25,000 fine and confiscation of non-compliant import consignments"
    },
    {
      id: "rule_6_1_b",
      ruleNo: "Rule 6(1)(b)",
      name: "Generic / Common Name",
      description: "Common or generic names of the commodity contained in the package must be clearly prominent without misleading trade descriptions.",
      sectionRef: "Rule 6(1)(b) & Section 36(1)",
      penalty: "₹25,000 (1st offense)"
    },
    {
      id: "rule_6_1_c",
      ruleNo: "Rule 6(1)(c)",
      name: "Net Quantity in Metric Units",
      description: "Net quantity in terms of standard unit of weight or measure (g, kg, ml, l) or in numbers. Non-standard units (oz, lbs) are prohibited.",
      sectionRef: "Section 36(2) of Legal Metrology Act, 2009",
      penalty: "₹10,000 to ₹50,000 for short-weight or improper measurement units"
    },
    {
      id: "rule_6_1_d_mfg",
      ruleNo: "Rule 6(1)(d)",
      name: "Month & Year of Manufacture / Packing",
      description: "The month and year in which the commodity is manufactured, packed or imported, clearly legible and not smudged.",
      sectionRef: "Rule 6(1)(d) & Rule 9",
      penalty: "₹25,000 (1st offense)"
    },
    {
      id: "rule_6_1_d_exp",
      ruleNo: "Rule 6(1)(d) & FSSAI",
      name: "Expiry / Best Before Date",
      description: "Mandatory for all food, cosmetics, and perishable items. Selling beyond expiry constitutes an unfair trade practice and health hazard.",
      sectionRef: "Consumer Protection Act 2019 & Section 36 Legal Metrology Act",
      penalty: "Immediate seizure, up to ₹1,00,000 fine and cancellation of vendor retail license"
    },
    {
      id: "rule_6_1_e",
      ruleNo: "Rule 6(1)(e)",
      name: "Maximum Retail Price (MRP)",
      description: "Retail sale price in the format 'MRP ₹ xx.xx (inclusive of all taxes)'. Overcharging above printed MRP or pasting duplicate price stickers is strictly prohibited.",
      sectionRef: "Rule 18(2) & Section 36(1) of Legal Metrology Act, 2009",
      penalty: "₹2,000 to ₹25,000 on retailer, up to ₹50,000 on manufacturer/distributor"
    },
    {
      id: "rule_6_1_k",
      ruleNo: "Rule 6(1)(k)",
      name: "Unit Sale Price (USP - 2022 Amendment)",
      description: "Mandatory declaration of Unit Sale Price (e.g. ₹/g, ₹/kg, ₹/ml, ₹/piece) adjacent to MRP to allow consumers to compare price per unit accurately.",
      sectionRef: "Ministry of Consumer Affairs Notification G.S.R. 779(E) w.e.f 1st Dec 2022",
      penalty: "₹25,000 (1st offense) on manufacturers, packers & e-commerce sellers"
    },
    {
      id: "rule_6_1_f",
      ruleNo: "Rule 6(1)(f)",
      name: "Consumer Care Details",
      description: "Name, address, telephone number, and email address of the person/grievance officer who can be contacted by the consumer in case of complaints.",
      sectionRef: "Rule 6(1)(f) of LM(PC) Rules 2011",
      penalty: "₹25,000 fine"
    }
  ],

  // 4 Pre-loaded Realistic FMCG Test Packets with bounding box coordinates and rule checks
  demoPackets: [
    {
      id: "demo_compliant",
      name: "Haldiram's Nagpur Aloo Bhujia 200g",
      category: "Packaged Savory Snack (FMCG Food)",
      image: "assets/compliant_pack.jpg",
      overallStatus: "COMPLIANT",
      complianceScore: 98,
      mrp: 50.00,
      netWeight: "200 g",
      unitSalePrice: "₹0.25 / g",
      calculatedUsp: 0.25,
      mfgDate: "12/2025",
      expDate: "06/2026",
      isExpired: false,
      countryOfOrigin: "India",
      manufacturer: "Haldiram Foods International Pvt. Ltd., Plot No. 145/146, Old Pardi Naka, Nagpur - 440008, Maharashtra",
      consumerCare: "care@haldiram.com | +91 712-2779451 | Nodal Grievance Officer: Mr. R. K. Sharma",
      barcode: "8904004401298",
      violationsCount: 0,
      summary: "All 9 mandatory Legal Metrology declarations verified. Accurate Unit Sale Price (USP) calculated at ₹0.25/g matching printed label. FSSAI & consumer desk fully compliant.",
      zones: [
        { label: "MRP & USP Declaration", status: "pass", text: "MRP ₹50.00 (Incl. of all taxes)\nUSP: ₹0.25 / g", box: { top: 72, left: 60, width: 32, height: 16 } },
        { label: "Net Quantity", status: "pass", text: "Net Weight: 200 g (0.44 lb)", box: { top: 62, left: 60, width: 30, height: 8 } },
        { label: "Dates (Mfg & Exp)", status: "pass", text: "Mfg: 12/2025 | Best Before: 6 Months from mfg (06/2026)", box: { top: 52, left: 10, width: 45, height: 12 } },
        { label: "Manufacturer Address", status: "pass", text: "Mfd by: Haldiram Foods Intl Pvt Ltd, Nagpur - 440008", box: { top: 32, left: 10, width: 45, height: 16 } },
        { label: "Country of Origin", status: "pass", text: "Country of Origin: INDIA", box: { top: 22, left: 10, width: 35, height: 8 } },
        { label: "Consumer Care", status: "pass", text: "Customer Care: care@haldiram.com | 0712-2779451", box: { top: 82, left: 10, width: 45, height: 12 } }
      ],
      ruleResults: {
        rule_6_1_a: { status: "PASS", message: "Complete physical address & unit location declared." },
        rule_6_1_aa: { status: "PASS", message: "Country of Origin 'INDIA' clearly printed in bold." },
        rule_6_1_b: { status: "PASS", message: "Common name 'Aloo Bhujia' prominently displayed." },
        rule_6_1_c: { status: "PASS", message: "Standard metric unit '200 g' declared." },
        rule_6_1_d_mfg: { status: "PASS", message: "Mfg Date 12/2025 clearly legible." },
        rule_6_1_d_exp: { status: "PASS", message: "Expiry 06/2026. Commodity is within valid shelf life." },
        rule_6_1_e: { status: "PASS", message: "MRP ₹50.00 incl. of all taxes. No dual stickering detected." },
        rule_6_1_k: { status: "PASS", message: "USP ₹0.25/g matches formula (₹50 / 200g = ₹0.25/g)." },
        rule_6_1_f: { status: "PASS", message: "Toll-free telephone, grievance officer and email verified." }
      }
    },
    {
      id: "demo_dual_mrp",
      name: "Himalaya Purifying Neem Face Wash 150ml",
      category: "Personal Care & Cosmetics",
      image: "assets/dual_mrp_pack.jpg",
      overallStatus: "CRITICAL VIOLATION",
      complianceScore: 28,
      mrp: 185.00,
      originalMrp: 150.00,
      netWeight: "150 ml",
      unitSalePrice: "Not Provided",
      calculatedUsp: 1.23,
      mfgDate: "03/2024",
      expDate: "02/2027",
      isExpired: false,
      countryOfOrigin: "India",
      manufacturer: "The Himalaya Drug Company, Makali, Bengaluru - 562162",
      consumerCare: "contactus@himalayawellness.com | 1-800-208-1930",
      barcode: "8901138820442",
      violationsCount: 3,
      summary: "CRITICAL: Dual MRP stickering detected! Unofficial barcode sticker of ₹185 slapped directly over original printed MRP of ₹150 (₹35 illegal surcharge). Violation of Rule 18(2) & Section 36. Unit Sale Price also absent.",
      zones: [
        { label: "TAMPERED MRP STICKER", status: "violation", text: "STICKER DETECTED: ₹185.00\nOriginal Underlying MRP: ₹150.00", box: { top: 68, left: 48, width: 44, height: 20 } },
        { label: "Missing USP Zone", status: "violation", text: "VIOLATION: Unit Sale Price (₹/ml) omitted entirely.", box: { top: 60, left: 10, width: 35, height: 10 } },
        { label: "Net Quantity", status: "pass", text: "Net Content: 150 ml", box: { top: 78, left: 10, width: 30, height: 8 } },
        { label: "Manufacturer Address", status: "pass", text: "The Himalaya Drug Company, Makali, Bengaluru", box: { top: 25, left: 10, width: 48, height: 16 } },
        { label: "Consumer Care", status: "pass", text: "Toll-free: 1-800-208-1930", box: { top: 44, left: 10, width: 40, height: 12 } }
      ],
      ruleResults: {
        rule_6_1_a: { status: "PASS", message: "Manufacturer name and physical address present." },
        rule_6_1_aa: { status: "PASS", message: "Country of Origin declared as India." },
        rule_6_1_b: { status: "PASS", message: "Generic name 'Face Wash' indicated." },
        rule_6_1_c: { status: "PASS", message: "Net Quantity 150 ml in standard metric." },
        rule_6_1_d_mfg: { status: "PASS", message: "Mfg date 03/2024 legible." },
        rule_6_1_d_exp: { status: "PASS", message: "Product has 11 months shelf life remaining." },
        rule_6_1_e: { status: "FAIL", message: "DUAL MRP STICKER: Retailer pasted ₹185 label over factory ₹150. Illegal markup under Section 36(1) & Rule 18(2)." },
        rule_6_1_k: { status: "FAIL", message: "MISSING USP: No Unit Sale Price declared as required by 2022 amendment for packages > 100ml." },
        rule_6_1_f: { status: "PASS", message: "Consumer care details present." }
      }
    },
    {
      id: "demo_missing_usp",
      name: "Sunfeast Dark Fantasy Choco Fills 300g Big Saver Pack",
      category: "Confectionery / Biscuits",
      image: "assets/missing_usp_pack.jpg",
      overallStatus: "NON-COMPLIANT",
      complianceScore: 48,
      mrp: 160.00,
      netWeight: "300 g",
      unitSalePrice: "MISSING",
      calculatedUsp: 0.53,
      mfgDate: "10/2025",
      expDate: "04/2026",
      isExpired: false,
      countryOfOrigin: "India",
      manufacturer: "ITC Limited, 37 J.L. Nehru Road, Kolkata - 700071",
      consumerCare: "itccares@itc.in | 1800-425-4444",
      barcode: "8901725134144",
      violationsCount: 2,
      summary: "VIOLATION: Unit Sale Price (USP) completely omitted on this 300g pack. Mandatory under Dec 2022 notification to show ₹0.53/g. Batch print smudged on expiry date.",
      zones: [
        { label: "MRP Zone (Missing USP)", status: "violation", text: "MRP ₹160.00 (Incl. Taxes)\nUSP: NOT DECLARED (Mandatory ₹0.53/g missing)", box: { top: 70, left: 52, width: 42, height: 18 } },
        { label: "Net Quantity", status: "pass", text: "Net Qty: 300 g (6 x 50g packs)", box: { top: 58, left: 52, width: 35, height: 10 } },
        { label: "Smudged Expiry Zone", status: "warning", text: "WARNING: Date stamping faint/partially smudged (10/2025)", box: { top: 40, left: 10, width: 40, height: 14 } },
        { label: "Manufacturer Address", status: "pass", text: "ITC Limited, Kolkata - 700071", box: { top: 20, left: 10, width: 45, height: 14 } }
      ],
      ruleResults: {
        rule_6_1_a: { status: "PASS", message: "Manufacturer corporate details available." },
        rule_6_1_aa: { status: "PASS", message: "Origin India verified." },
        rule_6_1_b: { status: "PASS", message: "Filled cookies description present." },
        rule_6_1_c: { status: "PASS", message: "Net weight 300 g valid." },
        rule_6_1_d_mfg: { status: "PASS", message: "Mfg month 10/2025." },
        rule_6_1_d_exp: { status: "WARNING", message: "Best before date stamp font contrast fails visibility standards (Rule 9)." },
        rule_6_1_e: { status: "PASS", message: "MRP ₹160.00 clearly declared." },
        rule_6_1_k: { status: "FAIL", message: "MANDATORY USP OMITTED: Package > 100g must declare Unit Sale Price (₹0.53/g). Non-compliant with GSR 779(E)." },
        rule_6_1_f: { status: "PASS", message: "ITC Cares phone and email valid." }
      }
    },
    {
      id: "demo_imported_origin",
      name: "Belgian Artisan Dark Chocolate Bar 100g",
      category: "Imported Confectionery",
      image: "assets/imported_missing_origin.jpg",
      overallStatus: "CRITICAL VIOLATION",
      complianceScore: 32,
      mrp: 350.00,
      netWeight: "3.5 oz / 100g",
      unitSalePrice: "MISSING",
      calculatedUsp: 3.50,
      mfgDate: "Unknown",
      expDate: "01/2026 (EXPIRED)",
      isExpired: true,
      countryOfOrigin: "MISSING (Illegal Import)",
      manufacturer: "ChocoBelge SPRL, Brussels, Belgium",
      consumerCare: "None listed for India jurisdiction",
      barcode: "5410123456789",
      violationsCount: 4,
      summary: "SEVERE OFFENSE: Product is past expiration date (Jan 2026). Country of origin omitted on consumer panel. No registered Indian Importer / Packer address or Indian Consumer Care desk provided.",
      zones: [
        { label: "EXPIRED COMMODITY", status: "violation", text: "CRITICAL: Expired on 01/2026! Selling expired food is punishable under CPA 2019.", box: { top: 45, left: 10, width: 45, height: 16 } },
        { label: "Missing Country of Origin", status: "violation", text: "VIOLATION: Rule 6(1)(aa) - Country of Origin missing from label.", box: { top: 22, left: 10, width: 40, height: 12 } },
        { label: "No Indian Importer Stamp", status: "violation", text: "VIOLATION: Rule 6(1)(a) - No Indian Importer name/FSSAI Importer license.", box: { top: 32, left: 52, width: 44, height: 18 } },
        { label: "Missing USP & Non-metric net wt", status: "violation", text: "Net wt states 3.5 oz prominently, USP missing.", box: { top: 72, left: 10, width: 45, height: 15 } }
      ],
      ruleResults: {
        rule_6_1_a: { status: "FAIL", message: "NO INDIAN IMPORTER: Foreign manufacturer listed without registered Indian Importer Name & FSSAI license." },
        rule_6_1_aa: { status: "FAIL", message: "MISSING COUNTRY OF ORIGIN: Mandatory declaration under Rule 6(1)(aa) omitted on outer label." },
        rule_6_1_b: { status: "PASS", message: "Description 'Dark Chocolate' present." },
        rule_6_1_c: { status: "WARNING", message: "Non-standard unit '3.5 oz' listed prominently ahead of metric unit." },
        rule_6_1_d_mfg: { status: "FAIL", message: "Month & year of manufacture not declared." },
        rule_6_1_d_exp: { status: "FAIL", message: "EXPIRED ITEM: Best before date was January 2026. Current date is past shelf life. Immediate seizure offense." },
        rule_6_1_e: { status: "PASS", message: "MRP sticker ₹350 affixed." },
        rule_6_1_k: { status: "FAIL", message: "Unit Sale Price (₹3.50/g) missing." },
        rule_6_1_f: { status: "FAIL", message: "No domestic customer care desk, phone number or grievance contact provided in India." }
      }
    }
  ],

  // Hyderabad Store Violation Hotspots for Leaflet Interactive Map
  hyderabadStores: [
    {
      id: "hyd_01",
      name: "Sri Balaji Kirana & Super Bazaar",
      area: "Ameerpet Metro Junction",
      address: "Shop #14, Beside Ameerpet Metro Pillar 1042, Ameerpet, Hyderabad - 500016",
      lat: 17.4375,
      lng: 78.4483,
      riskLevel: "CRITICAL",
      primaryViolation: "Dual MRP Stickering on Cosmetics & Cold Beverages",
      violationType: "dual_mrp",
      violationsCount: 14,
      verifiedCount: 42,
      lastReported: "2 hours ago",
      flaggedProducts: ["Himalaya Face Wash (₹35 markup)", "Kinley Water 1L (₹25 charged vs ₹20 MRP)", "Amul Butter 500g"],
      inspectorAction: "Raid Scheduled - Legal Notice Form 1 Sent",
      status: "Investigation Active"
    },
    {
      id: "hyd_02",
      name: "Ratnadeep Supermarket (Franchise)",
      area: "Begumpet Airport Road",
      address: "Near Shoppers Stop, Prakash Nagar, Begumpet, Hyderabad - 500016",
      lat: 17.4448,
      lng: 78.4682,
      riskLevel: "MODERATE",
      primaryViolation: "Missing Unit Sale Price (USP) on Bulk FMCG",
      violationType: "missing_usp",
      violationsCount: 8,
      verifiedCount: 29,
      lastReported: "Yesterday",
      flaggedProducts: ["Sunfeast Dark Fantasy 300g", "Surf Excel 2kg Refill", "Aashirvaad Atta 10kg"],
      inspectorAction: "Advisory Notice issued under Rule 6(1)(k)",
      status: "Pending Compliance"
    },
    {
      id: "hyd_03",
      name: "Nature's Basket Gourmet Mart",
      area: "Banjara Hills Road No. 12",
      address: "Plot 8-2-684, Fortune Monarch Mall, Banjara Hills, Hyderabad - 500034",
      lat: 17.4156,
      lng: 78.4347,
      riskLevel: "CRITICAL",
      primaryViolation: "Imported Chocolates & Sauces Missing Country of Origin & Importer",
      violationType: "imported_origin",
      violationsCount: 19,
      verifiedCount: 56,
      lastReported: "4 hours ago",
      flaggedProducts: ["Belgian Dark Chocolate 100g (Expired)", "Italian Truffle Oil (No Indian Importer)", "Swiss Wafer Tins"],
      inspectorAction: "Seizure of 48 unlabelled imported units executed",
      status: "Seizure Notice Issued"
    },
    {
      id: "hyd_04",
      name: "Q-Mart Convenience Express",
      area: "Madhapur Hitec City",
      address: "Opposite Inorbit Mall, Mindspace Road, Madhapur, Hyderabad - 500081",
      lat: 17.4399,
      lng: 78.3807,
      riskLevel: "COMPLIANT",
      primaryViolation: "None - High Compliance Score (96%)",
      violationType: "compliant",
      violationsCount: 0,
      verifiedCount: 88,
      lastReported: "3 days ago",
      flaggedProducts: ["All 9 statutory declarations verified on sampled batches"],
      inspectorAction: "Awarded Metrology Green Certificate",
      status: "Certified Compliant"
    },
    {
      id: "hyd_05",
      name: "Station Canteen & Refreshment Stall #4",
      area: "Secunderabad Railway Station",
      address: "Platform 1, Secunderabad Junction, Hyderabad - 500003",
      lat: 17.4344,
      lng: 78.5015,
      riskLevel: "CRITICAL",
      primaryViolation: "Rampant Overcharging above MRP on Water & Snacks",
      violationType: "dual_mrp",
      violationsCount: 38,
      verifiedCount: 112,
      lastReported: "35 mins ago",
      flaggedProducts: ["Rail Neer (Charged ₹20 vs ₹15 MRP)", "Lays Chips ₹20 charged ₹25", "Parle-G 100g"],
      inspectorAction: "Joint Inspection with Railway Metrology Squad",
      status: "Fine Imposed ₹50,000"
    },
    {
      id: "hyd_06",
      name: "Old City Spices & General Store",
      area: "Charminar Laad Bazaar",
      address: "Near Mecca Masjid, Laad Bazaar, Charminar, Hyderabad - 500002",
      lat: 17.3616,
      lng: 78.4747,
      riskLevel: "MODERATE",
      primaryViolation: "Selling Repackaged Dry Fruits without Net Quantity & Packer Address",
      violationType: "missing_usp",
      violationsCount: 11,
      verifiedCount: 34,
      lastReported: "1 day ago",
      flaggedProducts: ["Cashew 250g unsealed polybags", "Almonds 500g pouch"],
      inspectorAction: "Notice to affix standard declaration labels",
      status: "Warning Issued"
    },
    {
      id: "hyd_07",
      name: "D-Mart Hypermarket",
      area: "Kukatpally Housing Board (KPHB)",
      address: "Road No. 1, KPHB Colony, Kukatpally, Hyderabad - 500072",
      lat: 17.4947,
      lng: 78.3996,
      riskLevel: "COMPLIANT",
      primaryViolation: "Minor barcode scanner USP display delay (Resolved)",
      violationType: "compliant",
      violationsCount: 1,
      verifiedCount: 145,
      lastReported: "5 days ago",
      flaggedProducts: ["Compliant automated Unit Sale Price billing displays"],
      inspectorAction: "Audit verified compliant",
      status: "Certified Compliant"
    },
    {
      id: "hyd_08",
      name: "Apollo Pharmacy 24x7",
      area: "Gachibowli Financial District",
      address: "Near Wipro Circle, ISB Road, Gachibowli, Hyderabad - 500032",
      lat: 17.4225,
      lng: 78.3375,
      riskLevel: "MODERATE",
      primaryViolation: "Dual Price Stickering on Protein Powders & Dietary Supplements",
      violationType: "dual_mrp",
      violationsCount: 6,
      verifiedCount: 22,
      lastReported: "6 hours ago",
      flaggedProducts: ["Whey Protein 1kg (Import sticker ₹3,800 vs ₹3,200)", "Omega 3 Capsules"],
      inspectorAction: "Show-cause letter dispatched",
      status: "Response Awaited"
    },
    {
      id: "hyd_09",
      name: "Heritage Fresh Mart",
      area: "Somajiguda Raj Bhavan Road",
      address: "Opp. Yashoda Hospital, Somajiguda, Hyderabad - 500082",
      lat: 17.4241,
      lng: 78.4578,
      riskLevel: "CRITICAL",
      primaryViolation: "Expired Dairy Products & Smudged Best-Before Dates",
      violationType: "expired_goods",
      violationsCount: 17,
      verifiedCount: 64,
      lastReported: "3 hours ago",
      flaggedProducts: ["Flavored Milk Bottles (Expired 3 days ago)", "Paneer 200g (Smudged date)"],
      inspectorAction: "Product batch quarantined by field officer",
      status: "Goods Quarantined"
    },
    {
      id: "hyd_10",
      name: "More Megastore",
      area: "Uppal Ring Road",
      address: "Survey #45, Near Uppal Metro Depot, Hyderabad - 500039",
      lat: 17.4018,
      lng: 78.5602,
      riskLevel: "COMPLIANT",
      primaryViolation: "None - Compliant shelf-edge unit pricing",
      violationType: "compliant",
      violationsCount: 0,
      verifiedCount: 76,
      lastReported: "2 days ago",
      flaggedProducts: ["Regularly calibrated weights and measures"],
      inspectorAction: "Routine inspection passed",
      status: "Certified Compliant"
    }
  ],

  // Legal Metrology Officer Audit Log Data
  inspectorStats: {
    totalScansToday: 1428,
    violationsDetected: 312,
    penaltiesProposed: "₹ 18,75,000",
    seizureNoticesIssued: 47,
    hyderabadRiskIndex: "68% Moderate",
    topOffendingBrands: [
      { brand: "Imported Confectionery Grey-market", violations: 94, risk: "High" },
      { brand: "Local Repackaged Pulses & Dry Fruits", violations: 72, risk: "High" },
      { brand: "Beverage Stall Dual-MRP Vendors", violations: 61, risk: "Critical" },
      { brand: "Cosmetics & Skincare Imported Lots", violations: 48, risk: "Medium" },
      { brand: "Stationery & Toy Importers", violations: 37, risk: "Medium" }
    ],
    recentAudits: [
      { id: "AUD-2026-901", store: "Sri Balaji Kirana Ameerpet", type: "Dual MRP", officer: "Insp. K. Raman Rao", action: "Form 1 Notice", date: "Today 10:30 AM" },
      { id: "AUD-2026-902", store: "Nature's Basket Banjara Hills", type: "Missing Origin", officer: "Insp. S. Anitha", action: "Seizure 48 Units", date: "Today 09:15 AM" },
      { id: "AUD-2026-903", store: "Secunderabad Platform 1", type: "Overcharging", officer: "Joint Squad Rly", action: "₹50k Penalty", date: "Yesterday 04:45 PM" },
      { id: "AUD-2026-904", store: "Heritage Fresh Somajiguda", type: "Expired Goods", officer: "Insp. M. Srinivas", action: "Quarantine Stock", date: "Yesterday 02:20 PM" }
    ]
  }
};

window.PARAKH_DATA = PARAKH_DATA;
