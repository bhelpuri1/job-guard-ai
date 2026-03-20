"use client";

import { useState, Suspense } from "react";
import { motion } from "motion/react";
import AntigravityBackground from "@/components/AntigravityBackground";
import JobAnalyzer from "@/components/JobAnalyzer";
import ScanHistory from "@/components/ScanHistory";
import { AnalysisResult } from "@/lib/types";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function Page() {
  const [latestResult, setLatestResult] = useState<AnalysisResult | null>(null);

  return (
    <main className="min-h-screen font-sans relative text-slate-200 selection:bg-indigo-500/30">
      <AntigravityBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              JOB GUARD <span className="text-indigo-400">AI</span>
            </span>
          </motion.div>
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <motion.a whileHover={{ y: -2, color: "#fff" }} href="#" className="transition-colors">
              Analyzer
            </motion.a>
            <motion.a whileHover={{ y: -2, color: "#fff" }} href="#" className="transition-colors">
              How it Works
            </motion.a>
            <motion.a whileHover={{ y: -2, color: "#fff" }} href="#" className="transition-colors">
              Extension
            </motion.a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 pt-16 pb-24 px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-500 mb-6"
          >
            Detect Fake Jobs in Seconds
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-400 leading-relaxed"
          >
            Protect yourself from employment scams. Our AI cross-checks job
            descriptions, verifies company existence, and analyzes LinkedIn
            presence instantly.
          </motion.p>
        </div>

        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>}>
          <JobAnalyzer onResult={setLatestResult} />
        </Suspense>
        <ScanHistory newResult={latestResult} />
      </div>
    </main>
  );
}
