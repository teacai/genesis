// SVG Sprite definitions - all game graphics as inline SVG strings
// Each sprite is a function that takes a color and returns SVG markup
// This makes them easily editable and color-customizable per team

const SPRITES = {
  // ========== INFANTRY ==========
  gi: (color = '#e63946') => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="8" r="5" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="12" y="13" width="8" height="10" rx="2" fill="${color}" stroke="#000" stroke-width="1"/>
    <line x1="8" y1="16" x2="12" y2="18" stroke="#000" stroke-width="2" stroke-linecap="round"/>
    <line x1="8" y1="16" x2="4" y2="14" stroke="#666" stroke-width="2" stroke-linecap="round"/>
    <rect x="2" y="12" width="4" height="2" rx="1" fill="#555"/>
    <line x1="13" y1="23" x2="11" y2="30" stroke="#000" stroke-width="2" stroke-linecap="round"/>
    <line x1="19" y1="23" x2="21" y2="30" stroke="#000" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  conscript: (color = '#457b9d') => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="8" r="5" fill="${color}" stroke="#000" stroke-width="1"/>
    <polygon points="11,4 16,1 21,4" fill="#5a3a2a"/>
    <rect x="12" y="13" width="8" height="10" rx="2" fill="${color}" stroke="#000" stroke-width="1"/>
    <line x1="20" y1="16" x2="26" y2="14" stroke="#666" stroke-width="2" stroke-linecap="round"/>
    <rect x="24" y="12" width="6" height="2" rx="1" fill="#555"/>
    <line x1="13" y1="23" x2="11" y2="30" stroke="#000" stroke-width="2" stroke-linecap="round"/>
    <line x1="19" y1="23" x2="21" y2="30" stroke="#000" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  engineer: (color = '#e63946') => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="8" r="5" fill="#ff0" stroke="#000" stroke-width="1"/>
    <rect x="11" y="3" width="10" height="3" rx="1" fill="#ff0" stroke="#aa0" stroke-width="0.5"/>
    <rect x="12" y="13" width="8" height="10" rx="2" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="7" y="14" width="5" height="6" rx="1" fill="#888" stroke="#555" stroke-width="0.5"/>
    <line x1="13" y1="23" x2="11" y2="30" stroke="#000" stroke-width="2" stroke-linecap="round"/>
    <line x1="19" y1="23" x2="21" y2="30" stroke="#000" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  spy: (color = '#e63946') => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="8" r="5" fill="#222" stroke="#000" stroke-width="1"/>
    <rect x="11" y="6" width="10" height="2" fill="#333"/>
    <rect x="12" y="13" width="8" height="10" rx="2" fill="#222" stroke="#000" stroke-width="1"/>
    <rect x="12" y="13" width="8" height="5" fill="${color}" opacity="0.5"/>
    <line x1="13" y1="23" x2="11" y2="30" stroke="#222" stroke-width="2" stroke-linecap="round"/>
    <line x1="19" y1="23" x2="21" y2="30" stroke="#222" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  seal: (color = '#e63946') => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="8" r="5" fill="#354a35" stroke="#000" stroke-width="1"/>
    <rect x="12" y="13" width="8" height="10" rx="2" fill="#354a35" stroke="#000" stroke-width="1"/>
    <rect x="14" y="14" width="4" height="3" fill="${color}" opacity="0.7"/>
    <line x1="8" y1="16" x2="3" y2="13" stroke="#666" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="1" y="11" width="5" height="2" rx="1" fill="#555"/>
    <circle cx="1" cy="12" r="1.5" fill="#ff0" opacity="0.5"/>
    <line x1="13" y1="23" x2="11" y2="30" stroke="#354a35" stroke-width="2" stroke-linecap="round"/>
    <line x1="19" y1="23" x2="21" y2="30" stroke="#354a35" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  tesla_trooper: (color = '#457b9d') => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="8" r="6" fill="#555" stroke="#000" stroke-width="1"/>
    <rect x="10" y="5" width="12" height="4" rx="2" fill="#666"/>
    <rect x="11" y="13" width="10" height="11" rx="2" fill="#555" stroke="#000" stroke-width="1"/>
    <rect x="13" y="14" width="6" height="4" fill="${color}" opacity="0.8"/>
    <line x1="6" y1="18" x2="11" y2="18" stroke="#4af" stroke-width="3" stroke-linecap="round"/>
    <line x1="21" y1="18" x2="26" y2="18" stroke="#4af" stroke-width="3" stroke-linecap="round"/>
    <circle cx="6" cy="18" r="2" fill="#4af" opacity="0.7"/>
    <circle cx="26" cy="18" r="2" fill="#4af" opacity="0.7"/>
    <line x1="13" y1="24" x2="11" y2="30" stroke="#555" stroke-width="3" stroke-linecap="round"/>
    <line x1="19" y1="24" x2="21" y2="30" stroke="#555" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  crazy_ivan: (color = '#457b9d') => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="8" r="5" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="12" y="13" width="8" height="10" rx="2" fill="${color}" stroke="#000" stroke-width="1"/>
    <circle cx="8" cy="16" r="3" fill="#c00" stroke="#800" stroke-width="1"/>
    <line x1="8" y1="13" x2="8" y2="11" stroke="#ff0" stroke-width="1"/>
    <circle cx="8" cy="10" r="1" fill="#ff0"/>
    <line x1="13" y1="23" x2="11" y2="30" stroke="#000" stroke-width="2" stroke-linecap="round"/>
    <line x1="19" y1="23" x2="21" y2="30" stroke="#000" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  // ========== VEHICLES ==========
  grizzly: (color = '#e63946') => `<svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="18" width="36" height="12" rx="3" fill="#556b2f" stroke="#000" stroke-width="1"/>
    <rect x="4" y="22" width="4" height="6" rx="1" fill="#3a3a3a"/>
    <rect x="40" y="22" width="4" height="6" rx="1" fill="#3a3a3a"/>
    <rect x="8" y="22" width="6" height="6" rx="2" fill="#333"/>
    <rect x="16" y="22" width="6" height="6" rx="2" fill="#333"/>
    <rect x="26" y="22" width="6" height="6" rx="2" fill="#333"/>
    <rect x="34" y="22" width="6" height="6" rx="2" fill="#333"/>
    <ellipse cx="24" cy="16" rx="10" ry="7" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="22" y="4" width="4" height="14" rx="1" fill="#556b2f" stroke="#000" stroke-width="1" transform="rotate(-10,24,12)"/>
    <circle cx="22" cy="4" r="2" fill="#333"/>
  </svg>`,

  rhino: (color = '#457b9d') => `<svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="18" width="40" height="13" rx="3" fill="#4a5a3a" stroke="#000" stroke-width="1"/>
    <rect x="2" y="22" width="5" height="7" rx="1" fill="#3a3a3a"/>
    <rect x="41" y="22" width="5" height="7" rx="1" fill="#3a3a3a"/>
    <rect x="7" y="23" width="7" height="6" rx="2" fill="#333"/>
    <rect x="16" y="23" width="7" height="6" rx="2" fill="#333"/>
    <rect x="25" y="23" width="7" height="6" rx="2" fill="#333"/>
    <rect x="34" y="23" width="7" height="6" rx="2" fill="#333"/>
    <ellipse cx="24" cy="16" rx="12" ry="8" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="21" y="2" width="5" height="16" rx="1.5" fill="#4a5a3a" stroke="#000" stroke-width="1" transform="rotate(-8,24,12)"/>
    <circle cx="21" cy="2" r="2.5" fill="#333"/>
  </svg>`,

  ifv: (color = '#e63946') => `<svg viewBox="0 0 40 28" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="14" width="32" height="10" rx="3" fill="#6b6b3f" stroke="#000" stroke-width="1"/>
    <rect x="6" y="18" width="5" height="5" rx="2" fill="#333"/>
    <rect x="13" y="18" width="5" height="5" rx="2" fill="#333"/>
    <rect x="22" y="18" width="5" height="5" rx="2" fill="#333"/>
    <rect x="29" y="18" width="5" height="5" rx="2" fill="#333"/>
    <rect x="10" y="8" width="16" height="8" rx="2" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="16" y="2" width="3" height="8" rx="1" fill="#666" stroke="#000" stroke-width="0.5"/>
    <circle cx="17.5" cy="2" r="1.5" fill="#444"/>
  </svg>`,

  flak_track: (color = '#457b9d') => `<svg viewBox="0 0 40 28" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="14" width="34" height="10" rx="3" fill="#5a5a3a" stroke="#000" stroke-width="1"/>
    <rect x="5" y="18" width="5" height="5" rx="2" fill="#333"/>
    <rect x="12" y="18" width="5" height="5" rx="2" fill="#333"/>
    <rect x="23" y="18" width="5" height="5" rx="2" fill="#333"/>
    <rect x="30" y="18" width="5" height="5" rx="2" fill="#333"/>
    <rect x="8" y="9" width="14" height="7" rx="2" fill="${color}" stroke="#000" stroke-width="1"/>
    <line x1="14" y1="3" x2="14" y2="9" stroke="#666" stroke-width="2"/>
    <line x1="16" y1="3" x2="16" y2="9" stroke="#666" stroke-width="2"/>
    <line x1="11" y1="5" x2="19" y2="5" stroke="#666" stroke-width="1.5"/>
  </svg>`,

  mirage: (color = '#e63946') => `<svg viewBox="0 0 44 30" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="16" width="32" height="11" rx="3" fill="#3a5a3a" stroke="#000" stroke-width="1"/>
    <rect x="8" y="21" width="5" height="5" rx="2" fill="#2a4a2a"/>
    <rect x="15" y="21" width="5" height="5" rx="2" fill="#2a4a2a"/>
    <rect x="24" y="21" width="5" height="5" rx="2" fill="#2a4a2a"/>
    <rect x="31" y="21" width="5" height="5" rx="2" fill="#2a4a2a"/>
    <ellipse cx="22" cy="14" rx="9" ry="6" fill="${color}" stroke="#000" stroke-width="1" opacity="0.8"/>
    <rect x="20" y="4" width="3" height="12" rx="1" fill="#3a5a3a" stroke="#000" stroke-width="0.5"/>
    <polygon points="18,4 22,1 26,4" fill="#4a4" opacity="0.6"/>
  </svg>`,

  prism: (color = '#e63946') => `<svg viewBox="0 0 44 30" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="16" width="32" height="11" rx="3" fill="#5a5a6a" stroke="#000" stroke-width="1"/>
    <rect x="8" y="21" width="5" height="5" rx="2" fill="#444"/>
    <rect x="15" y="21" width="5" height="5" rx="2" fill="#444"/>
    <rect x="24" y="21" width="5" height="5" rx="2" fill="#444"/>
    <rect x="31" y="21" width="5" height="5" rx="2" fill="#444"/>
    <ellipse cx="22" cy="14" rx="8" ry="5" fill="${color}" stroke="#000" stroke-width="1"/>
    <polygon points="19,5 22,2 25,5 22,14" fill="#aaf" stroke="#88d" stroke-width="0.5" opacity="0.8"/>
    <circle cx="22" cy="3" r="2" fill="#ccf" opacity="0.9"/>
  </svg>`,

  apocalypse: (color = '#457b9d') => `<svg viewBox="0 0 56 36" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="20" width="48" height="14" rx="4" fill="#3a4a3a" stroke="#000" stroke-width="1.5"/>
    <rect x="6" y="26" width="8" height="7" rx="2" fill="#333"/>
    <rect x="16" y="26" width="8" height="7" rx="2" fill="#333"/>
    <rect x="32" y="26" width="8" height="7" rx="2" fill="#333"/>
    <rect x="42" y="26" width="8" height="7" rx="2" fill="#333"/>
    <ellipse cx="28" cy="18" rx="14" ry="9" fill="${color}" stroke="#000" stroke-width="1.5"/>
    <rect x="24" y="4" width="4" height="16" rx="1.5" fill="#3a4a3a" stroke="#000" stroke-width="1"/>
    <rect x="28" y="4" width="4" height="16" rx="1.5" fill="#3a4a3a" stroke="#000" stroke-width="1"/>
    <circle cx="26" cy="4" r="2" fill="#333"/>
    <circle cx="30" cy="4" r="2" fill="#333"/>
    <rect x="18" y="12" width="3" height="8" rx="1" fill="#555" transform="rotate(-15,19,16)"/>
  </svg>`,

  v3_launcher: (color = '#457b9d') => `<svg viewBox="0 0 44 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="18" width="32" height="12" rx="3" fill="#5a5a4a" stroke="#000" stroke-width="1"/>
    <rect x="8" y="24" width="5" height="5" rx="2" fill="#333"/>
    <rect x="15" y="24" width="5" height="5" rx="2" fill="#333"/>
    <rect x="24" y="24" width="5" height="5" rx="2" fill="#333"/>
    <rect x="31" y="24" width="5" height="5" rx="2" fill="#333"/>
    <rect x="14" y="10" width="16" height="10" rx="2" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="18" y="2" width="4" height="12" rx="1" fill="#c00" stroke="#800" stroke-width="0.5" transform="rotate(-20,20,10)"/>
    <polygon points="18,2 20,0 22,2" fill="#c00" transform="rotate(-20,20,10)"/>
  </svg>`,

  harvester: (color = '#e63946') => `<svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="16" width="36" height="14" rx="4" fill="#8a7a3a" stroke="#000" stroke-width="1"/>
    <rect x="8" y="22" width="6" height="6" rx="2" fill="#333"/>
    <rect x="16" y="22" width="6" height="6" rx="2" fill="#333"/>
    <rect x="26" y="22" width="6" height="6" rx="2" fill="#333"/>
    <rect x="34" y="22" width="6" height="6" rx="2" fill="#333"/>
    <rect x="10" y="8" width="20" height="10" rx="3" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="32" y="12" width="10" height="6" rx="2" fill="#6a5a2a" stroke="#000" stroke-width="0.5"/>
    <rect x="8" y="10" width="4" height="6" rx="1" fill="#aaa" stroke="#666" stroke-width="0.5"/>
  </svg>`,

  // ========== AIR UNITS ==========
  harrier: (color = '#e63946') => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,2 24,16 32,20 24,22 22,36 20,30 18,36 16,22 8,20 16,16" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="18" y="8" width="4" height="12" rx="1" fill="#444"/>
    <circle cx="20" cy="10" r="2" fill="#88f" opacity="0.6"/>
    <line x1="12" y1="18" x2="8" y2="20" stroke="${color}" stroke-width="2"/>
    <line x1="28" y1="18" x2="32" y2="20" stroke="${color}" stroke-width="2"/>
  </svg>`,

  kirov: (color = '#457b9d') => `<svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="12" rx="20" ry="8" fill="${color}" stroke="#000" stroke-width="1.5"/>
    <rect x="16" y="18" width="16" height="6" rx="2" fill="#555" stroke="#000" stroke-width="1"/>
    <rect x="10" y="8" width="4" height="3" rx="1" fill="#666"/>
    <rect x="34" y="8" width="4" height="3" rx="1" fill="#666"/>
    <circle cx="24" cy="10" r="3" fill="#c00" opacity="0.3"/>
    <line x1="16" y1="12" x2="8" y2="16" stroke="#333" stroke-width="1"/>
    <line x1="32" y1="12" x2="40" y2="16" stroke="#333" stroke-width="1"/>
    <rect x="20" y="22" width="3" height="4" rx="1" fill="#c00"/>
    <rect x="25" y="22" width="3" height="4" rx="1" fill="#c00"/>
  </svg>`,

  // ========== NAVAL ==========
  destroyer: (color = '#e63946') => `<svg viewBox="0 0 48 24" xmlns="http://www.w3.org/2000/svg">
    <polygon points="4,14 10,8 38,8 44,14 38,18 10,18" fill="#666" stroke="#000" stroke-width="1"/>
    <rect x="16" y="6" width="12" height="4" rx="1" fill="${color}" stroke="#000" stroke-width="0.5"/>
    <rect x="20" y="2" width="3" height="6" rx="1" fill="#444"/>
    <circle cx="21.5" cy="2" r="1.5" fill="#555"/>
    <rect x="30" y="6" width="4" height="3" rx="1" fill="#555"/>
  </svg>`,

  typhoon: (color = '#457b9d') => `<svg viewBox="0 0 48 20" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="12" rx="20" ry="6" fill="#444" stroke="#000" stroke-width="1"/>
    <ellipse cx="24" cy="11" rx="16" ry="4" fill="${color}" stroke="#000" stroke-width="0.5" opacity="0.7"/>
    <rect x="18" y="8" width="8" height="3" rx="1" fill="#555"/>
    <circle cx="22" cy="9" r="1" fill="#4af" opacity="0.6"/>
    <polygon points="42,12 48,12 46,10 48,8" fill="#444" stroke="#000" stroke-width="0.5"/>
  </svg>`,

  // ========== BUILDINGS ==========
  construction_yard: (color = '#e63946') => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="20" width="56" height="40" rx="2" fill="#555" stroke="#000" stroke-width="1.5"/>
    <rect x="8" y="24" width="48" height="32" fill="#444"/>
    <rect x="20" y="36" width="24" height="20" fill="#333" stroke="#000" stroke-width="1"/>
    <rect x="22" y="38" width="20" height="16" fill="#222"/>
    <polygon points="4,20 32,4 60,20" fill="${color}" stroke="#000" stroke-width="1.5"/>
    <rect x="28" y="10" width="8" height="4" fill="#ff0" opacity="0.5"/>
    <rect x="10" y="26" width="8" height="8" fill="#88f" opacity="0.3"/>
    <rect x="46" y="26" width="8" height="8" fill="#88f" opacity="0.3"/>
    <line x1="32" y1="4" x2="32" y2="0" stroke="#666" stroke-width="2"/>
    <rect x="30" y="-2" width="4" height="4" fill="${color}" opacity="0.8"/>
  </svg>`,

  power_plant: (color = '#e63946') => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="16" width="40" height="28" rx="2" fill="#555" stroke="#000" stroke-width="1"/>
    <rect x="8" y="20" width="32" height="20" fill="#444"/>
    <polygon points="4,16 24,4 44,16" fill="${color}" stroke="#000" stroke-width="1"/>
    <polygon points="18,14 24,8 30,14" fill="#ff0" opacity="0.6"/>
    <rect x="12" y="28" width="10" height="12" fill="#333" stroke="#222" stroke-width="0.5"/>
    <rect x="26" y="28" width="10" height="12" fill="#333" stroke="#222" stroke-width="0.5"/>
    <circle cx="17" cy="34" r="3" fill="#4f4" opacity="0.5"/>
    <circle cx="31" cy="34" r="3" fill="#4f4" opacity="0.5"/>
  </svg>`,

  tesla_reactor: (color = '#457b9d') => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="16" width="40" height="28" rx="2" fill="#4a4a5a" stroke="#000" stroke-width="1"/>
    <rect x="8" y="20" width="32" height="20" fill="#3a3a4a"/>
    <polygon points="4,16 24,4 44,16" fill="${color}" stroke="#000" stroke-width="1"/>
    <circle cx="24" cy="30" r="8" fill="#333" stroke="#4af" stroke-width="2"/>
    <polygon points="22,24 26,24 24,30 28,30 22,38 24,32 20,32" fill="#4af" opacity="0.8"/>
  </svg>`,

  barracks: (color = '#e63946') => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="14" width="40" height="30" rx="2" fill="#5a5a4a" stroke="#000" stroke-width="1"/>
    <rect x="8" y="18" width="32" height="22" fill="#4a4a3a"/>
    <polygon points="4,14 24,4 44,14" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="18" y="28" width="12" height="14" fill="#333" stroke="#000" stroke-width="1"/>
    <rect x="20" y="30" width="8" height="10" fill="#222"/>
    <rect x="8" y="20" width="8" height="6" fill="#88f" opacity="0.2"/>
    <rect x="32" y="20" width="8" height="6" fill="#88f" opacity="0.2"/>
    <circle cx="14" cy="10" r="2" fill="${color}" opacity="0.5"/>
  </svg>`,

  refinery: (color = '#e63946') => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="24" width="56" height="36" rx="2" fill="#6a5a3a" stroke="#000" stroke-width="1"/>
    <rect x="8" y="28" width="24" height="28" fill="#5a4a2a"/>
    <rect x="36" y="20" width="20" height="40" rx="2" fill="#555" stroke="#000" stroke-width="1"/>
    <rect x="38" y="22" width="16" height="10" fill="${color}" opacity="0.6"/>
    <polygon points="4,24 20,12 36,24" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="14" y="36" width="14" height="18" fill="#333" stroke="#000" stroke-width="1"/>
    <rect x="40" y="34" width="12" height="4" rx="1" fill="#8a7a3a"/>
    <rect x="40" y="40" width="12" height="4" rx="1" fill="#8a7a3a"/>
    <rect x="40" y="46" width="12" height="4" rx="1" fill="#8a7a3a"/>
    <circle cx="46" cy="26" r="3" fill="#ff0" opacity="0.3"/>
  </svg>`,

  war_factory: (color = '#e63946') => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="18" width="56" height="42" rx="2" fill="#5a5a5a" stroke="#000" stroke-width="1.5"/>
    <rect x="8" y="22" width="48" height="34" fill="#4a4a4a"/>
    <polygon points="4,18 32,4 60,18" fill="${color}" stroke="#000" stroke-width="1.5"/>
    <rect x="12" y="36" width="40" height="22" fill="#333" stroke="#000" stroke-width="1"/>
    <rect x="14" y="38" width="36" height="18" fill="#222"/>
    <line x1="32" y1="36" x2="32" y2="58" stroke="#444" stroke-width="2"/>
    <rect x="16" y="24" width="10" height="8" fill="#333"/>
    <rect x="38" y="24" width="10" height="8" fill="#333"/>
    <circle cx="21" cy="28" r="2" fill="#f80" opacity="0.4"/>
    <circle cx="43" cy="28" r="2" fill="#f80" opacity="0.4"/>
  </svg>`,

  air_force_command: (color = '#e63946') => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="16" width="40" height="28" rx="2" fill="#5a5a6a" stroke="#000" stroke-width="1"/>
    <polygon points="4,16 24,4 44,16" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="16" y="24" width="16" height="16" fill="#333" stroke="#000" stroke-width="1"/>
    <circle cx="24" cy="32" r="5" fill="#2a2a3a" stroke="#4a4" stroke-width="1"/>
    <line x1="24" y1="27" x2="24" y2="37" stroke="#4a4" stroke-width="0.5"/>
    <line x1="19" y1="32" x2="29" y2="32" stroke="#4a4" stroke-width="0.5"/>
    <polygon points="8,12 12,8 16,12" fill="#aaa" opacity="0.5"/>
    <rect x="38" y="8" width="4" height="10" fill="#666"/>
    <circle cx="40" cy="7" r="2" fill="#f00" opacity="0.5"/>
  </svg>`,

  radar_tower: (color = '#457b9d') => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="20" width="16" height="26" rx="2" fill="#5a5a5a" stroke="#000" stroke-width="1"/>
    <rect x="20" y="24" width="8" height="18" fill="#444"/>
    <rect x="18" y="8" width="12" height="14" rx="2" fill="${color}" stroke="#000" stroke-width="1"/>
    <circle cx="24" cy="14" r="4" fill="#333" stroke="#4af" stroke-width="1.5"/>
    <line x1="24" y1="0" x2="24" y2="8" stroke="#666" stroke-width="2"/>
    <line x1="18" y1="4" x2="30" y2="4" stroke="#666" stroke-width="1.5"/>
    <circle cx="24" cy="14" r="1.5" fill="#4af" opacity="0.8"/>
    <path d="M 18,6 Q 24,0 30,6" fill="none" stroke="#4af" stroke-width="1" opacity="0.5"/>
    <path d="M 14,8 Q 24,-2 34,8" fill="none" stroke="#4af" stroke-width="0.8" opacity="0.3"/>
  </svg>`,

  naval_yard: (color = '#e63946') => `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="20" width="56" height="24" rx="2" fill="#5a5a5a" stroke="#000" stroke-width="1"/>
    <rect x="8" y="24" width="22" height="16" fill="#444"/>
    <rect x="34" y="24" width="22" height="16" fill="#3a4a5a"/>
    <polygon points="4,20 32,10 60,20" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="12" y="28" width="14" height="12" fill="#1a3a6b" opacity="0.5"/>
    <line x1="19" y1="28" x2="19" y2="40" stroke="#333" stroke-width="1"/>
    <rect x="40" y="14" width="4" height="10" fill="#666"/>
    <rect x="38" y="12" width="8" height="3" rx="1" fill="#888"/>
  </svg>`,

  battle_lab: (color = '#e63946') => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="16" width="36" height="28" rx="2" fill="#5a5a6a" stroke="#000" stroke-width="1"/>
    <rect x="10" y="20" width="28" height="20" fill="#3a3a4a"/>
    <polygon points="6,16 24,4 42,16" fill="${color}" stroke="#000" stroke-width="1"/>
    <circle cx="24" cy="30" r="6" fill="#222" stroke="#4af" stroke-width="2"/>
    <circle cx="24" cy="30" r="3" fill="#4af" opacity="0.3"/>
    <circle cx="24" cy="30" r="1" fill="#4af" opacity="0.8"/>
    <rect x="14" y="22" width="6" height="4" fill="#333"/>
    <rect x="28" y="22" width="6" height="4" fill="#333"/>
    <line x1="24" y1="4" x2="24" y2="0" stroke="#4af" stroke-width="1.5"/>
    <circle cx="24" cy="0" r="2" fill="#4af" opacity="0.5"/>
  </svg>`,

  ore_purifier: (color = '#e63946') => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="24" width="56" height="36" rx="2" fill="#6a6a5a" stroke="#000" stroke-width="1"/>
    <rect x="8" y="28" width="48" height="28" fill="#5a5a4a"/>
    <polygon points="4,24 32,10 60,24" fill="${color}" stroke="#000" stroke-width="1"/>
    <circle cx="24" cy="40" r="8" fill="#333" stroke="#8a7a3a" stroke-width="2"/>
    <circle cx="24" cy="40" r="4" fill="#8a7a3a" opacity="0.5"/>
    <circle cx="44" cy="40" r="6" fill="#333" stroke="#8a7a3a" stroke-width="1.5"/>
    <rect x="10" y="32" width="8" height="8" fill="#333"/>
  </svg>`,

  industrial_plant: (color = '#457b9d') => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="24" width="56" height="36" rx="2" fill="#5a5a5a" stroke="#000" stroke-width="1"/>
    <rect x="8" y="28" width="48" height="28" fill="#4a4a4a"/>
    <polygon points="4,24 20,12 36,24" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="40" y="8" width="8" height="20" rx="2" fill="#666" stroke="#000" stroke-width="1"/>
    <rect x="52" y="12" width="6" height="16" rx="2" fill="#666" stroke="#000" stroke-width="1"/>
    <circle cx="44" cy="8" r="3" fill="#888" opacity="0.4"/>
    <circle cx="55" cy="12" r="2.5" fill="#888" opacity="0.4"/>
    <rect x="12" y="36" width="16" height="18" fill="#333" stroke="#000" stroke-width="1"/>
    <rect x="32" y="36" width="16" height="18" fill="#333" stroke="#000" stroke-width="1"/>
  </svg>`,

  wall: (color = '#e63946') => `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="20" height="14" rx="1" fill="#666" stroke="#000" stroke-width="1"/>
    <line x1="2" y1="15" x2="22" y2="15" stroke="#555" stroke-width="1"/>
    <line x1="8" y1="8" x2="8" y2="15" stroke="#555" stroke-width="1"/>
    <line x1="16" y1="8" x2="16" y2="15" stroke="#555" stroke-width="1"/>
    <line x1="12" y1="15" x2="12" y2="22" stroke="#555" stroke-width="1"/>
  </svg>`,

  pillbox: (color = '#e63946') => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="16" cy="22" rx="14" ry="8" fill="#556b2f" stroke="#000" stroke-width="1"/>
    <ellipse cx="16" cy="18" rx="12" ry="6" fill="#666" stroke="#000" stroke-width="1"/>
    <rect x="10" y="14" width="12" height="6" rx="2" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="6" y="16" width="6" height="3" rx="1" fill="#444"/>
    <circle cx="7" cy="17.5" r="1" fill="#333"/>
  </svg>`,

  sentry_gun: (color = '#457b9d') => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="16" cy="22" rx="14" ry="8" fill="#4a5a3a" stroke="#000" stroke-width="1"/>
    <ellipse cx="16" cy="18" rx="10" ry="5" fill="#555" stroke="#000" stroke-width="1"/>
    <rect x="12" y="12" width="8" height="8" rx="2" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="4" y="15" width="10" height="3" rx="1" fill="#444"/>
    <rect x="18" y="15" width="10" height="3" rx="1" fill="#444"/>
    <circle cx="5" cy="16.5" r="1.5" fill="#333"/>
    <circle cx="27" cy="16.5" r="1.5" fill="#333"/>
  </svg>`,

  prism_tower: (color = '#e63946') => `<svg viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="24" width="12" height="20" rx="1" fill="#6a6a7a" stroke="#000" stroke-width="1"/>
    <polygon points="8,24 16,8 24,24" fill="${color}" stroke="#000" stroke-width="1"/>
    <polygon points="12,14 16,4 20,14" fill="#aaf" stroke="#88d" stroke-width="0.5" opacity="0.8"/>
    <circle cx="16" cy="6" r="3" fill="#ccf" opacity="0.9"/>
    <line x1="16" y1="6" x2="16" y2="2" stroke="#aaf" stroke-width="1.5"/>
    <circle cx="16" cy="2" r="1.5" fill="#fff" opacity="0.8"/>
    <rect x="12" y="32" width="8" height="4" fill="#555"/>
    <rect x="14" y="38" width="4" height="6" fill="#444"/>
  </svg>`,

  tesla_coil: (color = '#457b9d') => `<svg viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="24" width="16" height="20" rx="2" fill="#4a4a5a" stroke="#000" stroke-width="1"/>
    <rect x="12" y="10" width="8" height="16" rx="2" fill="${color}" stroke="#000" stroke-width="1"/>
    <circle cx="16" cy="6" r="5" fill="#333" stroke="#4af" stroke-width="2"/>
    <circle cx="16" cy="6" r="2" fill="#4af" opacity="0.8"/>
    <line x1="12" y1="4" x2="8" y2="0" stroke="#4af" stroke-width="1.5" opacity="0.6"/>
    <line x1="20" y1="4" x2="24" y2="0" stroke="#4af" stroke-width="1.5" opacity="0.6"/>
    <line x1="16" y1="2" x2="16" y2="-2" stroke="#4af" stroke-width="1.5" opacity="0.6"/>
    <rect x="10" y="30" width="12" height="4" fill="#3a3a4a"/>
  </svg>`,

  patriot: (color = '#e63946') => `<svg viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="24" width="16" height="14" rx="2" fill="#5a5a5a" stroke="#000" stroke-width="1"/>
    <rect x="10" y="12" width="12" height="14" rx="2" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="12" y="8" width="3" height="8" rx="1" fill="#666" transform="rotate(-15,13,12)"/>
    <rect x="17" y="8" width="3" height="8" rx="1" fill="#666" transform="rotate(15,19,12)"/>
    <circle cx="13" cy="7" r="1.5" fill="#fff" opacity="0.5"/>
    <circle cx="19" cy="7" r="1.5" fill="#fff" opacity="0.5"/>
    <circle cx="16" cy="18" r="3" fill="#333" stroke="#4a4" stroke-width="1"/>
  </svg>`,

  flak_cannon: (color = '#457b9d') => `<svg viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="24" width="20" height="14" rx="2" fill="#4a4a4a" stroke="#000" stroke-width="1"/>
    <rect x="10" y="14" width="12" height="12" rx="2" fill="${color}" stroke="#000" stroke-width="1"/>
    <rect x="8" y="6" width="4" height="12" rx="1" fill="#555" transform="rotate(-20,10,12)"/>
    <rect x="14" y="6" width="4" height="12" rx="1" fill="#555"/>
    <rect x="20" y="6" width="4" height="12" rx="1" fill="#555" transform="rotate(20,22,12)"/>
    <rect x="12" y="28" width="8" height="4" fill="#333"/>
  </svg>`,

  // ========== EFFECTS / MISC ==========
  explosion: () => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="12" fill="#f80" opacity="0.8"/>
    <circle cx="16" cy="16" r="8" fill="#ff0" opacity="0.6"/>
    <circle cx="16" cy="16" r="4" fill="#fff" opacity="0.5"/>
    <polygon points="16,2 18,12 28,8 20,14 28,20 18,18 16,28 14,18 4,20 12,14 4,8 14,12" fill="#f80" opacity="0.6"/>
  </svg>`,

  ore: () => `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <polygon points="4,12 2,8 6,4 10,4 14,8 12,12" fill="#8a7a3a" stroke="#6a5a2a" stroke-width="1"/>
    <polygon points="5,10 4,7 7,5 10,5 12,7 11,10" fill="#aa9a4a" opacity="0.6"/>
  </svg>`,

  gem: () => `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <polygon points="4,12 2,8 4,4 8,2 12,4 14,8 12,12 8,14" fill="#6a3a8a" stroke="#4a2a6a" stroke-width="1"/>
    <polygon points="5,10 4,7 6,5 8,4 10,5 12,7 11,10 8,12" fill="#8a5aaa" opacity="0.6"/>
    <circle cx="8" cy="7" r="2" fill="#aa8acc" opacity="0.5"/>
  </svg>`,

  tree: () => `<svg viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="16" width="4" height="8" fill="#5a3a1a"/>
    <polygon points="10,0 2,12 6,12 0,20 20,20 14,12 18,12" fill="#2a6a25"/>
    <polygon points="10,0 4,10 8,10 3,17 17,17 12,10 16,10" fill="#3a8a35" opacity="0.5"/>
  </svg>`,
};

// Sprite cache - rendered to off-screen canvases for performance
const SpriteCache = {
  _cache: {},

  getKey(spriteId, color, width, height) {
    return `${spriteId}_${color}_${width}_${height}`;
  },

  get(spriteId, color, width = 48, height = 48) {
    const key = this.getKey(spriteId, color, width, height);
    if (this._cache[key]) return this._cache[key];

    const spriteFn = SPRITES[spriteId];
    if (!spriteFn) return null;

    const svgString = spriteFn(color);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    // Return a promise-like that resolves when loaded
    const entry = { canvas, ready: false };
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      entry.ready = true;
    };
    img.src = url;
    this._cache[key] = entry;
    return entry;
  },

  preload(spriteId, color, width = 48, height = 48) {
    return this.get(spriteId, color, width, height);
  },
};
