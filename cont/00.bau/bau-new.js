// === BAU Form - Modular Architecture ===
// Main initialization file that imports and coordinates all modules

// Import all modules
import { initAIDemo } from "./src/ai-demo.js";
import { initAIModelAndToken } from "./src/ai-model.js";
import { enhanceSocratesSelectsInFlow } from "./src/dropdown-ui.js";
import { initFormDataManagement } from "./src/form-data.js";
import { initPDFGenerator } from "./src/pdf-generator.js";
import { initFileMCQ } from "./src/file-mcq.js";

// Import Firebase modules for history functionality
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// History management functions (from old bau.js)
async function loadHistories() {
  try {
    const auth = window.auth;
    const user = auth?.currentUser || null;
    
    if (!user) {
      console.log("[BAU] No authenticated user for loadHistories");
      return;
    }

    const db = getFirestore(window.firebaseApp);
    const colRef = collection(db, "users", user.uid, "histories");
    const q = query(colRef, orderBy("timestamp", "desc"), limit(50));
    const snap = await getDocs(q);
    
    console.log(`[BAU] Loaded ${snap.size} histories`);
    
    // Update history sidebar if it exists
    if (window.renderHistorySidebar) {
      window.renderHistorySidebar();
    }
  } catch (error) {
    console.error("[BAU] Error loading histories:", error);
  }
}

// Practice Mode Variables
let currentMode = 'chat'; // 'chat' or 'practice'
let currentCase = null;
let practiceMessages = [];
let caseDifficulty = 'intermediate';

// Practice Mode Functions
function switchMode(mode) {
  currentMode = mode;
  const chatContainer = document.getElementById('chat-mode-container');
  const practiceContainer = document.getElementById('practice-mode-container');
  const chatBtn = document.getElementById('chat-mode-btn');
  const practiceBtn = document.getElementById('practice-mode-btn');
  const modeStatus = document.getElementById('mode-status');
  
  // Simple direct query for chat input
  const chatInput = document.getElementById('chat-input');
  
  console.log('[PRACTICE] Element check:', {
    chatContainer: !!chatContainer,
    practiceContainer: !!practiceContainer,
    chatBtn: !!chatBtn,
    practiceBtn: !!practiceBtn,
    modeStatus: !!modeStatus,
    chatInput: !!chatInput
  });
  
  if (!chatInput) {
    console.error('[PRACTICE] CRITICAL: Chat input element not found!');
    return;
  }
  
  // Check if other elements exist
  if (!chatContainer || !practiceContainer || !chatBtn || !practiceBtn || !modeStatus) {
    console.warn('[PRACTICE] Some UI elements not found, skipping mode switch');
    return;
  }
  
  if (mode === 'chat') {
    chatContainer.style.display = 'block';
    practiceContainer.style.display = 'none';
    chatBtn.style.background = 'rgba(44, 201, 199, 0.9)';
    chatBtn.style.color = 'white';
    practiceBtn.style.background = 'transparent';
    practiceBtn.style.color = 'var(--all-text)';
    modeStatus.textContent = 'In Development';
    if (chatInput) {
      chatInput.placeholder = 'Feature under maintenance - coming soon!';
      chatInput.disabled = true;
    }
    
    // Disable send button for chat mode
    const sendBtn = document.getElementById('send-chat-btn');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.style.background = '#ccc';
      sendBtn.style.color = '#666';
      sendBtn.style.cursor = 'not-allowed';
    }
  } else {
    chatContainer.style.display = 'none';
    practiceContainer.style.display = 'block';
    practiceBtn.style.background = 'rgba(156, 39, 176, 0.9)';
    practiceBtn.style.color = 'white';
    chatBtn.style.background = 'transparent';
    chatBtn.style.color = 'var(--all-text)';
    modeStatus.textContent = 'Active';
    modeStatus.style.background = 'rgba(76, 175, 80, 0.1)';
    modeStatus.style.color = '#2e7d32';
    if (chatInput) {
      chatInput.placeholder = 'Ask questions about the case, request physical examination, or provide your assessment...';
      chatInput.disabled = false;
      chatInput.style.background = 'var(--header-bg)';
    }
    
    // Animate practice mode elements when switching to practice mode
    setTimeout(() => {
      animatePracticeModeElements();
    }, 100);
    
    if (chatInput) {
      chatInput.style.color = 'var(--all-text)';
      chatInput.style.cursor = 'text';
    }
    
    // Enable send button for practice mode
    const sendBtn = document.getElementById('send-chat-btn');
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.style.background = '#9c27b0';
      sendBtn.style.color = 'white';
      sendBtn.style.cursor = 'pointer';
    }
  }
  
  // Don't save practice mode to localStorage
  // localStorage.setItem('practiceMode', mode);
}

async function generateNewCase() {
  const caseContent = document.getElementById('case-content');
  const startBtn = document.getElementById('start-case-btn');
  
  try {
    startBtn.textContent = 'Generating Case...';
    startBtn.disabled = true;
    caseContent.style.opacity = '0.5';
    caseContent.innerHTML = 'Generating a new case presentation...';
    
    // Get selected AI model from the AI demo
    const modelSelect = document.getElementById('practice-model-select');
    const selectedModel = modelSelect ? modelSelect.value : 'gemini-2.0-flash-exp';
    
    const casePrompt = `Generate a realistic medical case for a ${caseDifficulty} level medical student practice session. 

Create a patient profile with:
- Patient name (first and last)
- Age and gender
- Brief general appearance/demeanor
- The medical condition they have (but don't reveal diagnosis)

Format the response as if you're the patient introducing yourself to the doctor. Keep it very brief - just name, age, gender, and a simple greeting. Do NOT include chief complaint, history, or any medical details yet. The student will ask for those step by step.

Example format: "Hello doctor, my name is [Name]. I'm a [age]-year-old [gender]. Thank you for seeing me today."`;
    
    let caseResult;
    
    // Use the same AI generation logic as the AI demo
    if (window.firebaseAI && selectedModel.startsWith('gemini')) {
      try {
        const model = window.getGenerativeModel(window.firebaseAI, {
          model: selectedModel,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
          ]
        });
        
        const result = await model.generateContent(casePrompt);
        const response = await result.response;
        caseResult = response.text();
        console.log('[PRACTICE] Case generated with Firebase AI:', selectedModel);
      } catch (error) {
        console.error('[PRACTICE] Firebase AI failed:', error);
        throw error;
      }
    } else {
      // Fallback to Vercel API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: casePrompt }],
          model: selectedModel,
          temperature: 0.7,
          max_tokens: 512
        })
      });
      
      if (!response.ok) throw new Error('Vercel API failed');
      const data = await response.json();
      caseResult = data.choices[0].message.content;
      console.log('[PRACTICE] Case generated with Vercel API:', selectedModel);
    }
    
    currentCase = {
      content: caseResult,
      difficulty: caseDifficulty,
      timestamp: new Date().toISOString()
    };
    
    caseContent.innerHTML = caseResult;
    caseContent.style.opacity = '1';
    
    // Clear previous messages and add initial patient greeting
    practiceMessages = [];
    const messagesContainer = document.getElementById('practice-messages');
    messagesContainer.innerHTML = '';
    
    // Add patient greeting from the generated case
    await addPracticeMessage('patient', caseResult);
    
    // Don't save to localStorage
    // savePracticeData();
    
  } catch (error) {
    console.error('[PRACTICE] Case generation failed:', error);
    caseContent.innerHTML = `<span style="color: #d32f2f;">Failed to generate case. Please try again.</span>`;
    caseContent.style.opacity = '1';
  } finally {
    startBtn.textContent = 'Start New Case';
    startBtn.disabled = false;
  }
}

async function handlePracticeInput() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message || !currentCase) return;
  
  // Add user message
  await addPracticeMessage('user', message);
  input.value = '';
  
  // Generate AI response
  await generatePracticeResponse(message);
}

async function addPracticeMessage(sender, content) {
  const messagesContainer = document.getElementById('practice-messages');
  
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    margin-bottom: 15px;
    display: flex;
    ${sender === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
  `;
  
  const bubble = document.createElement('div');
  bubble.style.cssText = `
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 18px;
    ${sender === 'user' 
      ? 'background: rgba(44, 201, 199, 0.9); color: white; border-bottom-right-radius: 4px;' 
      : 'background: var(--borderbottomdark); color: var(--all-text); border-bottom-left-radius: 4px;'
    }
    font-size: 14px;
    line-height: 1.4;
    word-wrap: break-word;
  `;
  
  bubble.textContent = content;
  messageDiv.appendChild(bubble);
  messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  practiceMessages.push({ sender, content, timestamp: new Date().toISOString() });
  
  // Save messages after each addition
  savePracticeData();
}

async function generatePracticeResponse(userMessage) {
  const messagesContainer = document.getElementById('practice-messages');
  
  // Add loading indicator
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'practice-loading';
  loadingDiv.style.cssText = `
    margin-bottom: 15px;
    display: flex;
    justify-content: flex-start;
  `;
  
  const loadingBubble = document.createElement('div');
  loadingBubble.style.cssText = `
    padding: 12px 16px;
    border-radius: 18px;
    background: var(--borderbottomdark);
    color: var(--all-text);
    font-size: 14px;
    font-style: italic;
    opacity: 0.7;
  `;
  loadingBubble.textContent = 'Patient is responding...';
  loadingDiv.appendChild(loadingBubble);
  messagesContainer.appendChild(loadingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  try {
    // Get selected AI model from Practice Mode selector
    const modelSelect = document.getElementById('practice-model-select');
    const selectedModel = modelSelect ? modelSelect.value : 'gemini-2.0-flash-exp';
    
    const responsePrompt = `You are a real patient with a medical condition. Your background: ${currentCase.content}

The doctor just said: "${userMessage}"

CRITICAL: You are NOT an AI assistant. You are a human patient. Respond ONLY as the patient would respond - no explanations, no medical knowledge, no helpful AI language.

Rules:
- Answer ONLY what a patient would know about their own body
- Keep responses very short (5-15 words typically)
- Use natural patient language, not medical terms
- If asked about physical exam, just say "okay" and let them examine you
- Don't explain medical concepts or be educational
- Show normal patient emotions (worry, confusion, pain)
- Only give information when directly asked
- Use "I" statements about your symptoms

Examples:
Doctor: "What brings you in?" 
Patient: "My chest really hurts."

Doctor: "When did it start?"
Patient: "About 3 hours ago."

Doctor: "Can I listen to your heart?"
Patient: "Sure, go ahead."

Doctor: "Any family history of heart problems?"
Patient: "My dad had a heart attack when he was 60."

BE THE PATIENT, NOT AN AI HELPER.`;
    
    let response;
    
    // Use same AI logic as case generation
    if (window.firebaseAI && selectedModel.startsWith('gemini')) {
      try {
        const model = window.getGenerativeModel(window.firebaseAI, {
          model: selectedModel,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 256,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
          ]
        });
        
        const result = await model.generateContent(responsePrompt);
        const aiResponse = await result.response;
        response = aiResponse.text();
        console.log('[PRACTICE] Response generated with Firebase AI:', selectedModel);
      } catch (error) {
        console.error('[PRACTICE] Firebase AI failed:', error);
        throw error;
      }
    } else {
      // Fallback to Vercel API
      const apiResponse = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: responsePrompt }],
          model: selectedModel,
          temperature: 0.7,
          max_tokens: 256
        })
      });
      
      if (!apiResponse.ok) throw new Error('Vercel API failed');
      const data = await apiResponse.json();
      response = data.choices[0].message.content;
      console.log('[PRACTICE] Response generated with Vercel API:', selectedModel);
    }
    
    // Remove loading indicator
    const loading = document.getElementById('practice-loading');
    if (loading) loading.remove();
    
    // Add AI response
    await addPracticeMessage('patient', response);
    
  } catch (error) {
    console.error('[PRACTICE] Response generation failed:', error);
    
    // Remove loading indicator
    const loading = document.getElementById('practice-loading');
    if (loading) loading.remove();
    
    // Add error message as patient would
    await addPracticeMessage('patient', 'Sorry doctor, I didn\'t hear you clearly. Can you ask me again?');
  }
}

function cycleDifficulty() {
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const currentIndex = difficulties.indexOf(caseDifficulty);
  caseDifficulty = difficulties[(currentIndex + 1) % difficulties.length];
  
  const btn = document.getElementById('case-difficulty-btn');
  btn.textContent = `Difficulty: ${caseDifficulty.charAt(0).toUpperCase() + caseDifficulty.slice(1)}`;
}

// Save/Load Practice Data Functions
function savePracticeData() {
  // Disabled localStorage saving for practice data
  // const practiceData = {
  //   currentCase,
  //   practiceMessages,
  //   caseDifficulty,
  //   timestamp: new Date().toISOString()
  // };
  // localStorage.setItem('practiceData', JSON.stringify(practiceData));
}

function loadPracticeData() {
  // Disabled localStorage loading for practice data
  // try {
  //   const saved = localStorage.getItem('practiceData');
  //   if (saved) {
  //     const data = JSON.parse(saved);
  //     currentCase = data.currentCase;
  //     practiceMessages = data.practiceMessages || [];
  //     caseDifficulty = data.caseDifficulty || 'intermediate';
  //     
  //     // Update difficulty button
  //     const btn = document.getElementById('case-difficulty-btn');
  //     if (btn) {
  //       btn.textContent = `Difficulty: ${caseDifficulty.charAt(0).toUpperCase() + caseDifficulty.slice(1)}`;
  //     }
  //     
  //     // Update case content if we have a current case
  //     if (currentCase) {
  //       const caseContent = document.getElementById('case-content');
  //       if (caseContent) {
  //         caseContent.innerHTML = currentCase;
  //         caseContent.style.opacity = '1';
  //       }
  //     }
  //     
  //     // Restore messages
  //     const messagesContainer = document.getElementById('practice-messages');
  //     if (messagesContainer && practiceMessages.length > 0) {
  //       messagesContainer.innerHTML = '';
  //       practiceMessages.forEach(msg => {
  //         addPracticeMessage(msg.type, msg.content, false); // false = don't save again
  //       });
  //     }
  //     
  //     console.log('[PRACTICE] Data loaded from localStorage');
  //   }
  // } catch (error) {
  //   console.error('[PRACTICE] Failed to load saved data:', error);
  // }
}

function addPracticeMessageToDOM(sender, content) {
  const messagesContainer = document.getElementById('practice-messages');
  
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    margin-bottom: 15px;
    display: flex;
    ${sender === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
  `;
  
  const bubble = document.createElement('div');
  bubble.style.cssText = `
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 18px;
    ${sender === 'user' 
      ? 'background: rgba(44, 201, 199, 0.9); color: white; border-bottom-right-radius: 4px;' 
      : 'background: var(--borderbottomdark); color: var(--all-text); border-bottom-left-radius: 4px;'
    }
    font-size: 14px;
    line-height: 1.4;
    word-wrap: break-word;
  `;
  
  bubble.textContent = content;
  messageDiv.appendChild(bubble);
  messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Main initialization function
function initBAU() {
  try {
    console.log("[BAU] Initializing modular BAU system...");

    // Initialize all modules in the correct order
    initFormDataManagement();
    initPDFGenerator();
    
    // Initialize form navigation after DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initFormNavigation);
    } else {
      setTimeout(initFormNavigation, 100);
    }

    // Ensure classic HTML report generator is loaded (globals)
    const ensureHTMLReportGenerator = () =>
      new Promise((resolve) => {
        if (window.generateHTMLReport && window.initHTMLReportGenerator) {
          return resolve();
        }
        const existing = document.querySelector(
          'script[src="cont/00.bau/src/html-report-generator.js"]'
        );
        if (existing) return existing.addEventListener("load", () => resolve());
        const s = document.createElement("script");
        s.src = "cont/00.bau/src/html-report-generator.js";
        s.onload = () => resolve();
        s.onerror = () => resolve();
        document.body.appendChild(s);
      });

    ensureHTMLReportGenerator().then(() => {
      try {
        if (typeof window.initHTMLReportGenerator === "function") {
          window.initHTMLReportGenerator();
        }
      } catch (e) {
        console.warn("[BAU] initHTMLReportGenerator failed:", e);
      }
    });

    // Initialize AI Demo after a short delay to ensure DOM is ready
    setTimeout(() => {
      initAIDemo();
      initAIModelAndToken(); // Initialize AI model dropdown
      enhanceSocratesSelectsInFlow();
      initFormDataManagement();
      initPDFGenerator();
      
      // Load user histories if authenticated
      loadHistories();
      
      // Initialize practice mode early to ensure models are loaded
      initPracticeMode();
      
      // Initialize File MCQ functionality
      initFileMCQ();
      
      console.log("[BAU] All modules initialized successfully");
    }, 1000);

  } catch (error) {
    console.error("[BAU] Initialization failed:", error);
  }
}

function initPracticeMode() {
  // Check if already initialized to prevent duplicate event listeners
  if (window.practiceInitialized) {
    return;
  }
  
  // Always initialize practice mode regardless of container visibility
  // This ensures models are loaded and ready when user switches to dynamic form
  console.log('[PRACTICE] Initializing practice mode...');
  
  // Check if we're in the dynamic container (but don't require it for initialization)
  const dynamicContainer = document.getElementById('dynamic-chat-container');
  console.log('[PRACTICE] Dynamic container check:', {
    exists: !!dynamicContainer,
    display: dynamicContainer?.style.display,
    computed: dynamicContainer ? window.getComputedStyle(dynamicContainer).display : 'N/A'
  });
  
  // Wait for DOM elements to be available with longer timeout
  setTimeout(() => {
    // Debug: Check all elements with chat-input id
    const allElements = document.querySelectorAll('[id="chat-input"]');
    console.log('[PRACTICE] All chat-input elements found:', allElements.length);
    
    // Try multiple ways to find the element
    const chatInput1 = document.getElementById('chat-input');
    const chatInput2 = document.querySelector('#chat-input');
    const chatInput3 = dynamicContainer.querySelector('#chat-input');
    
    console.log('[PRACTICE] Chat input search results:', {
      getElementById: !!chatInput1,
      querySelector: !!chatInput2,
      containerQuery: !!chatInput3,
      containerHTML: dynamicContainer.innerHTML.includes('chat-input')
    });
    
    let chatInput = chatInput1 || chatInput2 || chatInput3;
    
    // Remove any existing chat inputs - we don't need them for MCQ generator
    const existingChatInputs = document.querySelectorAll('#chat-input');
    existingChatInputs.forEach(input => {
      const parent = input.parentElement;
      if (parent && parent.parentElement) {
        parent.parentElement.removeChild(parent);
      } else if (parent) {
        parent.removeChild(input);
      }
    });
    
    // Mode switcher event listeners
    const chatModeBtn = document.getElementById('chat-mode-btn');
    const practiceModeBtn = document.getElementById('practice-mode-btn');
    
    if (chatModeBtn && !chatModeBtn.hasAttribute('data-practice-listener')) {
      chatModeBtn.addEventListener('click', () => switchMode('chat'));
      chatModeBtn.setAttribute('data-practice-listener', 'true');
    }
    
    if (practiceModeBtn && !practiceModeBtn.hasAttribute('data-practice-listener')) {
      practiceModeBtn.addEventListener('click', () => {
        console.log('[PRACTICE] Practice mode button clicked');
        switchMode('practice');
      });
      practiceModeBtn.setAttribute('data-practice-listener', 'true');
    }
    
    // Practice mode controls
    const startCaseBtn = document.getElementById('start-case-btn');
    const difficultyBtn = document.getElementById('case-difficulty-btn');
    
    if (startCaseBtn && !startCaseBtn.hasAttribute('data-practice-listener')) {
      startCaseBtn.addEventListener('click', generateNewCase);
      startCaseBtn.setAttribute('data-practice-listener', 'true');
    }
    
    if (difficultyBtn && !difficultyBtn.hasAttribute('data-practice-listener')) {
      difficultyBtn.addEventListener('click', cycleDifficulty);
      difficultyBtn.setAttribute('data-practice-listener', 'true');
    }
    
    // MCQ Generator doesn't need chat input - removed for clean UI
    
    // Restore saved mode only if elements exist
    const chatContainer = document.getElementById('chat-mode-container');
    if (chatContainer) {
      const savedMode = localStorage.getItem('practiceMode') || 'chat';
      switchMode(savedMode);
    }
    
    window.practiceInitialized = true;
    console.log('[BAU] Practice Mode initialized');
  }, 1500);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBAU);
} else {
  initBAU();
}

// Animation function for dynamic form elements
function animateDynamicFormElements(container) {
  if (!container) return;
  
  // Get elements to animate (excluding hidden containers)
  const elementsToAnimate = [
    container.querySelector('.chat-header'),
    container.querySelector('#chat-mode-container'),
    container.querySelector('.chat-input-container'),
    ...container.querySelectorAll('.mode-btn')
  ].filter(Boolean);
  
  // Reset animation state
  elementsToAnimate.forEach((el) => {
    el.classList.remove('animate-on-load');
    el.style.opacity = '0';
    el.style.animationDelay = '';
  });
  
  // Trigger animation with staggered delays
  elementsToAnimate.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('animate-on-load');
      el.style.animationDelay = `${i * 0.1}s`;
    }, 50);
  });
}

// Separate animation function for practice mode elements
function animatePracticeModeElements() {
  const practiceContainer = document.getElementById('practice-mode-container');
  if (!practiceContainer || practiceContainer.style.display === 'none') return;
  
  const practiceElements = [
    practiceContainer.querySelector('#practice-model-select'),
    practiceContainer.querySelector('#case-difficulty-btn'),
    practiceContainer.querySelector('#start-case-btn'),
    practiceContainer.querySelector('#case-content'),
    practiceContainer.querySelector('.chat-input-container')
  ].filter(Boolean);
  
  // Reset animation state
  practiceElements.forEach((el) => {
    el.classList.remove('animate-on-load');
    el.style.opacity = '0';
    el.style.animationDelay = '';
  });
  
  // Trigger animation with staggered delays
  practiceElements.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('animate-on-load');
      el.style.animationDelay = `${i * 0.1}s`;
    }, 50);
  });
}

// Expose functions globally for external script access
window.initFormNavigation = initFormNavigation;
window.animateDynamicFormElements = animateDynamicFormElements;
window.animatePracticeModeElements = animatePracticeModeElements;
window.loadHistories = loadHistories;
window.switchMode = switchMode;
window.generateNewCase = generateNewCase;

function initFormNavigation() {
  console.log("[BAU] Initializing form navigation...");
  
  const formNavBtns = document.querySelectorAll('.form-nav-btn');
  const staticContainer = document.getElementById('history-form-container');
  const dynamicContainer = document.getElementById('dynamic-chat-container');
  
  // Chat elements
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-msg-btn');
  
  if (!formNavBtns.length || !staticContainer || !dynamicContainer) {
    console.warn("[BAU] Navigation elements not found, retrying in 500ms...");
    setTimeout(initFormNavigation, 500);
    return;
  }
  
  console.log("[BAU] Navigation elements found, setting up event listeners...");
  
  // Set default state: Static Form active, MCQ Generator hidden
  staticContainer.style.display = 'block';
  dynamicContainer.style.display = 'none';
  
  // Set Static Form button as active by default
  const staticBtn = document.querySelector('.form-nav-btn[data-mode="static"]');
  const dynamicBtn = document.querySelector('.form-nav-btn[data-mode="dynamic"]');
  
  if (staticBtn) {
    staticBtn.classList.add('active');
    staticBtn.style.background = 'var(--header-bg)';
    staticBtn.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
    staticBtn.style.fontWeight = 'bold';
  }
  
  if (dynamicBtn) {
    dynamicBtn.classList.remove('active');
    dynamicBtn.style.background = 'rgba(255, 255, 255, 0)';
    dynamicBtn.style.boxShadow = 'none';
    dynamicBtn.style.fontWeight = 'normal';
  }

  // Add navigation event listeners
  formNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      
      // Update button states
      formNavBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'rgba(255, 255, 255, 0)';
        b.style.boxShadow = 'none';
        b.style.fontWeight = 'normal';
      });
      
      btn.classList.add('active');
      btn.style.background = 'var(--header-bg)';
      btn.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
      btn.style.fontWeight = 'bold';
      
      // Switch containers
      if (mode === 'static') {
        staticContainer.style.display = 'block';
        dynamicContainer.style.display = 'none';
      } else if (mode === 'dynamic') {
        staticContainer.style.display = 'none';
        dynamicContainer.style.display = 'block';
        
        // Initialize MCQ functionality when switching to dynamic mode
        setTimeout(() => {
          initFileMCQ();
        }, 100);
      }
    });
  });
  
  // MCQ Generator - no chat elements needed
  
  let chatHistory = [];
  let conversationActive = false;

  // iPad detection for backdrop filter fixes
  const isIpad = navigator.userAgent.includes('iPad') || 
                 (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
  
  // Fix backdrop filter issues on iPad
  if (isIpad) {
    formNavBtns.forEach(btn => {
      btn.style.backdropFilter = 'none';
      btn.style.webkitBackdropFilter = 'none';
      // Use solid background instead for iPad
      btn.style.background = 'var(--header-bg)';
      btn.style.opacity = '0.9';
    });
  }

  // Navigation button event listeners
  formNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log(`[BAU] Navigation button clicked: ${btn.getAttribute('data-mode')}`);
      
      // Force repaint to prevent background glitches on iPad
      if (isIpad) {
        document.body.style.transform = 'translateZ(0)';
        setTimeout(() => {
          document.body.style.transform = '';
        }, 10);
      }
      
      // Remove active class from all buttons
      formNavBtns.forEach(b => {
        b.classList.remove('active');
        if (isIpad) {
          b.style.background = 'var(--header-bg)';
          b.style.opacity = '0.6';
        } else {
          b.style.background = 'rgba(255, 255, 255, 0)';
        }
        b.style.boxShadow = 'none';
        b.style.fontWeight = 'normal';
      });
      
      // Add active class to clicked button
      btn.classList.add('active');
      if (isIpad) {
        btn.style.background = 'var(--header-bg)';
        btn.style.opacity = '1';
      } else {
        btn.style.background = 'var(--header-bg)';
      }
      btn.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
      btn.style.fontWeight = 'bold';
      
      const mode = btn.getAttribute('data-mode');
      
      if (mode === 'static') {
        // Smooth transition for iPad
        if (isIpad) {
          dynamicContainer.style.opacity = '0';
          setTimeout(() => {
            staticContainer.style.display = 'block';
            dynamicContainer.style.display = 'none';
            staticContainer.style.opacity = '1';
          }, 100);
        } else {
          staticContainer.style.display = 'block';
          dynamicContainer.style.display = 'none';
        }
      } else if (mode === 'dynamic') {
        // Smooth transition for iPad
        if (isIpad) {
          staticContainer.style.opacity = '0';
          setTimeout(() => {
            staticContainer.style.display = 'none';
            dynamicContainer.style.display = 'block';
            dynamicContainer.style.opacity = '1';
            
            // Trigger animation for dynamic form elements
            animateDynamicFormElements(dynamicContainer);
          }, 100);
        } else {
          staticContainer.style.display = 'none';
          dynamicContainer.style.display = 'block';
          
          // Trigger animation for dynamic form elements
          animateDynamicFormElements(dynamicContainer);
        }
        
        // Disable auto-focus on iPad to prevent keyboard opening
        if (chatInput && !isIpad) {
          chatInput.focus();
        }
        
        // Initialize Practice Mode when Dynamic Form becomes visible
        // Use longer delay to ensure all elements are properly loaded
        setTimeout(() => {
          initPracticeMode();
        }, 500);
      }
    });
  });

  // Hover effects for navigation buttons
  formNavBtns.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = 'rgba(43, 43, 43, 0.056)';
        btn.style.transform = 'scale(1.05)';
      }
    });
    
    btn.addEventListener('mouseleave', () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = 'rgba(255, 255, 255, 0)';
        btn.style.transform = 'scale(1)';
      }
    });
  });

  // Chat functionality
  if (chatMessages && chatInput && sendBtn) {
    function addMessage(content, isUser = false, isSystem = false) {
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = `
        margin-bottom: 15px;
        padding: 12px 16px;
        border-radius: 12px;
        max-width: 85%;
        line-height: 1.4;
        font-size: 14px;
        ${isUser ? `
          background: rgb(44, 201, 199);
          color: white;
          margin-left: auto;
          text-align: right;
        ` : isSystem ? `
          background: rgba(156, 39, 176, 0.1);
          color: var(--all-text);
          text-align: center;
          font-style: italic;
          max-width: 100%;
        ` : `
          background: var(--userdiv);
          color: var(--all-text);
          margin-right: auto;
        `}
      `;
      messageDiv.innerHTML = content;
      
      // Remove welcome message if it exists
      const welcomeMsg = chatMessages.querySelector('.welcome-message');
      if (welcomeMsg) {
        welcomeMsg.remove();
      }
      
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessage() {
      const message = chatInput.value.trim();
      if (!message) return;
      
      // Add user message
      addMessage(message, true);
      chatHistory.push({ role: 'user', content: message });
      chatInput.value = '';
      conversationActive = true;
      
      // Show typing indicator
      const typingDiv = document.createElement('div');
      typingDiv.className = 'typing-indicator';
      typingDiv.style.cssText = `
        padding: 12px 16px;
        background: var(--userdiv);
        border-radius: 12px;
        margin-bottom: 15px;
        max-width: 85%;
        color: var(--all-text);
        font-style: italic;
        opacity: 0.7;
      `;
      typingDiv.textContent = 'AI is thinking...';
      chatMessages.appendChild(typingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      try {
        // Get AI response using existing AI infrastructure
        const aiResponse = await getDynamicChatResponse(chatHistory);
        
        // Remove typing indicator
        typingDiv.remove();
        
        // Add AI response
        addMessage(aiResponse, false);
        chatHistory.push({ role: 'assistant', content: aiResponse });
        
        // Show generate report button after a few exchanges
        if (chatHistory.length >= 4 && generateBtn) {
          generateBtn.style.display = 'block';
        }
        
      } catch (error) {
        typingDiv.remove();
        addMessage('Sorry, I encountered an error. Please try again.', false);
        console.error('Chat error:', error);
      }
    }

    async function getDynamicChatResponse(history) {
      try {
        // Build conversation prompt from history
        let conversationPrompt = `You are a medical AI assistant helping a student take a comprehensive patient history. Your role is to:

1. Ask targeted, relevant questions based on the information provided
2. Guide the conversation toward a complete history (HPI, PMH, medications, allergies, social history, family history, ROS)
3. Help identify potential diagnoses through systematic questioning
4. Be concise but thorough in your questions
5. Ask one focused question at a time
6. Build upon previous answers to deepen understanding

Start by acknowledging the information provided, then ask the most relevant follow-up question to build the history systematically.

## Conversation History:\n`;

        // Add conversation history
        history.forEach((msg, index) => {
          if (msg.role === 'user') {
            conversationPrompt += `\nStudent: ${msg.content}`;
          } else if (msg.role === 'assistant') {
            conversationPrompt += `\nAI: ${msg.content}`;
          }
        });

        conversationPrompt += `\n\nPlease respond as the AI assistant with your next question or guidance. Keep responses concise and focused on one main question or point.`;

        // Get the selected AI model from the form
        const aiModelSelect = document.getElementById('ai-model');
        const selectedModel = aiModelSelect ? aiModelSelect.value : 'gemini-2.0-flash-exp';

        // Use the existing Firebase AI service
        if (window.firebaseAI && window.firebaseAI.generateContent) {
          const result = await window.firebaseAI.generateContent(
            selectedModel,
            conversationPrompt,
            {
              temperature: 0.7,
              maxOutputTokens: 512 // Keep responses concise
            }
          );
          
          if (result.success) {
            return result.content;
          } else {
            throw new Error(result.error || 'AI generation failed');
          }
        } else {
          // Fallback responses based on conversation context
          const lastUserMessage = history.filter(msg => msg.role === 'user').pop();
          if (!lastUserMessage) {
            return "Hello! I'm here to help you take a comprehensive patient history. Please start by telling me about the patient's main complaint or any symptoms they're experiencing.";
          }
          
          const userContent = lastUserMessage.content.toLowerCase();
          
          // Simple pattern matching for common scenarios
          if (userContent.includes('pain') || userContent.includes('hurt')) {
            return "Thank you for that information about the pain. Can you tell me more about when this pain first started and how it has changed over time?";
          } else if (userContent.includes('fever') || userContent.includes('temperature')) {
            return "I understand the patient has fever. How long has the fever been present, and have you noticed any pattern to when it's highest?";
          } else if (userContent.includes('cough') || userContent.includes('breathing')) {
            return "Thanks for mentioning the respiratory symptoms. Is this a dry cough or are they bringing up any sputum? Any shortness of breath?";
          } else {
            return "Thank you for that information. Can you tell me more about when these symptoms first started and how they've progressed over time?";
          }
        }
      } catch (error) {
        console.error('Dynamic chat AI error:', error);
        throw error;
      }
    }

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the chat? This will delete all conversation history.')) {
          chatHistory = [];
          conversationActive = false;
          chatMessages.innerHTML = `
            <div class="welcome-message">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; justify-content: center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#ff9800"/>
                </svg>
                <span style="font-weight: 600; color: #ff9800;">Dynamic History Taking</span>
                <span style="background: #fff3cd; color: #856404; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">In Development</span>
              </div>
              <p style="margin: 0; color: #666; line-height: 1.5;">This feature is currently under development. Share any patient information to begin testing the AI-guided history taking experience.</p>
            </div>
          `;
          if (generateBtn) generateBtn.style.display = 'none';
        }
      });
    }
    
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        if (confirm('Generate final report from this conversation? This will switch to static form mode and populate the fields.')) {
          generateReportFromChat();
        }
      });
    }

    async function generateReportFromChat() {
      try {
        // Add system message about report generation
        addMessage('Generating structured report from conversation...', false, true);
        
        // Build a summary prompt from the chat history
        let summaryPrompt = `Based on the following medical history conversation, please extract and structure the information into a comprehensive medical history format. Organize the information under appropriate headings:

## Conversation:\n`;
        
        chatHistory.forEach((msg, index) => {
          if (msg.role === 'user') {
            summaryPrompt += `\nStudent: ${msg.content}`;
          } else if (msg.role === 'assistant') {
            summaryPrompt += `\nAI: ${msg.content}`;
          }
        });
        
        summaryPrompt += `\n\nPlease organize this information into the following structure:

**PATIENT INFORMATION:**
- Name, Age, Gender (if mentioned)

**CHIEF COMPLAINT:**
- Main presenting problem

**HISTORY OF PRESENT ILLNESS:**
- Detailed narrative of current symptoms
- SOCRATES analysis if applicable (Site, Onset, Character, Radiation, Associated symptoms, Timing, Exacerbating/relieving factors, Severity)

**PAST MEDICAL HISTORY:**
- Previous illnesses, conditions

**MEDICATIONS:**
- Current medications

**ALLERGIES:**
- Known allergies

**SOCIAL HISTORY:**
- Smoking, alcohol, occupation, etc.

**FAMILY HISTORY:**
- Relevant family medical history

**REVIEW OF SYSTEMS:**
- Additional symptoms by system

Only include sections where information was provided. Use 'Not discussed' for missing information.`;
        
        // Get AI model and generate summary
        const aiModelSelect = document.getElementById('ai-model');
        const selectedModel = aiModelSelect ? aiModelSelect.value : 'gemini-2.0-flash-exp';
        
        if (window.firebaseAI && window.firebaseAI.generateContent) {
          const result = await window.firebaseAI.generateContent(
            selectedModel,
            summaryPrompt,
            {
              temperature: 0.3, // Lower temperature for more structured output
              maxOutputTokens: 1024
            }
          );
          
          if (result.success) {
            // Switch back to static form
            document.querySelector('.form-nav-btn[data-mode="static"]').click();
            
            // Show the generated summary in the AI output section
            const aiOutput = document.getElementById('ai-output');
            if (aiOutput) {
              aiOutput.innerHTML = `
                <div style="background: var(--userdiv); padding: 20px; border-radius: 12px; margin-top: 15px;">
                  <h3 style="margin-top: 0; color: var(--all-text);">Generated Report from Dynamic Chat</h3>
                  <div style="white-space: pre-wrap; line-height: 1.6; color: var(--all-text);">${result.content}</div>
                  <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--borderbottomdark); font-size: 12px; opacity: 0.7;">
                    Generated from ${chatHistory.length} conversation exchanges • Model: ${result.model || selectedModel}
                  </div>
                </div>
              `;
              
              // Scroll to the AI output
              aiOutput.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Add success message to chat
            addMessage('Report generated successfully! Check the AI Analysis section in the static form.', false, true);
            
          } else {
            throw new Error(result.error || 'Failed to generate report');
          }
        } else {
          throw new Error('AI service not available for report generation');
        }
        
      } catch (error) {
        console.error('Report generation error:', error);
        addMessage(`Error generating report: ${error.message}`, false, true);
      }
    }
  }
  
  console.log("[BAU] Form navigation initialized successfully with Static Form as default");
}

// Auto-initialize and export for external use
initBAU();
window.initBAU = initBAU;
window.initBau = initBAU; // Alternative naming for compatibility
window.loadHistories = loadHistories;
