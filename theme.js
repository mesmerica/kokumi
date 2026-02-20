const themeStyle = document.createElement("style");
themeStyle.id = "kokumiCustomTheme";
document.head.appendChild(themeStyle);

const applyTheme = async () => {
  const { themeColors = {}, customFonts = {} } = await chrome.storage.sync.get(["themeColors", "customFonts"]);
  
  let cssContent = "";

  if (customFonts.url) {
    cssContent += `@import url('${customFonts.url}');\n`;
  }

  if (customFonts.family) {
    cssContent += `
      body, body *, :root {
        font-family: ${customFonts.family} !important;
      }
    `;
  }

  if (Object.keys(themeColors).length > 0) {
    let variablesString = "";
    for (const [key, value] of Object.entries(themeColors)) {
      variablesString += `${key}: ${value} !important;\n`;
    }

    cssContent += `
:root {
    ${variablesString}
}
    `;
  }

  themeStyle.textContent = cssContent;
};

applyTheme();

chrome.storage.onChanged.addListener((changes) => {
  if (changes.themeColors || changes.customFonts) {
    applyTheme();
  }
});