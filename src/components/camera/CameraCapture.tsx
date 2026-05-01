"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface CameraCaptureProps {
  onImageReady: (file: File) => void;
}

export default function CameraCapture({ onImageReady }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      // Attach stream to video element
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        // Ensure the video plays once metadata is loaded
        video.onloadedmetadata = () => {
          video.play().catch(() => {});
        };
      }
      setIsActive(true);
    } catch {
      setCameraError("Camera access denied. Please allow camera permissions in your browser.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera not ready yet. Please wait a moment and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    stopCamera();

    const dataURL = canvas.toDataURL("image/jpeg", 0.9);
    const byteString = atob(dataURL.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: "image/jpeg" });
    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

    setPreview(dataURL);
    setCapturedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setCapturedFile(file);
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleAnalyze = () => {
    if (capturedFile) {
      onImageReady(capturedFile);
    }
  };

  const handleReset = () => {
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setCapturedFile(null);
    setCameraError(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera / Preview Area */}
      <div className="relative w-full max-w-md aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden">
        {/* Video element - always in DOM, visibility controlled via CSS */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isActive ? "block" : "hidden"}`}
        />

        {/* Preview image (after capture/upload) */}
        {!isActive && preview && (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        )}

        {/* Empty state */}
        {!isActive && !preview && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <p className="text-sm">Start camera or upload an image</p>
          </div>
        )}
      </div>

      {cameraError && <p className="text-red-500 text-sm text-center">{cameraError}</p>}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        {/* Initial state: show Start Camera + Upload */}
        {!isActive && !preview && (
          <>
            <button
              onClick={startCamera}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Start Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
            >
              Upload Image
            </button>
          </>
        )}

        {/* Camera active: show Capture + Stop */}
        {isActive && (
          <>
            <button
              onClick={handleCapture}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Capture Photo
            </button>
            <button
              onClick={stopCamera}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              Stop Camera
            </button>
          </>
        )}

        {/* Preview state: show Analyze + Retake */}
        {!isActive && preview && (
          <>
            <button
              onClick={handleAnalyze}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Analyze Image
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
            >
              Retake / New Image
            </button>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
