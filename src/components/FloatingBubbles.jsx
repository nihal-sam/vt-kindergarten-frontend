import { useEffect, useRef } from "react";

const COLORS = ['#FF6B35','#4ECDC4','#FFD93D','#A78BFA','#F472B6','#34D399'];

export default function FloatingBubbles() {
  const containerRef = useRef();

  useEffect(() => {
    const container = containerRef.current;
    const bubbles = [];

    for (let i = 0; i < 18; i++) {
      const el = document.createElement('div');
      el.className = 'bubble';
      const size = Math.random() * 80 + 30;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${Math.random() * 100}%;
        animation-duration: ${Math.random() * 20 + 15}s;
        animation-delay: ${Math.random() * 15}s;
      `;
      container.appendChild(el);
      bubbles.push(el);
    }
    return () => bubbles.forEach(b => b.remove());
  }, []);

  return <div className="bubbles-container" ref={containerRef} />;
}
