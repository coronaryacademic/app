// === Firebase AI Logic Service ===
export class FirebaseAIService {
  constructor() {
    this.firebaseAI = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (!window.firebaseAI || !window.getGenerativeModel) {
        throw new Error(
    this.models = [
      // GitHub Models
      {
        value: "DeepSeek-R1",
        text: "DeepSeek R1",
        type: "github",
        provider: "deepseek",
        token: DEEPSEEK_TOKEN
      },
      {
        value: "gpt-4o",
        text: "ChatGPT 4o",
        type: "github",
        provider: "openai",
        token: CHATGPT_TOKEN
      },
      // Vercel API models
      {
        value: "mistral/mistral-medium",
        text: "Mistral Medium (via Vercel)",
        type: "vercel",
        provider: "mistral",
        apiBase: "https://coronaryacademic.vercel.app/api/ai/chat",
        // API key will be injected from the server-side
        apiKey: window.ENV?.MISTRAL_API_KEY || "",
      },
      // Fallback to Firebase models if Vercel API is not available
      {
        value: "gemini-1.5-flash",
        text: "Gemini 1.5 Flash (Fastest, Recommended)",
        type: "firebase",
        provider: "google",
      },
      {
        value: "gemini-1.5-pro",
        text: "Gemini 1.5 Pro (Locked, Need payment)",
        type: "firebase",
        provider: "google",
      },
    ];
  }

  async generateContent(modelName, prompt, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Get the model configuration
    const models = this.getAvailableModels();
    const modelConfig = models.find((m) => m.value === modelName);

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
        const currentModelConfig =
          models.find((m) => m.value === currentModel) || {};
        let result;

        // Route to the appropriate handler based on model type
        if (currentModelConfig.type === "vercel") {
          result = await this.generateWithVercelAPI(
            currentModelConfig,
            prompt,
            options
          );
        } else {
          // Default to Firebase for other model types
          result = await this.tryGenerateWithModel(
            currentModel,
            prompt,
            options
          );
        }

        // If we get here, generation was successful
        return {
          ...result,
          modelUsed: currentModel,
          fallbackUsed: currentModel !== originalModel,
        };
      } catch (error) {
        console.warn(
          `[Firebase AI] Generation failed with ${currentModel}:`,
          error
        );
        lastError = error;

        // If this is a quota error or API error, try the next model
        if (
          error.message?.includes("quota") ||
          error.message?.includes("rate limit") ||
          error.message?.includes("429") ||
          error.message?.includes("API")
        ) {
          console.log(
            `[Firebase AI] Error with ${currentModel}, trying fallback...`
          );
          continue;
        }

        // For other errors, rethrow
        throw error;
      }
    }

    // If we've tried all models and all failed
    throw lastError || new Error("All model generation attempts failed");
  }

  async generateWithVercelAPI(modelConfig, prompt, options = {}) {
    const { value: model, apiBase, apiKey } = modelConfig;

    if (!apiBase) {
      throw new Error("API base URL is required for Vercel models");
    }

    if (!apiKey) {
      throw new Error("API key is required for Vercel models");
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-provider": modelConfig.provider || "mistral", // Default to mistral if not specified
      };

      const response = await fetch(apiBase, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxOutputTokens || 2048,
          stream: false,
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
      const content = data.choices?.[0]?.message?.content || "";

      if (!content) {
        console.error("Unexpected API response format:", data);
        throw new Error("Received empty or invalid response from AI service");
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
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[Vercel API] Generation failed:", error);
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  getFallbackModels(originalModel) {
    const modelHierarchy = {
      // Vercel models - fall back between each other, then to Firebase models
      "mistral/mistral-medium": [
        "github/model",
        "gemini-1.5-flash",
        "gemini-1.0-pro",
      ],
      "github/model": [
        "mistral/mistral-medium",
        "gemini-1.5-flash",
        "gemini-1.0-pro",
      ],

      // Firebase models
      "gemini-1.5-pro": ["gemini-1.5-flash", "gemini-1.0-pro"],
      "gemini-1.5-flash": ["gemini-1.0-pro"],
      "gemini-1.0-pro": ["gemini-1.5-flash"],
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
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      });

      console.log("[Firebase AI] Generating content with model:", modelName);

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("[Firebase AI] Content generated successfully");

      return {
        success: true,
        content: text,
        model: modelName,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[Firebase AI] Generation failed:", error);

      // Handle specific error types
      let errorMessage = "An unexpected error occurred";

      if (error.message?.includes("quota")) {
        errorMessage =
          "API quota exceeded. Please try again later or switch to Gemini 1.5 Flash.";
      } else if (error.message?.includes("safety")) {
        errorMessage =
          "Content was blocked by safety filters. Please modify your request.";
      } else if (error.message?.includes("authentication")) {
        errorMessage = "Authentication failed. Please sign in again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        model: modelName,
      };
    }
  }

  buildMedicalPrompt(formData) {
    let prompt = `You are an AI medical assistant providing educational clinical insights. Please analyze this patient case and provide structured clinical guidance.

**IMPORTANT**: This is for educational purposes only. Always emphasize that real medical decisions require qualified healthcare professionals.

## Patient Case:
`;

    // Start building the HPI as a narrative
    let hpi = [];

    // Patient identification and demographics
    let patientInfo = [];
    if (formData.patientName) patientInfo.push(formData.patientName);
    if (formData.patientAge)
      patientInfo.push(`${formData.patientAge}-year-old`);
    if (formData.gender) patientInfo.push(formData.gender);

    // Past Medical History
    let pmh = [];
    if (formData.pastMedicalHistory) {
      pmh = formData.pastMedicalHistory.split(",").map((item) => item.trim());
    }

    // Past Surgical History
    let psh = [];
    if (formData.pastSurgicalHistory) {
      psh = formData.pastSurgicalHistory.split(",").map((item) => item.trim());
    }

    // Build the HPI narrative
    if (patientInfo.length > 0) {
      hpi.push(patientInfo.join(" "));
    }

    // Add PMH and PSH to the narrative
    let medicalHistory = [];
    if (pmh.length > 0) medicalHistory.push(`history of ${pmh.join(", ")}`);
    if (psh.length > 0)
      medicalHistory.push(`past surgical history including ${psh.join(", ")}`);

    if (medicalHistory.length > 0) {
      hpi[0] += ` with ${medicalHistory.join(" and ")}`;
    }

    // Chief Complaint
    if (formData.chiefComplaint) {
      hpi[0] += `, presented with ${formData.chiefComplaint.toLowerCase()}.`;
    } else {
      hpi[0] += ".";
    }

    // Presenting Complaint Details
    let presentingDetails = [];
    if (formData.site)
      presentingDetails.push(`The pain is located in the ${formData.site}`);
    if (formData.onset) presentingDetails.push(`it began ${formData.onset}`);
    if (formData.character)
      presentingDetails.push(`is described as ${formData.character}`);
    if (formData.radiation)
      presentingDetails.push(`radiates to ${formData.radiation}`);
    if (formData.severity)
      presentingDetails.push(`with a severity of ${formData.severity}/10`);
    if (formData.timing) presentingDetails.push(`timing is ${formData.timing}`);
    if (formData.exacerbating)
      presentingDetails.push(`exacerbated by ${formData.exacerbating}`);
    if (formData.relieving)
      presentingDetails.push(`relieved by ${formData.relieving}`);

    if (presentingDetails.length > 0) {
      hpi.push(presentingDetails.join(", ") + ".");
    }

    // Associated Symptoms
    if (formData.associatedSymptoms) {
      hpi.push(`Associated symptoms include: ${formData.associatedSymptoms}.`);
    }

    // Drug History
    if (formData.medications) {
      hpi.push(`Current medications include: ${formData.medications}.`);
    }

    // Allergies
    if (formData.allergies) {
      hpi.push(`Allergies: ${formData.allergies}.`);
    }

    // Social History
    let socialHistory = [];
    if (formData.smoking) socialHistory.push(`smoking: ${formData.smoking}`);
    if (formData.alcohol) socialHistory.push(`alcohol: ${formData.alcohol}`);
    if (formData.occupation)
      socialHistory.push(`occupation: ${formData.occupation}`);
    if (socialHistory.length > 0) {
      hpi.push(`Social history: ${socialHistory.join("; ")}.`);
    }

    // Family History
    if (formData.familyHistory) {
      hpi.push(`Family history: ${formData.familyHistory}.`);
    }

    // Physical Examination
    if (formData.examination) {
      hpi.push(`Physical examination reveals: ${formData.examination}.`);
    }

    // Investigations
    if (formData.investigations) {
      hpi.push(`Investigations: ${formData.investigations}.`);
    }

    // ICE (Ideas, Concerns, Expectations)
    if (formData.ice) {
      hpi.push(`Patient's concerns/expectations: ${formData.ice}.`);
    }

    // Add the HPI to the prompt
    prompt += `\n## History of Present Illness (HPI):\n\n${hpi.join(" ")}`;

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
