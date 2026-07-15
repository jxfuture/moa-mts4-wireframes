(function () {
  const protectedHosts = ["jxfuture.github.io", "wireframe.moasis.ai"];
  const isProtectedHost = protectedHosts.includes(location.hostname);
  if (!isProtectedHost) return;

  const adminIdHash = "ca466e9bddd57bdccf2d445d21b955f01437ee92c6e0e20229e9db02ea812a99";
  const passwordHash = "58db3574f7359e617c32ab5155e7b3f51347eadc6492fd9215a6c1d665e65ce0";
  const sessionKey = "moaWireframeAdminSessionV1";
  const sessionTtlMs = 12 * 60 * 60 * 1000;

  const style = document.createElement("style");
  style.textContent = `
    html:not(.moa-auth-ready) body { visibility: hidden; }
    .moa-auth-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: grid;
      place-items: center;
      background: #f7f8fb;
      color: #232323;
      font-family: "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif;
    }
    .moa-auth-card {
      width: min(390px, calc(100vw - 32px));
      border: 1px solid #d6deea;
      border-radius: 16px;
      background: #fff;
      padding: 22px;
      box-shadow: 0 18px 44px rgba(15, 23, 42, .12);
    }
    .moa-auth-kicker { color: #3b66d6; font-size: 12px; font-weight: 900; }
    .moa-auth-title { margin-top: 5px; font-size: 23px; line-height: 30px; font-weight: 900; }
    .moa-auth-copy { margin-top: 8px; color: #667085; font-size: 13px; line-height: 20px; }
    .moa-auth-form { display: grid; gap: 10px; margin-top: 18px; }
    .moa-auth-form input {
      width: 100%;
      height: 44px;
      border: 1px solid #cfd7e3;
      border-radius: 10px;
      padding: 0 12px;
      font: inherit;
      font-size: 14px;
      outline: none;
    }
    .moa-auth-form input:focus { border-color: #3b66d6; box-shadow: 0 0 0 3px rgba(59, 102, 214, .13); }
    .moa-auth-form button {
      height: 44px;
      border: 0;
      border-radius: 10px;
      background: #232323;
      color: #fff;
      font: inherit;
      font-size: 14px;
      font-weight: 900;
      cursor: pointer;
    }
    .moa-auth-error { min-height: 18px; color: #e53935; font-size: 12px; font-weight: 800; }
    .moa-auth-note { margin-top: 12px; color: #98a2b3; font-size: 11px; line-height: 17px; }
  `;
  document.head.appendChild(style);

  if (hasValidSession()) {
    unlock();
    return;
  }

  document.addEventListener("DOMContentLoaded", renderLogin);

  function hasValidSession() {
    try {
      const session = JSON.parse(localStorage.getItem(sessionKey) || "null");
      return Boolean(session && session.ok === true && Date.now() - session.createdAt < sessionTtlMs);
    } catch {
      return false;
    }
  }

  function unlock() {
    document.querySelector(".moa-auth-overlay")?.remove();
    document.documentElement.classList.add("moa-auth-ready");
  }

  function renderLogin() {
    document.documentElement.classList.add("moa-auth-ready");
    const overlay = document.createElement("section");
    overlay.className = "moa-auth-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <div class="moa-auth-card">
        <div class="moa-auth-kicker">MOA Wireframe</div>
        <div class="moa-auth-title">관리자 전용 화면</div>
        <div class="moa-auth-copy">온라인 와이어프레임은 관리자 확인 후 접근할 수 있습니다.</div>
        <form class="moa-auth-form">
          <input name="adminId" autocomplete="username" placeholder="관리자 ID" aria-label="관리자 ID" />
          <input name="password" type="password" autocomplete="current-password" placeholder="비밀번호" aria-label="비밀번호" />
          <button type="submit">입장하기</button>
          <div class="moa-auth-error" aria-live="polite"></div>
        </form>
        <div class="moa-auth-note">접속 권한은 이 브라우저에 12시간 동안 유지됩니다.</div>
      </div>
    `;
    document.body.appendChild(overlay);

    const form = overlay.querySelector("form");
    const error = overlay.querySelector(".moa-auth-error");
    const firstInput = overlay.querySelector("input");
    firstInput.focus();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "확인 중입니다...";
      const formData = new FormData(form);
      const idOk = await matchesHash(String(formData.get("adminId") || ""), adminIdHash);
      const passwordOk = await matchesHash(String(formData.get("password") || ""), passwordHash);
      if (!idOk || !passwordOk) {
        error.textContent = "관리자 ID 또는 비밀번호가 맞지 않습니다.";
        return;
      }
      localStorage.setItem(sessionKey, JSON.stringify({ ok: true, createdAt: Date.now() }));
      unlock();
    });
  }

  async function matchesHash(value, expectedHash) {
    const normalized = value.trim();
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("") === expectedHash;
  }
})();
