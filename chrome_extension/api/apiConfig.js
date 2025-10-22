/**
 * API Configuration for TruthLens Chrome Extension
 * 
 * Toggle between mock and real FastAPI backend
 */

// Set to false when connecting to real FastAPI backend
export const USE_MOCK = true;

// FastAPI backend URL (update this when deploying)
export const API_BASE_URL = 'https://api.truthlens.com';

// For local development, use:
// export const API_BASE_URL = 'http://localhost:8000';