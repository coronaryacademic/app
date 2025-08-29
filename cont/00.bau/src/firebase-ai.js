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
      { value: 'gemini-1.5-flash', text: 'Gemini 1.5 Flash (Recommended - Free Tier)' },
      { value: 'gemini-1.5-pro', text: 'Gemini 1.5 Pro (Advanced - Limited Quota)' },
      { value: 'gemini-1.0-pro', text: 'Gemini 1.0 Pro (Legacy)' }
    ];
  }

  async generateContent(modelName, prompt, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

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
        }
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

    // SOCRATES details
    if (formData.site || formData.onset || formData.character) {
      prompt += `\n**Presenting Complaint Details (SOCRATES)**:\n`;
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

    // Medical history
    if (formData.pastMedicalHistory) prompt += `\n**Past Medical History**: ${formData.pastMedicalHistory}\n`;
    if (formData.medications) prompt += `**Current Medications**: ${formData.medications}\n`;
    if (formData.allergies) prompt += `**Allergies**: ${formData.allergies}\n`;
    if (formData.familyHistory) prompt += `**Family History**: ${formData.familyHistory}\n`;

    // Social history
    if (formData.smoking || formData.alcohol || formData.occupation) {
      prompt += `\n**Social History**:\n`;
      if (formData.smoking) prompt += `- **Smoking**: ${formData.smoking}\n`;
      if (formData.alcohol) prompt += `- **Alcohol**: ${formData.alcohol}\n`;
      if (formData.occupation) prompt += `- **Occupation**: ${formData.occupation}\n`;
      if (formData.living) prompt += `- **Living Situation**: ${formData.living}\n`;
      if (formData.travel) prompt += `- **Recent Travel**: ${formData.travel}\n`;
    }

    // Examination and investigations
    if (formData.examination) prompt += `\n**Examination Findings**: ${formData.examination}\n`;
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
