"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Trophy, Star, Play, ChevronRight, Menu, X } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-cream">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-maroon rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AlFawz</h1>
                <p className="text-xs text-muted-foreground">Qur'an Institute</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="/features" className="text-foreground hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="/about" className="text-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-foreground hover:text-primary transition-colors">
                Contact
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="gradient-maroon text-white border-0">
                  Get Started
                </Button>
              </Link>
            </div>

            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
            <div className="px-4 py-4 space-y-3">
              <Link href="/features" className="block text-foreground hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="/about" className="block text-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/contact" className="block text-foreground hover:text-primary transition-colors">
                Contact
              </Link>
              <div className="flex space-x-3 pt-3">
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register" className="flex-1">
                  <Button size="sm" className="w-full gradient-maroon text-white border-0">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 gradient-gold text-white border-0 px-4 py-2">Excellence in Qur'anic Education</Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance mb-8">
              Transform Your <span className="text-gradient-gold">Qur'an Journey</span> with AI-Powered Learning
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-balance mb-12 leading-relaxed">
              Advanced platform for Qur'an recitation, memorization, and Islamic education. Experience personalized
              learning with AI feedback, spaced repetition, and comprehensive teacher tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/register">
                <Button size="lg" className="gradient-maroon text-white border-0 px-8 py-4 text-lg group">
                  Start Learning Today
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg group bg-transparent">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comprehensive Learning Platform</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for effective Qur'an education in one integrated platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 gradient-maroon rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Interactive Qur'an Reader</CardTitle>
                <CardDescription>
                  Beautiful Arabic text with audio recitation, translation, and real-time progress tracking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 gradient-gold rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Teacher Dashboard</CardTitle>
                <CardDescription>
                  Comprehensive tools for creating assignments, tracking student progress, and managing classes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 gradient-maroon rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Gamified Learning</CardTitle>
                <CardDescription>
                  Earn Hasanat points, unlock achievements, and compete on leaderboards while learning
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 gradient-gold rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <CardTitle>AI-Powered Feedback</CardTitle>
                <CardDescription>
                  Advanced recitation analysis using OpenAI Whisper for pronunciation and Tajweed improvement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 gradient-maroon rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Spaced Repetition System</CardTitle>
                <CardDescription>
                  Scientifically-proven memorization techniques with personalized review schedules
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 gradient-gold rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Progress Analytics</CardTitle>
                <CardDescription>
                  Detailed insights into learning patterns, strengths, and areas for improvement
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Qur'an Sample */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Experience Beautiful Qur'an Display</h2>
          <Card className="p-8 bg-background/80 backdrop-blur-sm border-border/50">
            <div className="arabic-text text-3xl md:text-4xl lg:text-5xl leading-loose text-primary mb-6">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <p className="text-lg text-muted-foreground mb-4">
              In the name of Allah, the Entirely Merciful, the Especially Merciful.
            </p>
            <Badge variant="secondary" className="text-sm">
              Al-Fatiha: 1
            </Badge>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Begin Your Journey?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students and teachers already using AlFawz to enhance their Qur'anic education
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="gradient-maroon text-white border-0 px-8 py-4 text-lg">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg bg-transparent">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">AlFawz</h3>
                  <p className="text-xs opacity-80">Qur'an Institute</p>
                </div>
              </div>
              <p className="text-sm opacity-80">
                Excellence in Qur'anic education through innovative technology and traditional wisdom.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>
                  <Link href="/features" className="hover:opacity-100 transition-opacity">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:opacity-100 transition-opacity">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:opacity-100 transition-opacity">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>
                  <Link href="/help" className="hover:opacity-100 transition-opacity">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:opacity-100 transition-opacity">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/community" className="hover:opacity-100 transition-opacity">
                    Community
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>
                  <Link href="/about" className="hover:opacity-100 transition-opacity">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:opacity-100 transition-opacity">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:opacity-100 transition-opacity">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm opacity-80">
            <p>&copy; 2025 AlFawz Qur'an Institute. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
