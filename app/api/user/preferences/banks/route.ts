// app/api/user/banks/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { validate as isUUID } from 'uuid'; 

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Validate userId as UUID
    if (!isUUID(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Fetch user data from Prisma, including bank information
    const user = await db.public_users.findUnique({
      where: { id: userId },
      select: { id: true, bank_id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure bank_id is an array of strings
    const bankIds: string[] = Array.isArray(user.bank_id)
      ? user.bank_id.filter((id): id is string => typeof id === 'string')
      : typeof user.bank_id === 'string'
      ? [user.bank_id]
      : [];

    // Type guard to filter only valid UUID strings
    const validBankIds: string[] = bankIds.filter(
      (id): id is string => isUUID(id)
    );

    const banks = await db.bank.findMany({
      where: { id: { in: validBankIds } },
      select: { id: true, name: true },
    });

    return NextResponse.json({ banks });
  } catch (error) {
    console.error('Error fetching user banks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}