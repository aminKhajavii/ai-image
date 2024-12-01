"use client";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import { useRef, useEffect, useState, MouseEvent } from "react";
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

export default function AnimatedMediaUploadForm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasPreviewRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Magnifying glass state
  const [magnifyPosition, setMagnifyPosition] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);

  // Existing canvas animation effect (from previous implementation)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particles: Array<{
      x: number;
      y: number;
      dx: number;
      dy: number;
      length: number;
      speed: number;
      hue: number;
    }> = [];

    const createTrail = (
      x: number,
      y: number,
      dx: number,
      dy: number,
      hue: number
    ) => {
      particles.push({ x, y, dx, dy, length: 3, speed: 2, hue });
    };

    // Initialize particles
    for (let i = 0; i < 10; i++) {
      createTrail(canvas.width * (i / 10), 0, 0, 1, i * 36);
      createTrail(canvas.width * (i / 10), canvas.height, 0, -1, i * 36 + 180);
      createTrail(0, canvas.height * (i / 10), 1, 0, i * 36 + 90);
      createTrail(canvas.width, canvas.height * (i / 10), -1, 0, i * 36 + 270);
    }

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      particles.forEach((particle) => {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        const endX = particle.x - particle.dx * particle.length;
        const endY = particle.y - particle.dy * particle.length;
        ctx.lineTo(endX, endY);

        const gradient = ctx.createLinearGradient(
          particle.x,
          particle.y,
          endX,
          endY
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 50%, 1)`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 50%, 0.1)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.stroke();

        particle.x += particle.dx * particle.speed;
        particle.y += particle.dy * particle.speed;

        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
        particle.speed =
          2 +
          (1 - distanceToCenter / (Math.max(canvas.width, canvas.height) / 2)) *
            3;

        if (
          distanceToCenter < 5 ||
          particle.x < 0 ||
          particle.x > canvas.width ||
          particle.y < 0 ||
          particle.y > canvas.height
        ) {
          if (particle.dx !== 0) {
            particle.x = particle.dx > 0 ? 0 : canvas.width;
            particle.y = Math.random() * canvas.height;
          } else {
            particle.x = Math.random() * canvas.width;
            particle.y = particle.dy > 0 ? 0 : canvas.height;
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Open and set up camera
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Prefer back/world-facing camera
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraModalOpen(true);
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasPreviewRef.current) {
      const video = videoRef.current;
      const canvas = canvasPreviewRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      const context = canvas.getContext("2d");
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "captured-photo.jpg", {
            type: "image/jpeg",
          });
          processSelectedFile(file, "camera");
        }
      }, "image/jpeg");

      // Stop video stream and close modal
      const stream = video.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());

      setIsCameraModalOpen(false);
      setIsCameraActive(false);
    }
  };

  // Close camera and release stream
  const closeCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());

      setIsCameraModalOpen(false);
      setIsCameraActive(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    processSelectedFile(selectedFile, "file");
  };

  // Common file processing logic
  const processSelectedFile = (
    selectedFile: File | undefined,
    source: "file" | "camera"
  ) => {
    console.log(source);
    if (selectedFile) {
      // Validate file type and size
      if (!selectedFile.type.startsWith("image/")) {
        alert("Please upload a valid image file");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("File is too large. Maximum size is 5MB");
        return;
      }

      setFile(selectedFile);
      setUploadedImage(URL.createObjectURL(selectedFile));
      setProcessingComplete(false);
    }
  };
  if (isCameraActive) {
    console.log("Camera is active");
  }

  // اگر نیاز دارید از source استفاده کنید

  // Submit handler
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setProcessingComplete(false);

    setTimeout(() => {
      setLoading(false);
      setProcessingComplete(true);
    }, 5000);
  };

  // Magnifying glass mouse move handler
  const handleMouseMove = (e: MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMagnifyPosition({ x, y });
  };

  return (
    <div className="relative min-h-screen bg-black flex flex-col">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-white mb-8 z-50 text-center">
          لطفا عکس خود را اپلود کنید
        </h1>
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl z-50 bg-zinc-900 shadow-sm rounded-sm"
        >
          <div className="relative flex items-center">
            {/* Hidden file input for file selection */}
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
          <DotLottieReact
            className="z-50"
            src="https://lottie.host/5a71ed8a-b030-463e-a9a4-e8555e7e140e/EEtxL4mix3.lottie"
            loop
            autoplay
          />
        )}

        {processingComplete && uploadedImage && !loading && (
          <div
            className="mt-5 z-50 shadow-xl shadow-current text-center relative"
            onMouseEnter={() => setShowMagnifier(true)}
            onMouseLeave={() => setShowMagnifier(false)}
          >
            <p className="text-white mb-2">تصویر پردازش شده</p>
            <div className="relative inline-block">
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

              {showMagnifier && (
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
                      backgroundSize: `${imageRef.current?.width * 2}px ${
                        imageRef.current?.height * 2
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

      {/* Camera Modal */}
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
  );
}
