(function () {
  "use strict";

  var THEME_KEY = "portfolio-theme";
  var PALETTE_KEY = "portfolio-palette";
  var VALID_PALETTES = ["indigo", "terracotta", "emerald", "plum"];

  var root = document.documentElement;
  var themeToggle = document.getElementById("theme-toggle");
  var themeLabel = document.getElementById("theme-label");
  var themeMeta = document.getElementById("theme-color-meta");
  var paletteSwatches = document.querySelectorAll(".palette-swatch");

  var header = document.getElementById("site-header");
  var menuToggle = document.getElementById("menu-toggle");
  var nav = document.getElementById("site-nav");
  var navLinks = document.querySelectorAll(".site-nav .nav-link");
  var sections = document.querySelectorAll("main section[id]");
  var filterTabs = document.querySelectorAll(".filter-tab");
  var projectCards = document.querySelectorAll(".project-card");
  var copyBtn = document.getElementById("copy-email-btn");
  var copyText = document.getElementById("copy-email-text");

  /* 1. Day & Night Theme + Color Palette Switcher */
  function syncThemeColorMeta() {
    if (!themeMeta) return;
    var bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    if (bg) {
      themeMeta.setAttribute("content", bg);
    }
  }

  function getPreferredTheme() {
    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch (err) {
      /* Ignore storage restrictions */
    }

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  function getPreferredPalette() {
    try {
      var saved = localStorage.getItem(PALETTE_KEY);
      if (saved && VALID_PALETTES.indexOf(saved) !== -1) {
        return saved;
      }
    } catch (err) {
      /* Ignore storage restrictions */
    }
    return "indigo";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var isDark = theme === "dark";

    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.setAttribute(
        "aria-label",
        isDark ? "Switch to day theme" : "Switch to night theme"
      );
    }

    if (themeLabel) {
      themeLabel.textContent = isDark ? "Day" : "Night";
    }

    syncThemeColorMeta();
  }

  function applyPalette(palette) {
    if (VALID_PALETTES.indexOf(palette) === -1) {
      palette = "indigo";
    }
    root.setAttribute("data-palette", palette);

    paletteSwatches.forEach(function (swatch) {
      var isCurrent = swatch.getAttribute("data-palette") === palette;
      swatch.classList.toggle("active", isCurrent);
      swatch.setAttribute("aria-checked", String(isCurrent));
    });

    syncThemeColorMeta();
  }

  applyPalette(getPreferredPalette());
  applyTheme(getPreferredTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (err) {
        /* Ignore storage restrictions */
      }
    });
  }

  paletteSwatches.forEach(function (swatch) {
    swatch.addEventListener("click", function () {
      var chosen = swatch.getAttribute("data-palette");
      applyPalette(chosen);
      try {
        localStorage.setItem(PALETTE_KEY, chosen);
      } catch (err) {
        /* Ignore storage restrictions */
      }
    });
  });

  if (window.matchMedia) {
    var colorQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if (colorQuery.addEventListener) {
      colorQuery.addEventListener("change", function (event) {
        try {
          if (localStorage.getItem(THEME_KEY)) return;
        } catch (err) {
          /* Continue with system change */
        }
        applyTheme(event.matches ? "dark" : "light");
      });
    }
  }

  /* 2. Sticky Header State & Active Nav Highlighting */
  function handleScroll() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }

    var scrollPos = window.scrollY + 120;
    var activeId = "";

    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) {
        activeId = sec.id;
      }
    });

    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24) {
      activeId = "contact";
    }

    navLinks.forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var id = href.charAt(0) === "#" ? href.slice(1) : "";
      link.classList.toggle("is-active", id !== "" && id === activeId);
    });
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  /* 3. Mobile Navigation Drawer */
  function setMenuState(isOpen) {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    nav.classList.toggle("is-open", isOpen);
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      var isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      setMenuState(!isOpen);
    });

    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        setMenuState(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setMenuState(false);
      }
    });

    document.addEventListener("click", function (event) {
      if (header && !header.contains(event.target)) {
        setMenuState(false);
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 840) {
        setMenuState(false);
      }
    });
  }

  /* 4. Project Category Filter */
  filterTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var filter = tab.getAttribute("data-filter");

      filterTabs.forEach(function (item) {
        var isActive = item === tab;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });

      projectCards.forEach(function (card) {
        var category = card.getAttribute("data-category");
        var visible = filter === "all" || category === filter;
        card.classList.toggle("is-hidden", !visible);
      });
    });
  });

  /* 5. Copy Email to Clipboard */
  if (copyBtn && copyText) {
    var timer = null;

    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email");
      if (!email) return;

      function confirmCopied() {
        copyText.textContent = "Email Copied";
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
          copyText.textContent = "Copy Email";
        }, 2000);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(confirmCopied).catch(function () {
          copyFallback(email, confirmCopied);
        });
      } else {
        copyFallback(email, confirmCopied);
      }
    });
  }

  function copyFallback(value, onDone) {
    var area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      onDone();
    } catch (err) {
      /* Ignore clipboard errors */
    }
    document.body.removeChild(area);
  }
})();
