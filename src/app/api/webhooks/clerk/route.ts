import { NextRequest, NextResponse } from "next/server";

const CLERK_ENABLED =
  !!process.env.CLERK_SECRET_KEY &&
  process.env.CLERK_SECRET_KEY !== "sk_test_your_clerk_secret_key";

const MONGODB_ENABLED =
  !!process.env.MONGODB_URI &&
  process.env.MONGODB_URI !== "mongodb+srv://user:password@cluster.mongodb.net/pitwall?retryWrites=true&w=majority";

// POST /api/webhooks/clerk
export async function POST(req: NextRequest) {
  // In demo mode, just return 200
  if (!CLERK_ENABLED || !MONGODB_ENABLED) {
    return NextResponse.json({ received: true, mode: "demo" });
  }

  try {
    const { Webhook } = await import("svix");
    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");

    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
    }

    const body = await req.text();
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

    let event: { type: string; data: Record<string, unknown> };
    try {
      event = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof event;
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    await connectDB();
    const { type, data } = event;

    switch (type) {
      case "user.created":
      case "user.updated": {
        const email = Array.isArray(data.email_addresses)
          ? (data.email_addresses[0] as { email_address: string })?.email_address
          : "";

        const username = (data.username as string) ||
          email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "_");

        await UserProfile.findOneAndUpdate(
          { clerkId: data.id as string },
          {
            $set: {
              clerkId: data.id as string,
              email,
              username,
              displayName: `${data.first_name || ""} ${data.last_name || ""}`.trim() || username,
              avatar: data.image_url as string,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
              sportPreferences: ["football"],
              onboardingComplete: false,
            },
          },
          { upsert: true, new: true }
        );
        break;
      }

      case "user.deleted": {
        await UserProfile.updateOne(
          { clerkId: data.id as string },
          { $set: { isDeleted: true } }
        );
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[clerk webhook]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
