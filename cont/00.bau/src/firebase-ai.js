// === AI Service with Multiple Providers ===
// Supports GitHub Models (DeepSeek, ChatGPT) and Google Gemini

import { AI_CONFIG } from './ai-config.js';

const DEEPSEEK_TOKEN = AI_CONFIG.DEEPSEEK_TOKEN;
const CHATGPT_TOKEN = AI_CONFIG.CHATGPT_TOKEN;
const GITHUB_ENDPOINT = AI_CONFIG.GITHUB_ENDPOINT;
const GOOGLE_API_KEY = AI_CONFIG.GOOGLE_API_KEY;

export class FirebaseAIService {
  constructor() {
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
      // Google Gemini Models
      {
        value: "gemini-2.0-flash-exp",
        text: "Gemini 2.0 Flash (New & Free)",
        type: "google",
        provider: "google",
        apiKey: GOOGLE_API_KEY
      },
      {
        value: "gemini-1.5-flash",
        text: "Gemini 1.5 Flash",
        type: "google",
        provider: "google",
        apiKey: GOOGLE_API_KEY
      },
      {
        value: "gemini-1.5-pro",
        text: "Gemini 1.5 Pro",
        type: "google",
        provider: "google",
        apiKey: GOOGLE_API_KEY
      }
    ];
    this.firebaseAI = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      this.isInitialized = true;
      console.log("[Firebase AI] Service initialized successfully");
      return true;
    } catch (error) {
      console.error("[Firebase AI] Initialization failed:", error);
      throw error;
    }
  }

  getAvailableModels() {
    return this.models;
  }

  async generateContent(modelName, prompt, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const model = this.models.find((m) => m.value === modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    // Route to appropriate provider
    if (model.type === "github") {
      return await this.generateWithGitHub(model, prompt, options);
    } else if (model.type === "google") {
      return await this.generateWithGoogle(model, prompt, options);
    } else {
      throw new Error(`Unsupported model type: ${model.type}`);
    }
  }

  async generateWithGitHub(model, prompt, options = {}) {
    try {
      const response = await fetch(`${GITHUB_ENDPOINT}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${model.token}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          model: model.value,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4000,
          top_p: options.topP || 0.95,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `GitHub API error: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      return {
        text: data.choices?.[0]?.message?.content || "",
        model: model.value,
        provider: "github",
      };
    } catch (error) {
      console.error("[Firebase AI] GitHub generation error:", error);
      throw error;
    }
  }

  async generateWithGoogle(model, prompt, options = {}) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.value}:generateContent?key=${model.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: options.temperature || 0.7,
              maxOutputTokens: options.maxTokens || 4000,
              topP: options.topP || 0.95,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Google API error: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return {
        text: text,
        model: model.value,
        provider: "google",
      };
    } catch (error) {
      console.error("[Firebase AI] Google generation error:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const firebaseAI = new FirebaseAIService();

// Initialize on load
firebaseAI.initialize().catch((error) => {
  console.error("[Firebase AI] Failed to initialize:", error);
});
