"use client";

import { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { motion } from "motion/react";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  MapPin,
  DollarSign,
  Building2,
  Link as LinkIcon,
  Mail,
} from "lucide-react";

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
If NOT_A_JOB_POSTING, stop the analysis and return a warning.

-----------------------------------------------------

STAGE 2 — EXTRACT JOB INFORMATION
Extract the following fields if present:
jobTitle
companyName
jobLocation
salaryInformation
employmentType
requiredSkills
recruiterName
contactEmail
contactPhone
applicationMethod
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
• Output strictly valid JSON
• Never fabricate company information
• If uncertain choose Suspicious
• Always explain decisions using signals`;

export default function JobGuard() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const analyzeJob = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: input,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              validJobPosting: { type: Type.BOOLEAN },
              error: { type: Type.STRING },
              warning: { type: Type.STRING },
              instruction: { type: Type.STRING },
              extractedInformation: {
                type: Type.OBJECT,
                properties: {
                  jobTitle: { type: Type.STRING },
                  companyName: { type: Type.STRING },
                  jobLocation: { type: Type.STRING },
                  salaryInformation: { type: Type.STRING },
                  requiredSkills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  contactEmail: { type: Type.STRING },
                  companyWebsite: { type: Type.STRING },
                  jobURL: { type: Type.STRING },
                },
              },
              prediction: { type: Type.STRING },
              fraudScore: { type: Type.NUMBER },
              confidenceScore: { type: Type.NUMBER },
              domainReputation: { type: Type.STRING },
              recruiterAuthenticity: { type: Type.STRING },
              signals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    message: { type: Type.STRING },
                  },
                },
              },
              reportScam: {
                type: Type.OBJECT,
                properties: {
                  scamType: { type: Type.STRING },
                  riskLevel: { type: Type.STRING },
                  recommendedAction: { type: Type.STRING },
                  warningMessage: { type: Type.STRING },
                },
              },
              datasetLabel: { type: Type.STRING },
            },
          },
        },
      });

      if (response.text) {
        setResult(JSON.parse(response.text));
      } else {
        setError("Failed to get a valid response from the model.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-full mb-4">
          <ShieldCheck className="w-12 h-12 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          JobGuard AI
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Advanced fraud detection system designed to identify fraudulent job
          postings. Paste a job description or URL below to analyze its
          legitimacy.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <label
          htmlFor="job-input"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Job Posting Content or URL
        </label>
        <textarea
          id="job-input"
          rows={8}
          className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-4 bg-slate-50 border"
          placeholder="Paste the job description, requirements, company info, or a link to the job posting here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={analyzeJob}
            disabled={loading || !input.trim()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Analyzing...
              </>
            ) : (
              "Analyze Job Posting"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {!result.validJobPosting ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-xl font-semibold text-amber-900">
                Not a Job Posting
              </h3>
              <p className="text-amber-700">{result.warning}</p>
              <p className="text-sm text-amber-600 font-medium">
                {result.instruction}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Verdict & Scores */}
              <div className="space-y-6">
                {/* Verdict Card */}
                <div
                  className={`rounded-2xl p-6 border ${
                    result.prediction === "Genuine"
                      ? "bg-emerald-50 border-emerald-200"
                      : result.prediction === "Suspicious"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-rose-50 border-rose-200"
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    {result.prediction === "Genuine" && (
                      <ShieldCheck className="w-16 h-16 text-emerald-500" />
                    )}
                    {result.prediction === "Suspicious" && (
                      <AlertTriangle className="w-16 h-16 text-amber-500" />
                    )}
                    {result.prediction === "Scam" && (
                      <ShieldAlert className="w-16 h-16 text-rose-500" />
                    )}

                    <div>
                      <h2
                        className={`text-3xl font-bold ${
                          result.prediction === "Genuine"
                            ? "text-emerald-700"
                            : result.prediction === "Suspicious"
                              ? "text-amber-700"
                              : "text-rose-700"
                        }`}
                      >
                        {result.prediction}
                      </h2>
                      <p
                        className={`text-sm mt-1 ${
                          result.prediction === "Genuine"
                            ? "text-emerald-600"
                            : result.prediction === "Suspicious"
                              ? "text-amber-600"
                              : "text-rose-600"
                        }`}
                      >
                        Analysis Complete
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scores Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        Fraud Risk Score
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {result.fraudScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          result.fraudScore < 30
                            ? "bg-emerald-500"
                            : result.fraudScore < 60
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`}
                        style={{ width: `${result.fraudScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        AI Confidence
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {result.confidenceScore}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div
                        className="bg-indigo-500 h-2.5 rounded-full"
                        style={{ width: `${result.confidenceScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Reputation Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <h3 className="font-semibold text-slate-900 border-b pb-2">
                    Trust Indicators
                  </h3>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">
                      Domain Reputation
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        result.domainReputation === "Trusted"
                          ? "bg-emerald-100 text-emerald-800"
                          : result.domainReputation === "Suspicious"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {result.domainReputation || "Unknown"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">
                      Recruiter Profile
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        result.recruiterAuthenticity === "Authentic"
                          ? "bg-emerald-100 text-emerald-800"
                          : result.recruiterAuthenticity === "Suspicious"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {result.recruiterAuthenticity || "Unverified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Details & Signals */}
              <div className="lg:col-span-2 space-y-6">
                {/* Scam Report (if applicable) */}
                {result.reportScam && result.prediction !== "Genuine" && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-rose-900 mb-4 flex items-center">
                      <ShieldAlert className="w-5 h-5 mr-2" />
                      Scam Report: {result.reportScam.scamType}
                    </h3>
                    <div className="space-y-3">
                      <p className="text-sm text-rose-800">
                        <span className="font-semibold">Risk Level:</span>{" "}
                        {result.reportScam.riskLevel}
                      </p>
                      <p className="text-sm text-rose-800">
                        <span className="font-semibold">Warning:</span>{" "}
                        {result.reportScam.warningMessage}
                      </p>
                      <div className="mt-4 p-3 bg-rose-100 rounded-lg">
                        <p className="text-sm font-medium text-rose-900">
                          Recommended Action:{" "}
                          {result.reportScam.recommendedAction}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Signals */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Detection Signals
                  </h3>
                  <div className="space-y-3">
                    {result.signals?.map((signal: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex items-start p-3 rounded-lg border ${
                          signal.type === "positive"
                            ? "bg-emerald-50 border-emerald-100"
                            : signal.type === "warning"
                              ? "bg-amber-50 border-amber-100"
                              : "bg-rose-50 border-rose-100"
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {signal.type === "positive" && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          )}
                          {signal.type === "warning" && (
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                          )}
                          {signal.type === "negative" && (
                            <XCircle className="w-5 h-5 text-rose-500" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p
                            className={`text-sm font-medium ${
                              signal.type === "positive"
                                ? "text-emerald-800"
                                : signal.type === "warning"
                                  ? "text-amber-800"
                                  : "text-rose-800"
                            }`}
                          >
                            {signal.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extracted Info */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Extracted Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.extractedInformation?.jobTitle && (
                      <div className="flex items-start space-x-3">
                        <Briefcase className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase">
                            Job Title
                          </p>
                          <p className="text-sm text-slate-900">
                            {result.extractedInformation.jobTitle}
                          </p>
                        </div>
                      </div>
                    )}
                    {result.extractedInformation?.companyName && (
                      <div className="flex items-start space-x-3">
                        <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase">
                            Company
                          </p>
                          <p className="text-sm text-slate-900">
                            {result.extractedInformation.companyName}
                          </p>
                        </div>
                      </div>
                    )}
                    {result.extractedInformation?.jobLocation && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase">
                            Location
                          </p>
                          <p className="text-sm text-slate-900">
                            {result.extractedInformation.jobLocation}
                          </p>
                        </div>
                      </div>
                    )}
                    {result.extractedInformation?.salaryInformation && (
                      <div className="flex items-start space-x-3">
                        <DollarSign className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase">
                            Salary
                          </p>
                          <p className="text-sm text-slate-900">
                            {result.extractedInformation.salaryInformation}
                          </p>
                        </div>
                      </div>
                    )}
                    {result.extractedInformation?.companyWebsite && (
                      <div className="flex items-start space-x-3">
                        <LinkIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase">
                            Website
                          </p>
                          <p className="text-sm text-slate-900 truncate max-w-[200px]">
                            {result.extractedInformation.companyWebsite}
                          </p>
                        </div>
                      </div>
                    )}
                    {result.extractedInformation?.contactEmail && (
                      <div className="flex items-start space-x-3">
                        <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase">
                            Contact Email
                          </p>
                          <p className="text-sm text-slate-900">
                            {result.extractedInformation.contactEmail}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {result.extractedInformation?.requiredSkills &&
                    result.extractedInformation.requiredSkills.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <p className="text-xs font-medium text-slate-500 uppercase mb-2">
                          Required Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.extractedInformation.requiredSkills.map(
                            (skill: string, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
                              >
                                {skill}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
