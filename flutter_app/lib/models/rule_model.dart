// ParakhAI Flutter Model - Statutory Metrology Rule & Audit Results

class MetrologyRule {
  final String id;
  final String ruleNo;
  final String name;
  final String description;
  final String sectionRef;
  final String penalty;

  const MetrologyRule({
    required this.id,
    required this.ruleNo,
    required this.name,
    required this.description,
    required this.sectionRef,
    required this.penalty,
  });
}

class RuleAuditVerdict {
  final String ruleNo;
  final String title;
  final String status; // 'PASS', 'FAIL', 'WARNING'
  final String message;
  final int penalty;
  final String? extractedValue;

  const RuleAuditVerdict({
    required this.ruleNo,
    required this.title,
    required this.status,
    required this.message,
    this.penalty = 0,
    this.extractedValue,
  });
}

class AuditReport {
  final String packetName;
  final String verdict; // 'COMPLIANT', 'CRITICAL VIOLATION', 'NON-COMPLIANT'
  final int complianceScore; // 0 - 100
  final List<String> violations;
  final int penaltiesIncurred;
  final Map<String, RuleAuditVerdict> ruleResults;

  const AuditReport({
    required this.packetName,
    required this.verdict,
    required this.complianceScore,
    required this.violations,
    required this.penaltiesIncurred,
    required this.ruleResults,
  });
}
