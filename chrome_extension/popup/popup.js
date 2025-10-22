/**
 * Popup Script for TruthLens Chrome Extension
 * Handles UI interactions and API calls
 */

import { login, verifyArticle, logout } from '../api/extensionApi.js';
import { getAuthData, saveAuthData, clearAuthData } from '../api/authStorage.js';

// DOM Elements
const loginView = document.getElementById('loginView');
const mainView = document.getElementById('mainView');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const userAvatar = document.querySelector('.user-avatar');
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const checkBtn = document.getElementById('checkBtn');
const resultSection = document.getElementById('resultSection');
const checkAgainBtn = document.getElementById('checkAgainBtn');
const signupLink = document.getElementById('signupLink');
const viewFullReport = document.getElementById('viewFullReport');

// State
let currentResult = null;

// Initialize
init();

async function init() {
  const { token, user } = await getAuthData();
  
  if (token && user) {
    showMainView(user);
  } else {
    showLoginView();
  }
}

function showLoginView() {
  loginView.style.display = 'block';
  mainView.style.display = 'none';
}

function showMainView(user) {
  loginView.style.display = 'none';
  mainView.style.display = 'block';
  
  // Set user info
  userName.textContent = user.username;
  
  // Set avatar initials
  const initials = getInitials(user.username);
  userAvatar.textContent = initials;
}

function getInitials(name) {
  if (!name || name.length === 0) return '?';
  if (name.length === 1) return name.toUpperCase();
  return (name[0] + name[name.length - 1]).toUpperCase();
}

// Login Form
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  
  if (!username || !password) {
    showError('Please enter both username and password');
    return;
  }
  
  setLoading(loginBtn, true);
  hideError();
  
  try {
    const response = await login(username, password);
    
    // Save auth data
    await saveAuthData(response.access_token, response.user);
    
    // Show main view
    showMainView(response.user);
    
    // Reset form
    loginForm.reset();
    
  } catch (error) {
    showError(error.message || 'Login failed. Please try again.');
  } finally {
    setLoading(loginBtn, false);
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await clearAuthData();
  showLoginView();
  
  // Reset main view
  textInput.value = '';
  charCount.textContent = '0';
  resultSection.style.display = 'none';
});

// Text Input
textInput.addEventListener('input', () => {
  const length = textInput.value.length;
  charCount.textContent = length.toLocaleString();
  
  // Enable/disable check button
  checkBtn.disabled = length === 0 || length > 10000;
});

// Check Button
checkBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  
  if (!text) return;
  
  if (text.length > 10000) {
    alert('Text is too long. Maximum 10,000 characters allowed.');
    return;
  }
  
  setLoading(checkBtn, true);
  
  try {
    const result = await verifyArticle(text);
    currentResult = result;
    
    // Display result
    displayResult(result);
    
  } catch (error) {
    alert(error.message || 'Verification failed. Please try again.');
  } finally {
    setLoading(checkBtn, false);
  }
});

// Check Again
checkAgainBtn.addEventListener('click', () => {
  resultSection.style.display = 'none';
  textInput.value = '';
  charCount.textContent = '0';
  checkBtn.disabled = true;
  currentResult = null;
});

// Signup Link
signupLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://truthlens.com/auth#signup' });
});

// View Full Report
viewFullReport.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://truthlens.com' });
});

// Display Result
function displayResult(result) {
  const scorePill = document.getElementById('scorePill');
  const scoreValue = document.getElementById('scoreValue');
  const verdict = document.getElementById('verdict');
  const rationale = document.getElementById('rationale');
  const sources = document.getElementById('sources');
  
  // Set score
  scoreValue.textContent = `${result.score}/100`;
  
  // Set score class
  scorePill.classList.remove('score-high', 'score-medium', 'score-low');
  if (result.score >= 70) {
    scorePill.classList.add('score-high');
  } else if (result.score >= 40) {
    scorePill.classList.add('score-medium');
  } else {
    scorePill.classList.add('score-low');
  }
  
  // Set verdict
  verdict.textContent = result.verdict;
  
  // Set rationale
  rationale.textContent = result.rationale;
  
  // Set sources
  if (result.sources && result.sources.length > 0) {
    sources.innerHTML = `
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
    `;
  } else {
    sources.innerHTML = '';
  }
  
  // Show result section
  resultSection.style.display = 'block';
  
  // Scroll to result
  resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Helper Functions
function setLoading(button, isLoading) {
  const textSpan = button.querySelector('.btn-text');
  const spinner = button.querySelector('.spinner');
  
  if (isLoading) {
    button.disabled = true;
    if (textSpan) textSpan.style.display = 'none';
    if (spinner) spinner.style.display = 'inline-block';
  } else {
    button.disabled = false;
    if (textSpan) textSpan.style.display = 'inline';
    if (spinner) spinner.style.display = 'none';
  }
}

function showError(message) {
  loginError.textContent = message;
  loginError.style.display = 'block';
}

function hideError() {
  loginError.style.display = 'none';
  loginError.textContent = '';
}

console.log('[TruthLens] Popup script loaded');