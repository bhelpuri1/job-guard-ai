'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AnalysisResult } from '@/lib/types';
import { Clock, ShieldCheck, AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';

export default function ScanHistory({ newResult }: { newResult: AnalysisResult | null }) {
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('jobguard_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history');
      }
    }
  }, []);

  // Update history when newResult changes
  useEffect(() => {
    if (newResult && newResult.id) {
      setTimeout(() => {
        setHistory(prev => {
          // Prevent duplicates if same ID
          if (prev.some(item => item.id === newResult.id)) return prev;
          
          const updated = [newResult, ...prev].slice(0, 10); // Keep last 10
          localStorage.setItem('jobguard_history', JSON.stringify(updated));
          return updated;
        });
      }, 0);
    }
  }, [newResult]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('jobguard_history');
  };

  if (!mounted || history.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-12">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-indigo-400" />
          Recent Scans
        </h3>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearHistory}
          className="text-sm text-slate-400 hover:text-rose-400 flex items-center transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Clear
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item, idx) => (
          <motion.div
            key={item.id || idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            transition={{ delay: idx * 0.1, duration: 0.2 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 transition-colors cursor-default"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                {item.verdict === 'Real' && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                {item.verdict === 'Suspicious' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {item.verdict === 'Fake' && <ShieldAlert className="w-5 h-5 text-rose-400" />}
                <span className={`font-medium ${
                  item.verdict === 'Real' ? 'text-emerald-400' :
                  item.verdict === 'Suspicious' ? 'text-amber-400' :
                  'text-rose-400'
                }`}>{item.verdict}</span>
              </div>
              <span className="text-xs text-slate-500">
                {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Just now'}
              </span>
            </div>
            
            <h4 className="text-white font-medium truncate mb-1">
              {item.jobTitle || 'Unknown Role'}
            </h4>
            <p className="text-slate-400 text-sm truncate mb-4">
              {item.companyName || 'Unknown Company'}
            </p>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Confidence</span>
              <span className="text-white font-medium">{item.confidenceScore}%</span>
            </div>
            <div className="h-1.5 w-full bg-black/40 rounded-full mt-1 overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  item.confidenceScore > 80 ? 'bg-emerald-500' :
                  item.confidenceScore > 40 ? 'bg-amber-500' :
                  'bg-rose-500'
                }`}
                style={{ width: `${item.confidenceScore}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
