(function () {
  const navItems = [
    { key: "home", label: "홈", href: "moa_mts4_home_wireframe.html" },
    { key: "cascade", label: "캐스케이드", href: "moa_mts4_cascade_main.html" },
    { key: "ai", label: "MOA AI", href: "moa_mts4_ai_fullscreen_wireframe.html" },
    { key: "market", label: "마켓", href: "moa_mts4_market.html" },
    { key: "portfolio", label: "포트폴리오", href: "moa_mts4_cascade_portfolio.html" }
  ];

  function currentFile() {
    const file = decodeURIComponent((location.pathname.split("/").pop() || "").toLowerCase());
    return file;
  }

  function activeKey(file) {
    if (file.includes("cascade") && !file.includes("portfolio")) return "cascade";
    if (file.includes("market") || file.includes("stock_")) return "market";
    if (file.includes("portfolio") || file.includes("cash") || file.includes("account")) return "portfolio";
    if (file.includes("_ai_") || file.includes("strategy") || file.includes("chart")) return "ai";
    return "home";
  }

  function normalizeBottomNav() {
    const file = currentFile();
    const active = activeKey(file);
    document.querySelectorAll(".bottom-nav").forEach((nav) => {
      nav.innerHTML = navItems.map((item) => {
        const cls = item.key === active ? "nav-item active" : "nav-item";
        return `<a class="${cls}" href="${item.href}"><div class="nav-icon"></div><div>${item.label}</div></a>`;
      }).join("");
    });
  }

  function normalizeMenuButtons() {
    document.querySelectorAll('a[href="moa_mts4_all_menu.html"]').forEach((link) => {
      if (link.classList.contains("icon-button") || link.classList.contains("menu-round")) {
        link.textContent = "☰";
        link.setAttribute("aria-label", "전체 메뉴");
      }
    });
  }

  function removeStrayQuestionMarks() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.nodeValue && node.nodeValue.trim() === "?" && node.parentElement && node.parentElement.tagName === "A") {
        node.nodeValue = "";
      }
    });
  }

  function addReviewMode() {
    const reviewSelectors = [
      ".phone-wrap > .caption",
      ".board > .annotation",
      ".board > .drawer",
      ".board > .state-panel",
      ".board > .flow-panel",
      ".board > aside.panel",
      ".board > section.panel",
      ".board > div.panel",
      ".board > .change-note",
      ".board > .legend"
    ];
    const hasReviewContent = reviewSelectors.some((selector) => document.querySelector(selector));
    if (!hasReviewContent || document.querySelector(".moa-review-toggle")) return;

    const style = document.createElement("style");
    style.textContent = `
      body:not(.moa-review-on) .caption,
      body:not(.moa-review-on) .annotation,
      body:not(.moa-review-on) .line,
      body:not(.moa-review-on) .drawer,
      body:not(.moa-review-on) .state-panel,
      body:not(.moa-review-on) .flow-panel,
      body:not(.moa-review-on) .board > aside.panel,
      body:not(.moa-review-on) .board > section.panel,
      body:not(.moa-review-on) .board > div.panel,
      body:not(.moa-review-on) .board > .change-note,
      body:not(.moa-review-on) .board > .legend {
        display: none !important;
      }

      body:not(.moa-review-on) .moa-review-rail {
        display: none !important;
      }

      body.moa-review-on .line {
        display: none !important;
      }

      .moa-review-rail {
        position: fixed;
        top: 70px;
        right: 22px;
        z-index: 9998;
        display: flex;
        flex-direction: column;
        gap: 14px;
        width: min(430px, calc(100vw - 44px));
        max-height: calc(100vh - 92px);
        overflow: auto;
        padding: 14px;
        border: 1px solid #d8d8d8;
        border-radius: 12px;
        background: rgba(255,255,255,.96);
        box-shadow: 0 12px 28px rgba(0,0,0,.14);
        box-sizing: border-box;
      }

      .moa-review-rail-title {
        margin: 0 0 2px;
        color: #232323;
        font-family: "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif;
        font-size: 13px;
        font-weight: 900;
      }

      .moa-review-rail > :not(.moa-review-rail-title) {
        position: static !important;
        left: auto !important;
        top: auto !important;
        right: auto !important;
        bottom: auto !important;
        width: auto !important;
        max-width: none !important;
        margin: 0 !important;
        box-sizing: border-box;
      }

      .moa-review-rail .caption,
      .moa-review-rail .annotation {
        display: block !important;
        padding: 10px 12px;
        border: 1px solid #e2e2e2;
        border-radius: 8px;
        background: #f8f8f8;
        text-align: left !important;
        color: #3464d8;
        font-size: 12px;
        font-weight: 900;
      }

      .moa-review-toggle {
        position: fixed;
        top: 22px;
        right: 22px;
        z-index: 9999;
        min-height: 34px;
        padding: 0 13px;
        border: 1px solid #232323;
        border-radius: 8px;
        background: #ffffff;
        color: #232323;
        font-family: "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif;
        font-size: 12px;
        font-weight: 900;
        box-shadow: 0 4px 14px rgba(0,0,0,.10);
        cursor: pointer;
      }

      body.moa-review-on .moa-review-toggle {
        background: #232323;
        color: #ffffff;
      }
    `;
    document.head.appendChild(style);

    const rail = document.createElement("aside");
    rail.className = "moa-review-rail";
    rail.setAttribute("aria-label", "기획 검토용 역할과 흐름");
    const railTitle = document.createElement("div");
    railTitle.className = "moa-review-rail-title";
    railTitle.textContent = "기획 검토용 역할/흐름";
    rail.appendChild(railTitle);
    reviewSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (!rail.contains(element) && element !== rail) rail.appendChild(element);
      });
    });
    document.body.appendChild(rail);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "moa-review-toggle";
    button.textContent = "역할/흐름 보기";
    button.addEventListener("click", () => {
      document.body.classList.toggle("moa-review-on");
      button.textContent = document.body.classList.contains("moa-review-on")
        ? "역할/흐름 숨기기"
        : "역할/흐름 보기";
    });
    document.body.appendChild(button);
  }

  function init() {
    normalizeMenuButtons();
    normalizeBottomNav();
    removeStrayQuestionMarks();
    addReviewMode();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
