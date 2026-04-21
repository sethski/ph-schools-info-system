// =============================================================================
// MINDI Browser Extension — Content Script
// Runs on every page. Detects text selection for quick capture.
// Adds "Add to Mindi" context menu trigger on selection.
// Does NOT auto-capture anything — explicit user action required.
// =============================================================================

(function () {
  'use strict';

  let captureButton = null;
  let selectionTimeout = null;

  // Show capture button when user selects text
  document.addEventListener('mouseup', () => {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText && selectedText.length > 20) {
        showCaptureButton(selectedText);
      } else {
        hideCaptureButton();
      }
    }, 200);
  });

  // Hide on click elsewhere
  document.addEventListener('mousedown', (e) => {
    if (captureButton && !captureButton.contains(e.target)) {
      hideCaptureButton();
    }
  });

  function showCaptureButton(selectedText) {
    hideCaptureButton();

    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    captureButton = document.createElement('button');
    captureButton.textContent = '🧠 Add to Mindi';
    captureButton.setAttribute('aria-label', 'Add selected text to your Mindi brain');

    Object.assign(captureButton.style, {
      position: 'fixed',
      top: `${rect.top + window.scrollY - 40}px`,
      left: `${rect.left + rect.width / 2 - 70}px`,
      zIndex: '2147483647',
      background: '#1a1a24',
      color: '#a5b4fc',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: '8px',
      padding: '5px 12px',
      fontSize: '12px',
      fontFamily: 'system-ui, sans-serif',
      cursor: 'pointer',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      transition: 'opacity 0.15s ease',
    });

    captureButton.addEventListener('click', () => {
      captureSelection(selectedText);
      hideCaptureButton();
    });

    document.body.appendChild(captureButton);
  }

  function hideCaptureButton() {
    if (captureButton) {
      captureButton.remove();
      captureButton = null;
    }
  }

  function captureSelection(selectedText) {
    chrome.runtime.sendMessage(
      {
        type: 'capture',
        payload: {
          url: window.location.href,
          title: document.title,
          selectedText,
          capturedAt: new Date().toISOString(),
          source: 'selection',
        },
      },
      (response) => {
        if (response?.error) {
          showToast(`Mindi: ${response.error}`, 'error');
        } else {
          showToast('Added to your brain ✓', 'success');
        }
      }
    );
  }

  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.textContent = message;

    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '2147483647',
      background: type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
      color: type === 'success' ? '#10b981' : '#ef4444',
      border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
      borderRadius: '10px',
      padding: '10px 16px',
      fontSize: '13px',
      fontFamily: 'system-ui, sans-serif',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      opacity: '1',
      transition: 'opacity 0.3s ease',
    });

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
})();
