'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, AlertTriangle, ShieldAlert, Loader2, Link as LinkIcon,
  Building2, CheckCircle2, XCircle, Copy, Check, Search, Briefcase,
  MapPin, DollarSign, Mail, AlertCircle
} from 'lucide-react';
import { AnalysisResult, JobGuardResult } from '@/lib/types';

const LOADING_STEPS = [
  "Parsing job description...",
  "Running cross-checks on company...",
  "Scanning LinkedIn presence...",
  "Evaluating risk factors...",
  "Calculating fraud score...",
  "Finalizing verdict..."
];

const SYSTEM_INSTRUCTION = `You are "JobGuard AI", an advanced fraud detection system designed to identify fraudulent job postings.

The user may provide:
• a job posting text
• a job URL
• extracted job information from a webpage

Your goal is to analyze the content and determine whether the job posting is legitimate, suspicious, or a scam.

Follow the structured analysis pipeline below.

-----------------------------------------------------

STAGE 1 — INPUT VALIDATION
Determine if the provided content represents a job or internship posting.
A valid job posting should include at least TWO of the following:
• job title
• company name
• job responsibilities
• required skills
• salary or compensation
• job location
• application instructions
• recruiter contact information

If the content does not resemble a job listing, classify as:
NOT_A_JOB_POSTING
If NOT_A_JOB_POSTING, set validJobPosting to false, set prediction to "Suspicious", fraudScore to 0, confidenceScore to 0, and provide a warning and instruction explaining that the input does not appear to be a valid job posting.

-----------------------------------------------------

STAGE 2 — EXTRACT JOB INFORMATION
Extract the following fields if present:
jobTitle
companyName
jobLocation
salaryInformation
requiredSkills (array of strings)
contactEmail
companyWebsite
jobURL

Return null if information is missing.

-----------------------------------------------------

STAGE 3 — DOMAIN & WEBSITE ANALYSIS
If a job URL or company website is provided, evaluate the domain credibility.
Indicators of suspicious domains:
• recently created domains
• domains unrelated to company name
• misspelled domains
• free website builders
• random characters in domain name

Classify domain reputation:
Trusted
Unknown
Suspicious

-----------------------------------------------------

STAGE 4 — RECRUITER AUTHENTICITY CHECK
Evaluate recruiter credibility.
Positive signals:
• recruiter email uses company domain
• recruiter name is provided
• interview process mentioned
• official company career page

Negative signals:
• recruiter uses personal email (gmail, yahoo, outlook)
• recruiter communicates only via WhatsApp or Telegram
• recruiter requests payment
• recruiter promises guaranteed income
• recruiter avoids interview process

Classify recruiter authenticity:
Authentic
Unverified
Suspicious

-----------------------------------------------------

STAGE 5 — SCAM PATTERN DETECTION
Identify patterns commonly found in job scams.
HIGH RISK SIGNALS (+30 risk each)
• registration fee required
• training fee before hiring
• payment before interview
• guaranteed income promises
• extremely high salary for simple tasks
• remote job with no experience required

MEDIUM RISK SIGNALS (+15 risk each)
• vague job description
• missing company information
• suspicious domain
• no interview process mentioned
• incomplete recruiter details

POSITIVE SIGNALS (-10 risk each)
• verified company website
• detailed job description
• structured hiring process
• professional recruiter contact
• company presence on professional platforms

-----------------------------------------------------

STAGE 6 — FRAUD RISK CALCULATION
Start with:
fraudScore = 0
Add risk points from scam indicators.
Subtract points for positive signals.
Clamp fraudScore between 0 and 100.

-----------------------------------------------------

STAGE 7 — CLASSIFICATION
Based on fraudScore:
0–30 → Genuine  
31–60 → Suspicious  
61–100 → Scam  
If signals conflict choose Suspicious.

-----------------------------------------------------

STAGE 8 — CONFIDENCE SCORE
Generate a confidence score between 0 and 100.
Confidence increases with:
• clear company information
• detailed job description
• multiple signals detected
Confidence decreases with:
• missing information
• ambiguous signals

-----------------------------------------------------

STAGE 9 — SIGNAL EXPLANATION
Provide at least FOUR signals explaining the analysis.
Each signal must contain:
type: positive | warning | negative  
message: explanation

-----------------------------------------------------

STAGE 10 — SCAM REPORT GENERATION
If classification is Suspicious or Scam generate a scam report.
Possible scam types:
Fake Internship  
Advance Fee Scam  
Fake Recruiter Scam  
Identity Theft Job  
Data Harvesting Job  
Pyramid Scheme Job  

-----------------------------------------------------

STAGE 11 — DATASET LABEL
Label the job for machine learning training.
Values:
legitimate_job  
suspicious_job  
fraudulent_job  

-----------------------------------------------------

CRITICAL RULES
• Output strictly valid JSON matching the schema below
• Never fabricate company information
• If uncertain choose Suspicious
• Always explain decisions using signals
• Be consistent: the SAME input should always produce the SAME analysis. Follow the scoring rules exactly.

You MUST respond with ONLY a valid JSON object matching this exact schema:
{
  "validJobPosting": boolean,
  "error": string or null,
  "warning": string or null,
  "instruction": string or null,
  "extractedInformation": {
    "jobTitle": string or null,
    "companyName": string or null,
    "jobLocation": string or null,
    "salaryInformation": string or null,
    "requiredSkills": [string] or null,
    "contactEmail": string or null,
    "companyWebsite": string or null,
    "jobURL": string or null
  },
  "prediction": "Genuine" | "Suspicious" | "Scam",
  "fraudScore": number (0-100),
  "confidenceScore": number (0-100),
  "domainReputation": "Trusted" | "Unknown" | "Suspicious",
  "recruiterAuthenticity": "Authentic" | "Unverified" | "Suspicious",
  "signals": [{ "type": "positive" | "warning" | "negative", "message": string }],
  "reportScam": { "scamType": string, "riskLevel": string, "recommendedAction": string, "warningMessage": string } or null,
  "datasetLabel": "legitimate_job" | "suspicious_job" | "fraudulent_job"
}`;

// Convert JobGuardResult to legacy AnalysisResult for ScanHistory
function toAnalysisResult(r: JobGuardResult): AnalysisResult {
  let verdict: AnalysisResult['verdict'];
  if (!r.validJobPosting) {
    verdict = 'Invalid';
  } else if (r.prediction === 'Genuine') {
    verdict = 'Real';
  } else if (r.prediction === 'Suspicious') {
    verdict = 'Suspicious';
  } else {
    verdict = 'Fake';
  }

  const redFlags = r.signals
    .filter(s => s.type === 'negative' || s.type === 'warning')
    .map(s => s.message);
  const positiveSignals = r.signals
    .filter(s => s.type === 'positive')
    .map(s => s.message);

  let riskLevel: AnalysisResult['riskLevel'];
  if (r.fraudScore <= 30) riskLevel = 'Low';
  else if (r.fraudScore <= 60) riskLevel = 'Medium';
  else riskLevel = 'High';

  return {
    id: r.id,
    timestamp: r.timestamp,
    jobTitle: r.extractedInformation.jobTitle || 'Unknown',
    companyName: r.extractedInformation.companyName || 'Unknown',
    verdict,
    confidenceScore: r.confidenceScore,
    riskLevel,
    redFlags,
    positiveSignals,
    explanation: r.signals.map(s => s.message).join(' '),
    companyVerification: {
      exists: r.domainReputation === 'Trusted',
      details: r.signals.find(s => s.message.toLowerCase().includes('company'))?.message || '',
      linkedInFound: r.domainReputation === 'Trusted',
    },
  };
}

export default function JobAnalyzer({ onResult }: { onResult: (res: AnalysisResult) => void }) {
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<JobGuardResult | null>(null);
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
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: `Analyze this job posting:\n\n${input}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
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

      let data: JobGuardResult;
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
      onResult(toAnalysisResult(data));
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
    const text = `JOB GUARD AI ANALYSIS
Prediction: ${result.prediction}
Fraud Score: ${result.fraudScore}/100
Confidence: ${result.confidenceScore}%
Domain Reputation: ${result.domainReputation}
Recruiter Authenticity: ${result.recruiterAuthenticity}

Signals:
${result.signals.map(s => `[${s.type.toUpperCase()}] ${s.message}`).join('\n')}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const predictionColor = (pred: string) => {
    if (pred === 'Genuine') return { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/20', bgCard: 'bg-emerald-500/10' };
    if (pred === 'Suspicious') return { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/20', bgCard: 'bg-amber-500/10' };
    return { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500/20', bgCard: 'bg-rose-500/10' };
  };

  return (
    <div id="analyzer" className="w-full max-w-5xl mx-auto space-y-8">
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
            <span className="flex items-center"><LinkIcon className="w-4 h-4 mr-1 text-blue-400/70" /> Domain Scan</span>
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
          className="space-y-6"
        >
          {/* Not a job posting warning */}
          {!result.validJobPosting ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8 text-center space-y-4">
              <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto" />
              <h3 className="text-2xl font-semibold text-amber-300">Not a Job Posting</h3>
              <p className="text-amber-200/80">{result.warning}</p>
              <p className="text-sm text-amber-200/60 font-medium">{result.instruction}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Verdict Card */}
              <div className={`lg:col-span-1 rounded-3xl p-8 border backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden ${predictionColor(result.prediction).bgCard} ${predictionColor(result.prediction).border}`}>
                <div className={`absolute inset-0 blur-3xl opacity-20 ${predictionColor(result.prediction).bg}`}></div>

                <div className="relative z-10">
                  {result.prediction === 'Genuine' && <ShieldCheck className="w-20 h-20 text-emerald-400 mx-auto mb-4" />}
                  {result.prediction === 'Suspicious' && <AlertTriangle className="w-20 h-20 text-amber-400 mx-auto mb-4" />}
                  {result.prediction === 'Scam' && <ShieldAlert className="w-20 h-20 text-rose-400 mx-auto mb-4" />}
                  
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Verdict</h3>
                  <h2 className={`text-4xl font-bold mb-6 ${predictionColor(result.prediction).text}`}>
                    {result.prediction}
                  </h2>

                  <div className="w-full space-y-4">
                    {/* Fraud Score */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">Fraud Score</span>
                        <span className="text-white font-bold">{result.fraudScore}/100</span>
                      </div>
                      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.fraudScore}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            result.fraudScore <= 30 ? 'bg-emerald-500' :
                            result.fraudScore <= 60 ? 'bg-amber-500' :
                            'bg-rose-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Confidence */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">AI Confidence</span>
                        <span className="text-white font-bold">{result.confidenceScore}%</span>
                      </div>
                      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidenceScore}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                          className="h-full rounded-full bg-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trust Indicators */}
                  <div className="w-full mt-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Domain</span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        result.domainReputation === 'Trusted' ? 'bg-emerald-500/20 text-emerald-300' :
                        result.domainReputation === 'Suspicious' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-slate-500/20 text-slate-300'
                      }`}>
                        {result.domainReputation}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Recruiter</span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        result.recruiterAuthenticity === 'Authentic' ? 'bg-emerald-500/20 text-emerald-300' :
                        result.recruiterAuthenticity === 'Suspicious' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-slate-500/20 text-slate-300'
                      }`}>
                        {result.recruiterAuthenticity}
                      </span>
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

              {/* Details & Signals */}
              <div className="lg:col-span-2 space-y-6">
                {/* Scam Report */}
                {result.reportScam && result.prediction !== 'Genuine' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-rose-500/10 backdrop-blur-xl border border-rose-500/20 rounded-3xl p-6 shadow-xl"
                  >
                    <h3 className="text-lg font-semibold text-rose-300 mb-4 flex items-center">
                      <ShieldAlert className="w-5 h-5 mr-2" />
                      Scam Report: {result.reportScam.scamType}
                    </h3>
                    <div className="space-y-3">
                      <p className="text-sm text-rose-200/80">
                        <span className="font-semibold text-rose-300">Risk Level:</span>{" "}
                        {result.reportScam.riskLevel}
                      </p>
                      <p className="text-sm text-rose-200/80">
                        <span className="font-semibold text-rose-300">Warning:</span>{" "}
                        {result.reportScam.warningMessage}
                      </p>
                      <div className="mt-4 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                        <p className="text-sm font-medium text-rose-200">
                          Recommended: {result.reportScam.recommendedAction}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Detection Signals */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Detection Signals</h3>
                  <div className="space-y-3">
                    {result.signals?.map((signal, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start p-3 rounded-xl border ${
                          signal.type === 'positive'
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : signal.type === 'warning'
                              ? 'bg-amber-500/10 border-amber-500/20'
                              : 'bg-rose-500/10 border-rose-500/20'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {signal.type === 'positive' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                          {signal.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                          {signal.type === 'negative' && <XCircle className="w-5 h-5 text-rose-400" />}
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${
                            signal.type === 'positive' ? 'text-emerald-300' :
                            signal.type === 'warning' ? 'text-amber-300' :
                            'text-rose-300'
                          }`}>
                            {signal.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Extracted Information */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Extracted Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.extractedInformation?.jobTitle && (
                      <div className="flex items-start space-x-3 bg-black/20 rounded-2xl p-4 border border-white/5">
                        <Briefcase className="w-5 h-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase">Job Title</p>
                          <p className="text-sm text-white">{result.extractedInformation.jobTitle}</p>
                        </div>
                      </div>
                    )}
                    {result.extractedInformation?.companyName && (
                      <div className="flex items-start space-x-3 bg-black/20 rounded-2xl p-4 border border-white/5">
                        <Building2 className="w-5 h-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase">Company</p>
                          <p className="text-sm text-white">{result.extractedInformation.companyName}</p>
                        </div>
                      </div>
                    )}
                    {result.extractedInformation?.jobLocation && (
                      <div className="flex items-start space-x-3 bg-black/20 rounded-2xl p-4 border border-white/5">
                        <MapPin className="w-5 h-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase">Location</p>
                          <p className="text-sm text-white">{result.extractedInformation.jobLocation}</p>
                        </div>
                      </div>
                    )}
                    {result.extractedInformation?.salaryInformation && (
                      <div className="flex items-start space-x-3 bg-black/20 rounded-2xl p-4 border border-white/5">
                        <DollarSign className="w-5 h-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase">Salary</p>
                          <p className="text-sm text-white">{result.extractedInformation.salaryInformation}</p>
                        </div>
                      </div>
                    )}
                    {result.extractedInformation?.companyWebsite && (
                      <div className="flex items-start space-x-3 bg-black/20 rounded-2xl p-4 border border-white/5">
                        <LinkIcon className="w-5 h-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase">Website</p>
                          <p className="text-sm text-white truncate max-w-[200px]">{result.extractedInformation.companyWebsite}</p>
                        </div>
                      </div>
                    )}
                    {result.extractedInformation?.contactEmail && (
                      <div className="flex items-start space-x-3 bg-black/20 rounded-2xl p-4 border border-white/5">
                        <Mail className="w-5 h-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase">Contact Email</p>
                          <p className="text-sm text-white">{result.extractedInformation.contactEmail}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {result.extractedInformation?.requiredSkills &&
                    result.extractedInformation.requiredSkills.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-xs font-medium text-slate-400 uppercase mb-3">Required Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {result.extractedInformation.requiredSkills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
