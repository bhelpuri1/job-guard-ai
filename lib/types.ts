export interface CompanyVerification {
  exists: boolean;
  details: string;
  linkedInFound: boolean;
  linkedInUrl?: string;
}

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
