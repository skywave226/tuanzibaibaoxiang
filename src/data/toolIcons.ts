export const toolIconMap: Record<string, string> = {
  // ========== AI 工具 ==========
  '/translator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h8v14H3z"/><path d="M5 9h4M5 12h4"/><path d="M13 5h8v14h-8z"/><path d="M15 9h4M15 12h4"/><path d="M11 9l2 3-2 3"/></svg>`,

  '/ai-image-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="M17 13l-4-4-6 6"/><path d="M19 15l.5 1.5L21 17l-1.5.5L19 19l-.5-1.5L17 17l1.5-.5z"/></svg>`,

  '/ai-writer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7-4-4-7 7v4z"/><path d="M15 8l1 1"/><path d="M5 19l3-1"/><path d="M18 3l.4 1.2L19.6 4.4l-1.2.4L18 6l-.4-1.2L16.4 4.4l1.2-.4z"/></svg>`,

  // ========== AI 辅助 ==========
  '/translation-compare': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h12M13 5l3 3-3 3"/><path d="M20 16H8M11 13l-3 3 3 3"/></svg>`,

  '/keyword-extractor': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20"/><path d="M7 8.5h6M7 11.5h4"/></svg>`,

  '/sentiment-analyzer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="12" r="5.5"/><circle cx="16" cy="12" r="5.5"/><path d="M6 10.5l1.5 1.5L9 10.5"/><path d="M6 14.5c1 1 2 1 3 0"/><path d="M15 10.5l1.5 1.5L18 10.5"/><path d="M15 14.5c1-1 2-1 3 0"/></svg>`,

  '/prompt-templates': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="13" height="15" rx="2"/><path d="M10 7h7M10 11h7M10 15h4"/><rect x="3" y="6" width="13" height="15" rx="2"/></svg>`,

  '/text-classifier': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v5l6 7 5-5-6-7z"/><circle cx="7" cy="10" r="1"/><path d="M15 5h6M16 9h5M17 13h4M18 17h3"/></svg>`,

  '/text-summarizer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 10h16M4 14h11M4 18h7"/><path d="M17 15l3 2-3 2"/></svg>`,

  '/grammar-checker': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h7M4 10h5"/><path d="M4 14l2.5 2.5L9 14"/><path d="M14 6h6M14 10h6M14 14h6M14 18h4"/></svg>`,

  '/ai-config-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9l-3 3 3 3M16 9l3 3-3 3"/><circle cx="12" cy="12" r="2"/><path d="M12 5v2M12 17v2M5 12h2M17 12h2"/></svg>`,

  '/markdown-polisher': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="13" height="12" rx="1"/><path d="M5 14V9l2.5 3L10 9v5"/><path d="M18 13l3-3-2-2-3 3v2z"/></svg>`,

  '/token-counter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="13" rx="2"/><path d="M6 9h3M6 12h3M6 15h3"/><path d="M13 9h5M13 12h5M13 15h3"/><path d="M9 21h6"/></svg>`,

  // ========== API 测试 ==========
  '/api-key-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M10 10l8 8"/><path d="M15 13l2 2M17 15l2 2"/><circle cx="18" cy="18" r="2"/><path d="M18 15.5v1M18 19.5v.5M15.5 18h1M19.5 18h.5"/></svg>`,

  '/graphql-tester': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><circle cx="12" cy="7" r="1.5"/><circle cx="6" cy="13" r="1.5"/><circle cx="18" cy="13" r="1.5"/><circle cx="12" cy="18" r="1.5"/><path d="M12 8.5v8M7.5 12L12 17l4.5-5M7.5 13.5l9-2M16.5 13.5l-9-2"/></svg>`,

  '/grpc-reflector': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="5" rx="1"/><rect x="14" y="4" width="7" height="5" rx="1"/><rect x="3" y="15" width="7" height="5" rx="1"/><rect x="14" y="15" width="7" height="5" rx="1"/><path d="M10 6.5h4M10 17.5h4M6.5 9v6M17.5 9v6"/></svg>`,

  '/hmac-signer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/><path d="M12 15v2"/><path d="M3 5l4 1M3 8l3 1"/></svg>`,

  '/jwt-debugger': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l-3 4 3 4M19 8l3 4-3 4"/><path d="M9 4l-1 16M15 4l1 16"/><circle cx="12" cy="12" r="1.5"/></svg>`,

  '/mock-server': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/><path d="M7 7h.5M7 17h.5"/><circle cx="17" cy="7" r="2"/><circle cx="17" cy="17" r="2"/><path d="M17 5v.5M17 8.5v.5M15 7h.5M18.5 7h.5"/></svg>`,

  '/openapi-validator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M9 9h6M9 13h6"/><path d="M8 17l2 2 4-4"/></svg>`,

  '/sse-tester': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c2-4 4-4 6 0s4 4 6 0"/><path d="M2 8c3-6 6-6 9 0s6 6 9 0"/><path d="M2 16c3 6 6 6 9 0s6-6 9 0"/><circle cx="20" cy="12" r="1"/></svg>`,

  '/webhook-tester': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12a4 4 0 118 0"/><path d="M12 8v4l3 2"/><path d="M8 12l-2-3M16 12l2-3"/></svg>`,

  '/websocket-tester': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/><path d="M9 12h6"/><path d="M10 10l2 2-2 2M14 10l-2 2 2 2"/><path d="M6 9V6M6 15v3M18 9V6M18 15v3"/></svg>`,

  // ========== SEO 工具 ==========
  '/keyword-density': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20"/><path d="M7 8v4M9 8l1 2 1-2M7 12h3"/><path d="M16 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/></svg>`,

  '/meta-tag-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v5l6 7 5-5-6-7z"/><circle cx="7" cy="10" r="1"/><path d="M15 5l4 4-4 4M19 9h2"/><path d="M15 13l4 4-4 4M19 17h2"/></svg>`,

  '/robots-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="14" height="12" rx="2"/><path d="M12 3v4"/><circle cx="12" cy="3" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M9 16h6"/><path d="M2 11v4M22 11v4"/></svg>`,

  '/sitemap-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="4" rx="1"/><rect x="3" y="17" width="6" height="4" rx="1"/><rect x="9" y="17" width="6" height="4" rx="1"/><rect x="15" y="17" width="6" height="4" rx="1"/><path d="M12 7v4M6 17v-4h12v4M12 13v4"/></svg>`,

  // ========== 安全工具 ==========
  '/password-strength': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/><path d="M12 15v2"/><path d="M3 19l2-2M3 16l2-2M21 19l-2-2M21 16l-2-2"/></svg>`,

  '/aes-encrypt': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><rect x="9" y="11" width="6" height="5" rx="1"/><path d="M10 11V9a2 2 0 014 0v2"/></svg>`,

  '/base32-codec': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h12M13 5l3 3-3 3"/><path d="M20 16H8M11 13l-3 3 3 3"/><path d="M17 11v6"/><circle cx="17" cy="10" r="1.5"/></svg>`,

  '/rsa-encrypt': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M10 10l6 6"/><rect x="13" y="13" width="8" height="8" rx="2"/><path d="M17 13v-1M17 22v-1M13 17h-1M22 17h-1"/></svg>`,

  // ========== 办公工具 ==========
  '/data-processor': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16M15 4v16"/><path d="M3 16h6M15 16h6"/><circle cx="18" cy="13" r="1.5"/><path d="M18 11v.5M18 14.5v.5M16.5 13h.5M19 13h.5"/></svg>`,

  // ========== 编码转换 ==========
  '/base64-codec': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h12M13 5l3 3-3 3"/><path d="M20 16H8M11 13l-3 3 3 3"/><path d="M17 5v6"/><circle cx="17" cy="14" r="2"/><path d="M17 16v3"/></svg>`,

  '/html-entity-codec': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7l-2 5 2 5M20 7l2 5-2 5"/><path d="M9 6l-1 12M15 6l1 12"/><path d="M7 12h2M15 12h2"/></svg>`,

  '/json-formatter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4c-3 0-4 2-4 4s0 3-2 4c2 1 2 2 2 4s1 4 4 4"/><path d="M16 4c3 0 4 2 4 4s0 3 2 4c-2 1-2 2-2 4s-1 4-4 4"/><path d="M10 9h4M10 12h4M10 15h2"/></svg>`,

  '/unicode-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14V8M8 14c0 1.5 1 2 2 2s2-.5 2-2V8M14 14c0 1.5 1 2 2 2"/><path d="M14 8v8M14 11h2"/></svg>`,

  '/url-codec': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/><path d="M18 3v4M20 5h-4"/></svg>`,

  // ========== 计算工具 ==========
  '/percentage-calculator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5L5 19"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>`,

  '/number-base-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M6 7h2M7 6v2M16 17h2M17 16v2"/><path d="M11 7h2M11 17h2M12 8l1-1M12 16l1 1"/></svg>`,

  '/scientific-calculator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M7 6h10v4H7z"/><path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2M15 17h2"/><path d="M9 7l1 1 2-2"/></svg>`,

  '/color-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="9" r="1.5"/><circle cx="9" cy="15" r="1.5"/><circle cx="15" cy="15" r="1.5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/></svg>`,

  '/hash-calculator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16M4 15h16"/><path d="M10 3L8 21M16 3l-2 18"/></svg>`,

  // ========== 开发工具 ==========
  '/code-minifier': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8l-4 4 4 4M16 8l4 4-4 4"/><path d="M10 5l-2 14M14 5l2 14"/><path d="M5 12h3M16 12h3"/></svg>`,

  '/css-unit': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="1"/><path d="M3 10h18M3 14h18M7 6v12M11 6v12M15 6v12M19 6v12"/><path d="M9 3l3 3 3-3"/></svg>`,

  '/json-table-editor': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M3 16h18M9 4v16M15 4v16"/><path d="M6 7h1M12 7h1M18 7h1"/></svg>`,

  '/json-to-ts': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3c-2 0-3 1-3 3s0 2-1 3c1 1 1 1 1 3s1 3 3 3"/><path d="M16 3c2 0 3 1 3 3s0 2 1 3c-1 1-1 1-1 3s-1 3-3 3"/><path d="M9 9h6M9 15h6"/><path d="M11 6l-1 12M14 6l1 12"/></svg>`,

  '/jwt-decoder': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l-2 4 2 4M19 8l2 4-2 4"/><path d="M9 5l-1 14M15 5l1 14"/><circle cx="12" cy="9" r="1"/><circle cx="12" cy="15" r="1"/><path d="M12 10v4"/></svg>`,

  '/sql-formatter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.5 3.5 3 8 3s8-1.5 8-3V5"/><path d="M4 11v6c0 1.5 3.5 3 8 3s8-1.5 8-3v-6"/><path d="M9 9h6M9 15h6"/></svg>`,

  '/xml-formatter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5l-3 4 3 4M8 5l3 4-3 4M16 5l3 4-3 4M19 15l-3 4 3 4"/><path d="M11 12h2"/></svg>`,

  '/yaml-json': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h6M4 11h6M4 15h4"/><path d="M14 7h6M14 11h6M14 15h4"/><path d="M10 9l4 3-4 3M14 9l-4 3 4 3"/></svg>`,

  // ========== 教育学习 ==========
  '/idiom-dictionary': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v16h7V4zM13 4v16h7V4z"/><path d="M6 8h3M6 11h3M15 8h3M15 11h3"/><path d="M6 14l1.5 1.5L9 14M15 14l1.5 1.5L18 14"/></svg>`,

  '/unit-converter-edu': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 8h16M4 13h16M4 18h16"/><path d="M8 10v3M12 10v3M16 10v3"/><path d="M8 15l4 3 4-3"/></svg>`,

  '/formula-reference': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z" /><path d="M7 9l2 6 2-6M14 9c1 0 2 1 2 2s-1 2-2 2-2 1-2 2 1 2 2 2"/><path d="M14 15h2"/></svg>`,

  '/poetry-collection': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h12v14H4z"/><path d="M6 8h8M6 11h8M6 14h6"/><path d="M16 7h4v12h-4z"/><path d="M18 10h0M18 13h0M18 16h0"/><path d="M2 19h16"/></svg>`,

  '/flashcard': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="14" height="12" rx="1"/><path d="M6 10h8M6 14h5"/><path d="M17 9l4 3-4 3M21 12h-4"/></svg>`,

  '/history-timeline': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18"/><circle cx="7" cy="12" r="2"/><circle cx="17" cy="12" r="2"/><circle cx="12" cy="12" r="1.5"/><path d="M7 10V6M17 10V6M7 14v4M17 14v4M12 10V7M12 14v3"/></svg>`,

  '/pinyin-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h6M7 4v2"/><path d="M5 12h4M5 16h4"/><path d="M6 6v12"/><path d="M12 4v8M12 12c2 0 4-1 4-3M12 12c2 0 4 1 4 3M16 6c-2 0-4 0-4 0"/><path d="M16 16v4M16 16h3M16 18h2"/></svg>`,

  '/math-practice': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h6v6H5z"/><path d="M8 7v2M7 8h2"/><path d="M13 5h6v6h-6z"/><path d="M15 8h2M16 7v2"/><path d="M5 13h6v6H5z"/><path d="M7 15h2"/><path d="M13 13h6v6h-6z"/><path d="M15 15h2M15 17h2"/></svg>`,

  '/english-grammar': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h6v12H4z"/><path d="M6 10l1.5-3L9 10M6.5 8v3"/><path d="M13 6h7M13 10h7M13 14h5M13 18h3"/><path d="M18 16l2 2-2 2"/></svg>`,

  '/grammar-reference': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v16h12V4z"/><path d="M7 8h6M7 12h6M7 16h4"/><path d="M16 8h4v12h-4z"/><path d="M18 11h0M18 14h0M18 17h0"/></svg>`,

  '/periodic-table': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>`,

  // ========== 数据可视化 ==========
  '/relation-graph-maker': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><circle cx="6" cy="18" r="1.5"/><path d="M8 7l4 9M16 7l-2 9M6.5 8.5v7M8 18h2"/></svg>`,

  '/flowchart-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3" width="8" height="4" rx="1"/><path d="M12 7v4"/><path d="M8 9h8l-2 2 2 2H8l2-2-2-2z"/><path d="M12 13v4"/><circle cx="12" cy="20" r="2"/><path d="M8 11H4M16 11h4"/></svg>`,

  '/heatmap-maker': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/><circle cx="6" cy="6" r="1.5" fill="currentColor"/><circle cx="12" cy="6" r="1.5" fill="currentColor"/><circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="18" r="1.5" fill="currentColor"/><circle cx="18" cy="18" r="1.5" fill="currentColor"/></svg>`,

  '/timeline-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/><circle cx="7" cy="6" r="2"/><circle cx="14" cy="12" r="2"/><circle cx="10" cy="18" r="2"/></svg>`,

  '/tree-diagram-drawer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M12 7v3M6 13v-3h12v3"/><rect x="3" y="13" width="6" height="4" rx="1"/><rect x="15" y="13" width="6" height="4" rx="1"/><path d="M6 17v2M18 17v2"/></svg>`,

  '/data-table-renderer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 8h18M3 14h18M8 3v18M14 3v18"/></svg>`,

  '/mind-map-maker': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 9V5M12 15v4M9 12H5M15 12h4"/><circle cx="5" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/><path d="M9.5 9.5L7 7M14.5 9.5L17 7M9.5 14.5L7 17M14.5 14.5L17 17"/></svg>`,

  '/stats-chart-maker': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><rect x="5" y="13" width="3" height="6"/><rect x="11" y="9" width="3" height="10"/><rect x="17" y="5" width="3" height="14"/></svg>`,

  '/csv-chart-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M7 17V11M12 17V7M17 17v-7"/><rect x="3" y="3" width="3" height="3" rx="0.5"/><path d="M6 4.5h2M9 3v3M9 4.5h2"/></svg>`,

  '/json-tree-viewer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4c-2 0-3 1-3 3s0 2-1 3c1 1 1 1 1 3s1 3 3 3"/><path d="M16 18c2 0 3-1 3-3s0-2 1-3c-1-1-1-1-1-3s-1-3-3-3"/><circle cx="12" cy="7" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="17" r="1.5"/><path d="M12 8.5v2M12 13.5v2"/></svg>`,

  // ========== 数据库工具 ==========
  '/table-schema-gen': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="2"/><path d="M4 5v4c0 1 3.5 2 8 2s8-1 8-2V5"/><path d="M4 9v4c0 1 3.5 2 8 2s8-1 8-2V9"/><path d="M4 13v4c0 1 3.5 2 8 2s8-1 8-2v-4"/><path d="M9 5v14M15 5v14"/></svg>`,

  '/connection-string-parser': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/><circle cx="12" cy="12" r="1.5"/></svg>`,

  '/index-optimizer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M6 21V10l6-4 6 4v11"/><path d="M10 21v-6h4v6"/><circle cx="12" cy="12" r="1.5"/><path d="M12 3v2M19 5l1 1M5 5l-1 1"/></svg>`,

  '/er-diagram-gen': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="5" rx="1"/><rect x="15" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M9 5.5h6M9 18.5h6M6 8v8M18 8v8"/><path d="M11 5.5v0M11 18.5v0"/></svg>`,

  '/mongo-query-builder': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c4 3 6 5 6 9s-2 7-6 9c-4-2-6-5-6-9s2-6 6-9z"/><path d="M9 9c1 1 2 2 3 2s2-1 3-2M9 15c1-1 2-2 3-2s2 1 3 2M12 3v18"/></svg>`,

  '/redis-command-ref': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M7 6.5h.5M9 6.5h.5"/><path d="M6 13l2 2 4-4"/><path d="M14 13h4M14 16h3"/></svg>`,

  '/sql-formatter-db': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="2"/><path d="M4 5v14c0 1 3.5 2 8 2s8-1 8-2V5"/><path d="M4 12c0 1 3.5 2 8 2s8-1 8-2"/><path d="M9 8h6M9 16h6"/></svg>`,

  '/sql-injection-check': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M9 10l-1 2 1 2M15 10l1 2-1 2"/><path d="M11 12h2"/></svg>`,

  '/sql-to-mongo': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="7" cy="6" rx="4" ry="1.5"/><path d="M3 6v5c0 1 2 1.5 4 1.5s4-.5 4-1.5V6"/><path d="M3 11v5c0 1 2 1.5 4 1.5s4-.5 4-1.5v-5"/><path d="M13 9l3 3-3 3M16 12h2"/><path d="M18 7c2 2 3 3 3 5s-1 3-3 5"/></svg>`,

  '/sql-to-entity': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="7" cy="6" rx="4" ry="1.5"/><path d="M3 6v5c0 1 2 1.5 4 1.5s4-.5 4-1.5V6"/><path d="M13 9l3 3-3 3M16 12h1"/><rect x="17" y="8" width="5" height="8" rx="1"/><path d="M19 11h1M19 13h1"/></svg>`,

  // ========== 图片工具 ==========
  '/qrcode-beautifier': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3z"/><path d="M14 19h2M18 14v3M18 19v2"/><path d="M20 6l.5 1.5L22 8l-1.5.5L20 10l-.5-1.5L18 8l1.5-.5z"/></svg>`,

  '/qrcode-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M14 18h2M18 14v3M18 18v3M21 18h0"/><path d="M14 21h3M21 14h0M21 21h0"/></svg>`,

  '/qrcode-reader': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8V5a2 2 0 012-2h3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3"/><rect x="7" y="7" width="5" height="5" rx="0.5"/><path d="M14 7h3v3M14 11h0M18 7v2M14 14h3M14 18h2M18 14v3"/></svg>`,

  '/image-crop': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v16h16M2 6h16v16"/><path d="M2 6l4-4M18 22l4-4"/></svg>`,

  '/image-format': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="13" height="13" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="M16 10l-3-3-5 5"/><path d="M18 14l3 3-3 3M21 17h-5"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,

  '/image-merge': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="12" height="12" rx="1"/><circle cx="7" cy="7" r="1.5"/><path d="M15 8l-3-3-4 4"/><rect x="9" y="9" width="12" height="12" rx="1"/><circle cx="13" cy="13" r="1.5"/><path d="M21 19l-3-3-4 4"/></svg>`,

  '/bg-remover': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><path d="M8 7l10 10M8 17L18 7"/><path d="M14 4l2 2M14 8l4-4M16 16l4-4M18 20l2-2"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>`,

  '/watermark-remover': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 12c2-4 8-4 10 0"/><path d="M5 5l4 4M9 5L5 9M15 5l4 4M19 5l-4 4M5 15l4 4M9 15l-4 4M15 15l4 4M19 15l-4 4"/></svg>`,

  '/image-watermark': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="7" cy="7" r="1.5"/><path d="M22 14l-5-5-7 7"/><rect x="12" y="12" width="9" height="9" rx="1"/><circle cx="15" cy="15" r="1"/><path d="M18 18h.5"/></svg>`,

  '/image-compress': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="13" height="13" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="M16 10l-3-3-5 5"/><path d="M15 17l3 3 3-3M18 14v6M21 17h-6"/></svg>`,

  '/image-to-base64': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="13" height="13" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="M16 10l-3-3-5 5"/><path d="M17 16l4-2v6l-4-2z"/><path d="M19 17h.5"/></svg>`,

  '/id-photo': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 18c0-3 2-5 5-5s5 2 5 5"/><path d="M3 8h3M18 8h3M3 16h3M18 16h3"/></svg>`,

  // ========== 网络工具 ==========
  '/port-lookup': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20"/><path d="M8 8v4M8 10h3M6 6l1 1M14 6l-1 1"/><rect x="16" y="3" width="5" height="5" rx="0.5"/><path d="M18 5v1M18 6h1"/></svg>`,

  '/network-speed': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17a9 9 0 0118 0"/><path d="M12 17l3-4"/><circle cx="12" cy="17" r="1"/><path d="M3 17h18M6 14l1-1M18 14l-1-1"/></svg>`,

  '/dns-query': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/><path d="M15 9l3-3M15 9h-3M15 9V6"/></svg>`,

  '/http-request': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="6" rx="1"/><path d="M5 7h2M9 7h2"/><path d="M4 14l4 2-4 2M10 14h6M10 18h4"/><path d="M16 15l2 2 2-2M18 13v4"/></svg>`,

  '/http-status': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><circle cx="6" cy="6.5" r="0.5" fill="currentColor"/><circle cx="8" cy="6.5" r="0.5" fill="currentColor"/><path d="M7 14l-2 2 2 2M11 14h4M11 18h2"/><path d="M15 14l2 2 2-2M17 12v4"/></svg>`,

  '/ip-query': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-7 7-12a7 7 0 00-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/><path d="M5 9h1M18 9h1M12 2v1M12 15v1"/></svg>`,

  '/subnet-calculator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/><path d="M6 7h2M6 9h1M16 15h2M16 17h1"/><path d="M7 17l-1 1M17 7l1-1"/><circle cx="7.5" cy="7.5" r="1"/><circle cx="16.5" cy="16.5" r="1"/></svg>`,

  '/ua-parser': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M2 18h20M9 21h6"/><circle cx="7" cy="11" r="2"/><path d="M12 9h6M12 12h4M12 15h2"/><path d="M7 13l-1 2M8 13l1 2"/></svg>`,

  // ========== 文本处理 ==========
  '/case-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l3-8 3 8M5 13h4"/><path d="M14 16v-6M14 10c0-1 1-2 2-2s2 1 2 2M14 13h4"/><path d="M11 6l2 2M13 6l-2 2"/></svg>`,

  '/traditional-simplified': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="8" height="16" rx="1"/><rect x="13" y="4" width="8" height="16" rx="1"/><path d="M5 8h4M5 12h4M5 16h3M15 8h4M15 12h4M15 16h3"/><path d="M11 12h2"/></svg>`,

  '/money-cn': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8M9 6l3 3 3-3M9 18l3-3 3 3M6 12h12"/></svg>`,

  '/morse-code': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="4" cy="12" r="1.5" fill="currentColor"/><path d="M8 9v6M11 9v6"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><path d="M18 9v6M21 9v6"/><path d="M2 18h20"/></svg>`,

  '/image-table-recognizer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/><path d="M6 6l1 1M18 6l-1 1M6 18l1-1M18 18l-1-1"/></svg>`,

  '/text-diff': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/><path d="M5 7h4M5 11h4M5 15h3M15 7h4M15 11h4M15 15h3"/><path d="M5 18h2M15 18h2"/></svg>`,

  '/text-dedup-sort': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h12M4 10h12M4 14h8M4 18h6"/><path d="M16 13l3 2-3 2M16 17l3 2-3 2"/><path d="M18 6v6"/></svg>`,

  '/text-to-speech': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9c1 1 1 5 0 6M18 7c2 2 2 8 0 10"/><path d="M4 6h4M4 18h4"/></svg>`,

  '/regex-tester': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h4M6 5v4"/><circle cx="14" cy="8" r="1.5"/><path d="M3 14c3 2 6 2 9 0M14 13c2 1 4 1 6 0"/><path d="M18 6l2 2M20 6l-2 2"/><path d="M2 11h20"/></svg>`,

  '/word-counter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16l3-8 3 8M6 13h4"/><path d="M14 16v-6h2M14 13h2c1 0 2-1 2-2M14 16h4"/><path d="M3 20h18M3 4h18"/></svg>`,

  '/markdown-preview': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M6 15V9l2.5 3L11 9v6"/><path d="M14 9v6M14 12l2 3 2-3"/><path d="M3 20h18M9 5h6"/></svg>`,

  // ========== 文档处理 ==========
  '/doc-word-count': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M9 9h6M9 13h6"/><path d="M9 17h2M13 17h2"/><circle cx="14" cy="17" r="2.5"/><path d="M14 15v4M12 17h4"/></svg>`,

  '/csv-to-json': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="8" height="14" rx="1"/><path d="M2 8h8M2 12h8M2 16h8M5 4v14"/><path d="M11 8l3 4-3 4M14 12h1"/><path d="M16 6c2 0 3 1 3 3s0 2 1 3c-1 1-1 1-1 3s-1 3-3 3"/><path d="M18 9h2M18 15h2"/></svg>`,

  '/excel-to-csv': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="8" height="14" rx="1"/><path d="M2 8h8M2 12h8M5 4v14"/><path d="M6 10l-2 4 2 4M6 10l2 4-2 4M5 14h2"/><path d="M11 8l3 4-3 4M14 12h1"/><rect x="16" y="4" width="6" height="14" rx="1"/><path d="M16 8h6M16 12h6M16 16h3M19 16h3"/></svg>`,

  '/markdown-to-pdf': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="10" height="10" rx="1"/><path d="M5 10V6l2 2 2-2v4"/><path d="M13 8l3 3-3 3M16 11h1"/><path d="M17 14v5a2 2 0 002 2h0a2 2 0 002-2v-5l-2-2z"/><path d="M17 14h4M17 17h4M18 19h2"/></svg>`,

  '/markdown-to-word': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="10" height="10" rx="1"/><path d="M5 10V6l2 2 2-2v4"/><path d="M13 8l3 3-3 3M16 11h1"/><path d="M17 14h5v6l-2-1-3 1z"/><path d="M19 16l1 1M19 18l1 1"/></svg>`,

  '/pdf-toolbox': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M9 9h6M9 13h6"/><path d="M9 17l2 2 4-4"/><path d="M14 3v3h3"/><path d="M3 20l2-2M3 17l2 2M5 20l-2-2"/></svg>`,

  '/txt-to-epub': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5h8v14H2z"/><path d="M4 9h4M4 13h4M4 17h2"/><path d="M11 8l3 3-3 3M14 11h1"/><path d="M15 4v16h6V4z"/><path d="M17 8h2M17 12h2M17 16h1"/></svg>`,

  '/word-to-markdown': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5h8v14H2z"/><path d="M4 9h4M4 13h4M4 17h2"/><path d="M5 7l1-1 1 1M6 6v2"/><path d="M11 8l3 3-3 3M14 11h1"/><rect x="15" y="3" width="7" height="10" rx="1"/><path d="M17 10V6l1.5 2L20 6v4"/></svg>`,

  // ========== 文档工具 ==========
  '/pdf-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v3h3"/><path d="M9 13l3 3 3-3M12 10v6"/><path d="M3 20l2-2M3 17l2 2M5 20l-2-2"/></svg>`,

  // ========== 日期时间 ==========
  '/solar-term-query': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="12" cy="15" r="3"/><path d="M12 12v-1M12 18v1M9 15h-1M16 15h-1"/><path d="M10 13l-1-1M14 17l1-1M10 17l-1 1M14 13l1 1"/></svg>`,

  '/timestamp-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M3 12h2M19 12h2M12 3v2M12 19v2"/><path d="M7 8l1 1M16 8l-1 1M7 16l1-1M16 16l-1-1"/></svg>`,

  '/timezone-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/><circle cx="12" cy="12" r="3"/><path d="M12 11v1l1 1"/></svg>`,

  // ========== 游戏开发 ==========
  '/map-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/><path d="M6 6h0M12 6h0M18 6h0M6 12h0M18 12h0M6 18h0M12 18h0M18 18h0"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,

  '/sprite-slicer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 3v18M15 3v18"/><path d="M3 3l18 18M3 21L21 3"/></svg>`,

  '/collision-detector': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="1"/><rect x="10" y="10" width="12" height="12" rx="1"/><path d="M10 10h4M10 10v4M14 10v4M10 14h4"/></svg>`,

  '/random-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/></svg>`,

  '/vector-calculator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21L21 3M21 3v6M21 3h-6"/><path d="M3 21h6M3 21v-6"/><circle cx="3" cy="21" r="1.5" fill="currentColor"/><circle cx="21" cy="3" r="1.5" fill="currentColor"/></svg>`,

  '/pixel-art-tool': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/><rect x="9" y="9" width="6" height="6" fill="currentColor" stroke="none"/></svg>`,

  '/pixel-art-editor': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="12" height="12" rx="1"/><path d="M3 9h12M9 3v12"/><rect x="6" y="6" width="3" height="3" fill="currentColor" stroke="none"/><path d="M15 15l6-6M18 12l3-3-3-3M18 12l-3-3"/></svg>`,

  '/color-picker-game': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5l-9 9-3-3 9-9z"/><path d="M7 11l-3 3v3h3l3-3"/><path d="M5 17c-1 1-1 3 0 4s3 1 4 0"/><circle cx="14" cy="10" r="1"/></svg>`,

  '/game-config-gen': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12a6 6 0 0112 0M6 12v3a2 2 0 002 2h1v-5M18 12v3a2 2 0 01-2 2h-1v-5"/><path d="M12 4v2M10 6h4"/><circle cx="12" cy="18" r="2"/><path d="M12 20v2M10 22h4"/></svg>`,

  '/game-random-gen': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="6"/><circle cx="8" cy="9" r="1" fill="currentColor"/><circle cx="12" cy="9" r="1" fill="currentColor"/><circle cx="16" cy="9" r="1" fill="currentColor"/><circle cx="10" cy="15" r="1" fill="currentColor"/><circle cx="14" cy="15" r="1" fill="currentColor"/><path d="M12 3v3M12 18v3"/></svg>`,

  '/game-color-picker': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 9V3M12 15v6M9 12H3M15 12h6"/><circle cx="6" cy="6" r="1.5" fill="currentColor"/><circle cx="18" cy="6" r="1.5" fill="currentColor"/><circle cx="6" cy="18" r="1.5" fill="currentColor"/><circle cx="18" cy="18" r="1.5" fill="currentColor"/></svg>`,

  '/noise-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><path d="M2 8c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M2 16c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/></svg>`,

  '/coord-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M3 21V3"/><path d="M3 21l6-6 4 4 8-8"/><path d="M15 11h6v6"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/><circle cx="13" cy="19" r="1.5" fill="currentColor"/></svg>`,

  // ========== 生成器 ==========
  '/password-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><path d="M10 10l8 8"/><path d="M14 12l2 2M16 14l2 2"/><rect x="15" y="15" width="6" height="6" rx="1"/><circle cx="18" cy="18" r="1"/><path d="M16 4l.5 1.5L18 6l-1.5.5L16 8l-.5-1.5L14 6l1.5-.5z"/></svg>`,

  '/lorem-ipsum': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h12M4 10h12M4 14h8M4 18h6"/><path d="M18 6l2 2M18 10l2 2M18 14l2 2M18 18l2 2"/><path d="M16 4v16"/><circle cx="20" cy="20" r="0.5" fill="currentColor"/></svg>`,

  '/uuid-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 9h2M10 9h2M14 9h2M6 12h2M10 12h2M14 12h2M6 15h2M10 15h2M14 15h2"/><path d="M18 9h0M18 12h0M18 15h0"/><circle cx="18" cy="9" r="0.5" fill="currentColor"/><circle cx="18" cy="12" r="0.5" fill="currentColor"/><circle cx="18" cy="15" r="0.5" fill="currentColor"/></svg>`,

  // ========== 生活计算 ==========
  '/loan-calculator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16M8 13h2M12 13h4M8 17h2M12 17h4"/><path d="M12 1v3M10 2h4"/><path d="M7 5l1-1M17 5l-1-1"/></svg>`,

  '/unit-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/><path d="M6 8h3M6 16h3M15 8h3M15 16h3"/><path d="M7 9l1 1 1-1M7 17l1 1 1-1M16 9l1 1 1-1M16 17l1 1 1-1"/></svg>`,

  '/tax-calculator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16M8 13h2M12 13h4M8 17h2M12 17h4"/><path d="M19 5L5 19"/><circle cx="7.5" cy="5.5" r="1"/><circle cx="16.5" cy="5.5" r="1"/></svg>`,

  '/age-calculator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M10 4h4"/><path d="M5 21V10c0-2 2-4 7-4s7 2 7 4v11"/><path d="M5 21h14M9 21v-4h6v4M8 12h.5M16 12h.5"/><path d="M12 8v2M5 15h14"/></svg>`,

  '/date-diff': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="9" height="16" rx="1"/><rect x="13" y="5" width="9" height="16" rx="1"/><path d="M2 9h9M13 9h9M5 5V3M16 5V3"/><path d="M5 13h3M16 13h3M5 17h2M16 17h2"/><path d="M11 13h2M11 17h2"/></svg>`,

  '/bmi-calculator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M9 21v-4l-2-3v-3a3 3 0 013-3h4a3 3 0 013 3v3l-2 3v4"/><rect x="3" y="16" width="5" height="5" rx="1"/><path d="M3 18h5M3 19l2-2"/></svg>`,

  // ========== 站长工具 ==========
  '/site-stats': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><rect x="5" y="11" width="3" height="8"/><rect x="10.5" y="7" width="3" height="12"/><rect x="16" y="14" width="3" height="5"/><path d="M5 11l5-4 6 3 4-5"/><path d="M20 5h-2M20 5v2"/></svg>`,

  '/keyword-miner': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4l-8 8M3 15l5-5M14 4l2 2-8 8-2-2z"/><path d="M3 15l-1 4 4-1"/><path d="M17 7l3 3M19 5l3 3M15 9l3 3"/><circle cx="20" cy="16" r="2"/><path d="M20 18v2M20 14v-1"/></svg>`,

  // ========== 设计工具 ==========
  '/palette-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 100 18c1 0 2-1 2-2s-1-2-1-3 1-2 2-2h2a4 4 0 004-4c0-4-4-7-9-7z"/><circle cx="7" cy="11" r="1.2" fill="currentColor"/><circle cx="9" cy="7" r="1.2" fill="currentColor"/><circle cx="14" cy="7" r="1.2" fill="currentColor"/><circle cx="17" cy="11" r="1.2" fill="currentColor"/></svg>`,

  '/gradient-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 3l18 18"/><path d="M7 3v18M11 3v18M15 3v18"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/></svg>`,

  '/color-picker': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4l-9 9-3 6 6-3 9-9z"/><path d="M15 7l2 2"/><path d="M6 13l-3 3 2 4 4-2"/><circle cx="13" cy="9" r="1"/></svg>`,

  '/shadow-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l4-8 4 8M5 9h6"/><path d="M4 12v6h8v-6"/><path d="M14 10l5 10M14 10l5-2M19 8l2 4-2 2"/><path d="M14 10v8h5"/></svg>`,

  '/favicon-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 18h18M9 21h6M10 18v3M14 18v3"/><circle cx="12" cy="11" r="3"/><path d="M12 9l.5 1.5L14 11l-1.5.5L12 13l-.5-1.5L10 11l1.5-.5z"/></svg>`,

  // ========== 运维工具 ==========
  '/disk-calculator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="7" cy="8" r="1"/><path d="M11 8h6M11 12h6M11 16h6"/><path d="M7 12l1 1 2-2M7 16l1 1 2-2"/></svg>`,

  '/port-scanner': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 12l6-3"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>`,

  '/process-lookup': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/><circle cx="6" cy="6" r="0.8" fill="currentColor"/><circle cx="6" cy="12" r="0.8" fill="currentColor"/><circle cx="6" cy="18" r="0.8" fill="currentColor"/><path d="M10 6h7M10 12h7M10 18h7"/><circle cx="19" cy="6" r="1.5"/></svg>`,

  '/memory-unit-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 8h16M8 4v16M16 4v16"/><path d="M4 12h4M4 16h4M16 12h4M16 16h4"/><rect x="5" y="5" width="2" height="2" fill="currentColor" stroke="none"/><rect x="17" y="5" width="2" height="2" fill="currentColor" stroke="none"/></svg>`,

  '/log-analyzer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M9 9h6M9 13h6M9 17h4"/><path d="M15 3v3h3"/><path d="M3 21l4-4M3 17l4 4M5 21l-2-2"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="19" r="1.5" fill="currentColor"/></svg>`,

  '/cron-expr-gen': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M3 12h2M19 12h2"/><circle cx="12" cy="3" r="1.5"/><path d="M12 4.5v1M12 18.5v1M4.5 12h1M18.5 12h1"/></svg>`,

  '/docker-compose-gen': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="5" height="5" rx="0.5"/><rect x="9.5" y="8" width="5" height="5" rx="0.5"/><rect x="15" y="8" width="5" height="5" rx="0.5"/><rect x="9.5" y="2.5" width="5" height="5" rx="0.5"/><path d="M2 16c0-1 1-2 3-2h14c2 0 3 1 3 2v2c0 2-2 3-4 3H6c-2 0-4-1-4-3z"/><path d="M5 18h2M9 18h2M13 18h2"/></svg>`,

  '/nginx-config-gen': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 13l2 2-2 2M11 13h6M11 17h4"/><circle cx="6" cy="6.5" r="0.5" fill="currentColor"/><circle cx="8" cy="6.5" r="0.5" fill="currentColor"/><path d="M6 16l1 1M8 16l-1 1"/></svg>`,

  '/ssh-keygen': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M6 6.5h.5M8 6.5h.5"/><path d="M7 13c0-1 1-2 2-2M7 13h2M7 13v2h2"/><circle cx="9" cy="14" r="1.5"/><path d="M14 12l3 3M14 15l3-3M13 13h1"/></svg>`,

  '/ssl-cert-parser': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M9 9h6M9 13h4"/><path d="M14 3v3h3"/><rect x="8" y="15" width="8" height="6" rx="1"/><path d="M10 15v-1a2 2 0 014 0v1"/><circle cx="12" cy="18" r="1"/></svg>`,

  // ========== 音视频处理 ==========
  '/waveform-generator': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h2M5 8v8M8 4v16M11 6v12M14 9v6M17 5v14M20 8v8M22 12h0"/><path d="M2 12h20"/></svg>`,

  '/video-screenshot': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="14" height="11" rx="2"/><path d="M16 9l5-2v7l-5-2z"/><path d="M5 20h8M9 16v4"/><circle cx="6" cy="9" r="1"/><path d="M5 13l2-2 2 2"/></svg>`,

  '/video-info-extract': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="14" height="11" rx="2"/><path d="M16 9l5-2v7l-5-2z"/><circle cx="20" cy="20" r="2"/><path d="M20 19v1M20 21v0M19 20h0M21 20h0"/><path d="M5 20h6M8 16v4"/></svg>`,

  '/video-to-gif': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="14" height="11" rx="2"/><path d="M16 9l5-2v7l-5-2z"/><path d="M18 18h4M20 16v4M18 16v0"/><path d="M5 20h6M8 16v4"/><circle cx="6" cy="9" r="1"/><path d="M10 9l-2 2 2 2"/></svg>`,

  '/audio-speed-changer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12v-2a2 2 0 012-2h2v8H5a2 2 0 01-2-2z"/><path d="M7 8l8-4v16l-8-4"/><path d="M18 8c2 2 2 6 0 8M20 6c3 3 3 9 0 12"/><path d="M17 17l3 3M20 17l-3 3"/></svg>`,

  '/audio-converter': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12v-2a2 2 0 012-2h2v8H5a2 2 0 01-2-2z"/><path d="M7 8l5-2M7 16l5 2"/><path d="M15 8l3 3-3 3M18 11h-2"/><path d="M14 14l3 3-3 3M17 17h-2"/><rect x="13" y="7" width="4" height="4" rx="0.5"/></svg>`,

  '/audio-trimmer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12v-2a2 2 0 012-2h2v8H5a2 2 0 01-2-2z"/><path d="M7 8l8-4v16l-8-4"/><path d="M2 5v14M18 5v14"/><path d="M2 5l3 2M2 19l3-2M18 5l-3 2M18 19l-3-2"/></svg>`,

  '/audio-noise-reduction': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12v-2a2 2 0 012-2h2v8H5a2 2 0 01-2-2z"/><path d="M7 8l8-4v16l-8-4"/><path d="M16 12h6M19 9l3 3-3 3"/><rect x="15" y="9" width="4" height="6" rx="1"/></svg>`,

  '/audio-visualizer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12v-2a2 2 0 012-2h2v8H5a2 2 0 01-2-2z"/><path d="M7 8l8-4v16l-8-4"/><path d="M18 6v12M20 4v16M22 8v8"/></svg>`,

  '/tts-audio-synth': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10v4h3l4 3V7L6 10z"/><path d="M13 9c1 1 1 5 0 6M15 7c2 2 2 8 0 10M17 5c3 3 3 11 0 14"/><path d="M5 7h3M5 17h3"/><path d="M20 11l1 1 1-1M21 12v2"/></svg>`,
};
