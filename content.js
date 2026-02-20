const styleTag = document.createElement("style");
styleTag.id = "kokumiStyles";
document.head.appendChild(styleTag);

const widthStyleTag = document.createElement("style");
widthStyleTag.id = "kokumiWidth";
document.head.appendChild(widthStyleTag);

const hiddenAchievementsData = [
  {
    "slug": "ten_devlogs",
    "description": "10 recipes documented - publish that cookbook!",
    "cookies": 15
  },
  {
    "slug": "scrapbook_devlog",
    "description": "Used scrapbook in a devlog",
    "cookies": 0
  },
  {
    "slug": "cooking",
    "description": "Cooked so hard you ended up making a fire project that made our staff very happy!",
    "cookies": 5
  },
  {
    "slug": "conventional_commit",
    "description": "wrote a commit message following conventional commits",
    "cookies": 0
  }
];

const updateSidebarWidth = () => {
  const dpr = window.devicePixelRatio;
  const isRetina = window.matchMedia("(-webkit-min-device-pixel-ratio: 1.25)").matches;
  const threshold = isRetina ? 1.9 : 0.99;
  const isZoomedOut = dpr < threshold;
  
  const width = isZoomedOut ? "370px" : "290px";
  
  widthStyleTag.textContent = `
    .sidebar { 
      --sidebar-expanded-width: ${width} !important; 
    }
  `;
};

window.addEventListener("resize", updateSidebarWidth);
updateSidebarWidth();

const injectAchievements = () => {
  const navList = document.querySelector(".sidebar__nav-list");
  if (!navList || document.querySelector(".kokumi-achievements-nav")) return;

  const isActive = window.location.pathname === "/my/achievements";
  const activeClass = isActive ? "sidebar__nav-link--active" : "";
  const ariaCurrent = isActive ? 'aria-current="page"' : "";

  const li = document.createElement("li");
  li.className = "sidebar__nav-item kokumi-achievements-nav";
  li.innerHTML = `
    <a class="sidebar__nav-link ${activeClass}" ${ariaCurrent} href="/my/achievements">
      <span class="sidebar__nav-icon-wrapper" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="sidebar__nav-icon">
          <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"></path>
        </svg>
      </span>
      <span class="sidebar__nav-label">Achievements</span>
    </a>
  `;
  
  navList.appendChild(li);
};

const handleHiddenAchievements = (shouldReveal) => {
  if (window.location.pathname !== "/my/achievements") return;

  const secretCards = document.querySelectorAll(".achievements__card--secret");
  const earnedSlugs = Array.from(document.querySelectorAll(".achievements__card[data-slug]"))
    .map(card => card.getAttribute("data-slug"));

  const missingAchievements = hiddenAchievementsData.filter(
    ach => !earnedSlugs.includes(ach.slug)
  );

  secretCards.forEach((card, index) => {
    if (shouldReveal) {
      if (!card.dataset.originalContent) {
        card.dataset.originalContent = card.innerHTML;
      }

      if (index < missingAchievements.length) {
        const ach = missingAchievements[index];
        const title = ach.slug.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        
        const progressElement = card.querySelector(".achievements__progress");
        const progressHTML = progressElement ? progressElement.outerHTML : "";

        card.innerHTML = `
          <div class="achievements__icon">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="achievements__icon-svg" style="opacity: 0.5;">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </div>
          <h3 class="achievements__name">${title}</h3>
          <p class="achievements__description">${ach.description}</p>
          ${ach.cookies > 0 ? `<span class="achievements__reward">+${ach.cookies} 🍪</span>` : ''}
          ${progressHTML}
        `;
        
        card.style.opacity = "1"; 
        card.classList.remove("achievements__card--secret");
        card.classList.add("kokumi-revealed-temp");
      }
    } else {
      if (card.dataset.originalContent) {
        card.innerHTML = card.dataset.originalContent;
        card.classList.add("achievements__card--secret");
        card.classList.remove("kokumi-revealed-temp");
        card.style.opacity = "";
      }
    }
  });
};

const refreshStyles = async () => {
  const response = await fetch(chrome.runtime.getURL("data.json"));
  const configData = await response.json();
  const { visibleItems = {} } = await chrome.storage.sync.get("visibleItems");

  let cssRules = "";
  let revealHidden = true;

  configData.forEach(item => {
    const isVisible = visibleItems[item.name] !== false;
    
    if (item.name === "Reveal Hidden Achievements") {
      revealHidden = isVisible;
    } else if (!isVisible) {
      item.selectors.forEach(selector => {
        const prefix = selector.startsWith(".") || selector.startsWith("#") ? "" : ".";
        cssRules += `${prefix}${selector} { display: none !important; }\n`;
      });
    }
  });
  styleTag.textContent = cssRules;
  handleHiddenAchievements(revealHidden);
};

injectAchievements();
refreshStyles();

chrome.storage.onChanged.addListener((changes) => {
  if (changes.visibleItems) {
    refreshStyles();
  }
});