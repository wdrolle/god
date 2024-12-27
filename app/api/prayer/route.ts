import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Fallback prayers for when the AI is unavailable
const FALLBACK_PRAYERS = [
  `Dear Heavenly Father,

Guide us with Your infinite wisdom and grace. Help us to trust in Your perfect timing and to find peace in Your presence. Grant us the strength to face our challenges with faith and courage.

May Your light shine upon our path and Your love fill our hearts. We thank You for Your endless blessings and constant protection.

In Jesus' name we pray,
Amen 🙏`,

  `Loving Father,

We come before You with grateful hearts, seeking Your guidance and wisdom. Help us to walk in Your ways and to trust in Your divine plan. Fill us with Your peace that surpasses all understanding.

Thank You for Your unfailing love and constant presence in our lives. May we always feel Your comfort and strength.

Through Christ our Lord,
Amen 🙏`,

  `Gracious God,

We lift our hearts to You in prayer, knowing that You hear every word. Grant us wisdom to make right choices and courage to face whatever lies ahead. Let Your peace reign in our hearts.

Thank You for Your endless mercy and grace. May we always walk in Your light.

In Your holy name,
Amen 🙏`
];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get god_user details
    const godUser = await prisma.god_users.findFirst({
      where: { auth_user_id: session.user.id }
    });

    if (!godUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { prompt, maxWords = 100 } = await req.json();

    try {
      // Try to get AI response first
      const response = await fetch('http://localhost:3000/api/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Create a heartfelt prayer (max ${maxWords} words) that inspires and uplifts, focusing on ${prompt}. Make it personal and encouraging, without citing specific verses.`,
          themeId: 'faith'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.message) {
        // Format the response in markdown with proper spacing
        const formattedResponse = `

${data.message}

---

*With faith and love
-- Zoe* 🙏
`.trim();

        return NextResponse.json({ message: formattedResponse });
      }

      // If AI fails, use fallback
      console.log('Using fallback prayer due to AI service unavailability');
      const fallbackPrayer = FALLBACK_PRAYERS[Math.floor(Math.random() * FALLBACK_PRAYERS.length)];
      return NextResponse.json({ 
        message: fallbackPrayer,
        isFallback: true 
      });

    } catch (aiError) {
      // If AI service fails, use fallback
      console.error('AI service error:', aiError);
      const fallbackPrayer = FALLBACK_PRAYERS[Math.floor(Math.random() * FALLBACK_PRAYERS.length)];
      return NextResponse.json({ 
        message: fallbackPrayer,
        isFallback: true 
      });
    }

  } catch (error) {
    console.error('Error in prayer route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate prayer' },
      { status: 500 }
    );
  }
} 