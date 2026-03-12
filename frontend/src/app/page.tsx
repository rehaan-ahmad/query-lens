"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight, BarChart2, MessageSquare, Database } from "lucide-react";
import PageTransition from "@/components/animation/PageTransition";

export default function LandingPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-cream text-ink relative overflow-hidden font-sans selection:bg-olive selection:text-white">
        
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b3c36 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

        {/* Navbar */}
        <nav className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
          <div className="font-serif text-2xl tracking-tight text-navy font-bold">QueryLens.</div>
          <Link href="/login" className="text-sm font-medium hover:text-olive transition-colors">
            Sign In
          </Link>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 lg:pt-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-olive/10 text-olive px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-8 border border-olive/20">
              <span className="w-2 h-2 rounded-full bg-olive animate-pulse"></span>
              <span>Gemini 1.5 Powered BIOS</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-serif text-navy leading-[1.1] mb-8">
              Ask your data <br/> anything.
            </h1>
            
            <p className="text-xl text-muted leading-relaxed mb-12 max-w-2xl font-light">
              Transform raw inventory spreadsheets into interactive visual dashboards instantly. No SQL required. Just plain English.
            </p>
            
            <Link 
              href="/login"
              className="group inline-flex items-center bg-navy text-white px-8 py-4 rounded-[12px] text-lg font-medium hover:bg-olive transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Start Querying
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="mt-32 grid md:grid-cols-3 gap-8 border-t border-muted/20 pt-16">
            <DemoCard 
              icon={<MessageSquare className="w-6 h-6" />}
              title="Natural Language"
              description="Type conversational questions like 'What is the average price of diesel cars by year?'"
            />
            <DemoCard 
              icon={<Database className="w-6 h-6" />}
              title="Secure Execution"
              description="Backed by AthenaGuard protocols ensuring mathematically safe, injection-proof database queries."
            />
             <DemoCard 
              icon={<BarChart2 className="w-6 h-6" />}
              title="Auto-Visualisation"
              description="Our routing engine automatically detects the best chart type (Line, Bar, Pie) for your specific result shape."
            />
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

function DemoCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-surface p-8 rounded-[16px] shadow-sm border border-muted/10 hover:border-olive/30 transition-colors group">
      <div className="w-12 h-12 bg-cream rounded-xl flex items-center justify-center text-olive mb-6 group-hover:bg-olive group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-serif text-navy mb-3">{title}</h3>
      <p className="text-muted leading-relaxed">{description}</p>
    </div>
  );
}
