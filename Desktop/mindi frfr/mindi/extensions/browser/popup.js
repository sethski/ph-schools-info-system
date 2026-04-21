// =============================================================================
// MINDI Browser Extension — Popup Script
// Checks auth, handles capture, Brain Link injection, dashboard open.
// =============================================================================

const APP_URL = 'http://localhost:3000'; // Change to https://app.mindi.ai in prod
const TOKEN_KEY = 'mindi_ext_token';

const authStatus = document.getElementById('authStatus');
const unauthView = document.getElementById('unauthView');
const mainView = document.getElementById('mainView');
const statusMsg = document.getElementById('statusMsg');

function showStatus(message, type = 'info') {
  statusMsg.textContent = message;
  statusMsg.className = `status-msg ${type}`;
  statusMsg.style.display = 'block';
  if (type !== 'error') {
    setTimeout(() => { statusMsg.style.display = 'none'; }, 2500);
  }
}

// Check auth state on popup open
chrome.storage.local.get(TOKEN_KEY, (result) => {
  const token = result[TOKEN_KEY];
  if (token) {
    authStatus.textContent = 'Signed in';
    authStatus.className = 'auth-status signed-in';
    mainView.style.display = 'block';
  } else {
    authStatus.textContent = 'Not signed in';
    authStatus.className = 'auth-status signed-out';
    unauthView.style.display = 'block';
  }
});

// Capture full page
document.getElementById('capturePageBtn')?.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) return;

    // Get page text via content script
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => ({
          title: document.title,
          url: window.location.href,
          text: document.body.innerText?.slice(0, 10000) ?? '',
        }),
      },
      (results) => {
        const pageData = results?.[0]?.result;
        if (!pageData) { showStatus('Could not read page content', 'error'); return; }

        chrome.runtime.sendMessage(
          {
            type: 'capture',
            payload: {
              ...pageData,
              fullPageText: pageData.text,
              capturedAt: new Date().toISOString(),
              source: 'full_page',
            },
          },
          (response) => {
            if (response?.error) {
              showStatus(response.error, 'error');
            } else {
              showStatus('Page added to your brain ✓', 'success');
            }
          }
        );
      }
    );
  });
});

// Inject Brain Link into focused input on the active page
document.getElementById('injectLinkBtn')?.addEventListener('click', async () => {
  const stored = await chrome.storage.local.get(TOKEN_KEY);
  const token = stored[TOKEN_KEY];
  if (!token) { showStatus('Sign in first', 'error'); return; }

  showStatus('Fetching Brain Link…', 'info');

  try {
    const res = await fetch(`${APP_URL}/api/brainlink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        regions: ['writing', 'professional'],
        includeStyleFingerprint: true,
        includeRecentNodes: true,
        maxNodes: 5,
        expiresInHours: 1,
      }),
    });

    if (!res.ok) {
      showStatus('MFA required — open Mindi to verify', 'error');
      return;
    }

    const data = await res.json();

    chrome.runtime.sendMessage(
      { type: 'inject_brainlink', payload: { brainLinkSnippet: data.snippet } },
      () => showStatus('Brain Link injected ✓', 'success')
    );
  } catch {
    showStatus('Failed to fetch Brain Link', 'error');
  }
});

// Open dashboard
document.getElementById('openDashboardBtn')?.addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP_URL}/dashboard` });
});
