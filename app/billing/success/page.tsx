"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Crown, Gift, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const reference = searchParams.get("reference")

    if (reference) {
      // Verify payment with Paystack
      verifyPayment(reference)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const verifyPayment = async (reference: string) => {
    try {
      console.log("[v0] Verifying payment:", reference)

      // In a real implementation, this would call your backend to verify with Paystack
      const response = await fetch(`/api/payments/verify?reference=${reference}`)
      const data = await response.json()

      setPaymentDetails(data)
      setLoading(false)

      console.log("[v0] Payment verified:", data)
    } catch (error) {
      console.error("[v0] Payment verification error:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-maroon-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-600 mx-auto mb-4"></div>
          <p className="text-maroon-700">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-maroon-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-maroon-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-maroon-700">Thank you for your subscription. Your account has been upgraded.</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Subscription Details
            </CardTitle>
            <CardDescription>Your new subscription is now active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">Premium Monthly</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">₦15,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Billing:</span>
                <span className="font-medium">February 15, 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-medium text-sm">{searchParams.get("reference")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-yellow-300" />
              Welcome Bonus!
            </CardTitle>
            <CardDescription className="text-maroon-100">
              You've earned bonus Hasanat points for upgrading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300 mb-2">+500</div>
              <div className="text-maroon-100">Hasanat Points Added</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Crown className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <h3 className="font-semibold mb-1">Premium Features</h3>
              <p className="text-sm text-gray-600">Access all premium content and features</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Gift className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold mb-1">AI Feedback</h3>
              <p className="text-sm text-gray-600">Get personalized recitation feedback</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800">
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>

          <div className="text-sm text-gray-600">
            Need help?{" "}
            <Link href="/support" className="text-maroon-600 hover:underline">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
