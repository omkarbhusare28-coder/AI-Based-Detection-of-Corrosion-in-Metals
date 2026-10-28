import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Printer,
  ChevronDown,
  Info,
  Calendar,
  Sparkles,
  Layers,
  Activity,
} from 'lucide-react';
import { InspectionResult } from '../types';
import { downloadSingleInspectionPDF, openPrintableSingleReport } from '../utils/reports';

interface ResultCardProps {
  result: InspectionResult;
  onClear: () => void;
  isDetailedView?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onClear, isDetailedView = false }) => {
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const isCorroded = result.classification === 'Corroded';
  const isMetal = result.is_metal_surface;

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setDownloadMenuOpen(false);
      await downloadSingleInspectionPDF(result);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenPrintable = () => {
    setDownloadMenuOpen(false);
    openPrintableSingleReport(result);
  };

  // If AI determined it is NOT a metal surface:
  if (!isMetal) {
    return (
      <div className="w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500"></div>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Non-Metallic Surface Detected
            </h3>
            <p className="text-amber-300 font-medium text-sm leading-relaxed">
              This doesn't look like a metal surface. Please upload a clear photo of metal.
            </p>
            {result.notes && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 mt-2">
                <span className="font-semibold text-slate-300">Observation: </span>
                {result.notes}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClear}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Try Another Photo
          </button>
        </div>
      </div>
    );
  }

  // Severity indicator color badge
  const getSeverityBadge = () => {
    if (!isCorroded) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          None (Intact)
        </span>
      );
    }

    switch (result.severity) {
      case 'Severe':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Severe Corrosion
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Moderate Corrosion
          </span>
        );
      case 'Mild':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Mild Surface Oxidation
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md flex flex-col gap-6">
      {/* Top accent bar reflecting status */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          isCorroded ? 'bg-rose-500' : 'bg-emerald-500'
        }`}
      ></div>

      {/* Header section with timestamp & classification badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{new Date(result.timestamp).toLocaleString()}</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Gemini 3.8 Vision
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">Inspection Assessment</h3>
        </div>

        {/* Large Status Badge: Red for Corroded, Green for Non-corroded */}
        <div>
          {isCorroded ? (
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-400 shadow-lg shadow-rose-950/40">
              <AlertCircle className="w-6 h-6 text-rose-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider font-bold text-rose-300/80">Classification</div>
                <div className="text-xl font-black tracking-wide text-rose-300">CORRODED</div>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-300/80">Classification</div>
                <div className="text-xl font-black tracking-wide text-emerald-300">NON-CORRODED</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row: Confidence & Severity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Confidence metric with progress bar */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" /> Confidence Level
            </span>
            <span className="text-2xl font-black text-white">{result.confidence}%</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isCorroded ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, result.confidence))}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Certainty index calculated by Gemini vision model
          </p>
        </div>

        {/* Severity Indicator */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" /> Severity Level
            </span>
            {getSeverityBadge()}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mt-2 font-medium">
            {isCorroded
              ? result.severity === 'Severe'
                ? 'High-risk material degradation, pitting, or structural flaking detected.'
                : result.severity === 'Moderate'
                ? 'Noticeable granular oxide formation across localized surface zones.'
                : 'Superficial discoloration or early flash oxidation detected.'
              : 'Substrate displays clean metallic matrix with zero oxidation breakdown.'}
          </p>
        </div>
      </div>

      {/* Technical Metallurgical Notes */}
      {result.notes && (
        <div className="p-4 rounded-xl bg-slate-950/80 border-l-4 border-cyan-500 border-y border-r border-slate-800">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Metallurgical Inspection Notes
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-normal">{result.notes}</p>
        </div>
      )}

      {/* Mandatory Disclaimer Note */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0" />
        <p className="text-xs font-semibold text-amber-300/90 leading-tight">
          AI-based estimate. Not a substitute for professional inspection.
        </p>
      </div>

      {/* Action Footer: Download Report & Clear/Try Another */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
        {!isDetailedView ? (
          <button
            onClick={onClear}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Clear / Try Another
          </button>
        ) : (
          <div className="text-xs text-slate-500">Inspection ID: {result.id.slice(0, 8)}</div>
        )}

        {/* Download Report Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDownloadMenuOpen((prev) => !prev)}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-900/30 transition cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Report'}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {downloadMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setDownloadMenuOpen(false)}
              ></div>
              <div className="absolute right-0 bottom-full mb-2 w-64 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-1.5 z-30 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-700/80 text-white flex items-center gap-2.5 text-xs font-medium transition cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-semibold">PDF Document</div>
                    <div className="text-[11px] text-slate-400">Browser-generated vector certificate</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleOpenPrintable}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-700/80 text-white flex items-center gap-2.5 text-xs font-medium transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-semibold">Printable HTML Page</div>
                    <div className="text-[11px] text-slate-400">Opens in new tab with print layout</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
