"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight, BarChart2, MessageSquare, Database } from "lucide-react";
import PageTransition from "@/components/animation/PageTransition";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-cream text-ink relative overflow-hidden font-sans selection:bg-olive selection:text-white">
        
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b3c36 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

        {/* Navbar */}
        <nav className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
          <div className="font-serif text-2xl tracking-tight font-bold">QueryLens.</div>
          <div className="flex items-center space-x-6">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium hover:text-accent transition-colors">
              Sign In
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 lg:pt-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-accent/10 text-accent px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-8 border border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              <span>Gemini 1.5 Powered BIOS</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-serif leading-[1.1] mb-8 tracking-tight">
              Ask your data <br/> 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-glow">anything.</span>
            </h1>
            
            <p className="text-xl text-muted leading-relaxed mb-12 max-w-2xl font-light">
              Transform raw inventory spreadsheets into interactive visual dashboards instantly. No SQL required. Just plain English.
            </p>
            
            <Link 
              href="/login"
              className="group inline-flex items-center bg-foreground text-background dark:bg-accent dark:text-white px-8 py-4 rounded-[12px] text-lg font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5"
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
    <div className="bg-surface/50 backdrop-blur-sm p-8 rounded-[16px] shadow-sm border border-black/5 dark:border-white/10 hover:border-accent/40 dark:hover:border-accent/40 transition-colors group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center text-accent mb-6 group-hover:bg-accent group-hover:text-white transition-colors relative z-10 shadow-sm border border-black/5 dark:border-white/5">
        {icon}
      </div>
      <h3 className="text-xl font-serif mb-3 relative z-10">{title}</h3>
      <p className="text-muted leading-relaxed relative z-10">{description}</p>
    </div>
  );
}
