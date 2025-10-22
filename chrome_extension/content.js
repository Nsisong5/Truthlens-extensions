/**
 * Content Script for TruthLens Chrome Extension
 * Injects verification overlay into web pages
 */

// Track if overlay is currently shown
let currentOverlay = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_RESULT') {
    showVerificationOverlay(message.payload, message.selection);
    sendResponse({ success: true });
  }
  return true;
});

/**
 * Show verification result overlay
 */
function showVerificationOverlay(result, selection) {
  // Remove existing overlay if present
  removeOverlay();

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'truthlens-overlay';
  overlay.className = 'truthlens-container';

  // Get score color class
  const scoreClass = result.score >= 70 ? 'score-high' : 
                     result.score >= 40 ? 'score-medium' : 'score-low';

  // Build overlay HTML
  overlay.innerHTML = `
    <div class="truthlens-card">
      <div class="truthlens-header">
        <div class="truthlens-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
          </svg>
          <span>TruthLens</span>
        </div>
        <button class="truthlens-close" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="truthlens-score-row">
        <div class="truthlens-score ${scoreClass}">
          <span class="score-label">Truth Score</span>
          <span class="score-value">${result.score}/100</span>
        </div>
        <div class="truthlens-verdict">
          <span class="verdict-label">Verdict:</span>
          <span class="verdict-value">${result.verdict}</span>
        </div>
      </div>

      <p class="truthlens-rationale">${result.rationale}</p>

      ${result.sources && result.sources.length > 0 ? `
        <div class="truthlens-sources">
          <h4>Top Sources:</h4>
          <ul>
            ${result.sources.map(source => `
              <li>
                <a href="${source.url}" target="_blank" rel="noopener noreferrer">
                  ${source.title}
                </a>
                <span class="source-stance stance-${source.stance}">${source.stance.toUpperCase()}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="truthlens-actions">
        <a href="https://truthlens.com" target="_blank" class="truthlens-link">
          View Full Report
        </a>
      </div>
    </div>
  `;

  // Add close button handler
  const closeBtn = overlay.querySelector('.truthlens-close');
  closeBtn.addEventListener('click', removeOverlay);

  // Add overlay to page
  document.body.appendChild(overlay);
  currentOverlay = overlay;

  // Fade in animation
  setTimeout(() => {
    overlay.classList.add('show');
  }, 10);

  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (currentOverlay === overlay) {
      removeOverlay();
    }
  }, 30000);
}

/**
 * Remove overlay from page
 */
function removeOverlay() {
  if (currentOverlay) {
    currentOverlay.classList.remove('show');
    setTimeout(() => {
      if (currentOverlay && currentOverlay.parentNode) {
        currentOverlay.parentNode.removeChild(currentOverlay);
      }
      currentOverlay = null;
    }, 300);
  }
}

// Remove overlay when clicking outside
document.addEventListener('click', (e) => {
  if (currentOverlay && !currentOverlay.contains(e.target)) {
    removeOverlay();
  }
});

// Remove overlay on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && currentOverlay) {
    removeOverlay();
  }
});

console.log('[TruthLens] Content script loaded');