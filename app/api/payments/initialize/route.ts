import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, amount, plan, userId } = await request.json()

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("[v0] Payment initialization error: PAYSTACK_SECRET_KEY is not configured")
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("[v0] Payment initialization error: NEXT_PUBLIC_APP_URL is not configured")
      return NextResponse.json({ error: "Application URL not configured" }, { status: 500 })
    }

    if (!email || !amount || !plan || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Initialize Paystack payment
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo
        currency: "NGN",
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
        metadata: {
          plan,
          userId,
          custom_fields: [
            {
              display_name: "Plan",
              variable_name: "plan",
              value: plan,
            },
          ],
        },
      }),
    })

    const data = await paystackResponse.json()

    if (!data.status) {
      throw new Error(data.message || "Payment initialization failed")
    }

    console.log("[v0] Payment initialized:", data.data.reference)

    return NextResponse.json({
      status: "success",
      data: {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      },
    })
  } catch (error) {
    console.error("[v0] Payment initialization error:", error)
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
  }
}
