// ParakhAI Flutter Model - Pre-Packaged Commodity & Vision Label Zones

class LabelZone {
  final String label;
  final String status; // 'pass', 'violation', 'warning'
  final String text;
  final double top;
  final double left;
  final double width;
  final double height;

  const LabelZone({
    required this.label,
    required this.status,
    required this.text,
    required this.top,
    required this.left,
    required this.width,
    required this.height,
  });
}

class CommodityItem {
  final String id;
  final String name;
  final String category;
  final String imagePath;
  final double mrp;
  final double? originalMrp;
  final String netWeight;
  final String unitSalePrice;
  final String mfgDate;
  final String expDate;
  final bool isExpired;
  final String countryOfOrigin;
  final String manufacturer;
  final String consumerCare;
  final List<LabelZone> zones;

  const CommodityItem({
    required this.id,
    required this.name,
    required this.category,
    required this.imagePath,
    required this.mrp,
    this.originalMrp,
    required this.netWeight,
    required this.unitSalePrice,
    required this.mfgDate,
    required this.expDate,
    required this.isExpired,
    required this.countryOfOrigin,
    required this.manufacturer,
    required this.consumerCare,
    required this.zones,
  });
}
