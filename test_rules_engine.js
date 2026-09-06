// Test script for Legal Metrology Rules Engine
const fs = require('fs');
const vm = require('vm');

// Load data.js and rules-engine.js into context
const dataCode = fs.readFileSync(__dirname + '/js/data.js', 'utf8');
const rulesCode = fs.readFileSync(__dirname + '/js/rules-engine.js', 'utf8');

const context = { window: {}, console: console };
vm.createContext(context);
vm.runInContext(dataCode, context);
vm.runInContext(rulesCode, context);

const PARAKH_DATA = context.window.PARAKH_DATA || context.PARAKH_DATA;
const engine = context.window.parakhRulesEngine;

console.log("=== RUNNING RULES ENGINE TESTS ===");

const packets = PARAKH_DATA.demoPackets;
let passed = 0;

packets.forEach(packet => {
  const result = engine.auditPacket(packet);
  console.log(`\nTesting packet: ${packet.name}`);
  console.log(`  Verdict: ${result.verdict} (Score: ${result.complianceScore}%)`);
  console.log(`  Passed Rules: ${result.passedRulesCount}/9 | Violations: ${result.violations.length}`);
  console.log(`  Penalty Liability: ₹ ${result.penaltiesIncurred.toLocaleString('en-IN')}`);

  if (packet.id === "demo_compliant") {
    if (result.verdict === "COMPLIANT" && result.complianceScore >= 90 && result.violations.length === 0) {
      console.log("  [PASS] Compliant packet verified accurately.");
      passed++;
    } else {
      console.error("  [FAIL] Expected COMPLIANT packet to pass all rules.");
    }
  }

  if (packet.id === "demo_dual_mrp") {
    if (result.verdict === "CRITICAL VIOLATION" && result.ruleResults.rule_6_1_e.status === "FAIL") {
      console.log("  [PASS] Dual-MRP sticker caught and flagged under Section 36 & Rule 18.");
      passed++;
    } else {
      console.error("  [FAIL] Expected Dual MRP to trigger CRITICAL VIOLATION.");
    }
  }

  if (packet.id === "demo_missing_usp") {
    if (result.ruleResults.rule_6_1_k.status === "FAIL") {
      console.log("  [PASS] Missing USP caught and flagged under 2022 amendment.");
      passed++;
    } else {
      console.error("  [FAIL] Expected Missing USP to trigger failure.");
    }
  }

  if (packet.id === "demo_imported_origin") {
    if (result.ruleResults.rule_6_1_d_exp.status === "FAIL" && result.ruleResults.rule_6_1_aa.status === "FAIL") {
      console.log("  [PASS] Expired commodity & Missing Origin caught.");
      passed++;
    } else {
      console.error("  [FAIL] Expected Expired commodity and missing origin to trigger failure.");
    }
  }
});

console.log(`\n=== TEST SUMMARY: ${passed}/${packets.length} TESTS PASSED ===`);
if (passed === packets.length) {
  process.exit(0);
} else {
  process.exit(1);
}
