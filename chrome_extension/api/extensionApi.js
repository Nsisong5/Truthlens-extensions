/**
 * Extension API Wrapper
 * Handles all API calls - switches between mock and real FastAPI backend
 */

import { USE_MOCK, API_BASE_URL } from './apiConfig.js';
import * as mockApi from './mockApi.js';

/**
 * Fetch with authentication
 */
async function fetchWithAuth(endpoint, options = {}) {
  const data = await chrome.storage.local.get(['truthlens_token']);
  const token = data.truthlens_token;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token expired or invalid - clear storage
    await chrome.storage.local.remove(['truthlens_token', 'truthlens_user']);
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Login user
 */
export async function login(username, password) {
  if (USE_MOCK) {
    return await mockApi.mockLogin(username, password);
  }

  return await fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

/**
 * Register new user
 */
export async function register(username, email, password) {
  if (USE_MOCK) {
    return await mockApi.mockRegister(username, email, password);
  }

  return await fetchWithAuth('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  });
}

/**
 * Get current user info
 */
export async function getMe() {
  const data = await chrome.storage.local.get(['truthlens_token']);
  const token = data.truthlens_token;

  if (!token) {
    throw new Error('Not authenticated');
  }

  if (USE_MOCK) {
    return await mockApi.mockGetMe(token);
  }

  return await fetchWithAuth('/users/me');
}

/**
 * Verify article/text
 */
export async function verifyArticle(text, token = null) {
  if (USE_MOCK) {
    return await mockApi.mockVerifyArticle(token, text);
  }

  // If no token provided, get from storage
  if (!token) {
    const data = await chrome.storage.local.get(['truthlens_token']);
    token = data.truthlens_token;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const response = await fetch(`${API_BASE_URL}/verify_article`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Verification failed');
  }

  return await response.json();
}

/**
 * Logout (clear local storage)
 */
export async function logout() {
  await chrome.storage.local.remove(['truthlens_token', 'truthlens_user']);
}