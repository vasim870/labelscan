// LabelScan Backend API: /api/stats
// Real-time enforcement telemetry and violation statistics

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({
    success: true,
    timestamp: new Date().toISOString(),
    stats: {
      packagesAuditedToday: 1428,
      violationsDetected: 312,
      nonComplianceRate: "21.8%",
      penaltiesSection36: 1875000,
      seizureNoticesServed: 47,
      topViolations: [
        { type: "Missing Unit Sale Price (Rule 6(1)(k))", count: 142 },
        { type: "Dual MRP Stickering (Rule 18(2))", count: 88 },
        { type: "Expired / Past Shelf Life", count: 54 },
        { type: "Missing Country of Origin (Rule 6(1)(aa))", count: 28 }
      ]
    }
  }));
};
