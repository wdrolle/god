// app/api/auth/callback/route.ts

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    (await cookies()).getAll();
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code).then((result) => {
      console.log("Succefully logged In .");
      console.log(result);
      
    });
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
