// File processing and MCQ generation API endpoint
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileContent, fileName, questionCount = 5, difficulty = 'intermediate', customInstructions = '' } = req.body;

    if (!fileContent) {
      return res.status(400).json({ error: 'File content is required' });
    }

    // Detect file type
    const isCodeFile = fileName.match(/\.(py|js|html|css|java|cpp|c|json|xml)$/i);
    const fileExtension = fileName.split('.').pop().toLowerCase();

    // Create the improved prompt for MCQ generation
    const prompt = `You are an expert educator creating multiple choice questions. Analyze the following content and generate ${questionCount} high-quality MCQ questions.

FILE: ${fileName}
TYPE: ${isCodeFile ? fileExtension.toUpperCase() + ' Code' : 'Document'}

CONTENT TO ANALYZE:
${fileContent}

${customInstructions ? `CUSTOM INSTRUCTIONS: ${customInstructions}` : ''}

REQUIREMENTS:
1. Generate exactly ${questionCount} questions that test deep understanding
2. Focus on the actual content, not file metadata or technical details
3. Each question should have 4 options (A, B, C, D)
4. Questions should be relevant to the core concepts in the content
5. Avoid questions about file format, version, or technical specifications
6. Test comprehension, application, and analysis rather than memorization
7. Difficulty level: ${difficulty}

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

    // Use Gemini to generate MCQs
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let mcqText = response.text();

    // Clean up the response to ensure it's valid JSON
    mcqText = mcqText.trim();
    
    // Remove any markdown code blocks if present
    if (mcqText.startsWith('```python')) {
      mcqText = mcqText.replace(/```python\n?/, '').replace(/\n?```$/, '');
    } else if (mcqText.startsWith('```json')) {
      mcqText = mcqText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (mcqText.startsWith('```')) {
      mcqText = mcqText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    // Convert Python format to JSON if needed
    mcqText = mcqText.replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false');

    // Try to parse the JSON
    let mcqData;
    try {
      mcqData = JSON.parse(mcqText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', mcqText);
      
      // Fallback: try to extract JSON from the response
      const jsonMatch = mcqText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          mcqData = JSON.parse(jsonMatch[0]);
        } catch (fallbackError) {
          throw new Error('Failed to parse AI response as JSON');
        }
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    }

    // Validate the structure
    if (!Array.isArray(mcqData)) {
      throw new Error('AI response is not an array');
    }

    // Ensure each question has the required structure
    const validatedQuestions = mcqData.map((q, index) => ({
      id: q.id || index + 1,
      question: q.question || `Question ${index + 1}`,
      options: q.options || { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
      correctAnswer: q.correctAnswer || 'A',
      explanation: q.explanation || 'No explanation provided'
    }));

    return res.status(200).json({
      success: true,
      questions: validatedQuestions,
      metadata: {
        fileName,
        questionCount: validatedQuestions.length,
        difficulty,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('MCQ Generation Error:', error);
    
    return res.status(500).json({
      error: 'Failed to generate MCQ questions',
      details: error.message,
      // Provide fallback questions in case of error
      fallbackQuestions: [
        {
          id: 1,
          question: "Based on the uploaded document, what is the main topic discussed?",
          options: {
            A: "Please upload a valid document",
            B: "The system encountered an error",
            C: "Try again with a different file",
            D: "Contact support if this persists"
          },
          correctAnswer: "A",
          explanation: "This is a fallback question due to processing error."
        }
      ]
    });
  }
}
