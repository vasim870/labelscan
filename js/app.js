// ParakhAI - Main Application Controller & Hybrid Web/Mobile System
// Midnight Navy / Electric Cyan / Soft Lavender GovTech Compliance System

class ParakhApp {
  constructor() {
    this.activeTab = "scanner";
    this.viewMode = "web"; // 'web' or 'mobile-device'
    this.deferredInstallPrompt = null;
    this.initNavigation();
    this.initMobileNav();
    this.initViewModeToggle();
    this.initMobileClock();
    this.initPwa();
    this.initRulesLibrary();
    this.initQuickDemos();
  }

  initNavigation() {
    const navItems = document.querySelectorAll(".nav-link-btn");
    navItems.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // Mobile drawer menu toggle for smaller screens
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const navMenu = document.getElementById("appNavMenu");
    if (mobileMenuBtn && navMenu) {
      mobileMenuBtn.addEventListener("click", () => {
        navMenu.classList.toggle("menu-open");
      });
    }
  }

  // Mobile bottom navigation bar handler (for mobile app view & small screens)
  initMobileNav() {
    const mobileNavBtns = document.querySelectorAll(".mobile-nav-btn");
    mobileNavBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;

    // Update active state in top desktop header nav
    const navItems = document.querySelectorAll(".nav-link-btn");
    navItems.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update active state in bottom mobile app bar
    const mobileNavBtns = document.querySelectorAll(".mobile-nav-btn");
    mobileNavBtns.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Show active tab view
    const views = document.querySelectorAll(".app-tab-view");
    views.forEach(view => {
      if (view.id === `tabView_${tabId}`) {
        view.classList.add("active-view");
      } else {
        view.classList.remove("active-view");
      }
    });

    // If switching to map, trigger Leaflet invalidateSize so tiles render correctly
    if (tabId === "map" && window.parakhMap && window.parakhMap.map) {
      setTimeout(() => {
        window.parakhMap.map.invalidateSize();
      }, 200);
    }

    // Close mobile dropdown menu if open
    const navMenu = document.getElementById("appNavMenu");
    if (navMenu) navMenu.classList.remove("menu-open");

    // Scroll container to top
    const scrollContainer = document.querySelector(".phone-screen-scroll");
    if (scrollContainer && this.viewMode === "mobile-device") {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Toggle between Full Web View and Simulated Smartphone App Frame
  initViewModeToggle() {
    const webBtn = document.getElementById("viewWebBtn");
    const mobileBtn = document.getElementById("viewMobileBtn");
    const container = document.getElementById("deviceFrameContainer");

    if (webBtn && mobileBtn && container) {
      webBtn.addEventListener("click", () => {
        this.viewMode = "web";
        webBtn.classList.add("active");
        mobileBtn.classList.remove("active");
        container.className = "device-frame-container layout-web";
        this.showToast("Switched to Desktop Web Portal View");
        if (window.parakhMap && window.parakhMap.map) {
          setTimeout(() => window.parakhMap.map.invalidateSize(), 300);
        }
      });

      mobileBtn.addEventListener("click", () => {
        this.viewMode = "mobile-device";
        mobileBtn.classList.add("active");
        webBtn.classList.remove("active");
        container.className = "device-frame-container layout-mobile-device";
        this.showToast("Switched to Mobile Smartphone App Mode");
        if (window.parakhMap && window.parakhMap.map) {
          setTimeout(() => window.parakhMap.map.invalidateSize(), 300);
        }
      });
    }
  }

  // Mobile status bar live clock
  initMobileClock() {
    const timeEl = document.getElementById("mobileStatusTime");
    const updateTime = () => {
      if (!timeEl) return;
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      minutes = minutes < 10 ? '0' + minutes : minutes;
      timeEl.innerText = `${hours}:${minutes}`;
    };
    updateTime();
    setInterval(updateTime, 30000);
  }

  // Progressive Web App (PWA) installation & Service Worker
  initPwa() {
    // 1. Register Service Worker for offline capability
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            console.log('ParakhAI ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('ServiceWorker registration error:', err);
          });
      });
    }

    // 2. Capture install prompt
    const installBtn = document.getElementById("pwaInstallBtn");
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      if (installBtn) {
        installBtn.style.display = "inline-flex";
      }
    });

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (this.deferredInstallPrompt) {
          this.deferredInstallPrompt.prompt();
          const { outcome } = await this.deferredInstallPrompt.userChoice;
          if (outcome === 'accepted') {
            this.showToast("Installing LabelScan Mobile App to your device!");
          }
          this.deferredInstallPrompt = null;
          installBtn.style.display = "none";
        } else {
          // Fallback guidance for desktop / iOS users
          this.showToast("To install on iOS: Tap Share -> 'Add to Home Screen'. On Android: Tap Chrome Menu -> 'Install App'.");
        }
      });
    }
  }

  initQuickDemos() {
    const demoButtons = document.querySelectorAll(".demo-chip");
    demoButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        demoButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const demoId = btn.dataset.demo;
        if (window.parakhScanner) {
          window.parakhScanner.loadDemoPacket(demoId);
        }
      });
    });
  }

  initRulesLibrary() {
    const container = document.getElementById("rulesLibraryContainer");
    if (!container) return;

    const rules = PARAKH_DATA.rules;
    container.innerHTML = rules.map(r => `
      <div class="rule-card">
        <div class="rule-card-top">
          <span class="rule-pill-num">${r.ruleNo}</span>
          <span class="rule-legal-section">${r.sectionRef}</span>
        </div>
        <h4 class="rule-card-title">${r.name}</h4>
        <p class="rule-card-desc">${r.description}</p>
        <div class="rule-penalty-box">
          <span class="penalty-tag">Statutory Penalty:</span>
          <p class="penalty-desc">${r.penalty}</p>
        </div>
      </div>
    `).join("");
  }

  showToast(message, duration = 3500) {
    let toast = document.getElementById("parakhGlobalToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "parakhGlobalToast";
      toast.className = "parakh-toast";
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <div class="toast-content">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        <span>${message}</span>
      </div>
    `;

    toast.classList.add("toast-show");
    setTimeout(() => {
      toast.classList.remove("toast-show");
    }, duration);
  }
}

// Global bootstrap on window load
window.addEventListener("DOMContentLoaded", () => {
  window.parakhApp = new ParakhApp();

  // Load the first demo packet automatically to provide an immediate interactive visual experience!
  setTimeout(() => {
    if (window.parakhScanner) {
      window.parakhScanner.loadDemoPacket("demo_compliant");
    }
  }, 400);
});
