interface GenerateMessageProps {
  prompt: string;
  conversationId: string;
  previousMessages?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export async function generateMessage({ 
  prompt, 
  conversationId, 
  previousMessages = [] 
}: GenerateMessageProps): Promise<string> {
  try {
    const response = await fetch("/api/generate-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        conversationId,
        previousMessages,
        model: "llama3.2",
        temperature: 0.7,
        maxTokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate message in the utils generate message file.');
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('Error generating message:', error);
    throw error;
  }
} 