(() => {
  if (window.__chatCleanInitialized) return;
  window.__chatCleanInitialized = true;

  const HIDDEN_CLASS = "chatclean-hidden";
  // Match all PokeIdle reward redemption variants, regardless of reward type.
  const REWARD_PATTERN = /\bresgatou\s+b[oô]nus\b/i;
  let settings = { enabled: true, filters: { pokeidleRewards: true } };
  let scanQueued = false;

  const style = document.createElement("style");
  style.textContent = `.${HIDDEN_CLASS}{display:none!important}`;
  (document.documentElement || document.head).appendChild(style);

  function textOf(el) {
    return (el?.innerText || el?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function isTarget(el) {
    const text = textOf(el);
    return text.length > 0 && text.length < 500 && REWARD_PATTERN.test(text);
  }

  function findRow(el) {
    // Prefer semantic chat-row containers used by many chat implementations.
    const semantic = el.closest(
      '[data-testid*="chat-message" i], [data-testid*="message" i], ' +
      '[role="listitem"], li, article, [class*="chat-message" i], ' +
      '[class*="chatMessage" i], [class*="message-container" i]'
    );
    if (semantic && semantic !== document.body && isTarget(semantic)) return semantic;

    // Walk upward from the matching text and retain the smallest compact
    // ancestor that still contains the complete reward message.
    let node = el;
    let best = el;
    for (let i = 0; i < 7 && node.parentElement; i++) {
      const parent = node.parentElement;
      if (parent === document.body || parent === document.documentElement) break;
      const text = textOf(parent);
      if (text.length > 500) break;
      if (REWARD_PATTERN.test(text)) best = parent;
      node = parent;
    }
    // A little context is usually needed to hide the complete chat row.
    if (best.parentElement && best.parentElement !== document.body &&
        textOf(best.parentElement).length < 500 &&
        REWARD_PATTERN.test(textOf(best.parentElement))) {
      best = best.parentElement;
    }
    return best;
  }

  function clearHidden() {
    document.querySelectorAll("[data-chatclean-hidden]").forEach(el => {
      el.classList.remove(HIDDEN_CLASS);
      el.removeAttribute("data-chatclean-hidden");
    });
  }

  function scan() {
    if (!settings.enabled || settings.filters?.pokeidleRewards === false) {
      clearHidden();
      return;
    }

    // Inspect all elements so this also catches chat rows whose text is
    // updated in-place rather than inserted as a new DOM node.
    const all = document.querySelectorAll("div, li, article, [role='listitem'], span");
    for (const el of all) {
      if (el.classList.contains(HIDDEN_CLASS) || !isTarget(el)) continue;

      // Ignore large wrappers containing multiple messages.
      const row = findRow(el);
      if (!row || row === document.body || row === document.documentElement) continue;
      if (!row.hasAttribute("data-chatclean-hidden")) {
        row.classList.add(HIDDEN_CLASS);
        row.setAttribute("data-chatclean-hidden", "pokeidle-reward");
      }
    }
  }

  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(() => {
      scanQueued = false;
      scan();
    });
  }

  chrome.storage.sync.get(settings, data => {
    settings = {
      enabled: data.enabled !== false,
      filters: { pokeidleRewards: data.filters?.pokeidleRewards !== false }
    };
    queueScan();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes.enabled) settings.enabled = changes.enabled.newValue !== false;
    if (changes.filters) settings.filters = {
      pokeidleRewards: changes.filters.newValue?.pokeidleRewards !== false
    };
    queueScan();
  });

  // Scan the full chat after any DOM mutation. This covers both newly added
  // messages and existing message nodes whose contents are changed in place.
  const observer = new MutationObserver(() => queueScan());
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Kick's chat can hydrate after the content script starts.
  queueScan();
})();