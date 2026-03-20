'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Loader2, Link as LinkIcon, Building2, CheckCircle2, XCircle, Copy, Check, Search } from 'lucide-react';
import { AnalysisResult } from '@/lib/types';

const LOADING_STEPS = [
  "Parsing job description...",
  "Running cross-checks on company...",
  "Scanning LinkedIn presence...",
  "Evaluating risk factors...",
  "Finalizing verdict..."
];

export default function JobAnalyzer({ onResult }: { onResult: (res: AnalysisResult) => void }) {
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const jobParam = searchParams.get('job');
    if (jobParam) {
      setInput(jobParam);
    }
  }, [searchParams]);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const systemInstruction = `You are the core AI Decision Engine for JOB GUARD AI, a startup that detects fake job and internship postings.
Your task is to analyze the provided job posting text or URL.

CRITICAL INSTRUCTIONS:
0. FIRST, verify if the input is actually a job posting. If the text is clearly NOT a job posting (e.g., a random article, a question, a recipe, conversational text, or just a company name without a job description), you MUST set the verdict to 'Invalid', confidenceScore to 0, riskLevel to 'Low', and explain in the explanation field that the input does not appear to be a valid job posting. Set jobTitle and companyName to 'N/A'.
1. Use your knowledge to verify if the company actually exists in the real world.
2. Use your knowledge to cross-check if the company has a legitimate LinkedIn presence.
3. Analyze the job description for common scam patterns (e.g., asking for money, vague details, unrealistic salary, suspicious emails).
4. Combine the job content analysis, company verification, and LinkedIn data to make a final decision.
5. Return a structured JSON response matching the required schema.

Extract the job title and company name from the posting to include in the response. If you cannot find them, use "Unknown".

You MUST respond with ONLY a valid JSON object matching this exact schema:
{
  "jobTitle": string (extracted job title),
  "companyName": string (extracted company name),
  "verdict": "Real" | "Fake" | "Suspicious" | "Invalid",
  "confidenceScore": number (0-100),
  "riskLevel": "Low" | "Medium" | "High",
  "redFlags": [string] (list of suspicious indicators),
  "positiveSignals": [string] (list of legitimate indicators),
  "explanation": string (detailed explanation of verdict),
  "companyVerification": {
    "exists": boolean,
    "details": string,
    "linkedInFound": boolean,
    "linkedInUrl": string or null
  }
}`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
          "X-Title": "JobGuard AI",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: `Please analyze this job posting:\n\n${input}` },
          ],
          response_format: { type: "json_object" },
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || `API error: ${response.status}`);
      }

      const apiData = await response.json();
      let rawText = apiData.choices?.[0]?.message?.content;

      if (!rawText) {
        throw new Error('No response from AI');
      }

      // Clean up potential markdown formatting from the response
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        rawText = jsonMatch[1];
      } else {
        // Fallback: try to find the first '{' and last '}'
        const firstBrace = rawText.indexOf('{');
        const lastBrace = rawText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          rawText = rawText.substring(firstBrace, lastBrace + 1);
        }
      }

      rawText = rawText.trim();
      
      if (!rawText) {
        throw new Error('AI returned an empty response after cleaning.');
      }

      let data: AnalysisResult;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error("Failed to parse JSON. Raw text was:", rawText);
        if (rawText && !rawText.trim().endsWith('}')) {
          throw new Error('The AI response was incomplete. Please try analyzing the job again.');
        }
        throw new Error('Failed to parse AI response as JSON.');
      }
      
      data.id = Math.random().toString(36).substring(7);
      data.timestamp = Date.now();
      
      setResult(data);
      onResult(data);
    } catch (err: any) {
      console.error('Analysis Error:', err);
      
      const errorMessage = err?.message || '';
      
      if (
        errorMessage.includes('429') || 
        errorMessage.includes('quota') ||
        errorMessage.includes('rate limit')
      ) {
        setError('API Rate Limit: The AI service has reached its usage limit. Please try again in a moment.');
      } else {
        setError(errorMessage || 'Failed to analyze job. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `JOB GUARD AI VERDICT: ${result.verdict}
Confidence: ${result.confidenceScore}%
Risk Level: ${result.riskLevel}
Company Verified: ${result.companyVerification.exists ? 'Yes' : 'No'}
LinkedIn Found: ${result.companyVerification.linkedInFound ? 'Yes' : 'No'}

Explanation: ${result.explanation}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Input Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white tracking-tight">AI Job Analyzer</h2>
            <p className="text-slate-400 text-sm">Paste a job description or URL to detect fraud</p>
          </div>
        </div>

        <motion.textarea
          whileFocus={{ scale: 1.01 }}
          rows={6}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste job posting text or URL here..."
          className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all resize-none"
        />

        <div className="mt-6 flex justify-between items-center">
          <div className="flex space-x-4 text-sm text-slate-400">
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400/70" /> LLM Analysis</span>
            <span className="flex items-center"><Building2 className="w-4 h-4 mr-1 text-indigo-400/70" /> Company Check</span>
            <span className="flex items-center"><LinkIcon className="w-4 h-4 mr-1 text-blue-400/70" /> LinkedIn Cross-Check</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="relative overflow-hidden group bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center">
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Scanning...</>
              ) : (
                'Analyze Job'
              )}
            </span>
            {/* Hover effect */}
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient"></div>
          </motion.button>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center text-rose-400">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Loading State */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading-state"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full bg-white/5 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-12 shadow-2xl flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden"
          >
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full animate-pulse"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="bg-indigo-500/20 p-4 rounded-2xl border border-indigo-500/40 relative">
                  <Search className="w-10 h-10 text-indigo-400 animate-pulse" />
                </div>
              </div>
              
              <h3 className="text-2xl font-semibold text-white mb-2">Analyzing Job Posting</h3>
              
              <div className="h-6 overflow-hidden relative w-full max-w-sm text-center mb-8">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-indigo-300 text-sm absolute w-full font-medium"
                  >
                    {LOADING_STEPS[loadingStep]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-sm bg-black/40 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Dashboard */}
      {!loading && result && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Verdict Card */}
          <div className={`lg:col-span-1 rounded-3xl p-8 border backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden ${
            result.verdict === 'Real' ? 'bg-emerald-500/10 border-emerald-500/20' :
            result.verdict === 'Suspicious' ? 'bg-amber-500/10 border-amber-500/20' :
            result.verdict === 'Invalid' ? 'bg-slate-500/10 border-slate-500/20' :
            'bg-rose-500/10 border-rose-500/20'
          }`}>
            {/* Background glow */}
            <div className={`absolute inset-0 blur-3xl opacity-20 ${
              result.verdict === 'Real' ? 'bg-emerald-500' :
              result.verdict === 'Suspicious' ? 'bg-amber-500' :
              result.verdict === 'Invalid' ? 'bg-slate-500' :
              'bg-rose-500'
            }`}></div>

            <div className="relative z-10">
              {result.verdict === 'Real' && <ShieldCheck className="w-20 h-20 text-emerald-400 mx-auto mb-4" />}
              {result.verdict === 'Suspicious' && <AlertTriangle className="w-20 h-20 text-amber-400 mx-auto mb-4" />}
              {result.verdict === 'Fake' && <ShieldAlert className="w-20 h-20 text-rose-400 mx-auto mb-4" />}
              {result.verdict === 'Invalid' && <AlertTriangle className="w-20 h-20 text-slate-400 mx-auto mb-4" />}
              
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Verdict</h3>
              <h2 className={`text-4xl font-bold mb-6 ${
                result.verdict === 'Real' ? 'text-emerald-400' :
                result.verdict === 'Suspicious' ? 'text-amber-400' :
                result.verdict === 'Invalid' ? 'text-slate-400' :
                'text-rose-400'
              }`}>{result.verdict}</h2>

              <div className="w-full space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Trust Score</span>
                    <span className="text-white font-bold">{result.confidenceScore}%</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidenceScore}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        result.confidenceScore > 80 ? 'bg-emerald-500' :
                        result.confidenceScore > 40 ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopy}
                className="mt-8 flex items-center justify-center w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors"
              >
                {copied ? <><Check className="w-4 h-4 mr-2 text-emerald-400" /> Copied Report</> : <><Copy className="w-4 h-4 mr-2" /> Share Result</>}
              </motion.button>
            </div>
          </div>

          {/* Details & Verification */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Verification */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-indigo-400" />
                Company Verification
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <p className="text-sm text-slate-400 mb-1">Company Exists</p>
                  <div className="flex items-center">
                    {result.companyVerification.exists ? 
                      <><CheckCircle2 className="w-5 h-5 text-emerald-400 mr-2" /> <span className="text-white font-medium">Verified</span></> : 
                      <><XCircle className="w-5 h-5 text-rose-400 mr-2" /> <span className="text-white font-medium">Not Found</span></>
                    }
                  </div>
                </div>
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                  <p className="text-sm text-slate-400 mb-1">LinkedIn Presence</p>
                  <div className="flex items-center">
                    {result.companyVerification.linkedInFound ? 
                      <><CheckCircle2 className="w-5 h-5 text-blue-400 mr-2" /> <span className="text-white font-medium">Verified</span></> : 
                      <><XCircle className="w-5 h-5 text-rose-400 mr-2" /> <span className="text-white font-medium">Missing/Suspicious</span></>
                    }
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-300 bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 leading-relaxed">
                {result.companyVerification.details}
              </p>
            </motion.div>

            {/* Analysis Details */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-white mb-4">AI Analysis</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {result.explanation}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Red Flags */}
                {result.redFlags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-rose-400 mb-3 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" /> Red Flags Detected
                    </h4>
                    <ul className="space-y-2">
                      {result.redFlags.map((flag, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start">
                          <span className="text-rose-500 mr-2 mt-0.5">•</span>
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Positive Signals */}
                {result.positiveSignals.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Positive Signals
                    </h4>
                    <ul className="space-y-2">
                      {result.positiveSignals.map((signal, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start">
                          <span className="text-emerald-500 mr-2 mt-0.5">•</span>
                          {signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
