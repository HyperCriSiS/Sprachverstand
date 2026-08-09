(function (global) {
  "use strict";

  var POPUP_ID = "sprachverstand-popup-panel";
  var POPUP_BROWSER_ID = "sprachverstand-popup-browser";
  var POPUP_URL = "chrome://sprachverstand/content/popup/popup.html";

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
