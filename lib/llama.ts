interface LlamaResponse {
  response: string;
  error?: string;
}

export async function generateWithLlama(prompt: string): Promise<LlamaResponse> {
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          repeat_penalty: 1.1,
          length_penalty: 1.0,
          presence_penalty: 0.0,
          frequency_penalty: 0.0
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Llama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log("Llama response:", data);

    if (!data || !data.response) {
      throw new Error('Invalid response format from Llama');
    }

    return { response: data.response.trim() };
  } catch (error) {
    console.error("Llama generation error:", error);
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return { 
        response: "",
        error: "Cannot connect to Llama server. Please ensure it's running."
      };
    }
    return { 
      response: "",
      error: error instanceof Error ? error.message : "Failed to connect to Llama"
    };
  }
} 