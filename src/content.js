(() => {
  if (window.__chatCleanInitialized) return;
  window.__chatCleanInitialized = true;

  const STYLE_ID = "chatclean-style";
  const HIDDEN_CLASS = "chatclean-hidden";
  const REWARD_PATTERN = /resgatou\s+b[oô]nus\b/i;
  const MESSAGE_SELECTORS = [
    '[data-testid*="chat-message" i]',
    '[class*="chat-message" i]',
    '[class*="chatMessage" i]',
    '[class*="chat-entry" i]',
    '[class*="ChatEntry" i]',
    '[class*="message-container" i]',
    '[class*="MessageContainer" i]'
  ].join(",");

  let settings = { enabled: true, filters: { pokeidleRewards: true } };
  let scanQueued = false;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `.${HIDDEN_CLASS}{display:none!important}`;
  (document.documentElement || document.head).appendChild(style);

  function normalizedText(el) {
    return (el?.innerText || el?.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isRewardMessage(el) {
    return REWARD_PATTERN.test(normalizedText(el));
  }

  function findMessageContainer(el) {
    const explicit = el.closest(MESSAGE_SELECTORS);
    if (explicit && explicit !== document.body && explicit !== document.documentElement) {
      const text = normalizedText(explicit);
      if (text.length <= 350 && explicit.querySelectorAll('*').length <= 18 && isRewardMessage(explicit)) return explicit;
    }

    // Fallback para mudanças no HTML da Kick: sobe poucos níveis e escolhe
    // o menor bloco razoável que contém a mensagem inteira.
    let node = el;
    let fallback = null;
    for (let i = 0; i < 6 && node && node.parentElement; i++) {
      node = node.parentElement;
      if (node === document.body || node === document.documentElement) break;
      const text = normalizedText(node);
      if (text.length > 350) break;
      if (isRewardMessage(node) && node.children.length <= 12) {
        fallback = node;
        if (node.matches("div, li, article") && i >= 1) break;
      }
    }
    return fallback;
  }

  function processElement(el) {
    if (!(el instanceof Element)) return;
    if (!settings.enabled || settings.filters?.pokeidleRewards === false) {
      if (el.classList.contains(HIDDEN_CLASS)) el.classList.remove(HIDDEN_CLASS);
      el.querySelectorAll?.("." + HIDDEN_CLASS).forEach(n => n.classList.remove(HIDDEN_CLASS));
      return;
    }

    if (el.classList.contains(HIDDEN_CLASS)) return;
    if (!isRewardMessage(el)) return;

    const container = findMessageContainer(el);
    if (container && !container.classList.contains(HIDDEN_CLASS)) {
      container.classList.add(HIDDEN_CLASS);
      container.setAttribute("data-chatclean-hidden", "pokeidle-reward");
    }
  }

  function scan(root = document) {
    if (!settings.enabled || settings.filters?.pokeidleRewards === false) {
      root.querySelectorAll?.("[data-chatclean-hidden]").forEach(el => {
        el.classList.remove(HIDDEN_CLASS);
        el.removeAttribute("data-chatclean-hidden");
      });
      return;
    }

    if (root instanceof Element && isRewardMessage(root)) processElement(root);
    root.querySelectorAll?.("div,li,article,[role='listitem']").forEach(el => {
      if (isRewardMessage(el)) processElement(el);
    });
  }

  function queueScan(root) {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(() => {
      scanQueued = false;
      scan(root);
    });
  }

  chrome.storage.sync.get(settings, data => {
    settings = {
      enabled: data.enabled !== false,
      filters: { pokeidleRewards: data.filters?.pokeidleRewards !== false }
    };
    scan(document);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes.enabled) settings.enabled = changes.enabled.newValue !== false;
    if (changes.filters) settings.filters = {
      pokeidleRewards: changes.filters.newValue?.pokeidleRewards !== false
    };
    scan(document);
  });

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) queueScan(node);
        });
      } else if (mutation.type === "characterData") {
        queueScan(mutation.target.parentElement || document);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();