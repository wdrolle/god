export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context: number[];
  total_duration: number;
  load_duration: number;
  prompt_eval_duration: number;
  eval_duration: number;
}

interface OllamaProps {
  prompt: string;
  firstName?: string;
}

export async function generateResponse({ prompt, firstName = "friend" }: OllamaProps): Promise<string> {
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: `You are a wise and knowledgeable theologian, well-versed in biblical scripture, 
        theological concepts, and spiritual guidance. Address the user as "${firstName}". Your responses should:
        
        1. Draw from biblical wisdom and scripture
        2. Provide thoughtful spiritual guidance
        3. Reference relevant Bible verses when appropriate
        4. Explain complex theological concepts clearly
        5. Maintain a respectful and pastoral tone
        6. Encourage spiritual growth and understanding

        Previous conversation:
        ${prompt}

        Please provide a theological response that addresses the spiritual aspects of the question 
        and offers biblical wisdom and guidance.`,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate response from Llama');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
} 