// ParakhAI - Crowd-Sourced Hyderabad Store Violation Map
// Leaflet.js Map with Midnight Navy Dark CartoDB Tiles, Glowing Pins, and Community Verification

class ParakhViolationMap {
  constructor() {
    this.map = null;
    this.markers = [];
    this.stores = [...PARAKH_DATA.hyderabadStores];
    this.currentFilter = "all";
    this.initMap();
    this.renderStoreList();
    this.bindFilterButtons();
  }

  initMap() {
    const mapContainer = document.getElementById("hyderabadViolationMap");
    if (!mapContainer) return;

    // Center on central Hyderabad (Hussain Sagar / Secretariat / Ameerpet corridor)
    this.map = L.map("hyderabadViolationMap", {
      center: [17.4125, 78.4520],
      zoom: 12,
      zoomControl: false
    });

    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    // Midnight Navy Dark CartoDB Tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> | LabelScan Legal Metrology GIS',
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.map);

    this.renderMarkers();
  }

  // Create custom glowing HTML marker icons
  createCustomMarkerIcon(store) {
    let pinClass = "pin-cyan";
    let pulseClass = "pulse-cyan";
    let iconLetter = "✓";

    if (store.riskLevel === "CRITICAL") {
      pinClass = "pin-red";
      pulseClass = "pulse-red";
      iconLetter = "!";
    } else if (store.riskLevel === "MODERATE") {
      pinClass = "pin-lavender";
      pulseClass = "pulse-lavender";
      iconLetter = "▲";
    }

    const html = `
      <div class="custom-map-pin ${pinClass}">
        <div class="pin-pulse ${pulseClass}"></div>
        <div class="pin-core">${iconLetter}</div>
      </div>
    `;

    return L.divIcon({
      className: "parakh-div-icon",
      html: html,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  }

  renderMarkers() {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    const filtered = this.stores.filter(store => {
      if (this.currentFilter === "all") return true;
      if (this.currentFilter === "dual_mrp") return store.violationType === "dual_mrp";
      if (this.currentFilter === "missing_usp") return store.violationType === "missing_usp";
      if (this.currentFilter === "expired") return store.violationType === "expired_goods" || store.violationType === "imported_origin";
      if (this.currentFilter === "compliant") return store.riskLevel === "COMPLIANT";
      return true;
    });

    filtered.forEach(store => {
      const icon = this.createCustomMarkerIcon(store);
      const marker = L.marker([store.lat, store.lng], { icon: icon }).addTo(this.map);

      const popupContent = `
        <div class="map-popup-card">
          <div class="popup-top">
            <span class="popup-risk ${store.riskLevel.toLowerCase()}">${store.riskLevel}</span>
            <span class="popup-time">${store.lastReported}</span>
          </div>
          <h4 class="popup-store-name">${store.name}</h4>
          <p class="popup-area"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${store.area}</p>
          <div class="popup-violation-box">
            <strong>${store.primaryViolation}</strong>
          </div>
          <div class="popup-flagged">
            <span>Flagged Goods:</span>
            <ul>
              ${store.flaggedProducts.map(p => `<li>${p}</li>`).join("")}
            </ul>
          </div>
          <div class="popup-footer">
            <div class="popup-tally">
              <span class="tally-count" id="tally_${store.id}">${store.verifiedCount}</span>
              <span class="tally-sub">Citizens Verified</span>
            </div>
            <button class="btn btn-sm btn-cyan" onclick="window.parakhMap.verifyStore('${store.id}')">
              +1 Verify Report
            </button>
          </div>
          <div class="popup-officer-status">
            <span>Enforcement Status:</span>
            <em>${store.inspectorAction}</em>
          </div>
          <button class="btn btn-sm btn-outline-full mt-2" onclick="window.parakhMap.fileStoreNotice('${store.id}')">
            Issue Formal Legal Notice
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 320, className: "custom-leaflet-popup" });
      this.markers.push(marker);
    });
  }

  // Populate sidebar or bottom list of stores
  renderStoreList() {
    const listContainer = document.getElementById("storesListContainer");
    if (!listContainer) return;

    listContainer.innerHTML = this.stores.map(store => {
      const riskClass = store.riskLevel === "CRITICAL" ? "risk-critical" : (store.riskLevel === "MODERATE" ? "risk-mod" : "risk-ok");
      return `
        <div class="store-list-item ${riskClass}" onclick="window.parakhMap.zoomToStore('${store.id}')">
          <div class="store-item-header">
            <span class="store-title">${store.name}</span>
            <span class="store-badge ${riskClass}">${store.riskLevel}</span>
          </div>
          <p class="store-location">${store.area}</p>
          <p class="store-infraction">${store.primaryViolation}</p>
          <div class="store-item-footer">
            <span class="store-reports">${store.violationsCount} violations reported</span>
            <span class="store-verified">${store.verifiedCount} verified</span>
          </div>
        </div>
      `;
    }).join("");
  }

  zoomToStore(storeId) {
    const store = this.stores.find(s => s.id === storeId);
    if (store && this.map) {
      this.map.flyTo([store.lat, store.lng], 15, { duration: 1.2 });
      // Find matching marker and open popup
      const marker = this.markers.find(m => {
        const pos = m.getLatLng();
        return Math.abs(pos.lat - store.lat) < 0.0001 && Math.abs(pos.lng - store.lng) < 0.0001;
      });
      if (marker) {
        setTimeout(() => marker.openPopup(), 1200);
      }
    }
  }

  verifyStore(storeId) {
    const store = this.stores.find(s => s.id === storeId);
    if (!store) return;
    store.verifiedCount += 1;
    const tallyEl = document.getElementById(`tally_${storeId}`);
    if (tallyEl) tallyEl.innerText = store.verifiedCount;
    this.renderStoreList();
    if (window.parakhApp) {
      window.parakhApp.showToast(`Thank you! Verification logged for ${store.name}.`);
    }
  }

  fileStoreNotice(storeId) {
    const store = this.stores.find(s => s.id === storeId);
    if (!store) return;
    // Switch to Grievance tab and pre-fill store details
    if (window.parakhGrievance) {
      window.parakhGrievance.openNoticeModal(
        {
          name: store.flaggedProducts[0] || "Sample Commodity",
          category: store.primaryViolation,
          mrp: 150.00,
          originalMrp: 120.00,
          netWeight: "100 g",
          unitSalePrice: "MISSING",
          manufacturer: store.name + ", " + store.address,
          countryOfOrigin: "India",
          isExpired: store.violationType === "expired_goods"
        },
        null,
        store
      );
    }
  }

  bindFilterButtons() {
    const filterButtons = document.querySelectorAll(".map-filter-chip");
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentFilter = btn.dataset.filter;
        this.renderMarkers();
      });
    });
  }

  // Open "Tag a Store in Hyderabad" modal
  openReportModal(packetData, auditData) {
    const modal = document.getElementById("reportStoreModal");
    if (!modal) return;

    if (packetData) {
      const prodInput = document.getElementById("reportProductInput");
      if (prodInput) prodInput.value = packetData.name || "";
      const infractionInput = document.getElementById("reportInfractionInput");
      if (infractionInput) {
        infractionInput.value = (auditData && auditData.violations && auditData.violations[0]) || "Dual MRP / Missing USP";
      }
    }

    modal.classList.add("modal-open");
  }

  closeReportModal() {
    const modal = document.getElementById("reportStoreModal");
    if (modal) modal.classList.remove("modal-open");
  }

  submitNewStoreReport(event) {
    event.preventDefault();
    const name = document.getElementById("reportStoreName").value.trim();
    const area = document.getElementById("reportStoreArea").value.trim();
    const violationType = document.getElementById("reportViolationSelect").value;
    const description = document.getElementById("reportDescription").value.trim();
    const product = document.getElementById("reportProductInput").value.trim();

    if (!name || !area) {
      alert("Please enter store name and area in Hyderabad.");
      return;
    }

    // Assign realistic coordinates around Hyderabad based on area selection
    const areaCoordinates = {
      "Ameerpet": [17.4375, 78.4483],
      "Begumpet": [17.4448, 78.4682],
      "Banjara Hills": [17.4156, 78.4347],
      "Madhapur": [17.4399, 78.3807],
      "Secunderabad": [17.4344, 78.5015],
      "Charminar": [17.3616, 78.4747],
      "Kukatpally": [17.4947, 78.3996],
      "Gachibowli": [17.4225, 78.3375],
      "Somajiguda": [17.4241, 78.4578],
      "Uppal": [17.4018, 78.5602],
      "Dilsukhnagar": [17.3688, 78.5247],
      "Tolichowki": [17.4037, 78.4093]
    };

    let baseCoord = areaCoordinates[area] || [17.4065 + (Math.random() - 0.5) * 0.08, 78.4772 + (Math.random() - 0.5) * 0.08];
    // Add small random jitter so pins don't overlap exactly
    const lat = baseCoord[0] + (Math.random() - 0.5) * 0.008;
    const lng = baseCoord[1] + (Math.random() - 0.5) * 0.008;

    const newStore = {
      id: "hyd_user_" + Date.now(),
      name: name,
      area: `${area}, Hyderabad`,
      address: `${name}, Near Main Road, ${area}, Hyderabad - 5000${Math.floor(10 + Math.random() * 80)}`,
      lat: lat,
      lng: lng,
      riskLevel: "CRITICAL",
      primaryViolation: description || "Dual MRP Sticker / Illegal Surcharge",
      violationType: violationType,
      violationsCount: 1,
      verifiedCount: 1,
      lastReported: "Just now (Citizen Report)",
      flaggedProducts: [product || "Flagged Pre-packaged Good"],
      inspectorAction: "Dispatched to Local Legal Metrology Field Inspector",
      status: "Investigation Queued"
    };

    this.stores.unshift(newStore);
    this.renderMarkers();
    this.renderStoreList();
    this.closeReportModal();

    // Fly to new marker
    this.map.flyTo([lat, lng], 14, { duration: 1.2 });
    if (window.parakhApp) {
      window.parakhApp.showToast(`Violation pin successfully added for ${name}! Geotagged to Hyderabad Metrology Grid.`);
    }
  }
}

// Initialized when DOM is ready in app.js or immediately if DOM is already parsed
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.parakhMap = new ParakhViolationMap();
  });
} else {
  window.parakhMap = new ParakhViolationMap();
}
