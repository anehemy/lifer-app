import { useEffect, useRef, useState } from "react";

interface Bubble {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface ThemeVertex {
  name: string;
  color: string;
  x: number;
  y: number;
}

interface PentagonBubbleGameProps {
  experiences: string[]; // Array of unique experience types
}

export default function PentagonBubbleGame({ experiences }: PentagonBubbleGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const [zoom, setZoom] = useState(1);

  // Pentagon dimensions
  const WIDTH = 1200;
  const HEIGHT = 1000;
  const CENTER_X = WIDTH / 2;
  const CENTER_Y = HEIGHT / 2;
  const RADIUS = 350; // Pentagon radius

  // Theme vertices (5 points of pentagon)
  const themes: ThemeVertex[] = [
    { name: "Freedom", color: "#06b6d4", x: 0, y: 0 }, // cyan - top
    { name: "Power", color: "#ef4444", x: 0, y: 0 }, // red - top-right
    { name: "Value", color: "#a855f7", x: 0, y: 0 }, // purple - bottom-right
    { name: "Love", color: "#ec4899", x: 0, y: 0 }, // pink - bottom-left
    { name: "Truth", color: "#f97316", x: 0, y: 0 }, // orange - top-left
  ];

  // Calculate pentagon vertex positions
  useEffect(() => {
    const angle = (2 * Math.PI) / 5;
    const startAngle = -Math.PI / 2; // Start from top

    themes.forEach((theme, i) => {
      const a = startAngle + i * angle;
      theme.x = CENTER_X + RADIUS * Math.cos(a);
      theme.y = CENTER_Y + RADIUS * Math.sin(a);
    });
  }, []);

  // Initialize bubbles from experiences
  useEffect(() => {
    console.log('[PentagonBubbleGame] Received experiences:', experiences);
    if (experiences.length === 0) {
      console.log('[PentagonBubbleGame] No experiences to display');
      return;
    }

    const newBubbles: Bubble[] = experiences.map((exp, i) => {
      // Random position within pentagon
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * (RADIUS * 0.6);
      
      return {
        id: `bubble-${i}`,
        label: exp,
        x: CENTER_X + distance * Math.cos(angle),
        y: CENTER_Y + distance * Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: 40 + Math.random() * 20,
        color: "#94a3b8", // Initial gray
      };
    });

    setBubbles(newBubbles);
  }, [experiences]);

  // Calculate color based on distance to vertices
  const calculateBubbleColor = (bubble: Bubble): string => {
    const distances = themes.map(theme => {
      const dx = bubble.x - theme.x;
      const dy = bubble.y - theme.y;
      return Math.sqrt(dx * dx + dy * dy);
    });

    // Find max distance for normalization
    const maxDist = Math.max(...distances);
    
    // Calculate weights (inverse distance)
    const weights = distances.map(d => 1 - (d / maxDist));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Blend colors based on weights
    let r = 0, g = 0, b = 0;
    themes.forEach((theme, i) => {
      const weight = weights[i] / totalWeight;
      const color = hexToRgb(theme.color);
      if (color) {
        r += color.r * weight;
        g += color.g * weight;
        b += color.b * weight;
      }
    });

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

  // Helper: hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Physics: bubble repulsion
  const applyRepulsion = (bubbles: Bubble[]) => {
    const REPULSION_STRENGTH = 0.2; // Reduced from 0.5 for stability
    const DAMPING = 0.85; // Stronger dampening from 0.95 to stop vibration

    bubbles.forEach((bubble, i) => {
      // Repel from other bubbles
      bubbles.forEach((other, j) => {
        if (i === j) return;
        
        const dx = bubble.x - other.x;
        const dy = bubble.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = bubble.radius + other.radius;

        if (dist < minDist + 50) {
          const force = (minDist + 50 - dist) * REPULSION_STRENGTH;
          const angle = Math.atan2(dy, dx);
          bubble.vx += Math.cos(angle) * force;
          bubble.vy += Math.sin(angle) * force;
        }
      });

      // Apply velocity
      bubble.x += bubble.vx;
      bubble.y += bubble.vy;

      // Damping
      bubble.vx *= DAMPING;
      bubble.vy *= DAMPING;

      // Keep within pentagon bounds (simplified: circular boundary)
      const dx = bubble.x - CENTER_X;
      const dy = bubble.y - CENTER_Y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = RADIUS - bubble.radius - 20;

      if (dist > maxDist) {
        const angle = Math.atan2(dy, dx);
        bubble.x = CENTER_X + maxDist * Math.cos(angle);
        bubble.y = CENTER_Y + maxDist * Math.sin(angle);
        bubble.vx *= -0.5;
        bubble.vy *= -0.5;
      }

      // Update color
      bubble.color = calculateBubbleColor(bubble);
    });
  };

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Draw pentagon outline - make it more visible
      ctx.beginPath();
      themes.forEach((theme, i) => {
        if (i === 0) ctx.moveTo(theme.x, theme.y);
        else ctx.lineTo(theme.x, theme.y);
      });
      ctx.closePath();
      ctx.strokeStyle = "#94a3b8"; // Darker gray
      ctx.lineWidth = 4; // Thicker line
      ctx.stroke();
      
      // Add a subtle fill to show the pentagon area
      ctx.fillStyle = "rgba(148, 163, 184, 0.05)";
      ctx.fill();

      // Draw theme vertices - larger and more prominent
      themes.forEach(theme => {
        // Draw larger colored circle
        ctx.beginPath();
        ctx.arc(theme.x, theme.y, 25, 0, Math.PI * 2);
        ctx.fillStyle = theme.color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw theme label with background for better visibility
        const labelY = theme.y - 45;
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Measure text for background
        const textMetrics = ctx.measureText(theme.name);
        const padding = 8;
        
        // Draw background rectangle
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fillRect(
          theme.x - textMetrics.width / 2 - padding,
          labelY - 12,
          textMetrics.width + padding * 2,
          24
        );
        
        // Draw text
        ctx.fillStyle = theme.color;
        ctx.fillText(theme.name, theme.x, labelY);
      });

      // Apply physics
      if (!dragging) {
        applyRepulsion(bubbles);
      }

      // Draw bubbles
      bubbles.forEach(bubble => {
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fillStyle = bubble.color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw label
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const words = bubble.label.split(" ");
        words.forEach((word, i) => {
          ctx.fillText(word, bubble.x, bubble.y + (i - words.length / 2 + 0.5) * 14);
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bubbles, dragging]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // Find clicked bubble
    const clicked = bubbles.find(bubble => {
      const dx = x - bubble.x;
      const dy = y - bubble.y;
      return Math.sqrt(dx * dx + dy * dy) < bubble.radius;
    });

    if (clicked) {
      setDragging(clicked.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setBubbles(prev => prev.map(bubble => {
      if (bubble.id === dragging) {
        return { ...bubble, x, y, vx: 0, vy: 0 };
      }
      return bubble;
    }));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Pentagon Bubble Game</h3>
        <p className="text-sm text-muted-foreground">
          Drag bubbles to group related experiences. Watch colors blend and shift as you explore connections.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {experiences.length} experiences • Drag bubbles to arrange and watch colors change
        </p>
      </div>
      
      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
        >
          Zoom Out −
        </button>
        <span className="text-sm font-medium min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
        >
          Zoom In +
        </button>
        <button
          onClick={() => setZoom(1)}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          Reset
        </button>
      </div>
      
      <div className="overflow-auto max-w-full" style={{ maxHeight: '800px' }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s' }}>
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="border border-gray-200 rounded-lg shadow-lg cursor-grab active:cursor-grabbing bg-gradient-to-br from-slate-50 to-slate-100"
        />
        </div>
      </div>
    </div>
  );
}

