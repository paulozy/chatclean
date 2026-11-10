const enabled = document.getElementById("enabled");
const pokeidle = document.getElementById("pokeidle");
const status = document.getElementById("save-status");

const defaults = { enabled: true, filters: { pokeidleRewards: true } };

async function load() {
  const data = await chrome.storage.sync.get(defaults);
  enabled.checked = data.enabled !== false;
  pokeidle.checked = data.filters?.pokeidleRewards !== false;
}

async function save() {
  await chrome.storage.sync.set({
    enabled: enabled.checked,
    filters: { pokeidleRewards: pokeidle.checked }
  });
  status.textContent = "Salvo!";
  window.setTimeout(() => status.textContent = "Configurações salvas neste navegador.", 1100);
}

enabled.addEventListener("change", save);
pokeidle.addEventListener("change", save);
load().catch(() => status.textContent = "Não foi possível carregar as configurações.");
