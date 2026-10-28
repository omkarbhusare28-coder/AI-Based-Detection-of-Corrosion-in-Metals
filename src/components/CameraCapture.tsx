import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, AlertTriangle, VideoOff } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for available video input devices
  useEffect(() => {
    async function checkDevices() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        }
      } catch (e) {
        console.warn('Unable to enumerate devices:', e);
      }
    }
    checkDevices();
  }, []);

  // Start or restart camera stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    let isMounted = true;

    async function startCamera() {
      setIsInitializing(true);
      setError(null);

      // Stop previous tracks
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser environment.');
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch((playErr) => {
            console.warn('Video play interrupted:', playErr);
          });
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Camera error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(
            'Camera permission was denied. Please allow camera permissions in your browser address bar and try again.'
          );
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera device was detected on your system.');
        } else {
          setError(err.message || 'Unable to access camera feed.');
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // If user camera, mirror it horizontally so photo matches preview
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // Stop tracks before closing
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      onCapture(dataUrl);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col items-center">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 z-10">
        <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Metal Surface Scanner
        </div>
        <div className="flex items-center gap-2">
          {hasMultipleCameras && (
            <button
              onClick={toggleFacingMode}
              type="button"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Switch Camera (Front/Rear)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flip Camera</span>
            </button>
          )}
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Cancel Camera"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="relative w-full aspect-4/3 max-h-[440px] bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="p-6 text-center max-w-sm flex flex-col items-center text-slate-300">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-rose-300 mb-1">Camera Inaccessible</p>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer"
            >
              Back to File Upload
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Target reticle / crosshairs overlay for inspection */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-4/5 h-4/5 border border-dashed border-cyan-400/50 rounded-xl relative">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>

                {/* Center target indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border border-cyan-400/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                  </div>
                </div>

                <div className="absolute bottom-3 inset-x-0 text-center">
                  <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm text-[11px] text-cyan-300 font-medium tracking-wide">
                    Align metal surface within reticle
                  </span>
                </div>
              </div>
            </div>

            {isInitializing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-slate-300">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs font-medium">Initializing camera optical sensor...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Capture Controls */}
      {!error && (
        <div className="w-full p-4 bg-slate-900 flex items-center justify-center gap-6 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={capturePhoto}
            disabled={isInitializing}
            className="group relative flex items-center justify-center p-1 rounded-full bg-linear-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            title="Capture Photo"
          >
            <div className="w-14 h-14 rounded-full border-4 border-slate-950 bg-white flex items-center justify-center group-hover:bg-slate-100 transition-colors">
              <Camera className="w-6 h-6 text-slate-900" />
            </div>
          </button>

          <div className="w-16"></div>
        </div>
      )}
    </div>
  );
};
