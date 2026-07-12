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

  function normalizeHeaderBackButtons() {
    if (!document.querySelector("style[data-moa-logo-style]")) {
      const style = document.createElement("style");
      style.setAttribute("data-moa-logo-style", "true");
      style.textContent = `
        .moa-logo {
          width: 36px;
          height: 36px;
          border: 1px solid var(--line, #d4d4d4);
          border-radius: 9px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--blue, #3b66d6);
          font-family: "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif;
          font-size: 12px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: 0;
          box-sizing: border-box;
        }
      `;
      document.head.appendChild(style);
    }

    const headerSelectors = [
      ".appbar a",
      ".appbar .back",
      ".topbar a",
      ".topbar .back",
      ".toolbar a",
      ".toolbar .back",
      "header a",
      "header .back"
    ];

    document.querySelectorAll(headerSelectors.join(", ")).forEach((element) => {
      const text = (element.textContent || "").trim();
      const isBackArrow = text === "←" || text === "‹" || text === "<";
      const isBackClass = element.classList.contains("back");
      const isMenu = element.getAttribute("href") === "moa_mts4_all_menu.html" || text === "☰";
      if ((!isBackArrow && !isBackClass) || isMenu) return;

      const logo = document.createElement("div");
      logo.className = "moa-logo";
      logo.textContent = "MOA";
      logo.setAttribute("aria-label", "MOA");
      element.replaceWith(logo);
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

  function autoScrollMoaAIContent() {
    const isMoaAIChatPage = Boolean(document.querySelector(".content .bubble"));
    if (!isMoaAIChatPage) return;

    const scrollTargets = Array.from(document.querySelectorAll(".content")).filter((element) => {
      return element.querySelector(".bubble");
    });

    const scrollToBottom = () => {
      scrollTargets.forEach((element) => {
        element.scrollTop = element.scrollHeight;
      });
    };

    requestAnimationFrame(scrollToBottom);
    setTimeout(scrollToBottom, 120);
    setTimeout(scrollToBottom, 420);
  }

  function moaAiApiBase() {
    const configured = window.MOA_AI_API_BASE
      || document.querySelector('meta[name="moa-ai-api-base"]')?.getAttribute("content")
      || localStorage.getItem("moaAiApiBase");
    if (configured) return configured.replace(/\/$/, "");
    if (location.protocol === "http:" || location.protocol === "https:") return "";
    return "http://localhost:8787";
  }

  function enableLiveMoaAI() {
    const homeInput = document.getElementById("demoAiInput");
    const homeSend = document.getElementById("demoAiSend");
    const homeMic = document.getElementById("demoMicButton");
    if (homeInput && homeSend) {
      const sendHome = (source, event) => {
        if (event) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        const fallback = source === "voice" ? "음성으로 삼성전자 지금 사도 되는지 물어봤어요" : "";
        const message = homeInput.value.trim() || fallback;
        if (!message) return;
        openMoaAIWithMessage(message, source);
      };
      homeSend.addEventListener("click", (event) => sendHome("text", event), true);
      if (homeMic) homeMic.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        startSpeechInput({
          input: homeInput,
          statusTarget: document.querySelector(".typing"),
          onFinal: (message) => {
            if (message) openMoaAIWithMessage(message, "voice");
          }
        });
      }, true);
      homeInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") sendHome("text", event);
      }, true);
    }

    document.querySelectorAll(".composer, .chat-row, .chatbar").forEach((composer) => {
      if (composer.dataset.moaLiveBound === "true") return;
      const input = composer.querySelector(".input, .message-input, .chat-input");
      const send = Array.from(composer.querySelectorAll(".icon-button, .send")).at(-1);
      const mic = Array.from(composer.querySelectorAll(".icon-button, .mic, .voice")).at(0);
      if (!input || !send) return;
      composer.dataset.moaLiveBound = "true";

      if (input.tagName !== "INPUT" && input.tagName !== "TEXTAREA") {
        input.dataset.placeholder = input.textContent.trim() || "MOA AI에게 메시지 보내기";
        input.textContent = "";
        input.setAttribute("contenteditable", "true");
        input.setAttribute("role", "textbox");
        input.setAttribute("aria-label", input.dataset.placeholder);
        input.classList.add("moa-live-input");
      }

      const sendChat = (event, presetMessage = "") => {
        if (event) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        const message = presetMessage || readInputValue(input);
        if (!message) return;
        sendChatMessage(message, input);
      };

      send.addEventListener("click", sendChat, true);
      if (mic && mic !== send) {
        mic.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          startSpeechInput({
            input,
            statusTarget: mic,
            onFinal: (message) => sendChat(null, message)
          });
        }, true);
      }
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) sendChat(event);
      }, true);
    });

    consumePendingMoaAIMessage();
  }

  function openMoaAIWithMessage(message, source) {
    sessionStorage.setItem("moaPendingMessage", JSON.stringify({
      message,
      source,
      createdAt: Date.now()
    }));
    location.href = "moa_mts4_ai_fullscreen_wireframe.html";
  }

  function consumePendingMoaAIMessage() {
    const raw = sessionStorage.getItem("moaPendingMessage");
    if (!raw) return;
    const input = document.querySelector(".composer .input, .composer .message-input, .composer .chat-input");
    if (!input) return;

    sessionStorage.removeItem("moaPendingMessage");
    let pending = null;
    try {
      pending = JSON.parse(raw);
    } catch {
      pending = { message: raw };
    }
    const message = String(pending.message || "").trim();
    if (!message) return;
    setTimeout(() => sendChatMessage(message, input), 80);
  }

  function sendChatMessage(message, input) {
    const container = document.querySelector(".messages") || document.querySelector(".content");
    appendBubble(container, "user", message);
    const loading = appendBubble(container, "ai", "MOA AI가 답변을 준비하고 있습니다...");
    clearInputValue(input);
    submitMoaAIMessage(message, {
      loadingBubble: loading,
      chatContainer: container
    });
  }

  function startSpeechInput({ input, statusTarget, onFinal }) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setInputValue(input, "이 브라우저에서는 음성 인식이 지원되지 않습니다.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    let finalText = "";

    if (statusTarget) statusTarget.textContent = "듣는 중...";
    recognition.onresult = (event) => {
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript.trim();
        if (event.results[index].isFinal) finalText += `${transcript} `;
        else interimText += `${transcript} `;
      }
      setInputValue(input, `${finalText}${interimText}`.trim());
    };
    recognition.onerror = () => {
      if (statusTarget) statusTarget.textContent = "Mic";
    };
    recognition.onend = () => {
      const message = (finalText || readInputValue(input)).trim();
      if (statusTarget) statusTarget.textContent = statusTarget.classList?.contains("typing") ? "응답 중..." : "Mic";
      if (message && onFinal) onFinal(message);
    };
    recognition.start();
  }

  async function submitMoaAIMessage(message, targets) {
    if (targets.statusTarget) targets.statusTarget.textContent = "MOA AI 응답 중...";
    if (targets.responseShell) targets.responseShell.classList.add("show");
    if (targets.questionTarget) targets.questionTarget.textContent = message;

    try {
      const response = await fetch(`${moaAiApiBase()}/api/moa-ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          page: location.pathname.split("/").pop() || "wireframe",
          history: collectVisibleChatHistory()
        })
      });
      const data = await response.json();
      renderMoaAIResponse(data, targets);
    } catch (error) {
      renderMoaAIResponse({
        answer: "MOA AI 서버에 연결되지 않았습니다. 로컬에서 `npm run ai:server`를 실행한 뒤 다시 질문해 주세요.",
        choices: []
      }, targets);
    } finally {
      if (targets.statusTarget) targets.statusTarget.textContent = "응답 완료";
      if (targets.clearInput) targets.clearInput();
    }
  }

  function renderMoaAIResponse(data, targets) {
    const answer = data.answer || "답변을 가져오지 못했습니다.";
    if (targets.answerTarget) {
      targets.answerTarget.innerHTML = `<b>MOA AI</b><br />${escapeHtml(answer).replace(/\n/g, "<br />")}`;
    }
    if (targets.actionsTarget) {
      targets.actionsTarget.innerHTML = renderChoiceLinks(data.choices || []);
    }
    if (targets.loadingBubble) {
      targets.loadingBubble.innerHTML = `${escapeHtml(answer).replace(/\n/g, "<br />")}${renderInlineChoices(data.choices || [])}`;
    }
    if (targets.chatContainer) scrollElementToBottom(targets.chatContainer);
  }

  function renderChoiceLinks(choices) {
    if (!choices.length) return "";
    return choices.map((choice, index) => {
      const cls = index === 0 ? "dark" : "";
      return `<a class="${cls}" href="${escapeAttribute(choice.href || "#")}">${escapeHtml(choice.label || "보기")}</a>`;
    }).join("");
  }

  function renderInlineChoices(choices) {
    if (!choices.length) return "";
    const links = choices.map((choice) => {
      return `<a class="moa-live-choice" href="${escapeAttribute(choice.href || "#")}">${escapeHtml(choice.label || "보기")}</a>`;
    }).join("");
    return `<div class="moa-live-choices">${links}</div>`;
  }

  function appendBubble(container, type, text) {
    if (!container) return null;
    const bubble = document.createElement("div");
    bubble.className = `bubble ${type}`;
    bubble.textContent = text;
    container.appendChild(bubble);
    scrollElementToBottom(container);
    return bubble;
  }

  function collectVisibleChatHistory() {
    return Array.from(document.querySelectorAll(".bubble")).slice(-8).map((bubble) => ({
      role: bubble.classList.contains("ai") ? "assistant" : "user",
      content: bubble.textContent.trim()
    }));
  }

  function readInputValue(input) {
    if (!input) return "";
    return (input.value !== undefined ? input.value : input.textContent).trim();
  }

  function clearInputValue(input) {
    if (!input) return;
    if (input.value !== undefined) input.value = "";
    else input.textContent = "";
  }

  function setInputValue(input, value) {
    if (!input) return;
    if (input.value !== undefined) input.value = value;
    else input.textContent = value;
  }

  function scrollElementToBottom(element) {
    requestAnimationFrame(() => {
      element.scrollTop = element.scrollHeight;
    });
  }

  function addMoaLiveStyles() {
    if (document.querySelector("style[data-moa-live-style]")) return;
    const style = document.createElement("style");
    style.setAttribute("data-moa-live-style", "true");
    style.textContent = `
      .moa-live-input:empty::before {
        content: attr(data-placeholder);
        color: #aaa;
      }
      .moa-live-choices {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 7px;
        margin-top: 10px;
      }
      .moa-live-choice {
        min-height: 34px;
        border: 1px solid #bdbdbd;
        border-radius: 9px;
        background: #fff;
        color: #232323;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 8px;
        text-align: center;
        font-size: 11px;
        font-weight: 800;
      }
      .moa-live-choice:first-child {
        background: #232323;
        color: #fff;
        border-color: #232323;
      }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
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
    normalizeHeaderBackButtons();
    normalizeMenuButtons();
    normalizeBottomNav();
    removeStrayQuestionMarks();
    addReviewMode();
    addMoaLiveStyles();
    enableLiveMoaAI();
    autoScrollMoaAIContent();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
