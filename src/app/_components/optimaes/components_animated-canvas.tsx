"use client";

import { useRef, useEffect, useState } from "react";

export default function AnimatedCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      speed: number;
      color: string;
    }> = [];

    const colors = ["rgba(173, 216, 230, 0.7)", "rgba(144, 238, 144, 0.7)"]; // Light blue and light green

    const createParticle = (startX: number, startY: number, color: string) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      particles.push({
        x: startX,
        y: startY,
        targetX: centerX,
        targetY: centerY,
        speed: 0.5 + Math.random() * 0.5,
        color: color,
      });
    };

    const initializeParticles = () => {
      particles = [];
      const corners = [
        [0, 0],
        [canvas.width, 0],
        [0, canvas.height],
        [canvas.width, canvas.height],
      ];

      corners.forEach((corner, index) => {
        for (let i = 0; i < 5; i++) {
          createParticle(corner[0], corner[1], colors[index % 2]);
        }
      });
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setDimensions({ width: canvas.width, height: canvas.height });
      initializeParticles();
    };

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);

        // Calculate the next position
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
          particle.x += (dx / distance) * particle.speed;
          particle.y += (dy / distance) * particle.speed;
        } else {
          // Reset particle to a corner when it reaches the center
          const corner = [
            [0, 0],
            [canvas.width, 0],
            [0, canvas.height],
            [canvas.width, canvas.height],
          ][Math.floor(Math.random() * 4)];
          particle.x = corner[0];
          particle.y = corner[1];
          particle.targetX = canvas.width / 2;
          particle.targetY = canvas.height / 2;
        }

        ctx.lineTo(particle.x, particle.y);
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      width={dimensions.width}
      height={dimensions.height}
      aria-hidden="true"
    />
  );
}
