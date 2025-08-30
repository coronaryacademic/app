// === Firebase AI Logic Service ===
export class FirebaseAIService {
  constructor() {
    this.firebaseAI = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (!window.firebaseAI || !window.getGenerativeModel) {
        throw new Error('Firebase AI Logic not available. Make sure Firebase is properly initialized.');
      }
      
      this.firebaseAI = window.firebaseAI;
      this.isInitialized = true;
      console.log('[Firebase AI] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[Firebase AI] Initialization failed:', error);
      throw error;
    }
  }

  getAvailableModels() {
    return [
      // Vercel API models
      {
        value: 'mistral/mistral-medium',
        text: 'Mistral Medium (via Vercel)',
        type: 'vercel',
        provider: 'mistral',
        apiBase: 'https://coronaryacademic.vercel.app/api/ai/chat',
        // API key will be injected from the server-side
        apiKey: window.ENV?.MISTRAL_API_KEY || ''
      },
      {
        value: 'github/model',
        text: 'GitHub Model (via Vercel)',
        type: 'vercel',
        provider: 'github',
        apiBase: 'https://coronaryacademic.vercel.app/api/ai/chat',
        // API key will be injected from the server-side
        apiKey: window.ENV?.GITHUB_MODELS_TOKEN || ''
      },
      // Fallback to Firebase models if Vercel API is not available
      {
        value: 'gemini-1.5-flash',
        text: 'Gemini 1.5 Flash (Firebase)',
        type: 'firebase',
        provider: 'google'
      },
      {
        value: 'gemini-1.5-pro',
        text: 'Gemini 1.5 Pro (Firebase)',
        type: 'firebase',
        provider: 'google'
      }
    ];
  }

  async generateContent(modelName, prompt, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Get the model configuration
    const models = this.getAvailableModels();
    const modelConfig = models.find(m => m.value === modelName);
    
    if (!modelConfig) {
      throw new Error(`Model ${modelName} not found in available models`);
    }

    // Track the original model and fallback models
    const originalModel = modelName;
    const fallbackModels = this.getFallbackModels(originalModel);
    const modelsToTry = [originalModel, ...fallbackModels];
    
    let lastError = null;
    
    // Try each model in sequence until one succeeds
    for (const currentModel of modelsToTry) {
      try {
        const currentModelConfig = models.find(m => m.value === currentModel) || {};
        let result;

        // Route to the appropriate handler based on model type
        if (currentModelConfig.type === 'vercel') {
          result = await this.generateWithVercelAPI(currentModelConfig, prompt, options);
        } else {
          // Default to Firebase for other model types
          result = await this.tryGenerateWithModel(currentModel, prompt, options);
        }

        // If we get here, generation was successful
        return {
          ...result,
          modelUsed: currentModel,
          fallbackUsed: currentModel !== originalModel
        };
      } catch (error) {
        console.warn(`[Firebase AI] Generation failed with ${currentModel}:`, error);
        lastError = error;
        
        // If this is a quota error or API error, try the next model
        if (error.message?.includes('quota') || 
            error.message?.includes('rate limit') || 
            error.message?.includes('429') ||
            error.message?.includes('API')) {
          console.log(`[Firebase AI] Error with ${currentModel}, trying fallback...`);
          continue;
        }
        
        // For other errors, rethrow
        throw error;
      }
    }
    
    // If we've tried all models and all failed
    throw lastError || new Error('All model generation attempts failed');
  }

  async generateWithVercelAPI(modelConfig, prompt, options = {}) {
    const { value: model, apiBase, apiKey } = modelConfig;
    
    if (!apiBase) {
      throw new Error('API base URL is required for Vercel models');
    }

    if (!apiKey) {
      throw new Error('API key is required for Vercel models');
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-provider': modelConfig.provider || 'mistral' // Default to mistral if not specified
      };

      const response = await fetch(apiBase, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxOutputTokens || 2048,
          stream: false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API request failed with status ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = `${errorMessage}: ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      if (!content) {
        console.error('Unexpected API response format:', data);
        throw new Error('Received empty or invalid response from AI service');
      }
      
      return {
        success: true,
        content,
        model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Vercel API] Generation failed:', error);
      throw new Error(`AI service error: ${error.message}`);
    }
  }
  
  getFallbackModels(originalModel) {
    const modelHierarchy = {
      // Vercel models - fall back between each other, then to Firebase models
      'mistral/mistral-medium': ['github/model', 'gemini-1.5-flash', 'gemini-1.0-pro'],
      'github/model': ['mistral/mistral-medium', 'gemini-1.5-flash', 'gemini-1.0-pro'],
      
      // Firebase models
      'gemini-1.5-pro': ['gemini-1.5-flash', 'gemini-1.0-pro'],
      'gemini-1.5-flash': ['gemini-1.0-pro'],
      'gemini-1.0-pro': ['gemini-1.5-flash']
    };
    
    return modelHierarchy[originalModel] || [];
  }
  
  async tryGenerateWithModel(modelName, prompt, options = {}) {

    try {
      // Get the generative model
      const model = window.getGenerativeModel(this.firebaseAI, {
        model: modelName,
        generationConfig: {
          temperature: options.temperature || 0.7,
          topK: options.topK || 40,
          topP: options.topP || 0.95,
          maxOutputTokens: options.maxOutputTokens || 2048,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      });

      console.log('[Firebase AI] Generating content with model:', modelName);
      
      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('[Firebase AI] Content generated successfully');
      
      return {
        success: true,
        content: text,
        model: modelName,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[Firebase AI] Generation failed:', error);
      
      // Handle specific error types
      let errorMessage = 'An unexpected error occurred';
      
      if (error.message?.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later or switch to Gemini 1.5 Flash.';
      } else if (error.message?.includes('safety')) {
        errorMessage = 'Content was blocked by safety filters. Please modify your request.';
      } else if (error.message?.includes('authentication')) {
        errorMessage = 'Authentication failed. Please sign in again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        model: modelName
      };
    }
  }

  buildMedicalPrompt(formData) {
    let prompt = `You are an AI medical assistant providing educational clinical insights. Please analyze this patient case and provide structured clinical guidance.

**IMPORTANT**: This is for educational purposes only. Always emphasize that real medical decisions require qualified healthcare professionals.

## Patient Case:
`;

    // Patient demographics
    if (formData.patientAge) {
      prompt += `**Age**: ${formData.patientAge} years old\n`;
    }
    if (formData.gender) {
      prompt += `**Gender**: ${formData.gender}\n`;
    }

    // Chief complaint
    if (formData.chiefComplaint) {
      prompt += `\n**Chief Complaint**: ${formData.chiefComplaint}\n`;
    }

    // History of Present Illness (HPI)
    prompt += `\n## History of Present Illness (HPI):\n`;
    
    // Include all relevant details in HPI
    if (formData.site || formData.onset || formData.character) {
      prompt += `\n**Presenting Complaint**:\n`;
      if (formData.site) prompt += `- **Site**: ${formData.site}\n`;
      if (formData.onset) prompt += `- **Onset**: ${formData.onset}\n`;
      if (formData.character) prompt += `- **Character**: ${formData.character}\n`;
      if (formData.radiation) prompt += `- **Radiation**: ${formData.radiation}\n`;
      if (formData.associatedSymptoms) prompt += `- **Associated Symptoms**: ${formData.associatedSymptoms}\n`;
      if (formData.timing) prompt += `- **Timing**: ${formData.timing}\n`;
      if (formData.exacerbating) prompt += `- **Exacerbating Factors**: ${formData.exacerbating}\n`;
      if (formData.relieving) prompt += `- **Relieving Factors**: ${formData.relieving}\n`;
      if (formData.severity) prompt += `- **Severity**: ${formData.severity}\n`;
    }

    // Include Past Medical History in HPI
    if (formData.pastMedicalHistory) {
      prompt += `\n**Past Medical History**: ${formData.pastMedicalHistory}\n`;
    }

    // Include Past Surgical History in HPI
    if (formData.pastSurgicalHistory) {
      prompt += `**Past Surgical History**: ${formData.pastSurgicalHistory}\n`;
    }

    // Include Physical Exam in HPI
    if (formData.examination) {
      prompt += `**Physical Examination**: ${formData.examination}\n`;
    }

    // Include medications and allergies in HPI
    if (formData.medications) prompt += `**Current Medications**: ${formData.medications}\n`;
    if (formData.allergies) prompt += `**Allergies**: ${formData.allergies}\n`;

    // Include family history in HPI
    if (formData.familyHistory) prompt += `**Family History**: ${formData.familyHistory}\n`;

    // Include social history in HPI
    if (formData.smoking || formData.alcohol || formData.occupation) {
      prompt += `**Social History**: `;
      const socialHistory = [];
      if (formData.smoking) socialHistory.push(`Smoking: ${formData.smoking}`);
      if (formData.alcohol) socialHistory.push(`Alcohol: ${formData.alcohol}`);
      if (formData.occupation) socialHistory.push(`Occupation: ${formData.occupation}`);
      if (formData.living) socialHistory.push(`Living: ${formData.living}`);
      if (formData.travel) socialHistory.push(`Travel: ${formData.travel}`);
      prompt += socialHistory.join(', ') + '\n';
    }

    // Include investigations in HPI
    if (formData.investigations) prompt += `**Investigations**: ${formData.investigations}\n`;

    prompt += `\n## Please Provide:

**1. DIFFERENTIAL DIAGNOSES**
List the top 3-5 most likely diagnoses based on the presentation, ranked by probability.

**2. RECOMMENDED INVESTIGATIONS**
Suggest appropriate investigations to help confirm or rule out the differential diagnoses.

**3. INITIAL MANAGEMENT APPROACH**
Outline immediate management steps and treatment considerations.

**4. RED FLAGS & SAFETY NETTING**
Highlight warning signs that would require urgent medical attention.

**5. EDUCATIONAL POINTS**
Key learning points about this condition for medical students.

Please format your response with clear headings and bullet points. Remember to emphasize that this is educational guidance only and that real patient care requires qualified medical professionals.`;

    return prompt;
  }
}

// Export singleton instance
export const firebaseAI = new FirebaseAIService();
