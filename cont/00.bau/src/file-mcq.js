// File MCQ Generator Module
// Handles file upload, processing, and MCQ generation/display

class FileMCQManager {
  constructor() {
    this.currentFile = null;
    this.currentQuestions = [];
    this.userAnswers = {};
    this.isProcessing = false;
    
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.fileDropZone = document.getElementById('file-drop-zone');
    this.fileInput = document.getElementById('file-input');
    this.fileInfo = document.getElementById('file-info');
    this.fileName = document.getElementById('file-name');
    this.fileSize = document.getElementById('file-size');
    this.aiInstructionsSection = document.getElementById('ai-instructions-section');
    this.aiInstructions = document.getElementById('ai-instructions');
    this.generateBtn = document.getElementById('generate-questions-btn');
    this.mcqContainer = document.getElementById('mcq-container');
    this.questionsList = document.getElementById('questions-list');
    this.submitBtn = document.getElementById('submit-answers-btn');
    this.resetBtn = document.getElementById('reset-quiz-btn');
    this.resultsDiv = document.getElementById('quiz-results');
    this.resultsContent = document.getElementById('results-content');
  }

  setupEventListeners() {
    // File drop zone events
    if (this.fileDropZone) {
      this.fileDropZone.addEventListener('click', () => this.fileInput?.click());
      this.fileDropZone.addEventListener('dragover', this.handleDragOver.bind(this));
      this.fileDropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
      this.fileDropZone.addEventListener('drop', this.handleDrop.bind(this));
    }

    // File input change
    if (this.fileInput) {
      this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    // Generate questions button
    if (this.generateBtn) {
      this.generateBtn.addEventListener('click', this.generateQuestions.bind(this));
    }

    // Submit answers button
    if (this.submitBtn) {
      this.submitBtn.addEventListener('click', this.submitAnswers.bind(this));
    }

    // Reset quiz button
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', this.resetQuiz.bind(this));
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    this.fileDropZone.style.borderColor = '#2196F3';
    this.fileDropZone.style.background = 'rgba(33, 150, 243, 0.1)';
  }

  handleDragLeave(e) {
    e.preventDefault();
    this.fileDropZone.style.borderColor = 'var(--borderbottomdark)';
    this.fileDropZone.style.background = 'rgba(33, 150, 243, 0.05)';
  }

  handleDrop(e) {
    e.preventDefault();
    this.handleDragLeave(e);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }

  handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }

  async processFile(file) {
    console.log('[MCQ] Processing file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showError('File size must be less than 10MB');
      return;
    }

    // Check if file is empty
    if (file.size === 0) {
      this.showError('File appears to be empty');
      return;
    }

    // Be more permissive with file types - let the reading function handle it
    const allowedExtensions = /\.(txt|md|pdf|doc|docx|py|js|html|css|java|cpp|c|json|xml)$/i;
    
    // Only show warning for clearly unsupported types, but don't block them
    if (!file.type.includes('text') && 
        !file.type.includes('json') && 
        !file.type.includes('xml') && 
        !file.type.includes('pdf') && 
        !file.type.includes('word') && 
        !file.name.match(allowedExtensions)) {
      this.showError('This file type may not work well. For best results, use TXT, MD, or code files.');
    }

    this.currentFile = file;
    this.displayFileInfo(file);
    
    try {
      // Read file content
      const content = await this.readFileContent(file);
      this.currentFile.content = content;
      
      console.log('[MCQ] File content loaded:', content.length, 'characters');
      
      // Enable generate button (AI instructions section is always visible)
      this.generateBtn.style.display = 'block';
      this.generateBtn.disabled = false;
      
    } catch (error) {
      console.error('Error reading file:', error);
      this.showError('Failed to read file content: ' + error.message);
      
      // Hide generate button if file reading failed
      this.generateBtn.style.display = 'none';
    }
  }

  displayFileInfo(file) {
    this.fileName.textContent = file.name;
    this.fileSize.textContent = this.formatFileSize(file.size);
    this.fileInfo.style.display = 'block';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          let content = e.target.result;
          
          // Check if content is empty or null
          if (!content || content.trim().length === 0) {
            reject(new Error('File appears to be empty or unreadable'));
            return;
          }
          
          // For PDF files, show helpful message but don't reject
          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            this.showError('PDF files may not display correctly. For best results, copy the text content and save as a .txt file, then upload that instead.');
            // Still try to process in case it's a text-based PDF
          }
          
          // For Word documents, show helpful message but don't reject
          if (file.type.includes('word') || file.name.match(/\.(doc|docx)$/i)) {
            this.showError('Word documents may not display correctly. For best results, copy the text content and save as a .txt file, then upload that instead.');
            // Still try to process in case it contains readable text
          }
          
          // Accept the content regardless of file type
          resolve(content);
          
        } catch (error) {
          console.error('Error processing file content:', error);
          reject(new Error('Failed to process file content: ' + error.message));
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Failed to read file - please try a different file or format'));
      };
      
      // Try to read as text first
      try {
        reader.readAsText(file, 'UTF-8');
      } catch (error) {
        console.error('Error starting file read:', error);
        reject(new Error('Cannot read this file type'));
      }
    });
  }

  async generateQuestions() {
    if (!this.currentFile || !this.currentFile.content) {
      this.showError('No file content available');
      return;
    }

    this.isProcessing = true;
    this.generateBtn.textContent = 'Generating Questions...';
    this.generateBtn.disabled = true;

    try {
      // Get AI model selection from MCQ model selector
      const modelSelect = document.getElementById('mcq-model-select');
      const selectedModel = modelSelect ? modelSelect.value : 'gemini-2.0-flash-exp';
      
      // Update status
      const statusSpan = document.getElementById('mcq-status');
      if (statusSpan) {
        statusSpan.textContent = 'Generating...';
        statusSpan.style.background = 'rgba(255, 152, 0, 0.1)';
        statusSpan.style.color = '#F57C00';
      }

      let response;
      
      // Try Firebase AI first if available
      if (window.firebaseAI && selectedModel.startsWith('gemini')) {
        response = await this.generateWithFirebase(selectedModel);
      } else {
        // Fallback to API endpoint
        response = await this.generateWithAPI();
      }

      if (response.success) {
        this.currentQuestions = response.questions;
        this.displayQuestions(response.questions);
        this.mcqContainer.style.display = 'block';
        
        // Update status to success
        const statusSpan = document.getElementById('mcq-status');
        if (statusSpan) {
          statusSpan.textContent = `${response.questions.length} Questions Generated`;
          statusSpan.style.background = 'rgba(76, 175, 80, 0.1)';
          statusSpan.style.color = '#4CAF50';
        }
        
        // Scroll to questions
        this.mcqContainer.scrollIntoView({ behavior: 'smooth' });
      } else {
        throw new Error(response.error || 'Failed to generate questions');
      }

    } catch (error) {
      console.error('Question generation error:', error);
      this.showError('Failed to generate questions: ' + error.message);
      
      // Reset status on error
      const statusSpan = document.getElementById('mcq-status');
      if (statusSpan) {
        statusSpan.textContent = 'Error';
        statusSpan.style.background = 'rgba(244, 67, 54, 0.1)';
        statusSpan.style.color = '#f44336';
      }
    } finally {
      this.isProcessing = false;
      this.generateBtn.textContent = 'Generate MCQ Questions';
      this.generateBtn.disabled = false;
    }
  }

  async generateWithFirebase(model) {
    // Get custom instructions
    const customInstructions = this.aiInstructions.value.trim();
    
    // Detect if it's a code file
    const isCodeFile = this.currentFile.name.match(/\.(py|js|html|css|java|cpp|c|json|xml)$/i);
    const fileExtension = this.currentFile.name.split('.').pop().toLowerCase();
    
    const prompt = `You are an expert educator creating multiple choice questions. Analyze the following content and generate 5 high-quality MCQ questions.

FILE: ${this.currentFile.name}
TYPE: ${isCodeFile ? fileExtension.toUpperCase() + ' Code' : 'Document'}

CONTENT TO ANALYZE:
${this.currentFile.content}

${customInstructions ? `CUSTOM INSTRUCTIONS: ${customInstructions}` : ''}

REQUIREMENTS:
1. Generate exactly 5 questions that test deep understanding
2. Focus on the actual content, not file metadata or technical details
3. Each question should have 4 options (A, B, C, D)
4. Questions should be relevant to the core concepts in the content
5. Avoid questions about file format, version, or technical specifications
6. Test comprehension, application, and analysis rather than memorization

${isCodeFile ? 'For code content: Focus on logic, functionality, best practices, and practical application.' : 'For document content: Focus on key concepts, principles, and practical applications.'}

OUTPUT FORMAT - Return a valid Python list of dictionaries:
[
    {
        "id": 1,
        "question": "What is the main concept discussed in this content?",
        "options": {
            "A": "First option",
            "B": "Second option", 
            "C": "Third option",
            "D": "Fourth option"
        },
        "correctAnswer": "A",
        "explanation": "Clear explanation of why this answer is correct"
    }
]

Return ONLY the Python list structure above. No additional text or formatting.`;

    const aiModel = window.getGenerativeModel(window.firebaseAI, {
      model: model,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const result = await aiModel.generateContent(prompt);
    const aiResponse = await result.response;
    let responseText = aiResponse.text();

    // Parse Python/JSON response
    responseText = responseText.trim();
    
    // Remove code blocks if present
    if (responseText.startsWith('```python')) {
      responseText = responseText.replace(/```python\n?/, '').replace(/\n?```$/, '');
    } else if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    // Convert Python format to JSON if needed
    responseText = responseText.replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false');

    const questions = JSON.parse(responseText);
    return { success: true, questions };
  }

  async generateWithAPI() {
    const customInstructions = this.aiInstructions.value.trim();
    
    const response = await fetch('/api/ai/file-mcq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileContent: this.currentFile.content,
        fileName: this.currentFile.name,
        questionCount: 5,
        difficulty: 'intermediate',
        customInstructions: customInstructions
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  }

  displayQuestions(questions) {
    this.questionsList.innerHTML = '';
    this.userAnswers = {};

    questions.forEach((q, index) => {
      const questionDiv = document.createElement('div');
      questionDiv.className = 'mcq-question';
      questionDiv.style.cssText = `
        margin-bottom: 25px;
        padding: 20px;
        border: 1px solid var(--borderbottomdark);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.02);
      `;

      const questionHTML = `
        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0 0 10px 0; color: var(--all-text); font-size: 16px;">
            Question ${q.id}: ${q.question}
          </h4>
        </div>
        <div class="options-container" style="display: grid; gap: 10px;">
          ${Object.entries(q.options).map(([key, value]) => `
            <label style="
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 10px;
              border: 1px solid var(--borderbottomdark);
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s ease;
              background: var(--header-bg);
            " class="option-label" data-question="${q.id}" data-option="${key}">
              <input 
                type="radio" 
                name="question_${q.id}" 
                value="${key}"
                style="margin: 0;"
              />
              <span style="color: var(--all-text); font-size: 14px;">
                <strong>${key}:</strong> ${value}
              </span>
            </label>
          `).join('')}
        </div>
      `;

      questionDiv.innerHTML = questionHTML;
      this.questionsList.appendChild(questionDiv);

      // Add click handlers for options
      const optionLabels = questionDiv.querySelectorAll('.option-label');
      optionLabels.forEach(label => {
        label.addEventListener('click', () => {
          const questionId = label.dataset.question;
          const option = label.dataset.option;
          this.userAnswers[questionId] = option;
          
          // Update visual feedback
          optionLabels.forEach(l => {
            if (l.dataset.question === questionId) {
              l.style.background = l.dataset.option === option ? 
                'rgba(33, 150, 243, 0.1)' : 'var(--header-bg)';
              l.style.borderColor = l.dataset.option === option ? 
                '#2196F3' : 'var(--borderbottomdark)';
            }
          });
        });
      });
    });
  }

  submitAnswers() {
    if (Object.keys(this.userAnswers).length < this.currentQuestions.length) {
      this.showError('Please answer all questions before submitting');
      return;
    }

    let correct = 0;
    const results = [];

    this.currentQuestions.forEach(q => {
      const userAnswer = this.userAnswers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      
      if (isCorrect) correct++;
      
      results.push({
        question: q.question,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation
      });
    });

    this.displayResults(correct, this.currentQuestions.length, results);
  }

  displayResults(correct, total, results) {
    const percentage = Math.round((correct / total) * 100);
    
    let resultHTML = `
      <div style="margin-bottom: 20px; text-align: center;">
        <div style="
          display: inline-block;
          padding: 15px 25px;
          border-radius: 8px;
          background: ${percentage >= 70 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'};
          border: 1px solid ${percentage >= 70 ? '#4CAF50' : '#f44336'};
        ">
          <h3 style="margin: 0; color: ${percentage >= 70 ? '#4CAF50' : '#f44336'};">
            Score: ${correct}/${total} (${percentage}%)
          </h3>
        </div>
      </div>
      <div style="display: grid; gap: 15px;">
    `;

    results.forEach((result, index) => {
      resultHTML += `
        <div style="
          padding: 15px;
          border: 1px solid ${result.isCorrect ? '#4CAF50' : '#f44336'};
          border-radius: 6px;
          background: ${result.isCorrect ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)'};
        ">
          <div style="margin-bottom: 10px;">
            <strong style="color: var(--all-text);">Q${index + 1}: ${result.question}</strong>
          </div>
          <div style="margin-bottom: 8px; color: var(--all-text);">
            Your answer: <span style="color: ${result.isCorrect ? '#4CAF50' : '#f44336'};">${result.userAnswer}</span>
          </div>
          ${!result.isCorrect ? `
            <div style="margin-bottom: 8px; color: var(--all-text);">
              Correct answer: <span style="color: #4CAF50;">${result.correctAnswer}</span>
            </div>
          ` : ''}
          <div style="font-size: 13px; opacity: 0.8; color: var(--all-text);">
            ${result.explanation}
          </div>
        </div>
      `;
    });

    resultHTML += '</div>';
    
    this.resultsContent.innerHTML = resultHTML;
    this.resultsDiv.style.display = 'block';
    this.resultsDiv.style.background = percentage >= 70 ? 
      'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)';
    
    // Scroll to results
    this.resultsDiv.scrollIntoView({ behavior: 'smooth' });
  }

  resetQuiz() {
    this.userAnswers = {};
    this.resultsDiv.style.display = 'none';
    
    // Reset all radio buttons and styling
    const radioButtons = this.questionsList.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => radio.checked = false);
    
    const optionLabels = this.questionsList.querySelectorAll('.option-label');
    optionLabels.forEach(label => {
      label.style.background = 'var(--header-bg)';
      label.style.borderColor = 'var(--borderbottomdark)';
    });
    
    // Scroll back to questions
    this.questionsList.scrollIntoView({ behavior: 'smooth' });
  }

  showError(message) {
    // Create or update error message
    let errorDiv = document.getElementById('mcq-error-message');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'mcq-error-message';
      errorDiv.style.cssText = `
        margin: 15px 0;
        padding: 12px;
        background: rgba(244, 67, 54, 0.1);
        border: 1px solid #f44336;
        border-radius: 6px;
        color: #f44336;
        font-size: 14px;
        text-align: center;
      `;
      this.fileDropZone.parentNode.insertBefore(errorDiv, this.fileDropZone.nextSibling);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorDiv) errorDiv.style.display = 'none';
    }, 5000);
  }
}

// Initialize the MCQ manager
let fileMCQManager = null;

export function initFileMCQ() {
  if (!fileMCQManager) {
    fileMCQManager = new FileMCQManager();
    console.log('[MCQ] File MCQ Manager initialized');
  }
  return fileMCQManager;
}

// Export for global access
window.initFileMCQ = initFileMCQ;
