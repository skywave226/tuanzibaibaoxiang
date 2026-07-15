import { readdir, readFile, writeFile } from 'fs/promises'

const TOOLS_DIR = new URL('../src/tools/', import.meta.url)

const svg = (content, viewBox = '0 0 24 24') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`

const svgs = {
  code: svg('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="16" r="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  key: svg('<circle cx="7.5" cy="14.5" r="5.5"/><path d="M21 3l-9 9"/><path d="M15 3h6v6"/>'),
  calculator: svg('<rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="8" y2="11.01"/><line x1="12" y1="11" x2="12" y2="11.01"/><line x1="16" y1="11" x2="16" y2="11.01"/><line x1="8" y1="15" x2="8" y2="15.01"/><line x1="12" y1="15" x2="12" y2="15.01"/><line x1="16" y1="15" x2="16" y2="15.01"/><line x1="8" y1="19" x2="8" y2="19.01"/><line x1="12" y1="19" x2="12" y2="19.01"/><line x1="16" y1="19" x2="16" y2="19.01"/>'),
  image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>'),
  audio: svg('<path d="M3 18v-6a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v6"/><path d="M12 3v15"/><path d="M18 9a4 4 0 0 1 0 8"/>'),
  music: svg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  text: svg('<path d="M4 7V5h16v2"/><path d="M9 7v10"/><path d="M15 7v10"/><path d="M12 7v10"/>'),
  transform: svg('<path d="M5 4h14"/><path d="M7 9h10"/><path d="M5 14h14"/><path d="M9 19h6"/>'),
  arrows: svg('<path d="M7 16V4h2M7 4l-3 3m13 9v8h-2m2 0l3-3"/>'),
  clock: svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
  globe: svg('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  table: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/>'),
  chart: svg('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'),
  lineChart: svg('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'),
  pieChart: svg('<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>'),
  dice: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/>'),
  book: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
  document: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
  palette: svg('<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.047a1.55 1.55 0 0 1 1.648-1.562c1.313 0 2.375-1.062 2.375-2.375s-1.062-2.375-2.375-2.375a1.55 1.55 0 0 1-1.648-1.562c0-.395.148-.758.438-1.047.257-.29.437-.688.437-1.125C13.648 2.746 12.926 2 12 2z"/>'),
  qr: svg('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'),
  search: svg('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
  user: svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  ruler: svg('<path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><line x1="6" y1="7" x2="18" y2="7"/><line x1="10" y1="11" x2="10" y2="7"/><line x1="14" y1="15" x2="14" y2="7"/>'),
  weight: svg('<path d="M12 3a4 4 0 0 1 4 4v1h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2V7a4 4 0 0 1 4-4z"/><circle cx="12" cy="14" r="3"/>'),
  thermometer: svg('<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>'),
  speedometer: svg('<path d="M12 2a10 10 0 0 0-10 10h20A10 10 0 0 0 12 2z"/><path d="M12 12l4-4"/>'),
  scissors: svg('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>'),
  filter: svg('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'),
  upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'),
  download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
  copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  refresh: svg('<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  microphone: svg('<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>'),
  camera: svg('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
  map: svg('<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>'),
  location: svg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
  link: svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  hash: svg('<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>'),
  gamepad: svg('<line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/>'),
  eye: svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
  fingerprint: svg('<path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M12 10a2 2 0 0 1 2 2c0 2.76-.45 4.73-.5 5.02"/><path d="M7 21c.1-.8.38-2.93.5-4.02"/><path d="M15 21c.1-.8.38-2.93.5-4.02"/>'),
  wifi: svg('<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>'),
  database: svg('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>'),
  fileJson: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1"/><path d="M14 12a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1"/><path d="M10 15h4"/>'),
  fileCsv: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/><path d="M8 9h2"/><path d="M14 9h2"/>'),
  fileXml: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="10 12 7 15 10 18"/><polyline points="14 12 17 15 14 18"/>'),
  fileCode: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="10 13 7 16 10 19"/><polyline points="14 13 17 16 14 19"/>'),
  bracket: svg('<path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/>'),
  list: svg('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'),
  checkList: svg('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
  gitBranch: svg('<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>'),
  terminal: svg('<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>'),
  bug: svg('<rect x="8" y="6" width="8" height="14" rx="4"/><path d="M12 20v4"/><path d="M8 22v2"/><path d="M16 22v2"/><path d="M4 14h4"/><path d="M16 14h4"/><path d="M10 2h4"/>'),
  layers: svg('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'),
  box: svg('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'),
  gift: svg('<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>'),
  brush: svg('<path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2.5 2.24 0 .46.62.8.62.8C4.14 21.95 6.5 23 9.06 23c2.56 0 4.92-1.05 6.87-2.97 1.95-1.92 3.08-4.74 3.08-7.86 0-1.34-2.5-1.52-2.5-2.24 0-1.67-1.34-3.02-3-3.02-1.32 0-2.44.82-2.87 1.97"/>'),
  crop: svg('<path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/>'),
  focus: svg('<circle cx="12" cy="12" r="3"/><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>'),
  mail: svg('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),
  phone: svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  play: svg('<polygon points="5 3 19 12 5 21 5 3"/>'),
  stop: svg('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
  trash: svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  edit: svg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
  sun: svg('<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'),
  moon: svg('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
  menu: svg('<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>'),
  toolbox: svg('<path d="M18 8h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2"/><path d="M10 8V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3"/><path d="M12 13v4"/><path d="M8 13v4"/><path d="M16 13v4"/>'),
  plus: svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
  minus: svg('<line x1="5" y1="12" x2="19" y2="12"/>'),
  grid: svg('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'),
  sparkle: svg('<path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z"/>'),
  flame: svg('<path d="M12 2c0 0-7 4-7 11 0 2.5 1 5 3 6.5 0 0-2-2.5-2-5.5 0-3 3-5 3-5s-1 4 3 7c0 0-1-5 2-9 0 0 1 2 1 4 0 3.5-2 6-2 6s3-1.5 3-6c0-3-1-6-4-9z"/>'),
  star: svg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
  heart: svg('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
  bell: svg('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),
  zap: svg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  cloud: svg('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>'),
  compass: svg('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'),
  anchor: svg('<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>'),
  coins: svg('<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/>'),
  triangle: svg('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>'),
  target: svg('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  crosshair: svg('<circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>'),
  alignCenter: svg('<line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/>'),
  sort: svg('<line x1="8" y1="4" x2="8" y2="20"/><polyline points="4 8 8 4 12 8"/><line x1="16" y1="4" x2="16" y2="20"/><polyline points="20 16 16 20 12 16"/>'),
  maximize: svg('<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>'),
  minimize: svg('<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>'),
  cpu: svg('<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>'),
  moonStars: svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/><path d="M19 3v4"/><path d="M21 5h-4"/>'),
  umbrella: svg('<path d="M12 2v18"/><path d="M12 20a4 4 0 0 1-4-4"/><path d="M2 12h20a10 10 0 0 0-20 0z"/>'),
  watch: svg('<circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 14 14"/><path d="M16.5 5.5l2-2"/><path d="M5.5 16.5l-2 2"/>'),
  battery: svg('<rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/><line x1="6" y1="11" x2="6" y2="13"/><line x1="10" y1="11" x2="10" y2="13"/>'),
  creditCard: svg('<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>'),
  truck: svg('<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'),
  plane: svg('<path d="M2 12h20"/><path d="M13 2l8 10-8 10"/>'),
  home: svg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
  trendingUp: svg('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'),
  trendingDown: svg('<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>'),
  shuffle: svg('<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>'),
  repeat: svg('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
  split: svg('<path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>'),
  merge: svg('<path d="M8 3v10a4 4 0 0 0 4 4h8"/><path d="M6 5l2 2 2-2"/><path d="M18 13l-2 2 2 2"/>'),
  branch: svg('<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>'),
  workflow: svg('<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><line x1="9" y1="6" x2="15" y2="6"/><line x1="9" y1="18" x2="15" y2="18"/><line x1="6" y1="9" x2="6" y2="15"/><line x1="18" y1="9" x2="18" y2="15"/>'),
  info: svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'),
}

function parseMeta(content) {
  const get = (key) => {
    const m = content.match(new RegExp(`${key}:\\s*['"]([^'"]*)['"]`))
    return m ? m[1] : ''
  }
  const name = get('name')
  const description = get('description')
  const category = get('category')
  const keywordsMatch = content.match(/keywords:\s*\[([^\]]*)\]/)
  const keywords = keywordsMatch
    ? keywordsMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean)
    : []
  return { name, description, category, keywords }
}

function pickIcon(meta) {
  const text = `${meta.name} ${meta.description} ${meta.category} ${meta.keywords.join(' ')}`.toLowerCase()

  const rules = [
    { keys: ['密码', '加密', 'aes', 'rsa', 'hash', 'hmac', 'private', '密钥', 'md5', 'sha', 'ssl'], icon: 'lock' },
    { keys: ['二维码', 'qr', 'barcode'], icon: 'qr' },
    { keys: ['颜色', '色', 'palette', 'color'], icon: 'palette' },
    { keys: ['图片', 'image', 'photo', '像素', 'pixel', 'sprite', '截图', 'ocr', '识别', '压缩图'], icon: 'image' },
    { keys: ['音频', 'audio', 'sound', 'music', 'wave', '录音', '噪音', '变速', '剪辑'], icon: 'audio' },
    { keys: ['视频', 'video'], icon: 'play' },
    { keys: ['转换', 'converter', 'codec', '编码', '解码', 'base64', 'base32', 'utf', '进制', '大小写', '简繁', '拼音', '单位', '坐标', '年龄', 'bmi'], icon: 'arrows' },
    { keys: ['压缩', 'minifier', 'minify', 'gzip'], icon: 'minimize' },
    { keys: ['格式化', 'format', 'formatter', '美化', 'polisher'], icon: 'alignCenter' },
    { keys: ['生成', 'generator', '生成器', 'random', '随机', 'uuid', '密码生成', 'key'], icon: 'dice' },
    { keys: ['json', 'yaml', 'xml', 'toml'], icon: 'fileJson' },
    { keys: ['csv', 'excel', 'xlsx', '表格', '数据表'], icon: 'fileCsv' },
    { keys: ['sql', '数据库', 'database'], icon: 'database' },
    { keys: ['cron', '时间', '日期', 'clock', 'timer', '计时', '闹钟', 'watch'], icon: 'clock' },
    { keys: ['计算', 'calculator', 'math', '数学', '运算', '练习', '公式'], icon: 'calculator' },
    { keys: ['图表', 'chart', 'graph', 'tree', 'histogram', '饼图', '折线', '柱状'], icon: 'chart' },
    { keys: ['地图', 'map', '坐标', 'location', '经纬'], icon: 'map' },
    { keys: ['网络', 'network', 'ip', 'dns', 'url', '请求', 'http', 'api', 'ping'], icon: 'globe' },
    { keys: ['diff', '对比', '比较', 'collision', '检测'], icon: 'split' },
    { keys: ['合并', 'merge'], icon: 'merge' },
    { keys: ['排序', 'sort'], icon: 'sort' },
    { keys: ['正则', 'regex'], icon: 'target' },
    { keys: ['markdown', '文档', 'doc', 'word', 'pdf'], icon: 'document' },
    { keys: ['文本', 'text', '字符串', 'string', '字符'], icon: 'text' },
    { keys: ['代码', 'code', 'programming', '开发', 'dev', '终端', 'terminal', 'git'], icon: 'code' },
    { keys: ['游戏', 'game', 'play', '娱乐'], icon: 'gamepad' },
    { keys: ['学习', '教育', 'edu', '英语', '语法', '单词', '成语', '周期表', '数学'], icon: 'book' },
    { keys: ['生活', 'life', '日历', '天气', '记账', '理财', '身份证'], icon: 'calendar' },
    { keys: ['安全', 'security', 'verify', '验证', '签名', 'certificate'], icon: 'shield' },
    { keys: ['信息', 'info', 'about'], icon: 'info' },
    { keys: ['设置', 'setting', 'config', 'preference'], icon: 'settings' },
    { keys: ['下载', 'download'], icon: 'download' },
    { keys: ['上传', 'upload'], icon: 'upload' },
    { keys: ['复制', 'copy'], icon: 'copy' },
    { keys: ['搜索', 'search'], icon: 'search' },
    { keys: ['用户', 'user', 'profile'], icon: 'user' },
    { keys: ['邮件', 'email', 'mail'], icon: 'mail' },
    { keys: ['手机', 'phone'], icon: 'phone' },
    { keys: ['星星', '收藏', 'star'], icon: 'star' },
    { keys: ['爱心', 'heart'], icon: 'heart' },
    { keys: ['铃铛', 'bell'], icon: 'bell' },
    { keys: ['火焰', 'fire', 'trending'], icon: 'flame' },
    { keys: ['云', 'cloud'], icon: 'cloud' },
    { keys: ['闪电', 'zap'], icon: 'zap' },
    { keys: ['画笔', 'brush', 'draw'], icon: 'brush' },
    { keys: ['裁剪', 'crop'], icon: 'crop' },
    { keys: ['聚焦', 'focus'], icon: 'focus' },
    { keys: ['礼物', 'gift'], icon: 'gift' },
    { keys: ['眼睛', 'eye'], icon: 'eye' },
    { keys: ['指纹', 'fingerprint'], icon: 'fingerprint' },
    { keys: ['wifi', '无线'], icon: 'wifi' },
    { keys: ['列表', 'list', 'todo'], icon: 'list' },
    { keys: ['清单', 'checklist'], icon: 'checkList' },
    { keys: ['git', 'branch'], icon: 'gitBranch' },
    { keys: ['终端', 'terminal'], icon: 'terminal' },
    { keys: ['bug', '调试'], icon: 'bug' },
    { keys: ['层', 'layer'], icon: 'layers' },
    { keys: ['盒子', 'box'], icon: 'box' },
    { keys: ['主页', 'home'], icon: 'home' },
    { keys: ['趋势', 'trend'], icon: 'trendingUp' },
    { keys: ['太阳', 'sun'], icon: 'sun' },
    { keys: ['月亮', 'moon'], icon: 'moon' },
    { keys: ['菜单', 'menu'], icon: 'menu' },
    { keys: ['工具箱', 'toolbox'], icon: 'toolbox' },
  ]

  for (const rule of rules) {
    if (rule.keys.some(k => text.includes(k))) return svgs[rule.icon]
  }

  const categoryMap = {
    '开发工具': 'code',
    '图片工具': 'image',
    '音频工具': 'audio',
    '视频工具': 'play',
    '文本工具': 'text',
    '转换工具': 'arrows',
    '计算工具': 'calculator',
    '格式化工具': 'alignCenter',
    '生成工具': 'dice',
    '网络工具': 'globe',
    '安全工具': 'shield',
    '数据工具': 'table',
    '图表工具': 'chart',
    '教育工具': 'book',
    '办公工具': 'document',
    '设计工具': 'palette',
    '游戏工具': 'gamepad',
    '生活工具': 'calendar',
    '加密工具': 'lock',
  }

  return svgs[categoryMap[meta.category]] || svgs.sparkle
}

async function main() {
  const dirs = await readdir(TOOLS_DIR)
  let updated = 0
  for (const dir of dirs) {
    const metaPath = new URL(`./${dir}/meta.ts`, TOOLS_DIR)
    let content
    try {
      content = await readFile(metaPath, 'utf-8')
    } catch {
      continue
    }
    if (!content.includes('icon:')) continue

    const meta = parseMeta(content)
    const iconSvg = pickIcon(meta)
    const escaped = iconSvg.replace(/'/g, "\\'")

    const newContent = content.replace(
      /icon:\s*['"][^'"]+['"],?/,
      `icon: '${escaped}',`
    )

    await writeFile(metaPath, newContent, 'utf-8')
    updated++
    console.log(`Updated ${dir}`)
  }
  console.log(`Done. Updated ${updated} meta.ts files.`)
}

main().catch(console.error)
