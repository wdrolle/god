import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWithLlama } from "@/lib/llama";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { prompt } = await request.json();

    // Generate prayer using Llama
    const result = await generateWithLlama(
      `Create a heartfelt prayer in the style of the ${prompt} Bible translation.
      
      Guidelines:
      - Keep it personal and encouraging
      - Focus on hope, guidance, and spiritual growth
      - Length: 50-100 words
      - Style: Match the language style of ${prompt}
      - Format: Single paragraph, well-punctuated
      - Tone: Reverent but accessible
      
      Begin the prayer now:`
    );

    if (result.error) {
      return new NextResponse(result.error, { status: 500 });
    }

    if (!result.response) {
      return new NextResponse("No response from Llama", { status: 500 });
    }

    return NextResponse.json({ 
      message: result.response.trim() 
    });

  } catch (error) {
    console.error("[PRAYER_ERROR]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to generate prayer", 
      { status: 500 }
    );
  }
} 