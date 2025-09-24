"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard,
  Crown,
  Star,
  Check,
  Calendar,
  Receipt,
  Download,
  AlertCircle,
  Zap,
  BookOpen,
  Users,
  Headphones,
} from "lucide-react"

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState("premium")

  const currentSubscription = {
    plan: "Premium",
    status: "active",
    nextBilling: "2024-02-15",
    amount: "₦15,000",
    period: "monthly",
  }

  const subscriptionPlans = [
    {
      id: "basic",
      name: "Basic",
      price: "₦5,000",
      period: "month",
      description: "Perfect for individual learners",
      features: [
        "Access to Qur'an Reader",
        "Basic progress tracking",
        "5 hours of audio content",
        "Community access",
        "Mobile app access",
      ],
      popular: false,
      color: "from-gray-500 to-gray-600",
    },
    {
      id: "premium",
      name: "Premium",
      price: "₦15,000",
      period: "month",
      description: "Most popular for serious students",
      features: [
        "Everything in Basic",
        "Advanced SRS system",
        "Unlimited audio content",
        "AI-powered feedback",
        "Progress analytics",
        "Priority support",
        "Offline access",
      ],
      popular: true,
      color: "from-maroon-600 to-maroon-700",
    },
    {
      id: "family",
      name: "Family",
      price: "₦25,000",
      period: "month",
      description: "Perfect for families and small groups",
      features: [
        "Everything in Premium",
        "Up to 6 family members",
        "Family progress dashboard",
        "Parental controls",
        "Group challenges",
        "Family leaderboard",
        "Bulk assignments",
      ],
      popular: false,
      color: "from-purple-600 to-purple-700",
    },
    {
      id: "institution",
      name: "Institution",
      price: "₦50,000",
      period: "month",
      description: "For schools and Islamic centers",
      features: [
        "Everything in Family",
        "Unlimited students",
        "Teacher dashboard",
        "Advanced analytics",
        "Custom branding",
        "API access",
        "Dedicated support",
      ],
      popular: false,
      color: "from-yellow-600 to-orange-600",
    },
  ]

  const paymentHistory = [
    {
      id: "PAY_001",
      date: "2024-01-15",
      amount: "₦15,000",
      description: "Premium Monthly Subscription",
      status: "completed",
      method: "Card ending in 4242",
    },
    {
      id: "PAY_002",
      date: "2023-12-15",
      amount: "₦15,000",
      description: "Premium Monthly Subscription",
      status: "completed",
      method: "Card ending in 4242",
    },
    {
      id: "PAY_003",
      date: "2023-11-15",
      amount: "₦15,000",
      description: "Premium Monthly Subscription",
      status: "completed",
      method: "Bank Transfer",
    },
    {
      id: "PAY_004",
      date: "2023-10-15",
      amount: "₦5,000",
      description: "Basic Monthly Subscription",
      status: "completed",
      method: "Card ending in 4242",
    },
  ]

  const handlePaystackPayment = (planId: string) => {
    // In a real implementation, this would integrate with Paystack
    console.log(`[v0] Initiating Paystack payment for plan: ${planId}`)

    // Simulate Paystack integration
    const plan = subscriptionPlans.find((p) => p.id === planId)
    if (plan) {
      // This would typically open Paystack popup or redirect
      alert(`Redirecting to Paystack for ${plan.name} plan payment of ${plan.price}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-maroon-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-maroon-900 mb-4">Billing & Subscriptions</h1>
          <p className="text-lg text-maroon-700 max-w-2xl mx-auto">
            Manage your subscription and access premium features to enhance your Qur'an learning journey
          </p>
        </div>

        <Tabs defaultValue="subscription" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
            <TabsTrigger
              value="subscription"
              className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
              <Crown className="h-4 w-4 mr-2" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
              <Receipt className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Current Subscription */}
          <TabsContent value="subscription" className="space-y-6">
            <Card className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Crown className="h-6 w-6 text-yellow-300" />
                  Current Subscription
                </CardTitle>
                <CardDescription className="text-maroon-100">
                  Your active subscription details and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-sm text-maroon-100 mb-1">Current Plan</div>
                    <div className="text-2xl font-bold text-yellow-300">{currentSubscription.plan}</div>
                    <Badge className="mt-2 bg-green-500 text-white border-0">{currentSubscription.status}</Badge>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-sm text-maroon-100 mb-1">Next Billing</div>
                    <div className="text-xl font-bold">{currentSubscription.nextBilling}</div>
                    <div className="text-sm text-maroon-100 mt-1">
                      {currentSubscription.amount}/{currentSubscription.period}
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-sm text-maroon-100 mb-1">Payment Method</div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Card ending in 4242</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Upgrade Plan
                  </CardTitle>
                  <CardDescription>Get access to more features and unlock your full potential</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800"
                    onClick={() => handlePaystackPayment("family")}
                  >
                    Upgrade to Family Plan
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Manage Subscription
                  </CardTitle>
                  <CardDescription>Cancel, pause, or modify your current subscription</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full bg-transparent">
                      Pause Subscription
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscription Plans */}
          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {subscriptionPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    plan.popular ? "ring-2 ring-maroon-500 shadow-lg" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-maroon-600 to-maroon-700 text-white text-center py-2 text-sm font-medium">
                      Most Popular
                    </div>
                  )}

                  <CardHeader className={plan.popular ? "pt-12" : ""}>
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}
                    >
                      {plan.id === "basic" && <BookOpen className="h-6 w-6 text-white" />}
                      {plan.id === "premium" && <Star className="h-6 w-6 text-white" />}
                      {plan.id === "family" && <Users className="h-6 w-6 text-white" />}
                      {plan.id === "institution" && <Crown className="h-6 w-6 text-white" />}
                    </div>

                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>

                    <div className="mt-4">
                      <span className="text-3xl font-bold text-maroon-900">{plan.price}</span>
                      <span className="text-maroon-600">/{plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800"
                          : "bg-gray-900 hover:bg-gray-800"
                      }`}
                      onClick={() => handlePaystackPayment(plan.id)}
                    >
                      {currentSubscription.plan.toLowerCase() === plan.name.toLowerCase()
                        ? "Current Plan"
                        : "Choose Plan"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Accepted Payment Methods
                </CardTitle>
                <CardDescription>We accept various payment methods through Paystack</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Visa/Mastercard</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Headphones className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Bank Transfer</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Star className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">USSD</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Zap className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium">Mobile Money</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Payment History
                </CardTitle>
                <CardDescription>View and download your payment receipts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{payment.description}</div>
                          <div className="text-sm text-gray-600">
                            {payment.date} • {payment.method}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{payment.amount}</div>
                          <Badge className="bg-green-100 text-green-800 border-green-200">{payment.status}</Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Receipt
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Billing Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-maroon-600" />
                  <div className="text-2xl font-bold text-maroon-900">4</div>
                  <div className="text-sm text-maroon-600">Total Payments</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-maroon-900">₦50,000</div>
                  <div className="text-sm text-maroon-600">Total Spent</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <div className="text-2xl font-bold text-maroon-900">₦15,000</div>
                  <div className="text-sm text-maroon-600">Next Payment</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
