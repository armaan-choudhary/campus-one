'use client';

import React, { useEffect, useRef } from 'react';

interface InteractiveSubtleBackgroundProps {
  containerRef: React.RefObject<HTMLElement | null>;
  currentTheme?: 'dark' | 'light';
}

interface GridDot {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface AmbientMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

export const InteractiveSubtleBackground: React.FC<InteractiveSubtleBackgroundProps> = ({
  containerRef,
  currentTheme = 'dark',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Mouse state
    const mouse = {
      x: -9999,
      y: -9999,
      active: false,
    };

    // Grid configuration
    const SPACING = 34;
    const dots: GridDot[] = [];
    const ripples: Ripple[] = [];
    const motes: AmbientMote[] = [];

    const isDark =
      currentTheme === 'dark' ||
      document.documentElement.classList.contains('dark');

    // Build grid dots
    const initGrid = () => {
      dots.length = 0;
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const originX = c * SPACING;
          const originY = r * SPACING;
          dots.push({
            originX,
            originY,
            x: originX,
            y: originY,
            vx: 0,
            vy: 0,
            size: 1.2,
            baseAlpha: isDark ? 0.07 : 0.05,
          });
        }
      }
    };

    // Build ambient micro-motes (18 motes)
    const initMotes = () => {
      motes.length = 0;
      for (let i = 0; i < 18; i++) {
        motes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: -(0.15 + Math.random() * 0.35), // slow upward drift
          size: 1.0 + Math.random() * 1.4,
          alpha: isDark ? 0.12 + Math.random() * 0.18 : 0.08 + Math.random() * 0.12,
          pulseSpeed: 0.02 + Math.random() * 0.03,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initGrid();
      initMotes();
    };

    handleResize();

    // Mouse listeners on container
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handlePointerLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Add a tactile subtle expansion ripple
      if (ripples.length < 6) {
        ripples.push({
          x: clickX,
          y: clickY,
          radius: 0,
          maxRadius: Math.min(width, height) * 0.45,
          alpha: isDark ? 0.28 : 0.2,
        });
      }
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    container.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Animation Loop
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const activeDark =
        currentTheme === 'dark' ||
        document.documentElement.classList.contains('dark');

      const dotColor = activeDark ? '255, 255, 255' : '0, 0, 0';

      // 1. Update and Render Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += 140 * dt;
        rip.alpha -= 0.35 * dt;

        if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${dotColor}, ${rip.alpha * 0.7})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]); // Subtle dashed ring
        ctx.stroke();
        ctx.restore();
      }

      // 2. Interactive Constellation Lines (hairline links from cursor to nearest dots)
      if (mouse.active) {
        const CONNECT_RADIUS = 95;
        const nearbyDots: Array<{ dot: GridDot; dist: number }> = [];

        for (let i = 0; i < dots.length; i++) {
          const d = dots[i];
          const dist = Math.hypot(mouse.x - d.x, mouse.y - d.y);
          if (dist < CONNECT_RADIUS) {
            nearbyDots.push({ dot: d, dist });
          }
        }

        // Connect cursor to up to 4 closest dots
        nearbyDots.sort((a, b) => a.dist - b.dist);
        const maxLines = Math.min(nearbyDots.length, 4);

        for (let i = 0; i < maxLines; i++) {
          const item = nearbyDots[i];
          const lineAlpha = (1 - item.dist / CONNECT_RADIUS) * (activeDark ? 0.18 : 0.12);

          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(item.dot.x, item.dot.y);
          ctx.strokeStyle = `rgba(${dotColor}, ${lineAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // 3. Update & Draw Grid Dots
      const MOUSE_RADIUS = 110;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Mouse displacement & brightening
        let targetX = dot.originX;
        let targetY = dot.originY;
        let dotAlpha = dot.baseAlpha;
        let currentSize = dot.size;

        if (mouse.active) {
          const dx = mouse.x - dot.originX;
          const dy = mouse.y - dot.originY;
          const dist = Math.hypot(dx, dy);

          if (dist < MOUSE_RADIUS) {
            const factor = 1 - dist / MOUSE_RADIUS;
            // Gentle magnetic displacement (dots push slightly outward)
            const push = factor * 7;
            targetX = dot.originX - (dx / (dist || 1)) * push;
            targetY = dot.originY - (dy / (dist || 1)) * push;

            // Highlight alpha
            dotAlpha = dot.baseAlpha + factor * (activeDark ? 0.32 : 0.22);
            currentSize = dot.size + factor * 0.8;
          }
        }

        // Ripple interaction: push dots slightly when ripple wavefront touches them
        for (let r = 0; r < ripples.length; r++) {
          const rip = ripples[r];
          const distToRipple = Math.hypot(dot.originX - rip.x, dot.originY - rip.y);
          const diff = Math.abs(distToRipple - rip.radius);

          if (diff < 20) {
            const waveStrength = (1 - diff / 20) * rip.alpha;
            dotAlpha = Math.max(dotAlpha, dot.baseAlpha + waveStrength * 0.5);
            currentSize = Math.max(currentSize, dot.size + waveStrength * 1.2);
          }
        }

        // Smooth spring movement back to target
        dot.vx = (dot.vx + (targetX - dot.x) * 12 * dt) * 0.82;
        dot.vy = (dot.vy + (targetY - dot.y) * 12 * dt) * 0.82;
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Draw dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor}, ${dotAlpha})`;
        ctx.fill();
      }

      // 4. Ambient Slow-Drifting Motes
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.x += m.vx;
        m.y += m.vy;
        m.pulsePhase += m.pulseSpeed;

        // Wrap around bounds
        if (m.y < -10) {
          m.y = height + 10;
          m.x = Math.random() * width;
        }
        if (m.x < -10) m.x = width + 10;
        if (m.x > width + 10) m.x = -10;

        // Subtle breath alpha
        const dynamicAlpha = m.alpha * (0.8 + 0.2 * Math.sin(m.pulsePhase));

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor}, ${dynamicAlpha})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [containerRef, currentTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 select-none"
      aria-hidden="true"
    />
  );
};
