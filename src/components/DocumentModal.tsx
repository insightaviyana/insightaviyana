import React from 'react';
import { X, ShieldCheck, FileText, Download, CheckCircle2, Award, Printer } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  title: string;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  documentName,
  title
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              Verified Government Document Proof
            </span>
            <h2 className="text-lg font-serif font-bold text-white mt-1">
              {title || 'Central Environmental Authority Clearance'}
            </h2>
            <p className="text-xs text-amber-300 font-mono">{documentName}</p>
          </div>
        </div>

        {/* Official Certificate Box */}
        <div className="bg-slate-950 border-2 border-amber-500/30 rounded-xl p-6 shadow-inner text-center space-y-4 relative overflow-hidden">
          {/* Watermark Logo Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Award size={200} className="text-amber-400" />
          </div>

          <div className="text-xs uppercase font-mono font-bold text-amber-400 tracking-widest">
            Democratic Socialist Republic of Sri Lanka
          </div>

          <h3 className="text-xl font-serif font-bold text-white">
            CENTRAL ENVIRONMENTAL AUTHORITY
          </h3>
          <p className="text-xs text-slate-400 font-serif italic">
            Environmental Impact Assessment (EIA) Certificate of Approval
          </p>

          <div className="py-4 my-2 border-y border-amber-500/20 text-xs text-slate-300 space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">Approval Reference:</span>
              <span className="font-mono text-amber-300 font-bold">CEA/7S/LK-2025-089</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Project Entity:</span>
              <span className="font-bold text-white">AVIYANA CEYLON RESORT LTD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Compliance Rating:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> 100% Fully Compliant
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Opening:</span>
              <span className="font-mono text-amber-300">August 2026</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-200 text-left">
            <strong>Official Verification Notice:</strong> This document serves as legal proof that all environmental, land, and community protection guidelines have been strictly met without forest reserve encroachment or water disruption.
          </div>

          <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Verified Seal ID: #AV-7S-2026</span>
            <span>Digital Signature: Verified OK</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-medium flex items-center space-x-1.5"
          >
            <Printer size={14} />
            <span>Print Document</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md hover:from-amber-400"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
