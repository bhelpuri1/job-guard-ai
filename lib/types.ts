export interface CompanyVerification {
  exists: boolean;
  details: string;
  linkedInFound: boolean;
  linkedInUrl?: string;
}

// Legacy type kept for ScanHistory compatibility
export interface AnalysisResult {
  id?: string;
  timestamp?: number;
  jobTitle?: string;
  companyName?: string;
  verdict: 'Real' | 'Fake' | 'Suspicious' | 'Invalid';
  confidenceScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  redFlags: string[];
  positiveSignals: string[];
  explanation: string;
  companyVerification: CompanyVerification;
}

// Signal from the AI analysis
export interface AnalysisSignal {
  type: 'positive' | 'warning' | 'negative';
  message: string;
}

// Scam report details
export interface ScamReport {
  scamType: string;
  riskLevel: string;
  recommendedAction: string;
  warningMessage: string;
}

// Extracted job information
export interface ExtractedInformation {
  jobTitle: string | null;
  companyName: string | null;
  jobLocation: string | null;
  salaryInformation: string | null;
  requiredSkills: string[] | null;
  contactEmail: string | null;
  companyWebsite: string | null;
  jobURL: string | null;
}

// Rich analysis result from the structured 11-stage prompt
export interface JobGuardResult {
  id?: string;
  timestamp?: number;
  validJobPosting: boolean;
  error: string | null;
  warning: string | null;
  instruction: string | null;
  extractedInformation: ExtractedInformation;
  prediction: 'Genuine' | 'Suspicious' | 'Scam';
  fraudScore: number;
  confidenceScore: number;
  domainReputation: 'Trusted' | 'Unknown' | 'Suspicious';
  recruiterAuthenticity: 'Authentic' | 'Unverified' | 'Suspicious';
  signals: AnalysisSignal[];
  reportScam: ScamReport | null;
  datasetLabel: 'legitimate_job' | 'suspicious_job' | 'fraudulent_job';
}
