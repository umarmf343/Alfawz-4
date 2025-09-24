import { type NextRequest, NextResponse } from "next/server"
import { createHmac } from "node:crypto"

// Paystack webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("[v0] Webhook error: PAYSTACK_SECRET_KEY is not configured")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    // Verify webhook signature
    const hash = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest("hex")

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)

    console.log("[v0] Paystack webhook received:", event.event)

    switch (event.event) {
      case "charge.success":
        await handleSuccessfulPayment(event.data)
        break

      case "subscription.create":
        await handleSubscriptionCreated(event.data)
        break

      case "subscription.disable":
        await handleSubscriptionCancelled(event.data)
        break

      case "invoice.create":
        await handleInvoiceCreated(event.data)
        break

      default:
        console.log("[v0] Unhandled webhook event:", event.event)
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleSuccessfulPayment(data: any) {
  console.log("[v0] Processing successful payment:", data.reference)

  // Update user subscription status
  // Update payment history
  // Send confirmation email
  // Award Hasanat points for payment

  // In a real implementation, this would update the database
  const paymentData = {
    reference: data.reference,
    amount: data.amount / 100, // Paystack amounts are in kobo
    email: data.customer.email,
    status: "completed",
    plan: data.metadata?.plan || "premium",
    userId: data.metadata?.userId,
  }

  console.log("[v0] Payment processed:", paymentData)
}

async function handleSubscriptionCreated(data: any) {
  console.log("[v0] Processing subscription creation:", data.subscription_code)

  // Update user subscription
  // Set subscription status to active
  // Send welcome email

  const subscriptionData = {
    code: data.subscription_code,
    email: data.customer.email,
    plan: data.plan.name,
    status: "active",
    nextPayment: data.next_payment_date,
  }

  console.log("[v0] Subscription created:", subscriptionData)
}

async function handleSubscriptionCancelled(data: any) {
  console.log("[v0] Processing subscription cancellation:", data.subscription_code)

  // Update user subscription status
  // Send cancellation confirmation
  // Downgrade user features

  const cancellationData = {
    code: data.subscription_code,
    email: data.customer.email,
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
  }

  console.log("[v0] Subscription cancelled:", cancellationData)
}

async function handleInvoiceCreated(data: any) {
  console.log("[v0] Processing invoice creation:", data.id)

  // Send invoice to user
  // Update billing records

  const invoiceData = {
    id: data.id,
    amount: data.amount / 100,
    email: data.customer.email,
    dueDate: data.due_date,
    status: data.status,
  }

  console.log("[v0] Invoice created:", invoiceData)
}
