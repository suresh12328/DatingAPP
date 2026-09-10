import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, AlertCircle, Upload } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileFallbackRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Start camera stream
  const startCamera = async (mode: 'user' | 'environment') => {
    setIsLoading(true);
    setCameraError(null);

    // Stop current stream
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by your browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsLoading(false);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setIsLoading(false);
      setCameraError(err.message || 'Could not access camera. You can capture or upload using the file selector below.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedBlob(null);
      setCapturedUrl(null);
      startCamera(facingMode);
    } else {
      // Clean up stream
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front camera for mirror look
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedUrl(URL.createObjectURL(blob));
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const handleRetake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null);
    setCapturedUrl(null);
  };

  const handleConfirm = () => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `camera-snap-${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });
    onCapture(file);
    handleClose();
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null);
    setCapturedUrl(null);
    onClose();
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/90 z-20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-zinc-100">Take Photo</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder or Captured Preview */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {capturedUrl ? (
            <img
              src={capturedUrl}
              alt="Snapped capture"
              className="w-full h-full object-contain"
            />
          ) : cameraError ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <p className="text-xs text-zinc-300 max-w-xs mx-auto">{cameraError}</p>
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Choose Photo or Use Device Camera</span>
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
                </div>
              )}
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden native input for environment capture fallback */}
          <input
            ref={fileFallbackRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFallbackFile}
          />
        </div>

        {/* Controls Footer */}
        <div className="p-4 bg-zinc-950 flex items-center justify-between">
          {!capturedUrl ? (
            <>
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                className="p-3 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-full transition"
                title="Use device gallery/camera"
              >
                <Upload className="w-5 h-5" />
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                id="camera-snap-btn"
                onClick={handleSnap}
                disabled={Boolean(cameraError) || isLoading}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-pink-600 hover:bg-pink-500 text-white shadow-lg active:scale-95 transition disabled:opacity-40"
              >
                <div className="w-12 h-12 rounded-full bg-white/20" />
              </button>

              <button
                type="button"
                onClick={toggleFacingMode}
                disabled={Boolean(cameraError)}
                className="p-3 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-full transition disabled:opacity-30"
                title="Switch camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
              >
                Retake
              </button>
              <button
                type="button"
                id="camera-send-btn"
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-95 transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Attach Photo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
