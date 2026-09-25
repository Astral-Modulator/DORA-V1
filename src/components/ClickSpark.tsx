import React, { useRef, useEffect, useCallback } from 'react';

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: 'linear' | 'ease-in' | 'ease-in-out' | 'ease-out';
  extraScale?: number;
  children?: React.ReactNode;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
  color: string;
}

const ClickSpark: React.FC<ClickSparkProps> = ({
  sparkColor = '#ffffff',
  sparkSize = 12,
  sparkRadius = 20,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1.1,
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparksRef = useRef<Spark[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const sparkColorRef = useRef<string>(sparkColor);

  useEffect(() => {
    sparkColorRef.current = sparkColor;
  }, [sparkColor]);

  // Resize canvas according to device pixel ratio for razor-sharp rendering
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const easeFunc = useCallback(
    (t: number) => {
      switch (easing) {
        case 'linear':
          return t;
        case 'ease-in':
          return t * t;
        case 'ease-in-out':
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
          return t * (2 - t);
      }
    },
    [easing]
  );

  const startAnimationLoop = useCallback(() => {
    if (animationFrameRef.current !== null) return;

    const render = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameRef.current = null;
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) {
          return false;
        }

        const progress = Math.min(Math.max(elapsed / duration, 0), 1);
        const eased = easeFunc(progress);

        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = spark.color;
        ctx.lineWidth = 1.75;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        return true;
      });

      // Keep rendering as long as active sparks exist; stop to save CPU when idle
      if (sparksRef.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(render);
  }, [duration, easeFunc, extraScale, sparkRadius, sparkSize]);

  const isDarkElement = (elem: Element | null): boolean => {
    // If sparkColor is configured as white (#ffffff), it's dark mode -> return true
    if (sparkColorRef.current === '#ffffff' || sparkColorRef.current === 'white') {
      return true;
    }

    // In light mode:
    // Elements on the login page and all light surfaces produce black sparks.
    // Only elements specifically inside #research-form or with data-cursor-color="white" produce white sparks.
    let curr = elem;
    while (curr && curr !== document.body) {
      const datasetColor = (curr as HTMLElement).dataset?.cursorColor;
      if (datasetColor === '#ffffff' || datasetColor === 'white') return true;
      if (datasetColor === '#000000' || datasetColor === 'black') return false;
      
      // #research-form is the only element with a permanent dark background in light mode
      if (curr.id === 'research-form') return true;
      
      curr = curr.parentElement;
    }
    return false;
  };

  const addSparksAt = useCallback(
    (clientX: number, clientY: number) => {
      const now = performance.now();
      const elementUnderClick = document.elementFromPoint(clientX, clientY);
      
      // Determine spark color:
      // If current configured sparkColor is white (Dark mode) -> white (#ffffff)
      // If in light mode, but clicking inside dark charcoal text boxes -> white (#ffffff)
      // Otherwise in light mode -> black (#000000)
      const currentColor = sparkColorRef.current;
      const isConfiguredDarkTheme = currentColor === '#ffffff' || currentColor === 'white';
      const sparkColorResolved = isConfiguredDarkTheme
        ? '#ffffff'
        : (isDarkElement(elementUnderClick) ? '#ffffff' : '#000000');

      const newSparks: Spark[] = Array.from({ length: sparkCount }, (_, i) => ({
        x: clientX,
        y: clientY,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now,
        color: sparkColorResolved,
      }));

      sparksRef.current.push(...newSparks);
      startAnimationLoop();
    },
    [sparkCount, startAnimationLoop]
  );

  // Smooth global click spark trigger without blocking any UI clicks or events
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      addSparksAt(e.clientX, e.clientY);
    };

    window.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true });
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [addSparksAt]);

  return (
    <div className="relative w-full min-h-screen">
      <canvas
        id="click-spark-canvas"
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[99999] select-none block"
      />
      {children}
    </div>
  );
};

export default ClickSpark;
