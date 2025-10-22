/**
 * Authentication Storage Helper
 * Manages token and user data in chrome.storage.local
 */

/**
 * Save authentication data
 */
export async function saveAuthData(token, user) {
  await chrome.storage.local.set({
    truthlens_token: token,
    truthlens_user: user
  });
}

/**
 * Get authentication data
 */
export async function getAuthData() {
  const data = await chrome.storage.local.get(['truthlens_token', 'truthlens_user']);
  return {
    token: data.truthlens_token || null,
    user: data.truthlens_user || null
  };
}

/**
 * Clear authentication data (logout)
 */
export async function clearAuthData() {
  await chrome.storage.local.remove(['truthlens_token', 'truthlens_user']);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const { token } = await getAuthData();
  return !!token;
}