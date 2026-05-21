import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef();
  const ringRef = useRef();

  useEffect(() => {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    const move = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
      }
    };

    const animate = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX - 18}px, ${ringY - 18}px)`;
      }
      requestAnimationFrame(animate);
    };

    const handleMouseOver = (e) => {
      const tag = e.target.tagName.toLowerCase();
      const interactive = ['a','button','input','select','textarea','label'];
      if (interactive.includes(tag) || e.target.closest('a, button')) {
        ringRef.current?.classList.add('hovered');
      }
    };
    const handleMouseOut = () => ringRef.current?.classList.remove('hovered');

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    animate();

    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dotRef} />
      <div className="cursor-ring" ref={ringRef} />
    </>
  );
}
