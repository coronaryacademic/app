// === BAU Form - Modular Architecture ===
// Main initialization file that imports and coordinates all modules

// Import all modules
import { initAIDemo } from "./src/ai-demo.js";
import { enhanceSocratesSelectsInFlow } from "./src/dropdown-ui.js";
import { initFormDataManagement } from "./src/form-data.js";
import { initPDFGenerator } from "./src/pdf-generator.js";

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
    }, 200);

    // Initialize dropdown UI enhancements after DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(enhanceSocratesSelectsInFlow, 100);
      });
    } else {
      setTimeout(enhanceSocratesSelectsInFlow, 100);
    }

    console.log("[BAU] Modular BAU system initialized successfully");
  } catch (e) {
    console.error("[BAU] Initialization error:", e);
  }
}

// Form Navigation System
function initFormNavigation() {
  console.log("[BAU] Initializing form navigation...");
  
  const formNavBtns = document.querySelectorAll('.form-nav-btn');
  const staticContainer = document.getElementById('history-form-container');
  const dynamicContainer = document.getElementById('dynamic-chat-container');
  
  if (!formNavBtns.length || !staticContainer || !dynamicContainer) {
    console.warn("[BAU] Navigation elements not found, retrying in 500ms...");
    setTimeout(initFormNavigation, 500);
    return;
  }
  
  console.log("[BAU] Navigation elements found, setting up event listeners...");
  
  // Set default state: Static Form active, Dynamic Chat hidden
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
  
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-chat-btn');
  const clearBtn = document.getElementById('clear-chat-btn');
  const generateBtn = document.getElementById('generate-report-btn');
  
  let chatHistory = [];
  let conversationActive = false;

  // Navigation button event listeners
  formNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log(`[BAU] Navigation button clicked: ${btn.getAttribute('data-mode')}`);
      
      // Remove active class from all buttons
      formNavBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'rgba(255, 255, 255, 0)';
        b.style.boxShadow = 'none';
        b.style.fontWeight = 'normal';
      });
      
      // Add active class to clicked button
      btn.classList.add('active');
      btn.style.background = 'var(--header-bg)';
      btn.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
      btn.style.fontWeight = 'bold';
      
      const mode = btn.getAttribute('data-mode');
      
      if (mode === 'static') {
        staticContainer.style.display = 'block';
        dynamicContainer.style.display = 'none';
      } else if (mode === 'dynamic') {
        staticContainer.style.display = 'none';
        dynamicContainer.style.display = 'block';
        if (chatInput) chatInput.focus();
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
        const selectedModel = aiModelSelect ? aiModelSelect.value : 'gemini-1.5-flash';

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
        const selectedModel = aiModelSelect ? aiModelSelect.value : 'gemini-1.5-flash';
        
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
