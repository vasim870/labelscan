import 'package:flutter/material.dart';
import 'models/commodity_model.dart';
import 'models/rule_model.dart';
import 'services/compliance_engine.dart';

void main() {
  runApp(const LabelScanApp());
}

class LabelScanApp extends StatelessWidget {
  const LabelScanApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LabelScan',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF070B14),
        primaryColor: const Color(0xFF00F0FF),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00F0FF),
          secondary: Color(0xFFC4B5FD),
          surface: Color(0xFF0D1527),
          error: Color(0xFFFF3366),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF070B14),
          elevation: 0,
        ),
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  bool _isInspectorMode = false;
  CommodityItem _currentCommodity = ComplianceEngine.sampleCommodities[0];
  late AuditReport _auditReport;

  @override
  void initState() {
    super.initState();
    _auditReport = ComplianceEngine.auditCommodity(_currentCommodity);
  }

  void _switchCommodity(CommodityItem item) {
    setState(() {
      _currentCommodity = item;
      _auditReport = ComplianceEngine.auditCommodity(item);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF00F0FF).withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF00F0FF)),
              ),
              child: const Icon(Icons.qr_code_scanner, color: Color(0xFF00F0FF), size: 20),
            ),
            const SizedBox(width: 10),
            RichText(
              text: const TextSpan(
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                children: [
                  TextSpan(text: 'LABEL', style: TextStyle(color: Color(0xFF00F0FF))),
                  TextSpan(text: 'SCAN', style: TextStyle(color: Colors.white)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: _isInspectorMode ? 'Switch to Citizen' : 'Switch to Inspector HUD',
            icon: Icon(
              _isInspectorMode ? Icons.shield : Icons.person_outline,
              color: _isInspectorMode ? const Color(0xFF00F0FF) : const Color(0xFFC4B5FD),
            ),
            onPressed: () {
              setState(() {
                _isInspectorMode = !_isInspectorMode;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: const Color(0xFF0D1527),
                  content: Text(
                    _isInspectorMode ? 'Switched to Inspector HUD' : 'Switched to Citizen Mode',
                    style: const TextStyle(color: Color(0xFF00F0FF)),
                  ),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildScannerScreen(),
          _buildMapScreen(),
          _buildDashboardScreen(),
          _buildNoticeScreen(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: const Color(0xFF0D1527),
        selectedItemColor: const Color(0xFF00F0FF),
        unselectedItemColor: const Color(0xFF64748B),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.center_focus_weak), label: 'Scanner'),
          BottomNavigationBarItem(icon: Icon(Icons.map_outlined), label: 'Hyd Map'),
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.description_outlined), label: 'Notice'),
        ],
      ),
    );
  }

  // 1. Scanner Screen
  Widget _buildScannerScreen() {
    final isPass = _auditReport.verdict == "COMPLIANT";
    final isCritical = _auditReport.verdict == "CRITICAL VIOLATION";

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Viewport Card
          Container(
            height: 280,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFF03060C),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.3)),
            ),
            child: Stack(
              children: [
                Center(
                  child: Image.asset(
                    _currentCommodity.imagePath,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Icon(Icons.inventory_2_outlined, size: 80, color: Color(0xFF00F0FF)),
                  ),
                ),
                // Laser scan line overlay
                Align(
                  alignment: Alignment.center,
                  child: Container(
                    height: 2,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.transparent, const Color(0xFF00F0FF), Colors.transparent],
                      ),
                      boxShadow: [
                        BoxShadow(color: const Color(0xFF00F0FF).withOpacity(0.8), blurRadius: 10, spreadRadius: 2),
                      ],
                    ),
                  ),
                ),
                // Status Pill
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF070B14).withOpacity(0.85),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.4)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircleAvatar(radius: 4, backgroundColor: isPass ? Colors.green : Colors.red),
                        const SizedBox(width: 6),
                        Text(_auditReport.verdict, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Test packet chips
          const Text('Pre-loaded FMCG Test Cases:', style: TextStyle(color: Color(0xFFC4B5FD), fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ComplianceEngine.sampleCommodities.map((item) {
                final isSelected = _currentCommodity.id == item.id;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(item.name.split(" ")[0] + " " + item.name.split(" ")[1]),
                    selected: isSelected,
                    selectedColor: const Color(0xFF00F0FF).withOpacity(0.2),
                    side: BorderSide(color: isSelected ? const Color(0xFF00F0FF) : const Color(0xFF1E293B)),
                    onSelected: (_) => _switchCommodity(item),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),

          // Audit Summary Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF0D1527),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_currentCommodity.category, style: const TextStyle(color: Color(0xFFC4B5FD), fontSize: 11)),
                          Text(_currentCommodity.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('Trust Score', style: TextStyle(color: Color(0xFF64748B), fontSize: 10)),
                        Text('${_auditReport.complianceScore}%', style: TextStyle(color: isPass ? const Color(0xFF00F0FF) : Colors.red, fontSize: 20, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
                if (_auditReport.violations.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.withOpacity(0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.warning_amber_rounded, color: Colors.red, size: 16),
                            SizedBox(width: 6),
                            Text('Detected Violations', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ..._auditReport.violations.map((v) => Text('• $v', style: const TextStyle(fontSize: 12))),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00F0FF),
                      foregroundColor: const Color(0xFF070B14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () => setState(() => _currentIndex = 3),
                    icon: const Icon(Icons.gavel),
                    label: const Text('Generate Section 36 Notice', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 2. Hyderabad Violation Map Screen
  Widget _buildMapScreen() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          height: 260,
          decoration: BoxDecoration(
            color: const Color(0xFF0D1527),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.3)),
          ),
          child: Stack(
            children: [
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.map, size: 50, color: Color(0xFF00F0FF)),
                    SizedBox(height: 8),
                    Text('Hyderabad Metrology GIS Network', style: TextStyle(fontWeight: FontWeight.bold)),
                    Text('10 Active Hotspots Monitored', style: TextStyle(color: Color(0xFFC4B5FD), fontSize: 12)),
                  ],
                ),
              ),
              Positioned(
                top: 12,
                left: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('Live GPS: 17.3850° N, 78.4867° E', style: TextStyle(fontSize: 10, color: Color(0xFF00F0FF))),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text('Hyderabad Stores Audit Feed:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        _buildStoreItem("Sri Balaji Kirana & Super Bazaar", "Ameerpet Metro", "Dual MRP Stickering (+₹35 markup)", Colors.red, 42),
        _buildStoreItem("Ratnadeep Supermarket", "Begumpet Airport Rd", "Missing Unit Sale Price on bulk packs", Colors.amber, 29),
        _buildStoreItem("Nature's Basket Gourmet", "Banjara Hills Rd 12", "Imported Chocolates Missing Origin", Colors.red, 56),
        _buildStoreItem("Q-Mart Convenience Express", "Madhapur Hitec City", "Certified Compliant (Score 96%)", Colors.green, 88),
      ],
    );
  }

  Widget _buildStoreItem(String name, String loc, String violation, Color color, int verified) {
    return Card(
      color: const Color(0xFF0D1527),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: color.withOpacity(0.3)),
      ),
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: CircleAvatar(backgroundColor: color.withOpacity(0.2), child: Icon(Icons.store, color: color)),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(loc, style: const TextStyle(color: Color(0xFF00F0FF), fontSize: 11)),
            Text(violation, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('$verified', style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold)),
            const Text('Verified', style: TextStyle(fontSize: 9, color: Color(0xFF64748B))),
          ],
        ),
      ),
    );
  }

  // 3. Dashboard Screen
  Widget _buildDashboardScreen() {
    if (_isInspectorMode) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Legal Metrology Officer HUD', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF00F0FF))),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _buildMetricTile("Audits Today", "1,428", const Color(0xFF00F0FF))),
              const SizedBox(width: 8),
              Expanded(child: _buildMetricTile("Violations", "312", Colors.red)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: _buildMetricTile("Penalties Proposed", "₹ 18.75 L", const Color(0xFFC4B5FD))),
              const SizedBox(width: 8),
              Expanded(child: _buildMetricTile("Seizure Notices", "47", Colors.orange)),
            ],
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('"Am I Being Cheated?" Unit Price Calculator', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        const Text('Verify if package USP conforms with Rule 6(1)(k)', style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF0D1527),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF00F0FF).withOpacity(0.2)),
          ),
          child: Column(
            children: [
              const TextField(
                decoration: InputDecoration(labelText: 'Package MRP (₹)', border: OutlineInputBorder()),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              const TextField(
                decoration: InputDecoration(labelText: 'Net Quantity (grams/ml)', border: OutlineInputBorder()),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFF00F0FF).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('Calculated Fair USP: ₹ 0.25 / g', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMetricTile(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0D1527),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF64748B), fontSize: 10, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  // 4. Legal Notice Screen
  Widget _buildNoticeScreen() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Center(
              child: Text(
                'FORMAL LEGAL NOTICE UNDER SECTION 36\nLEGAL METROLOGY ACT, 2009',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
            const Divider(color: Colors.black),
            const Text('Case Ref: LABELSCAN-HYD-2026-4891', style: TextStyle(color: Colors.black87, fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Respondent: ${_currentCommodity.manufacturer}', style: const TextStyle(color: Colors.black87, fontSize: 11)),
            Text('Commodity: ${_currentCommodity.name}', style: const TextStyle(color: Colors.black87, fontSize: 11)),
            Text('Offense: Selling commodity in packed form in violation of Rule 6 & Rule 18(2). Penalty: ₹${_auditReport.penaltiesIncurred}', style: const TextStyle(color: Colors.red, fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            const Text('You are hereby called upon within 7 days to cease sale of non-standard packs and refund overcharged amounts.', style: TextStyle(color: Colors.black87, fontSize: 11)),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                Text('Digital Hash Verified', style: TextStyle(color: Colors.black54, fontSize: 9)),
                Text('LabelScan Legal Node, Hyd', style: TextStyle(color: Colors.black54, fontSize: 9, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
