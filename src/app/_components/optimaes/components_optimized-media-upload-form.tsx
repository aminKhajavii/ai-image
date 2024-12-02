"use client";

import { useRef, useState, MouseEvent, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Paperclip, Camera, ArrowUp, X } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const LottieDotLottieReact: typeof DotLottieReact = DotLottieReact;

const AnimatedCanvas = dynamic(() => import("./components_animated-canvas"), {
  ssr: false,
});

export default function OptimizedMediaUploadForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasPreviewRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [magnifyPosition, setMagnifyPosition] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraModalOpen(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasPreviewRef.current) {
      const video = videoRef.current;
      const canvas = canvasPreviewRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "captured-photo.jpg", {
            type: "image/jpeg",
          });
          processSelectedFile(file);
        }
      }, "image/jpeg");

      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());

      setIsCameraModalOpen(false);
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());

      setIsCameraModalOpen(false);
    }
  }, []);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      processSelectedFile(selectedFile);
    },
    []
  );

  const processSelectedFile = useCallback((selectedFile: File | undefined) => {
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        alert("Please upload a valid image file");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("File is too large. Maximum size is 5MB");
        return;
      }

      setFile(selectedFile);
      setUploadedImage(selectedFile ? URL.createObjectURL(selectedFile) : null);
      setProcessingComplete(false);
    }
  }, []);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!file) return;

      setLoading(true);
      setProcessingComplete(false);

      setTimeout(() => {
        setLoading(false);
        setProcessingComplete(true);
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 5000);
      }, 5000);
    },
    [file]
  );

  const handleMouseMove = useCallback((e: MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMagnifyPosition({ x, y });
  }, []);

  return (
    <div className="relative min-h-screen bg-black flex flex-col">
      <AnimatedCanvas />

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-white mb-8 z-50 text-center">
          لطفا عکس خود را اپلود کنید
        </h1>
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl z-50 bg-zinc-900 shadow-sm rounded-sm"
        >
          <div className="relative flex items-center">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              aria-label="File input"
            />

            <Input
              readOnly
              value={file ? file.name : ""}
              placeholder="عکس خود را انتخاب کنید"
              className="w-full bg-white/10 border-0 focus-visible:ring-2 focus-visible:ring-blue-500 text-white placeholder:text-gray-400 text-lg py-7 pl-28"
            />
            <div className="absolute left-3 flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Attach file"
                className="h-9 w-9 text-gray-400 bg-white/10 hover:text-white hover:bg-white/20 focus:ring-2 focus:ring-blue-500"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Take photo"
                className="h-9 w-9 text-gray-400 bg-white/10 hover:text-white hover:bg-white/20 focus:ring-2 focus:ring-blue-500"
                onClick={openCamera}
              >
                <Camera className="h-5 w-5" />
              </Button>
            </div>
            <Button
              type="submit"
              size="icon"
              aria-label="Upload file"
              className={`absolute right-3 h-9 w-9 ${
                file
                  ? "bg-white text-black hover:bg-gray-200 focus:ring-2 focus:ring-blue-500"
                  : "bg-gray-500 cursor-not-allowed"
              }`}
              disabled={!file}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>
        </form>

        {loading && (
          <div className="z-50">
            <DotLottieReact
              src="https://lottie.host/a8717ae9-a779-42f3-a902-59c0982f9436/yUqzTP5keW.lottie"
              autoplay
              loop
            />
          </div>
        )}

        {processingComplete && uploadedImage && !loading && (
          <div
            className="mt-5 z-50 shadow-xl shadow-current text-center relative"
            onMouseEnter={() => setShowMagnifier(true)}
            onMouseLeave={() => setShowMagnifier(false)}
          >
            <p className="text-white mb-2">تصویر پردازش شده</p>
            <div className="relative inline-block">
              {uploadedImage && (
                <Image
                  ref={imageRef}
                  src={uploadedImage}
                  width={500}
                  height={500}
                  alt="Uploaded"
                  className="w-full max-w-md rounded-lg"
                  priority
                  onMouseMove={handleMouseMove}
                />
              )}

              {showAnimation && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <DotLottieReact
                    src="https://lottie.host/319ad928-9e9d-4ac9-8fa0-dcaa1100a397/9Am0oijspX.lottie"
                    autoplay
                    loop
                    className="w-full h-full"
                  />
                </div>
              )}

              {showMagnifier && uploadedImage && (
                <>
                  <div
                    className="absolute border-2 border-white/50 rounded-full pointer-events-none"
                    style={{
                      width: "100px",
                      height: "100px",
                      left: `${magnifyPosition.x - 50}px`,
                      top: `${magnifyPosition.y - 50}px`,
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                      zIndex: 10,
                    }}
                  />

                  <div
                    className="absolute border-2 border-white/50 rounded-lg overflow-hidden"
                    style={{
                      width: "200px",
                      height: "200px",
                      right: "-220px",
                      top: "0",
                      backgroundImage: `url(${uploadedImage})`,
                      backgroundPosition: `${-magnifyPosition.x * 2 + 100}px ${
                        -magnifyPosition.y * 2 + 100
                      }px`,
                      backgroundSize: `${
                        imageRef.current?.width
                          ? imageRef.current.width * 2
                          : 200
                      }px ${
                        imageRef.current?.height
                          ? imageRef.current.height * 2
                          : 200
                      }px`,
                      zIndex: 10,
                    }}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="relative p-4 flex justify-center gap-4 text-sm text-gray-400">
        {[
          "درباره ما",
          "تماس با ما",
          "حریم خصوصی",
          "شرایط استفاده از خدمات ما",
        ].map((link) => (
          <a
            key={link}
            href="#"
            className="hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {link}
          </a>
        ))}
      </footer>

      <div className="z-50">
        <Dialog open={isCameraModalOpen} onOpenChange={setIsCameraModalOpen}>
          <DialogContent className="sm:max-w-[425px] bg-black text-white">
            <DialogHeader>
              <DialogTitle className="text-white">عکس گرفتن</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 text-white hover:bg-white/20"
                onClick={closeCamera}
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogHeader>

            <div className="relative w-full aspect-square">
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded-lg"
                playsInline
              />
              <canvas ref={canvasPreviewRef} className="hidden" />
            </div>

            <div className="flex justify-center mt-4">
              <Button
                onClick={capturePhoto}
                className="bg-white text-black hover:bg-gray-200"
              >
                عکس گرفتن
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
