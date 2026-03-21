"use client";

import { useState, Suspense } from "react";
import { motion } from "motion/react";
import AntigravityBackground from "@/components/AntigravityBackground";
import JobAnalyzer from "@/components/JobAnalyzer";
import ScanHistory from "@/components/ScanHistory";
import { AnalysisResult } from "@/lib/types";
import { ShieldCheck, Loader2, FileSearch, Brain, CheckCircle2 } from "lucide-react";

export default function Page() {
  const [latestResult, setLatestResult] = useState<AnalysisResult | null>(null);

  return (
    <main className="min-h-screen font-sans relative text-slate-200 selection:bg-indigo-500/30">
      <AntigravityBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.a 
            href="#"
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
          </motion.a>
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <motion.a whileHover={{ y: -2, color: "#fff" }} href="#analyzer" className="transition-colors">
              Analyzer
            </motion.a>
            <motion.a whileHover={{ y: -2, color: "#fff" }} href="#how-it-works" className="transition-colors">
              How it Works
            </motion.a>
            <motion.a whileHover={{ y: -2, color: "#fff" }} href="#history" className="transition-colors">
              History
            </motion.a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 pt-16 pb-24 px-6">
        {/* Hero */}
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
            Protect yourself from employment scams. Our AI analyzes job
            descriptions, verifies company existence, checks recruiter
            authenticity, and calculates fraud risk scores instantly.
          </motion.p>
        </div>

        {/* Job Analyzer */}
        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>}>
          <JobAnalyzer onResult={setLatestResult} />
        </Suspense>

        {/* How it Works */}
        <section id="how-it-works" className="w-full max-w-5xl mx-auto mt-24 mb-12 scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              How it Works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Our 11-stage AI pipeline analyzes every aspect of a job posting to protect you from scams.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden group hover:border-indigo-500/30 transition-colors"
            >
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 flex items-center justify-center">
                  <FileSearch className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-widest">Step 1</div>
                <h3 className="text-xl font-semibold text-white mb-3">Paste Job Posting</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Copy and paste the job description, URL, or recruiter message into the analyzer. We accept any format.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden group hover:border-violet-500/30 transition-colors"
            >
              <div className="absolute inset-0 bg-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 bg-violet-500/20 rounded-2xl border border-violet-500/30 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-violet-400" />
                </div>
                <div className="text-xs font-bold text-violet-400 mb-2 uppercase tracking-widest">Step 2</div>
                <h3 className="text-xl font-semibold text-white mb-3">AI Analysis</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Our AI runs 11 detection stages: input validation, company verification, domain analysis, recruiter checks, and scam pattern scoring.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden group hover:border-emerald-500/30 transition-colors"
            >
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-widest">Step 3</div>
                <h3 className="text-xl font-semibold text-white mb-3">Get Your Verdict</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Receive a detailed report with fraud score, confidence level, detection signals, and actionable recommendations to stay safe.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Scan History */}
        <div id="history" className="scroll-mt-24">
          <ScanHistory newResult={latestResult} />
        </div>
      </div>
    </main>
  );
}
