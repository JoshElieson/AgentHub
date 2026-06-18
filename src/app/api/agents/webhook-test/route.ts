// POST /api/agents/webhook-test — echo endpoint for testing webhook delivery
//
// Receives the webhook payload, logs it to the server console, and returns
// it back to the caller with a 200 OK.

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("\n=== WEBHOOK RECEIVED ===");
    console.log(JSON.stringify(payload, null, 2));
    console.log("========================\n");
    return Response.json({ received: true, payload });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Invalid payload" },
      { status: 400 }
    );
  }
}
