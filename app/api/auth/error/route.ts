import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const error = searchParams.get('error')
  
  redirect(`/error?error=${error}`)
} 