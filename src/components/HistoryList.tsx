import React, { useState } from 'react';
import {
  Trash2,
  FileDown,
  Printer,
  ChevronDown,
  Clock,
  Eye,
  AlertCircle,
  CheckCircle2,
  Layers,
  X,
  History as HistoryIcon,
  Filter,
} from 'lucide-react';
import { InspectionResult } from '../types';
import { ResultCard } from './ResultCard';
import { downloadFullHistoryPDF, openPrintableFullHistoryReport } from '../utils/reports';

interface HistoryListProps {
  history: InspectionResult[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onSwitchToAnalyze: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onDelete,
  onClearAll,
  onSwitchToAnalyze,
}) => {
  const [selectedItem, setSelectedItem] = useState<InspectionResult | null>(null);
  const [filter, setFilter] = useState<'All' | 'Corroded' | 'Non-corroded'>('All');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [historyReportMenuOpen, setHistoryReportMenuOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const filteredHistory = history.filter((item) => {
    if (filter === 'All') return true;
    return item.classification === filter;
  });

  const handleDownloadFullPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setHistoryReportMenuOpen(false);
      await downloadFullHistoryPDF(history);
    } catch (err) {
      console.error('Failed to generate full history PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenPrintableHistory = () => {
    setHistoryReportMenuOpen(false);
    openPrintableFullHistoryReport(history);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-cyan-400">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Inspection History Log
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                {history.length} / 20
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Cached locally in browser storage with automated thumbnail compression
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('All')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                filter === 'All' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setFilter('Corroded')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                filter === 'Corroded'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Corroded ({history.filter((h) => h.classification === 'Corroded').length})
            </button>
            <button
              onClick={() => setFilter('Non-corroded')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                filter === 'Non-corroded'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Non-Corroded ({history.filter((h) => h.classification === 'Non-corroded').length})
            </button>
          </div>

          {/* Download Full History Report Button */}
          {history.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setHistoryReportMenuOpen((prev) => !prev)}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                <FileDown className="w-4 h-4 text-cyan-400" />
                <span>{isGeneratingPdf ? 'Generating...' : 'Full History Report'}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {historyReportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setHistoryReportMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-1.5 z-30 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={handleDownloadFullPdf}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/80 text-white flex items-center gap-2.5 text-xs font-medium cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="font-semibold">Full Audit PDF</div>
                        <div className="text-[10px] text-slate-400">All 20 records in formatted document</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenPrintableHistory}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/80 text-white flex items-center gap-2.5 text-xs font-medium cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-semibold">Printable Summary Log</div>
                        <div className="text-[10px] text-slate-400">Opens in tab with browser print button</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Clear All History Button */}
          {history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700 hover:border-rose-900 transition text-xs font-medium cursor-pointer"
              title="Clear all inspection history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <div className="w-full py-16 px-6 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-500 mb-4">
            <HistoryIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-200 mb-1">No Past Inspections Recorded</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
            Your analyzed metal photographs and metallurgical AI classifications will appear here automatically.
          </p>
          <button
            onClick={onSwitchToAnalyze}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-900/20 transition cursor-pointer"
          >
            Start First Inspection
          </button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="w-full py-12 px-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400">
          <p className="text-sm font-medium">No results match the current filter "{filter}".</p>
          <button
            onClick={() => setFilter('All')}
            className="mt-3 text-xs text-cyan-400 hover:underline cursor-pointer"
          >
            Show All Entries
          </button>
        </div>
      ) : (
        /* History Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHistory.map((item) => {
            const isCorroded = item.classification === 'Corroded';
            return (
              <div
                key={item.id}
                className="group relative rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-cyan-950/20"
              >
                {/* Status indicator bar */}
                <div
                  className={`absolute top-0 left-4 right-4 h-1 rounded-b-sm ${
                    isCorroded ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                ></div>

                <div>
                  {/* Thumbnail & Badges */}
                  <div className="relative w-full aspect-16/10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-3">
                    <img
                      src={item.thumbnailUrl || item.imageUrl}
                      alt="Metal Surface Thumbnail"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Classification pill on thumbnail */}
                    <div className="absolute top-2 left-2">
                      {isCorroded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-950/90 text-rose-300 border border-rose-500/50 backdrop-blur-md">
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          CORRODED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 backdrop-blur-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          NON-CORRODED
                        </span>
                      )}
                    </div>

                    {/* Confidence tag on thumbnail */}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 text-white backdrop-blur-md border border-slate-700">
                        {item.confidence}%
                      </span>
                    </div>
                  </div>

                  {/* Date and Details */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(item.timestamp).toLocaleDateString()}{' '}
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Severity chip if corroded */}
                    {isCorroded ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-orange-400 border border-orange-500/30">
                        {item.severity}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-emerald-400">Clean</span>
                    )}
                  </div>

                  {/* Notes snippet */}
                  {item.notes && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View Details</span>
                  </button>

                  <button
                    onClick={() => setItemToDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                    title="Delete this entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal when user clicks "View Details" */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-8">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Embedded image preview */}
            <div className="w-full aspect-16/10 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 mb-6">
              <img
                src={selectedItem.imageUrl || selectedItem.thumbnailUrl}
                alt="Inspected Surface"
                className="w-full h-full object-contain bg-slate-950"
              />
            </div>

            {/* Render complete ResultCard for this item */}
            <ResultCard
              result={selectedItem}
              onClear={() => setSelectedItem(null)}
              isDetailedView={true}
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal for "Clear All History" */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Clear All Inspection History?</h3>
            <p className="text-xs text-slate-400 mb-6">
              This will permanently remove all {history.length} saved inspection reports and thumbnails from this browser. This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/40 cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Single Item */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-center">
            <h4 className="text-sm font-bold text-white mb-2">Delete this inspection?</h4>
            <p className="text-xs text-slate-400 mb-5">
              This entry will be permanently removed from your history log.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(itemToDelete);
                  setItemToDelete(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
