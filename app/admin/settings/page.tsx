"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  Globe,
  Shield,
  Database,
  Bell,
  Palette,
  Users,
  CreditCard,
  Save,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "AlFawz Qur'an Institute",
    siteDescription: "Advanced Qur'an learning platform with AI-powered feedback",
    contactEmail: "admin@alfawz.com",
    supportEmail: "support@alfawz.com",
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    pushNotifications: true,
    autoBackup: true,
    backupFrequency: "daily",
    maxFileSize: "50",
    sessionTimeout: "30",
    passwordMinLength: "8",
    twoFactorRequired: false,
    apiRateLimit: "1000",
    cacheEnabled: true,
    debugMode: false,
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    console.log(`[v0] Setting changed: ${key} = ${value}`)
  }

  const handleSaveSettings = () => {
    console.log("[v0] Saving admin settings:", settings)
    // In a real implementation, this would save to the backend
    alert("Settings saved successfully!")
  }

  const handleSystemRestart = () => {
    console.log("[v0] Initiating system restart")
    if (confirm("Are you sure you want to restart the system? This will temporarily interrupt service.")) {
      alert("System restart initiated. Services will be back online in 2-3 minutes.")
    }
  }

  const handleClearCache = () => {
    console.log("[v0] Clearing system cache")
    alert("System cache cleared successfully!")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-maroon-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-maroon-900 mb-2">System Settings</h1>
            <p className="text-lg text-maroon-700">Configure and manage platform settings</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleClearCache}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button className="bg-gradient-to-r from-maroon-600 to-maroon-700" onClick={handleSaveSettings}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="general" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
              <Database className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white">
              <CreditCard className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-maroon-600 data-[state=active]:text-white"
            >
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Site Information
                  </CardTitle>
                  <CardDescription>Basic information about your platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={settings.siteName}
                      onChange={(e) => handleSettingChange("siteName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Textarea
                      id="siteDescription"
                      value={settings.siteDescription}
                      onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => handleSettingChange("contactEmail", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => handleSettingChange("supportEmail", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>Control user registration and access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Registration Enabled</Label>
                      <p className="text-sm text-gray-600">Allow new users to register</p>
                    </div>
                    <Switch
                      checked={settings.registrationEnabled}
                      onCheckedChange={(checked) => handleSettingChange("registrationEnabled", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-gray-600">Temporarily disable site access</p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
                    />
                  </div>
                  {settings.maintenanceMode && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Maintenance Mode Active</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">Only administrators can access the platform</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Authentication
                  </CardTitle>
                  <CardDescription>Configure authentication and password policies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={settings.passwordMinLength}
                      onChange={(e) => handleSettingChange("passwordMinLength", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange("sessionTimeout", e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication Required</Label>
                      <p className="text-sm text-gray-600">Require 2FA for all users</p>
                    </div>
                    <Switch
                      checked={settings.twoFactorRequired}
                      onCheckedChange={(checked) => handleSettingChange("twoFactorRequired", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API & Rate Limiting</CardTitle>
                  <CardDescription>Configure API access and rate limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="apiRateLimit">API Rate Limit (requests/hour)</Label>
                    <Input
                      id="apiRateLimit"
                      type="number"
                      value={settings.apiRateLimit}
                      onChange={(e) => handleSettingChange("apiRateLimit", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxFileSize">Max File Upload Size (MB)</Label>
                    <Input
                      id="maxFileSize"
                      type="number"
                      value={settings.maxFileSize}
                      onChange={(e) => handleSettingChange("maxFileSize", e.target.value)}
                    />
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Security Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">SSL Certificate</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Valid</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Firewall</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Last Security Scan</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">2 hours ago</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure system notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Email Notifications</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Email Notifications</Label>
                        <p className="text-sm text-gray-600">Send notifications via email</p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Email Templates</Label>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">Welcome Email</span>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">Password Reset</span>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">Payment Confirmation</span>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Push Notifications</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Push Notifications</Label>
                        <p className="text-sm text-gray-600">Send browser push notifications</p>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Notification Types</Label>
                      <div className="space-y-2">
                        {[
                          "New user registration",
                          "Payment received",
                          "Content reported",
                          "System alerts",
                          "Achievement unlocked",
                        ].map((type) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-sm">{type}</span>
                            <Switch defaultChecked />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database & Backup
                  </CardTitle>
                  <CardDescription>Configure database and backup settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Backup</Label>
                      <p className="text-sm text-gray-600">Automatically backup database</p>
                    </div>
                    <Switch
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => handleSettingChange("autoBackup", checked)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <select
                      id="backupFrequency"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={settings.backupFrequency}
                      onChange={(e) => handleSettingChange("backupFrequency", e.target.value)}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full bg-transparent">
                      <Database className="h-4 w-4 mr-2" />
                      Create Manual Backup
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restore from Backup
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance & Cache</CardTitle>
                  <CardDescription>Optimize system performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Caching</Label>
                      <p className="text-sm text-gray-600">Cache frequently accessed data</p>
                    </div>
                    <Switch
                      checked={settings.cacheEnabled}
                      onCheckedChange={(checked) => handleSettingChange("cacheEnabled", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Debug Mode</Label>
                      <p className="text-sm text-gray-600">Enable detailed error logging</p>
                    </div>
                    <Switch
                      checked={settings.debugMode}
                      onCheckedChange={(checked) => handleSettingChange("debugMode", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full bg-transparent" onClick={handleClearCache}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear All Cache
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                      onClick={handleSystemRestart}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Restart System
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Configuration
                </CardTitle>
                <CardDescription>Configure payment gateways and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Paystack Settings</h4>
                    <div>
                      <Label htmlFor="paystackPublicKey">Public Key</Label>
                      <Input id="paystackPublicKey" type="password" placeholder="pk_test_..." />
                    </div>
                    <div>
                      <Label htmlFor="paystackSecretKey">Secret Key</Label>
                      <Input id="paystackSecretKey" type="password" placeholder="sk_test_..." />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Test Mode</Label>
                        <p className="text-sm text-gray-600">Use test environment</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Payment Methods</h4>
                    <div className="space-y-2">
                      {["Credit/Debit Cards", "Bank Transfer", "USSD", "Mobile Money", "QR Code"].map((method) => (
                        <div key={method} className="flex items-center justify-between">
                          <span className="text-sm">{method}</span>
                          <Switch defaultChecked />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Transaction Fees</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cardFee">Card Fee (%)</Label>
                      <Input id="cardFee" type="number" defaultValue="1.5" step="0.1" />
                    </div>
                    <div>
                      <Label htmlFor="transferFee">Transfer Fee (₦)</Label>
                      <Input id="transferFee" type="number" defaultValue="50" />
                    </div>
                    <div>
                      <Label htmlFor="ussdFee">USSD Fee (₦)</Label>
                      <Input id="ussdFee" type="number" defaultValue="20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme & Branding
                </CardTitle>
                <CardDescription>Customize the look and feel of your platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Color Scheme</h4>
                    <div className="space-y-3">
                      <div>
                        <Label>Primary Color</Label>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-maroon-600 rounded border"></div>
                          <Input value="#8B2635" readOnly />
                        </div>
                      </div>
                      <div>
                        <Label>Secondary Color</Label>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-cream-100 rounded border"></div>
                          <Input value="#FDF6E3" readOnly />
                        </div>
                      </div>
                      <div>
                        <Label>Accent Color</Label>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-yellow-500 rounded border"></div>
                          <Input value="#EAB308" readOnly />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Logo & Branding</h4>
                    <div className="space-y-3">
                      <div>
                        <Label>Site Logo</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <div className="text-gray-500">
                            <div className="text-2xl mb-2">📖</div>
                            <p className="text-sm">Upload logo (PNG, JPG, SVG)</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Favicon</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <div className="text-gray-500">
                            <div className="text-lg mb-1">🕌</div>
                            <p className="text-xs">Upload favicon (ICO, PNG)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Typography</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Heading Font</Label>
                      <select className="w-full p-2 border border-gray-300 rounded-md">
                        <option>Inter</option>
                        <option>Roboto</option>
                        <option>Open Sans</option>
                        <option>Lato</option>
                      </select>
                    </div>
                    <div>
                      <Label>Body Font</Label>
                      <select className="w-full p-2 border border-gray-300 rounded-md">
                        <option>Inter</option>
                        <option>Roboto</option>
                        <option>Open Sans</option>
                        <option>Lato</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
