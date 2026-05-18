import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface CameraScannerProps {
  onClose: () => void;
  onScan: (result: string, imageUrl: string) => void;
  mode: 'verify' | 'add' | 'edit';
  expectedInstruments?: { id: string; name: string }[];
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onClose, onScan, mode, expectedInstruments }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
        console.error(err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      setIsScanning(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    const fullImageUrl = canvas.toDataURL('image/jpeg', 0.8);

    try {
      // Initialize Gemini API
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("Clé API Gemini manquante.");
      }

      const ai = new GoogleGenAI({ apiKey });

      let prompt = "";
      if (mode === 'verify' && expectedInstruments) {
        prompt = `You are a surgical instrument identification assistant. I will provide an image of an instrument and a list of expected instruments: ${JSON.stringify(expectedInstruments)}. Identify which instrument from the list is in the image. 
        
CRITICAL INSTRUCTION: You MUST respond with ONLY the name of the instrument. If the scan fails or is unrecognized, output: "Error scanning, try to scan again."`;
      } else {
        prompt = `You are a surgical instrument identification assistant. Identify the surgical instrument in the image. Use Google Search to confirm the medical name.
        
CRITICAL INSTRUCTION: You MUST respond with ONLY the name of the instrument. If the scan fails or is unrecognized, output: "Error scanning, try to scan again."`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg',
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          tools: [{ googleSearch: { searchTypes: { webSearch: {} } } }]
        }
      });

      let responseText = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.text) {
          responseText += part.text;
        }
      }

      const cleanText = responseText.trim();
      onScan(cleanText, fullImageUrl);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'analyse de l'image.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="flex justify-between items-center p-4 bg-black/50 text-white absolute top-0 left-0 right-0 z-10">
        <h3 className="font-bold text-lg">
          {mode === 'verify' ? 'Vérification des instruments' : mode === 'edit' ? 'Éditer l\'instrument' : 'Scanner un nouvel instrument'}
        </h3>
        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-red-400 p-4 text-center bg-black/80 rounded-xl m-4">
            {error}
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
            <Loader2 className="h-12 w-12 animate-spin text-teal-500 mb-4" />
            <p className="text-lg font-medium">Analyse par IA en cours...</p>
          </div>
        )}

        {/* Target Reticle */}
        {!isScanning && !error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-500 rounded-tl-3xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-500 rounded-tr-3xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-500 rounded-bl-3xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-500 rounded-br-3xl"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-black pb-10 flex justify-center">
        <button
          onClick={captureAndAnalyze}
          disabled={isScanning || !!error}
          className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-400 text-white px-8 py-4 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-lg shadow-teal-900/50"
        >
          <Camera className="h-6 w-6" />
          {isScanning ? 'Analyse...' : 'Scanner'}
        </button>
      </div>
    </div>
  );
};
