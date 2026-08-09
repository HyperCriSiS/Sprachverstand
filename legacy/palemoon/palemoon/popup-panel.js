(function (global) {
  "use strict";

  var POPUP_ID = "sprachverstand-popup-panel";
  var POPUP_BROWSER_ID = "sprachverstand-popup-browser";
  var POPUP_URL = "chrome://sprachverstand/content/popup/popup.html";
  var POPUP_WIDTH = 408;
  var POPUP_MAX_HEIGHT = 600;
  var POPUP_MIN_HEIGHT = 360;
  var POPUP_VERTICAL_MARGIN = 120;

  function panel() {
    return global.document.getElementById(POPUP_ID);
  }

  function popupBrowser() {
    return global.document.getElementById(POPUP_BROWSER_ID);
  }

  function refreshActiveTabCount() {
    try {
      if (global.SprachverstandPaleMoon) {
        global.SprachverstandPaleMoon.getCountText();
      }
    } catch (_error) {
      // The content document may be navigating while the panel is opened.
    }
  }

  function sizePopupBrowser() {
    var browser = popupBrowser();
    if (!browser) {
      return;
    }

    var availableHeight = POPUP_MAX_HEIGHT;
    if (typeof global.innerHeight === "number" && global.innerHeight > 0) {
      availableHeight = global.innerHeight - POPUP_VERTICAL_MARGIN;
    }

    var height = Math.max(
      POPUP_MIN_HEIGHT,
      Math.min(POPUP_MAX_HEIGHT, availableHeight)
    );

    browser.setAttribute("width", String(POPUP_WIDTH));
    browser.setAttribute("height", String(height));
  }

  function loadPopupDocument() {
    var browser = popupBrowser();
    if (!browser) {
      return;
    }

    browser.setAttribute("src", POPUP_URL);
  }

  function resetPopup() {
    var browser = popupBrowser();
    if (browser) {
      browser.setAttribute("src", "about:blank");
    }
  }

  function togglePopup(anchor) {
    var popup = panel();
    if (!popup || !anchor) {
      return;
    }

    if (popup.state === "open" || popup.state === "showing") {
      popup.hidePopup();
      return;
    }

    refreshActiveTabCount();
    sizePopupBrowser();
    loadPopupDocument();
    popup.openPopup(anchor, "after_end", 0, 0, false, false);
  }

  global.SprachverstandPaleMoonUI = {
    togglePopup: togglePopup,
    resetPopup: resetPopup
  };

  global.addEventListener(
    "unload",
    function () {
      resetPopup();
      delete global.SprachverstandPaleMoonUI;
    },
    { once: true }
  );
})(this);
