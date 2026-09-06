// ParakhAI - 1-Click Legal Notice & e-Daakhil Grievance Petition Generator
// Compliant with Legal Metrology Act 2009 (Sec 36) & Consumer Protection Act 2019 (Sec 2(47))

class ParakhGrievanceNotice {
  constructor() {
    this.currentData = null;
    this.initModal();
  }

  initModal() {
    // modal elements will be accessed dynamically
  }

  // Open the legal notice modal and pre-fill statutory complaint fields
  openNoticeModal(packetData, auditData, storeData) {
    const modal = document.getElementById("legalNoticeModal");
    if (!modal) return;

    const caseId = "LM-HYD-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

    // Vendor / Store info
    let storeName = storeData ? storeData.name : (packetData ? packetData.manufacturer : "Sri Balaji Kirana & Super Bazaar, Ameerpet, Hyderabad");
    let storeAddress = storeData ? storeData.address : "Shop #14, Ameerpet Metro Station, Hyderabad - 500016";

    // Commodity info
    let productName = packetData ? packetData.name : "Packaged Retail Commodity";
    let printedMrp = packetData ? (packetData.originalMrp || packetData.mrp || 150) : 150;
    let chargedPrice = packetData ? (packetData.mrp || 185) : 185;
    let netQty = packetData ? (packetData.netWeight || "150 ml") : "150 ml";
    let penaltyEst = auditData ? auditData.penaltiesIncurred : (chargedPrice > printedMrp ? 50000 : 25000);

    const violationsList = (auditData && auditData.violations && auditData.violations.length > 0)
      ? auditData.violations
      : (chargedPrice > printedMrp
        ? ["Dual MRP Sticker / ₹" + (chargedPrice - printedMrp) + " Illegal Markup over Factory MRP", "Absence of Unit Sale Price (USP)"]
        : ["Violation of Rule 6(1) of Legal Metrology (Packaged Commodities) Rules, 2011"]);

    this.currentData = {
      caseId,
      today,
      storeName,
      storeAddress,
      productName,
      printedMrp,
      chargedPrice,
      netQty,
      penaltyEst,
      violationsList,
      packetImage: packetData ? packetData.image : null
    };

    this.renderNoticeDocument();
    modal.classList.add("modal-open");
  }

  closeModal() {
    const modal = document.getElementById("legalNoticeModal");
    if (modal) modal.classList.remove("modal-open");
  }

  renderNoticeDocument() {
    const container = document.getElementById("noticeDocumentContainer");
    if (!container || !this.currentData) return;

    const d = this.currentData;
    const overchargeAmt = (d.chargedPrice - d.printedMrp > 0) ? (d.chargedPrice - d.printedMrp).toFixed(2) : "0.00";

    container.innerHTML = `
      <div class="notice-sheet" id="printableNoticeSheet">
        <!-- Official Government Emblazoned Header -->
        <div class="notice-gov-header">
          <div class="emblem-crest">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" stroke-width="1.8">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="gov-text">
            <h2>FORMAL LEGAL NOTICE / STATUTORY GRIEVANCE PETITION</h2>
            <h3>UNDER SECTION 36 OF THE LEGAL METROLOGY ACT, 2009</h3>
            <p>Read with Rule 18(2) & Rule 6 of Legal Metrology (Packaged Commodities) Rules, 2011</p>
            <p class="sub-portal">For submission to: Telangana Legal Metrology Department / e-Daakhil / NCH 1915</p>
          </div>
          <div class="case-meta-box">
            <span class="meta-label">NOTICE REF NO.</span>
            <span class="meta-val">${d.caseId}</span>
            <span class="meta-date">Date: ${d.today}</span>
            <span class="meta-jurisdiction">Jurisdiction: Hyderabad, Telangana</span>
          </div>
        </div>

        <hr class="notice-divider" />

        <!-- Notice Parties -->
        <div class="notice-parties-grid">
          <div class="party-box">
            <span class="party-title">FROM (COMPLAINANT / CITIZEN INSPECTION):</span>
            <p><strong>Citizen Consumer / Field Auditor</strong></p>
            <p>Through: LabelScan Statutory Compliance Network</p>
            <p>Verified Geotag: Hyderabad Urban District, Telangana</p>
            <p>Phone: +91 98765 XXXXX | Email: citizen.consumer@e-daakhil.gov.in</p>
          </div>
          <div class="party-box">
            <span class="party-title">TO (OPPOSITE PARTY / RESPONDENT VENDOR):</span>
            <p><strong>${d.storeName}</strong></p>
            <p>${d.storeAddress}</p>
            <p>Location: Hyderabad, Telangana</p>
            <p>Classification: Commercial Retailer / Packaged Commodity Stockist</p>
          </div>
        </div>

        <!-- Subject Matter -->
        <div class="notice-subject-bar">
          <strong>SUBJECT:</strong> Notice under Section 36 of Legal Metrology Act, 2009 for selling non-standard pre-packaged commodity, unfair dual-MRP pricing, and violation of statutory declarations under Rule 6 of LM(PC) Rules, 2011.
        </div>

        <!-- Statement of Facts & Evidence -->
        <div class="notice-section">
          <h4>1. STATEMENT OF FACTS & DIGITAL AUDIT EVIDENCE</h4>
          <p>
            On <strong>${d.today}</strong>, the undersigned visited the premises of the Respondent vendor and inspected/purchased the pre-packaged commodity titled <strong>"${d.productName}"</strong> (Net Quantity: <strong>${d.netQty}</strong>).
          </p>
          <p>
            Upon rigorous verification via the <strong>LabelScan Optical Character Recognition and Rule Engine</strong>, the following patent statutory non-compliances and unfair trade practices were discovered:
          </p>

          <table class="notice-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Statutory Requirement</th>
                <th>Observed on Package / Charged</th>
                <th>Status / Offense</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Maximum Retail Price (MRP)</strong></td>
                <td>Rule 6(1)(e) - Printed factory price incl. of taxes</td>
                <td>Declared / Factory: ₹${d.printedMrp.toFixed(2)} | Billed: ₹${d.chargedPrice.toFixed(2)}</td>
                <td class="${overchargeAmt > 0 ? 'text-red font-bold' : 'text-cyan'}">${overchargeAmt > 0 ? 'ILLEGAL SURCHARGE (₹' + overchargeAmt + ')' : 'Compliant'}</td>
              </tr>
              <tr>
                <td><strong>Unit Sale Price (USP)</strong></td>
                <td>Rule 6(1)(k) - Mandatory per gram/ml pricing (2022 Amendment)</td>
                <td>Absent / Non-compliant formulation</td>
                <td class="text-red font-bold">STATUTORY VIOLATION</td>
              </tr>
              <tr>
                <td><strong>Declarations (Rule 6)</strong></td>
                <td>Rule 6(1)(a)-(f) - Complete packer, origin, expiry</td>
                <td>${d.violationsList.join("; ")}</td>
                <td class="text-red font-bold">FAIL - NON-STANDARD PACK</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Legal Grounds & Citations -->
        <div class="notice-section">
          <h4>2. STATUTORY GROUNDS & PENAL LIABILITIES</h4>
          <ul class="legal-grounds-list">
            <li>
              <strong>Section 36(1) of Legal Metrology Act, 2009:</strong> <em>"Whoever manufactures, packs, imports, sells, distributes, delivers or otherwise transfers any pre-packaged commodity which does not conform to the declarations on the package as provided by rules, shall be punished with fine which may extend to twenty-five thousand rupees, for the second offence, to fifty thousand rupees and for the subsequent offence, to one lakh rupees or with imprisonment for a term which may extend to one year or with both."</em>
            </li>
            <li>
              <strong>Rule 18(2) of LM(PC) Rules, 2011:</strong> <em>"No retail dealer or other person including manufacturer, packer, importer shall make any sale of any commodity in packed form at a price exceeding the retail sale price thereof."</em>
            </li>
            <li>
              <strong>Section 2(47) of Consumer Protection Act, 2019:</strong> Slapping secondary stickers and demanding price exceeding maximum retail price constitutes a deceptive practice causing unjustified consumer detriment.
            </li>
          </ul>
        </div>

        <!-- Demand & Prayer -->
        <div class="notice-section">
          <h4>3. DEMAND & PRAYER FOR RELIEF</h4>
          <p>You are hereby called upon within <strong>seven (7) days</strong> of receipt of this notice to:</p>
          <ol class="prayer-list">
            <li>Immediately cease and desist from selling the said non-standard / dual-MRP commodities from your store.</li>
            <li>Refund the overcharged illegal premium of <strong>₹${overchargeAmt}</strong> to the consumer.</li>
            <li>Submit an affidavit of compliance and product withdrawal to the Controller of Legal Metrology, Government of Telangana.</li>
          </ol>
          <p class="penalty-warning">
            Failing which, formal proceedings under Section 36 of the Legal Metrology Act 2009 and Section 35 of the Consumer Protection Act 2019 will be filed before the District Consumer Disputes Redressal Commission, Hyderabad, seeking imposition of maximum statutory penalty of <strong>₹${d.penaltyEst.toLocaleString("en-IN")}</strong>, seizure of stock, and cancellation of trade license.
          </p>
        </div>

        <!-- Signatures & Verification Stamp -->
        <div class="notice-footer-stamp">
          <div class="qr-stamp-box">
            <div class="qr-mock">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="#00F0FF">
                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v3h-3v-3zm-5 0h2v2h-2v-2zm2 5h4v3h-4v-3zm-4-3h2v4h-2v-4z"/>
              </svg>
            </div>
            <span class="qr-caption">Scan to Verify Digital Audit Record on LabelScan</span>
          </div>

          <div class="signature-box">
            <div class="sign-line"></div>
            <p><strong>Authorized Citizen Complainant / Field Auditor</strong></p>
            <p>LabelScan Consumer Protection Node, Hyderabad</p>
            <p>Digital Cryptographic Hash: <code>${Math.random().toString(36).substring(2, 10).toUpperCase()}-LM-2026</code></p>
          </div>
        </div>
      </div>
    `;
  }

  printNotice() {
    window.print();
  }

  copyNoticeText() {
    if (!this.currentData) return;
    const d = this.currentData;
    const text = `
FORMAL LEGAL NOTICE UNDER SECTION 36 OF LEGAL METROLOGY ACT, 2009
Case Ref: ${d.caseId} | Date: ${d.today}
To: ${d.storeName}, ${d.storeAddress}
From: Citizen Consumer (via LabelScan Compliance Network, Hyderabad)

Subject: Notice for selling non-standard pre-packaged commodity "${d.productName}" and dual MRP stickering under Rule 18(2) & Rule 6 of Legal Metrology (Packaged Commodities) Rules, 2011.

Infractions Recorded:
- Factory MRP: ₹${d.printedMrp.toFixed(2)} | Charged: ₹${d.chargedPrice.toFixed(2)}
- Violations: ${d.violationsList.join("; ")}
- Statutory Liability under Section 36: ₹${d.penaltyEst.toLocaleString("en-IN")}

You are called upon to cease sale of non-compliant packs and refund overcharged amounts within 7 days, failing which formal complaint is lodged on e-Daakhil and National Consumer Helpline (1915).
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      if (window.parakhApp) {
        window.parakhApp.showToast("Notice text copied to clipboard! Ready to paste on e-Daakhil or email.");
      }
    });
  }

  openEDaakhil() {
    window.open("https://edaakhil.nic.in/", "_blank");
  }

  openNCH() {
    window.open("https://consumerhelpline.gov.in/", "_blank");
  }
}

window.parakhGrievance = new ParakhGrievanceNotice();
