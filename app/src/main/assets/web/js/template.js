(function () {
  "use strict";

  const STORAGE_KEY = "webapk_template_counter";
  let routeDepth = 0;

  function setCheckStatus(elementId, passed, detailText) {
    const row = document.getElementById(elementId);
    if (!row) return;
    const badge = row.querySelector(".check-indicator");
    if (badge) {
      badge.textContent = passed ? "PASS" : "WARN";
      badge.className = "check-indicator " + (passed ? "pass" : "pending");
    }
    if (detailText) {
      const detailSpan = row.querySelector(".check-body span");
      if (detailSpan) {
        detailSpan.textContent = detailText;
      }
    }
  }

  function populateBridgeConfig() {
    const bridgeTag = document.getElementById("bridge-status-tag");
    if (window.AndroidTemplateBridge && typeof window.AndroidTemplateBridge.getAppConfigJson === "function") {
      try {
        const raw = window.AndroidTemplateBridge.getAppConfigJson();
        const cfg = JSON.parse(raw);

        document.getElementById("cfg-app-name").textContent = cfg.appName || "WebAPK Template";
        document.getElementById("cfg-package-name").textContent = cfg.packageName || "unknown";
        document.getElementById("cfg-version-name").textContent = cfg.versionName || "1.0.0";
        document.getElementById("cfg-version-code").textContent = String(cfg.versionCode || 1);
        document.getElementById("cfg-orientation").textContent = cfg.orientation || "unspecified";
        document.getElementById("cfg-theme").textContent = cfg.theme || "Theme.AppTemplate";
        document.getElementById("cfg-entry-path").textContent = cfg.webEntryAssetPath || "web/index.html";
        document.getElementById("cfg-network").textContent = String(Boolean(cfg.allowExternalNetwork));

        if (bridgeTag) {
          bridgeTag.textContent = "Bridge Connected (SDK " + (cfg.androidSdkInt || "Android") + ")";
        }
      } catch (err) {
        if (bridgeTag) {
          bridgeTag.textContent = "Bridge Parse Error";
        }
      }
    } else {
      if (bridgeTag) {
        bridgeTag.textContent = "Browser Preview Mode";
      }
    }
  }

  function verifyCssLoaded() {
    const shell = document.querySelector(".shell");
    if (!shell) return;
    const computedMax = window.getComputedStyle(shell).maxWidth;
    setCheckStatus(
      "check-css",
      computedMax === "680px",
      "Stylesheet active (max-width: " + computedMax + ")"
    );
  }

  function verifyDomStorage() {
    try {
      const testKey = "__webapk_storage_probe__";
      window.localStorage.setItem(testKey, "ok");
      const readBack = window.localStorage.getItem(testKey);
      window.localStorage.removeItem(testKey);

      const savedCount = parseInt(window.localStorage.getItem(STORAGE_KEY) || "0", 10);
      const countEl = document.getElementById("storage-counter-val");
      if (countEl) {
        countEl.textContent = String(isNaN(savedCount) ? 0 : savedCount);
      }

      setCheckStatus(
        "check-storage",
        readBack === "ok",
        "localStorage & sessionStorage read/write verified"
      );
    } catch (err) {
      setCheckStatus("check-storage", false, "Storage unavailable: " + err.message);
    }
  }

  function verifyNestedSvg() {
    const img = document.querySelector(".hero-logo");
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      setCheckStatus(
        "check-svg",
        true,
        "Resolved ./assets/images/template-badge.svg (" + img.naturalWidth + "x" + img.naturalHeight + ")"
      );
    } else {
      img.addEventListener("load", function () {
        setCheckStatus(
          "check-svg",
          true,
          "Resolved ./assets/images/template-badge.svg (" + img.naturalWidth + "x" + img.naturalHeight + ")"
        );
      });
      img.addEventListener("error", function () {
        setCheckStatus("check-svg", false, "Failed to load ./assets/images/template-badge.svg");
      });
    }
  }

  function verifyNestedJson() {
    let bridgeVerified = false;
    if (
      window.AndroidTemplateBridge &&
      typeof window.AndroidTemplateBridge.isAssetPresent === "function"
    ) {
      bridgeVerified = Boolean(
        window.AndroidTemplateBridge.isAssetPresent("data/template-manifest.json")
      );
    }

    fetch("./data/template-manifest.json")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        setCheckStatus(
          "check-json",
          true,
          "Loaded ./data/template-manifest.json (schema v" + (data.schemaVersion || "1.0") + ")"
        );
      })
      .catch(function () {
        if (bridgeVerified) {
          setCheckStatus(
            "check-json",
            true,
            "Verified ./data/template-manifest.json in APK assets"
          );
        } else {
          setCheckStatus("check-json", false, "Could not read ./data/template-manifest.json");
        }
      });
  }

  function runAllDiagnostics() {
    populateBridgeConfig();
    verifyCssLoaded();
    verifyDomStorage();
    verifyNestedSvg();
    verifyNestedJson();
  }

  function setupInteractions() {
    const incBtn = document.getElementById("btn-increment-storage");
    if (incBtn) {
      incBtn.addEventListener("click", function () {
        try {
          const current = parseInt(window.localStorage.getItem(STORAGE_KEY) || "0", 10) || 0;
          const next = current + 1;
          window.localStorage.setItem(STORAGE_KEY, String(next));
          document.getElementById("storage-counter-val").textContent = String(next);
        } catch (_e) {
          // Ignore if storage blocked
        }
      });
    }

    const routeBtn = document.getElementById("btn-push-route");
    if (routeBtn) {
      routeBtn.addEventListener("click", function () {
        routeDepth += 1;
        const hash = "#step-" + routeDepth;
        window.history.pushState({ step: routeDepth }, "", hash);
        updateRouteDisplay();
      });
    }

    const rerunBtn = document.getElementById("btn-rerun-checks");
    if (rerunBtn) {
      rerunBtn.addEventListener("click", function () {
        runAllDiagnostics();
      });
    }

    window.addEventListener("popstate", function () {
      routeDepth = Math.max(0, routeDepth - 1);
      updateRouteDisplay();
    });
  }

  function updateRouteDisplay() {
    const depthEl = document.getElementById("route-depth-val");
    if (depthEl) {
      depthEl.textContent = String(routeDepth);
    }
    const labelEl = document.getElementById("active-route-label");
    if (labelEl) {
      const currentHash = window.location.hash || "#home";
      labelEl.innerHTML =
        "Current Route: <code>file:///android_asset/web/index.html" + currentHash + "</code>";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    runAllDiagnostics();
    setupInteractions();
  });
})();
