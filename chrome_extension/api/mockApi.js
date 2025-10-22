/**
 * Mock API for TruthLens Chrome Extension
 * Simulates FastAPI backend responses for testing without a live server
 */

const simulateDelay = (min = 500, max = 1400) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Mock login
 */
export async function mockLogin(username, password) {
  await simulateDelay();

  // Test credentials
  const validUsers = {
    'test@test.com': { password: 'test1234', username: 'testuser', email: 'test@test.com' },
    'testuser': { password: 'test1234', username: 'testuser', email: 'test@test.com' },
    'demo': { password: 'demo123', username: 'demo', email: 'demo@truthlens.com' }
  };

  const user = validUsers[username];
  
  if (!user || user.password !== password) {
    throw new Error('Invalid username or password');
  }

  const token = `mock_ext_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    access_token: token,
    token_type: 'bearer',
    user: {
      username: user.username,
      email: user.email
    }
  };
}

/**
 * Mock register
 */
export async function mockRegister(username, email, password) {
  await simulateDelay();

  if (!username || username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }

  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Check for existing users
  const existingUsers = ['testuser', 'demo', 'admin'];
  if (existingUsers.includes(username.toLowerCase())) {
    throw new Error('Username already exists');
  }

  const token = `mock_ext_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    access_token: token,
    token_type: 'bearer',
    user: { username, email }
  };
}

/**
 * Mock get current user
 */
export async function mockGetMe(token) {
  await simulateDelay(300, 600);

  if (!token || !token.startsWith('mock_ext_token_')) {
    throw new Error('Invalid or expired token');
  }

  return {
    username: 'testuser',
    email: 'test@test.com',
    joinedDate: '2024-01-15'
  };
}

/**
 * Mock verify article
 */
export async function mockVerifyArticle(token, text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  if (text.length > 10000) {
    text = text.substring(0, 5000);
    console.warn('[TruthLens] Text truncated to 5000 characters');
  }

  await simulateDelay();

  // Simulate occasional errors (5%)
  if (Math.random() < 0.05) {
    throw new Error('Server error: Unable to process request');
  }

  const lowerText = text.toLowerCase();
  let score = 50;

  // Score calculation based on keywords
  if (lowerText.includes('who') || lowerText.includes('cdc')) score += 15;
  if (lowerText.includes('research') || lowerText.includes('study')) score += 10;
  if (lowerText.includes('university') || lowerText.includes('professor')) score += 10;
  if (lowerText.includes('fake') || lowerText.includes('hoax')) score -= 25;
  if (lowerText.includes('conspiracy')) score -= 15;
  if (text.length > 500) score += 5;

  score = Math.max(0, Math.min(100, score));

  const verdict = score >= 70 ? 'Likely True' : score >= 40 ? 'Uncertain' : 'Likely False';
  const confidence = text.length < 200 ? 'low' : score >= 75 || score <= 25 ? 'high' : score >= 60 || score <= 40 ? 'medium' : 'low';

  const sources = generateMockSources(text, !token);

  const rationale = generateRationale(score, sources, confidence);

  return {
    score,
    verdict,
    confidence,
    rationale,
    sources
  };
}

function generateMockSources(text, isGuest) {
  const lowerText = text.toLowerCase();
  const sources = [];

  const hasCredible = lowerText.includes('who') || lowerText.includes('cdc') || lowerText.includes('research');
  const hasSkeptical = lowerText.includes('fake') || lowerText.includes('hoax');

  if (hasCredible) {
    sources.push({
      title: 'WHO Official Health Guidelines',
      url: 'https://who.int/news/fact-check',
      publisher: 'World Health Organization',
      stance: 'supports',
      date: '2024-06-15',
      excerpt: 'Official guidelines confirm the validity of public health measures discussed...'
    });

    sources.push({
      title: 'CDC Verified Information Database',
      url: 'https://cdc.gov/fact-check',
      publisher: 'CDC',
      stance: 'supports',
      date: '2024-06-10',
      excerpt: 'Centers for Disease Control data supports core assertions with detailed analysis...'
    });
  }

  if (hasSkeptical) {
    sources.push({
      title: 'Fact-Checkers Flag Misinformation',
      url: 'https://factcheck.org/debunk',
      publisher: 'FactCheck.org',
      stance: 'contradicts',
      date: '2024-06-18',
      excerpt: 'Investigation found several unsubstantiated claims lacking credible sourcing...'
    });
  } else {
    sources.push({
      title: 'Reuters Fact Check Analysis',
      url: 'https://reuters.com/fact-check',
      publisher: 'Reuters',
      stance: 'neutral',
      date: '2024-06-12',
      excerpt: 'Mixed evidence found. Some aspects align with verified information...'
    });
  }

  if (!isGuest && sources.length < 3) {
    sources.push({
      title: 'Academic Research Cross-Reference',
      url: 'https://pubmed.ncbi.nlm.nih.gov/article',
      publisher: 'PubMed',
      stance: 'supports',
      date: '2024-05-28',
      excerpt: 'Peer-reviewed research corroborates several key points with sound methodology...'
    });
  }

  return isGuest ? sources.slice(0, 2) : sources.slice(0, 3);
}

function generateRationale(score, sources, confidence) {
  const supportCount = sources.filter(s => s.stance === 'supports').length;
  const contradictCount = sources.filter(s => s.stance === 'contradicts').length;

  if (score >= 70) {
    return `This claim is supported by ${supportCount} independent source${supportCount !== 1 ? 's' : ''} including credible fact-checkers. Confidence: ${confidence.charAt(0).toUpperCase() + confidence.slice(1)}.`;
  } else if (score >= 40) {
    return `Mixed evidence with ${supportCount} supporting and ${contradictCount} contradicting sources. Additional verification recommended. Confidence: ${confidence.charAt(0).toUpperCase() + confidence.slice(1)}.`;
  } else {
    return `Multiple sources contradict key claims. ${contradictCount} authoritative source${contradictCount !== 1 ? 's' : ''} flag potential misinformation. Confidence: ${confidence.charAt(0).toUpperCase() + confidence.slice(1)}.`;
  }
}