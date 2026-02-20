const themeVariables = {
  "--color-text-header": "#4e2c31",
  "--color-text-body": "#592724",
  "--color-text-muted": "#6b524f",
  "--color-bg": "#fdebd0",
  "--color-bg-2": "#dfccad",
  "--color-red-500": "#a4383f",
  "--color-red-450": "#de8185",
  "--color-red-400": "#c1464f",
  "--color-red-300": "#fcbca8",
  "--color-green-500": "#458032",
  "--color-green-450": "#98c95a",
  "--color-green-400": "#6da843",
  "--color-green-300": "#d1e289",
  "--color-blue-600": "#253460",
  "--color-blue-500": "#3d5a8a",
  "--color-blue-400": "#4b8ebf",
  "--color-blue-300": "#79bfd3",
  "--color-yellow-600": "#88482b",
  "--color-yellow-500": "#bf7d2b",
  "--color-yellow-450": "#db9d44",
  "--color-yellow-400": "#ecc168",
  "--color-yellow-300": "#ecc168",
  "--color-brown-700": "#4e2c31",
  "--color-brown-600": "#77433f",
  "--color-brown-500": "#7b423e",
  "--color-brown-400": "#ad6d56",
  "--color-tan-400": "#d5af8a",
  "--color-tan-300": "#dfccad"
};

const applyPopupTheme = async () => {
  const { themeColors = {}, customFonts = {} } = await chrome.storage.sync.get(["themeColors", "customFonts"]);
  const root = document.documentElement;
  
  if (customFonts.url && !document.getElementById('customPopupFont')) {
    const link = document.createElement('link');
    link.id = 'customPopupFont';
    link.rel = 'stylesheet';
    link.href = customFonts.url;
    document.head.appendChild(link);
  }
  
  if (customFonts.family) {
    root.style.setProperty('--popup-font', customFonts.family);
  } else {
    root.style.removeProperty('--popup-font');
  }

  for (const [key, fallbackValue] of Object.entries(themeVariables)) {
    root.style.setProperty(key, themeColors[key] || fallbackValue);
  }
};

const renderToggles = async () => {
  const toggleContainer = document.getElementById("toggleContainer");
  const response = await fetch("data.json");
  const configData = await response.json();
  const { visibleItems = {} } = await chrome.storage.sync.get("visibleItems");

  const categories = configData.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  toggleContainer.innerHTML = "";

  for (const [category, items] of Object.entries(categories)) {
    const section = document.createElement("div");
    section.className = "categorySection";
    section.innerHTML = `<div class="categoryTitle">${category}</div>`;

    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "itemRow";
      const isChecked = visibleItems[item.name] !== false;

      row.innerHTML = `
        <span class="itemLabel">${item.name}</span>
        <input type="checkbox" data-name="${item.name}" ${isChecked ? "checked" : ""}>
      `;

      row.querySelector("input").addEventListener("change", (e) => {
        updatePreference(item.name, e.target.checked);
      });

      section.appendChild(row);
    });
    toggleContainer.appendChild(section);
  }
};

const renderThemeEditors = async () => {
  const themeContainer = document.getElementById("themeContainer");
  const { themeColors = {} } = await chrome.storage.sync.get("themeColors");
  
  themeContainer.innerHTML = "";
  const section = document.createElement("div");
  section.className = "categorySection";
  section.innerHTML = `<div class="categoryTitle">Colors</div>`;
  
  for (const [key, fallbackValue] of Object.entries(themeVariables)) {
    const row = document.createElement("div");
    row.className = "itemRow";
    const currentColor = themeColors[key] || fallbackValue;

    row.innerHTML = `
      <span class="itemLabel">${key.replace("--color-", "")}</span>
      <input type="color" class="colorInput" data-key="${key}" value="${currentColor}">
    `;

    row.querySelector("input").addEventListener("change", (e) => {
      updateThemeColor(key, e.target.value);
    });

    section.appendChild(row);
  }
  themeContainer.appendChild(section);
};

const loadFonts = async () => {
  const { customFonts = {} } = await chrome.storage.sync.get("customFonts");
  document.getElementById("googleFontUrl").value = customFonts.url || "";
  document.getElementById("fontFamily").value = customFonts.family || "";
};

const saveFonts = async () => {
  const customFonts = {
    url: document.getElementById("googleFontUrl").value.trim(),
    family: document.getElementById("fontFamily").value.trim()
  };
  await chrome.storage.sync.set({ customFonts });
  applyPopupTheme();
};

const updatePreference = async (itemName, isVisible) => {
  const { visibleItems = {} } = await chrome.storage.sync.get("visibleItems");
  visibleItems[itemName] = isVisible;
  await chrome.storage.sync.set({ visibleItems });
};

const updateThemeColor = async (key, color) => {
  const { themeColors = {} } = await chrome.storage.sync.get("themeColors");
  themeColors[key] = color;
  await chrome.storage.sync.set({ themeColors });
  applyPopupTheme();
};

const setupTabs = () => {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.target).classList.add("active");
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  applyPopupTheme();
  setupTabs();
  
  const exportSettings = document.getElementById("exportSettings");
  const importSettings = document.getElementById("importSettings");
  const fileInputSettings = document.getElementById("fileInputSettings");

  const exportTheme = document.getElementById("exportTheme");
  const importTheme = document.getElementById("importTheme");
  const resetTheme = document.getElementById("resetTheme");
  const fileInputTheme = document.getElementById("fileInputTheme");

  const googleFontUrl = document.getElementById("googleFontUrl");
  const fontFamily = document.getElementById("fontFamily");

  googleFontUrl.addEventListener("change", saveFonts);
  fontFamily.addEventListener("change", saveFonts);

  exportSettings.addEventListener("click", async () => {
    const data = await chrome.storage.sync.get("visibleItems");
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "kokumiSettings.json";
    anchor.click();
    URL.revokeObjectURL(url);
  });

  importSettings.addEventListener("click", () => fileInputSettings.click());

  fileInputSettings.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = JSON.parse(event.target.result);
        if (content.visibleItems) {
          await chrome.storage.sync.set({ visibleItems: content.visibleItems });
          renderToggles();
        }
      } catch (err) {}
    };
    reader.readAsText(file);
  });

  exportTheme.addEventListener("click", async () => {
    const data = await chrome.storage.sync.get(["themeColors", "customFonts"]);
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "kokumiTheme.json";
    anchor.click();
    URL.revokeObjectURL(url);
  });

  importTheme.addEventListener("click", () => fileInputTheme.click());

  fileInputTheme.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = JSON.parse(event.target.result);
        if (content.themeColors || content.customFonts) {
          await chrome.storage.sync.set({ 
            themeColors: content.themeColors || {},
            customFonts: content.customFonts || {}
          });
          renderThemeEditors();
          loadFonts();
          applyPopupTheme();
        }
      } catch (err) {}
    };
    reader.readAsText(file);
  });

  resetTheme.addEventListener("click", async () => {
    await chrome.storage.sync.remove(["themeColors", "customFonts"]);
    renderThemeEditors();
    loadFonts();
    applyPopupTheme();
  });

  renderToggles();
  renderThemeEditors();
  loadFonts();
});