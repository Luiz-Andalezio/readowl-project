import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");
  if (!to) return NextResponse.json({ error: "Missing ?to=email@example.com" }, { status: 400 });
  const subject = "Readowl dev test email";
  const text = "This is a simple test email from Readowl dev route.";
  const html = `<p>This is a <b>simple test</b> email from Readowl dev route.</p>`;
  try {
    await sendMail({ to, subject, text, html, headers: { "X-Readowl-Category": "dev-test" } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
