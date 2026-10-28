/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  UploadCloud,
  Camera,
  RotateCcw,
  Sparkles,
  FileImage,
  AlertTriangle,
  History,
  Layers,
  ChevronRight,
  HelpCircle,
  Eye,
  CheckCircle,
  Search,
} from 'lucide-react';
import { CameraCapture } from './components/CameraCapture';
import { ResultCard } from './components/ResultCard';
import { HistoryList } from './components/HistoryList';
import { InspectionResult, AnalysisResponse } from './types';
import {
  getSavedHistory,
  saveInspectionResult,
  deleteHistoryItem,
  clearAllHistory,
  createThumbnail,
} from './utils/storage';
import { getSampleImages, SampleImage } from './utils/sampleImages';

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<InspectionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<InspectionResult[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sampleImages = getSampleImages();

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = getSavedHistory();
    setHistory(saved);
  }, []);

  // Handle file selection (drag & drop or file picker)
  const handleFileProcess = (file: File) => {
    setErrorMessage(null);
    setAnalysisResult(null);

    // Validate MIME type - accept only JPG, PNG, WEBP
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Invalid file format. Please upload a standard image file (JPG, PNG, or WEBP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds 25MB limit. Please upload an image under 25MB.');
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSelectedImage(dataUrl);
      setIsCameraActive(false);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Handle live camera capture
  const handleCameraCapture = (dataUrl: string) => {
    setSelectedImage(dataUrl);
    setImageFileName(`capture_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`);
    setIsCameraActive(false);
    setErrorMessage(null);
    setAnalysisResult(null);
  };

  // Select sample image
  const handleSelectSample = (sample: SampleImage) => {
    setSelectedImage(sample.dataUrl);
    setImageFileName(`${sample.id}.jpg`);
    setIsCameraActive(false);
    setErrorMessage(null);
    setAnalysisResult(null);
  };

  // Clear current image and result
  const handleClear = () => {
    setSelectedImage(null);
    setImageFileName('');
    setAnalysisResult(null);
    setErrorMessage(null);
    setIsCameraActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Send image to backend Gemini vision endpoint
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    try {
      setIsAnalyzing(true);
      setErrorMessage(null);

      const response = await fetch('/api/analyze-corrosion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage,
          mimeType: selectedImage.startsWith('data:image/png')
            ? 'image/png'
            : selectedImage.startsWith('data:image/webp')
            ? 'image/webp'
            : 'image/jpeg',
        }),
      });

      const data: AnalysisResponse = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Server error during corrosion analysis.');
      }

      // Generate a compressed thumbnail for localStorage
      const thumbnailUrl = await createThumbnail(selectedImage, 180, 0.75);

      const inspectionRecord: InspectionResult = {
        id: `insp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        is_metal_surface: data.is_metal_surface,
        classification: data.classification,
        confidence: data.confidence,
        severity: data.severity,
        notes: data.notes,
        timestamp: data.timestamp || new Date().toISOString(),
        imageUrl: selectedImage,
        thumbnailUrl: thumbnailUrl,
        fileName: imageFileName,
      };

      setAnalysisResult(inspectionRecord);

      // Only save to history if it actually was recognized as a metal surface
      if (data.is_metal_surface) {
        const updatedHistory = await saveInspectionResult(inspectionRecord);
        setHistory(updatedHistory);
      }
    } catch (err: any) {
      console.error('Inspection failed:', err);
      setErrorMessage(
        err.message || 'Inspection failed. Please check network connectivity or try another photo.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Delete single history item
  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistory(updated);
  };

  // Clear all history
  const handleClearAllHistory = () => {
    clearAllHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-900/30">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                AI-Based Corrosion Detection
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  Metallurgical Vision
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Automated surface oxidation assessment and severity classification
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('analyze')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'analyze'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Analyze</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
              {history.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-800 text-cyan-400'
                  }`}
                >
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'analyze' ? (
          <div className="space-y-6">
            {/* Page Header Brief */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Surface Analysis Terminal
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Upload a photograph of a metal surface or use your device camera. The Gemini vision model will evaluate whether the surface is <strong className="text-rose-400">CORRODED</strong> or <strong className="text-emerald-400">NON-CORRODED</strong> with confidence score and severity level.
                </p>
              </div>

              {/* Status pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 w-fit">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="font-medium text-[11px]">Gemini 3.8 Flash Vision Ready</span>
              </div>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-200 flex items-start gap-3 shadow-lg">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-rose-300 mb-0.5">Inspection Notice</div>
                  <div>{errorMessage}</div>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-white text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Two-Column Layout: Input on Left, Result on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Input & Preview (lg:col-span-6) */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-cyan-400" /> 1. Provide Metal Surface Photo
                  </h3>

                  {/* Camera view if camera is active */}
                  {isCameraActive ? (
                    <CameraCapture
                      onCapture={handleCameraCapture}
                      onClose={() => setIsCameraActive(false)}
                    />
                  ) : selectedImage ? (
                    /* Image Preview Area */
                    <div className="space-y-4">
                      <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group">
                        <img
                          src={selectedImage}
                          alt="Selected Metal Surface"
                          className="w-full h-full object-contain bg-slate-950"
                        />

                        {/* Scanner animation overlay when analyzing */}
                        {isAnalyzing && (
                          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
                            {/* Moving horizontal scanning beam */}
                            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse"></div>

                            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-2xl flex flex-col items-center gap-3 text-center max-w-xs">
                              <div className="relative w-10 h-10 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                                <Sparkles className="w-5 h-5 text-cyan-400" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white tracking-wide">
                                  Analyzing Surface Morphology
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1">
                                  Gemini vision engine evaluating oxide pigmentation & pitting...
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* File Details & Action Buttons */}
                      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                        <span className="truncate max-w-[200px] font-medium text-slate-300">
                          {imageFileName || 'Inspection_Surface.jpg'}
                        </span>
                        <span className="text-slate-500">Image Ready</span>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-950/50 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                              <span>Analyzing Surface...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-cyan-300" />
                              <span>Analyze Surface with AI</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleClear}
                          disabled={isAnalyzing}
                          className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                          title="Clear / Try another"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Initial Upload / Camera Picker UI */
                    <div className="space-y-4">
                      {/* Drag & Drop Zone */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full aspect-16/10 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer ${
                          isDragOver
                            ? 'border-cyan-400 bg-cyan-950/20 scale-[0.99]'
                            : 'border-slate-700 hover:border-slate-500 bg-slate-950/40 hover:bg-slate-950/70'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-7 h-7" />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">
                          Click to upload or drag & drop photograph
                        </p>
                        <p className="text-xs text-slate-400 max-w-xs">
                          Accepts high-resolution JPG, PNG, or WEBP photos of metal surfaces
                        </p>
                      </div>

                      {/* Or Live Camera Option */}
                      <div className="relative flex py-2 items-center">
                        <div className="grow border-t border-slate-800"></div>
                        <span className="shrink mx-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          or capture live
                        </span>
                        <div className="grow border-t border-slate-800"></div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsCameraActive(true)}
                        className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-cyan-400" />
                        <span>Open Live Camera Scanner</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Test Samples */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> One-Click Test Samples
                    </h4>
                    <span className="text-[11px] text-slate-500">Instant evaluation</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {sampleImages.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleSelectSample(sample)}
                        disabled={isAnalyzing}
                        className="group text-left p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer disabled:opacity-50"
                      >
                        <div className="aspect-4/3 w-full rounded-lg overflow-hidden bg-slate-900 mb-2 border border-slate-800">
                          <img
                            src={sample.dataUrl}
                            alt={sample.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="text-[11px] font-bold text-slate-200 truncate">{sample.name}</div>
                        <div className="text-[10px] text-cyan-400 font-medium">{sample.expected}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Results & Inspection Findings (lg:col-span-6) */}
              <div className="lg:col-span-6 space-y-6">
                {analysisResult ? (
                  <ResultCard result={analysisResult} onClear={handleClear} />
                ) : (
                  /* Standby / Guidance Card when no result yet */
                  <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[460px]">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-4">
                      <Layers className="w-8 h-8 text-slate-400" />
                    </div>

                    <h3 className="text-base font-bold text-white mb-2">
                      Awaiting Metal Surface Image
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                      Select or capture a photograph of an industrial metal substrate on the left to initialize AI vision corrosion analysis.
                    </p>

                    <div className="w-full max-w-sm text-left bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Inspection Protocol
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-400">
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <span>Ensure proper lighting on the metallic surface</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-400">
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <span>Surface should be in sharp optical focus</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-400">
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <span>Non-metal objects are automatically rejected by AI filter</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* HISTORY TAB */
          <HistoryList
            history={history}
            onDelete={handleDeleteHistoryItem}
            onClearAll={handleClearAllHistory}
            onSwitchToAnalyze={() => setActiveTab('analyze')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-400">AI-Based Corrosion Detection in Metals</span> • Powered by Gemini Vision
          </div>
          <div className="text-slate-400 font-medium">
            AI-based estimate. Not a substitute for professional inspection.
          </div>
        </div>
      </footer>
    </div>
  );
}
