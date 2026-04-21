// =============================================================================
// MINDI Browser Extension — Background Service Worker (MV3)
// Handles: auth token storage, message routing between popup and content scripts.
// Security: tokens stored in extension storage, never in page context.
// =============================================================================

import { EXTENSION_CONFIG } from '../../shared/constants/phase3.js';

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ping') {
    sendResponse({ alive: true });
    return;
  }

  if (message.type === 'auth_check') {
    chrome.storage.local.get(EXTENSION_CONFIG.STORAGE_KEY_TOKEN, (result) => {
      sendResponse({ authenticated: !!result[EXTENSION_CONFIG.STORAGE_KEY_TOKEN] });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'capture') {
    // Forward capture payload to Mindi app
    handleCapture(message.payload).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message });
    });
    return true;
  }

  if (message.type === 'inject_brainlink') {
    // Inject Brain Link snippet into active tab's focused input
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: injectTextIntoFocusedInput,
          args: [message.payload.brainLinkSnippet],
        });
      }
    });
    sendResponse({ injected: true });
    return;
  }
});

async function handleCapture(payload) {
  const stored = await chrome.storage.local.get(EXTENSION_CONFIG.STORAGE_KEY_TOKEN);
  const token = stored[EXTENSION_CONFIG.STORAGE_KEY_TOKEN];

  if (!token) {
    return { error: 'Not authenticated. Open Mindi and sign in first.' };
  }

  // Truncate large captures
  if (payload.fullPageText?.length > EXTENSION_CONFIG.MAX_CAPTURE_CHARS) {
    payload.fullPageText = payload.fullPageText.slice(0, EXTENSION_CONFIG.MAX_CAPTURE_CHARS);
    payload.truncated = true;
  }

  const appUrl = EXTENSION_CONFIG.ALLOWED_ORIGINS.includes('http://localhost:3000')
    ? 'http://localhost:3000'
    : 'https://app.mindi.ai';

  const res = await fetch(`${appUrl}/api/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      chunks: [{
        index: 0,
        content: payload.selectedText || payload.fullPageText || payload.title,
        contentHash: await hashText(payload.selectedText || payload.title),
        tokenCount: Math.ceil((payload.selectedText || payload.title || '').length / 4),
        sourceRef: {
          type: 'upload',
          fileName: payload.title,
          fileUrl: payload.url,
          timestamp: payload.capturedAt,
        },
      }],
      fileName: payload.title,
      fileType: 'text/plain',
    }),
  });

  if (!res.ok) return { error: 'Failed to save to brain' };
  return await res.json();
}

// Injected into page to paste Brain Link into focused input
function injectTextIntoFocusedInput(text) {
  const el = document.activeElement;
  if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable)) {
    if (el.isContentEditable) {
      el.textContent = text + '\n\n' + el.textContent;
    } else {
      const start = el.selectionStart ?? 0;
      el.value = text + '\n\n' + el.value.slice(start);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}

async function hashText(text) {
  if (!text) return 'empty';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
