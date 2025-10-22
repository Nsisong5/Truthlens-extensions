/**
 * Background Service Worker for TruthLens Chrome Extension
 * Handles context menu, message passing, and API coordination
 */

import { verifyArticle } from './api/extensionApi.js';
import { getAuthData } from './api/authStorage.js';

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'truthlens_check_selection',
    title: 'Check with TruthLens',
    contexts: ['selection']
  });

  console.log('[TruthLens] Extension installed successfully');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'truthlens_check_selection') {
    const selection = info.selectionText;

    if (!selection || selection.trim().length === 0) {
      return;
    }

    try {
      // Get auth data
      const { token } = await getAuthData();

      // Check if text is too long
      let textToCheck = selection;
      if (selection.length > 10000) {
        textToCheck = selection.substring(0, 5000);
        
        // Show notification about truncation
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'TruthLens',
          message: 'Long selection detected. Checking first 5000 characters...'
        });
      }

      // Show loading notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'TruthLens',
        message: 'Checking claim...'
      });

      // Verify the article
      const result = await verifyArticle(textToCheck, token);

      // Send result to content script for overlay display
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_RESULT',
        payload: result,
        selection: textToCheck
      });

    } catch (error) {
      console.error('[TruthLens] Verification error:', error);

      // Show error notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'TruthLens Error',
        message: error.message || 'Failed to verify. Please try again.'
      });

      // If not authenticated, open popup
      if (error.message.includes('Session expired') || error.message.includes('Not authenticated')) {
        chrome.action.openPopup();
      }
    }
  }
});

// Handle messages from popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'VERIFY_TEXT':
          const { token } = await getAuthData();
          const result = await verifyArticle(message.text, token);
          sendResponse({ success: true, data: result });
          break;

        case 'GET_AUTH_STATUS':
          const authData = await getAuthData();
          sendResponse({ 
            success: true, 
            isAuthenticated: !!authData.token,
            user: authData.user 
          });
          break;

        case 'OPEN_WEB_APP':
          chrome.tabs.create({ url: 'https://truthlens.com' });
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[TruthLens] Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // Return true to indicate async response
  return true;
});

// Listen for extension icon click (opens popup automatically via manifest)
chrome.action.onClicked.addListener((tab) => {
  // Popup opens automatically, no additional action needed
  console.log('[TruthLens] Extension icon clicked');
});

console.log('[TruthLens] Background service worker loaded');