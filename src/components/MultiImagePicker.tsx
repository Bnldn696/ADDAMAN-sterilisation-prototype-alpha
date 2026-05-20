import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, Check, Loader2, Image as ImageIcon } from 'lucide-react';

interface MultiImagePickerProps {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
}

export const MultiImagePicker: React.FC<MultiImagePickerProps> = ({ images, onChange, label }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stop camera stream when component unmounts or camera is closed
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    setCapturedCount(0);
    try {
      const activeStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(activeStream);
      if (videoRef.current) {
        videoRef.current.srcObject = activeStream;
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      // Fallback: If camera is not allowed or failed, use normal input
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Visual flash feedback
    setShutterFlash(true);
    setTimeout(() => {
      setShutterFlash(false);
    }, 150);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set matching dimensions
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      // Update state
      onChange([...images, dataUrl]);
      setCapturedCount(prev => prev + 1);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files) as File[];
    const loadedImages: string[] = [];
    let processed = 0;

    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          loadedImages.push(reader.result);
        }
        processed++;
        if (processed === fileList.length) {
          onChange([...images, ...loadedImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-4">
      {label && <label className="block text-sm font-semibold text-slate-700">{label}</label>}

      {/* Selected Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          {images.map((img, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm bg-white border border-slate-100">
              <img src={img} alt={`selected-${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-colors"
                title="Supprimer la photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-1 left-1 bg-black/50 text-[10px] text-white px-1.5 py-0.5 rounded-md">
                Photo {idx + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* File Upload Button */}
        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all cursor-pointer shadow-sm active:scale-[0.98]">
          <Upload className="h-4.5 w-4.5 text-slate-500" />
          <span>Sélectionner des photos</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>

        {/* Camera capture button */}
        <button
          type="button"
          onClick={startCamera}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-teal-200 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-sm transition-all shadow-sm active:scale-[0.98]"
        >
          <Camera className="h-4.5 w-4.5 text-teal-600" />
          <span>Prendre photo (Caméra)</span>
        </button>
      </div>

      {/* Camera interface overlay modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 text-white">
          <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-teal-400" />
              <h4 className="font-bold text-base sm:text-lg">Caméra multi-captures</h4>
            </div>
            <button
              type="button"
              onClick={closeCamera}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden select-none">
            {cameraError ? (
              <div className="text-center p-6 max-w-md bg-slate-900 rounded-2xl border border-slate-800 m-4">
                <p className="text-red-400 font-medium mb-4">{cameraError}</p>
                {/* Fallback to custom file upload direct on-camera failure */}
                <label className="inline-flex items-center gap-2 bg-teal-600 px-5 py-2.5 rounded-xl text-white font-bold cursor-pointer hover:bg-teal-500 transition">
                  <Upload className="h-4 w-4" />
                  <span>Choisir un fichier</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      handleFileUpload(e);
                      closeCamera();
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover sm:max-h-[75vh]"
                />
                
                {/* Camera HUD Indicator */}
                <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 backdrop-blur-sm">
                  Mode: Caméra arrière
                </div>

                {capturedCount > 0 && (
                  <div className="absolute top-4 right-4 bg-teal-600/90 text-white px-3 py-1.5 rounded-full text-xs font-bold border border-teal-400/30 animate-pulse backdrop-blur-sm">
                    {capturedCount} {capturedCount > 1 ? 'photos capturées' : 'photo capturée'}
                  </div>
                )}

                {/* Shutter Animation Overlay */}
                {shutterFlash && (
                  <div className="absolute inset-0 bg-white z-[110] transition-opacity duration-75" />
                )}
                
                {/* Canvas hidden of course */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-900 border-t border-slate-800 pb-8 shrink-0 flex flex-col items-center gap-4">
            {/* Captured preview row in camera */}
            {images.length > 0 && (
              <div className="w-full flex gap-2 overflow-x-auto py-1 px-1 justify-center max-h-16">
                {images.map((pic, idx) => (
                  <div key={idx} className="relative h-12 w-12 rounded-lg overflow-hidden border border-teal-500/50 shrink-0">
                    <img src={pic} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex w-full justify-between items-center max-w-md">
              <button
                type="button"
                onClick={closeCamera}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition"
              >
                Annuler
              </button>

              {/* Shutter capture trigger */}
              {!cameraError && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="h-16 w-16 bg-white hover:bg-teal-100 hover:scale-105 active:scale-95 rounded-full border-4 border-slate-300 hover:border-teal-400 flex items-center justify-center transition-all shadow-xl shadow-black/40"
                  title="Prendre une photo"
                >
                  <div className="h-10 w-10 bg-teal-600 rounded-full" />
                </button>
              )}

              <button
                type="button"
                onClick={closeCamera}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-sm transition flex items-center gap-1.5 shadow-md"
              >
                <Check className="h-4 w-4" />
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
