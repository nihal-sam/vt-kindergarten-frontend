import { useEffect, useMemo, useState } from "react";

const phrases = ["Bright Future", "Joyful Learning", "Happy Childhood", "Smart Growth"];

export default function HeroClean() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [scene, setScene] = useState({ x: 0, y: 0, scroll: 0 });

  useEffect(() => {
    const timer = setInterval(() => setPhraseIdx((current) => (current + 1) % phrases.length), 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updatePointer = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      setScene((current) => ({ ...current, x, y }));
    };

    const updateScroll = () => {
      const heroHeight = Math.max(window.innerHeight, 1);
      const scroll = Math.min(window.scrollY / heroHeight, 1);
      setScene((current) => ({ ...current, scroll }));
    };

    window.addEventListener("mousemove", updatePointer);
    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();

    return () => {
      window.removeEventListener("mousemove", updatePointer);
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const stageStyle = useMemo(() => ({
    transform: `
      perspective(1400px)
      rotateX(${(-scene.y * 8) + (scene.scroll * 6)}deg)
      rotateY(${scene.x * 12}deg)
      translateY(${scene.scroll * 16}px)
    `,
  }), [scene]);

  const orbStyle = useMemo(() => ({
    transform: `translate(${scene.x * 18}px, ${scene.y * 14}px) scale(${1 + scene.scroll * 0.08})`,
  }), [scene]);

  const pupilStyle = useMemo(() => ({
    transform: `translate(${scene.x * 9}px, ${scene.y * 6}px)`,
  }), [scene]);

  const leftChipStyle = useMemo(() => ({
    transform: `translate3d(${scene.x * -14}px, ${scene.y * -10}px, 24px)`,
  }), [scene]);

  const rightChipStyle = useMemo(() => ({
    transform: `translate3d(${scene.x * 16}px, ${scene.y * 8}px, 30px)`,
  }), [scene]);

  const topChipStyle = useMemo(() => ({
    transform: `translate3d(${scene.x * 10}px, ${scene.y * -12}px, 18px)`,
  }), [scene]);

  const ringOneStyle = useMemo(() => ({
    transform: `rotate(${scene.scroll * 20}deg) translateZ(8px)`,
  }), [scene]);

  const ringTwoStyle = useMemo(() => ({
    transform: `rotate(${scene.scroll * -28}deg) translateZ(-8px)`,
  }), [scene]);

  return (
    <div className="hero">
      <div className="hero-bg-overlay" />

      <div className="hero-content">
        <div className="hero-badge">
          <span>STAR</span>
          <span>Karaikudi's Trusted Play School Since 2015</span>
        </div>
        <h1>
          Where Little
          <br />
          <em>Stars</em> Begin Their
          <br />
          <span>{phrases[phraseIdx]}</span>
        </h1>
        <p className="hero-desc">
          VT Kindergarten Play School, near Reliance Smart Bazaar, Subramaniapuram, Karaikudi.
          We nurture every child's cognitive, social, and creative development with love and expert care.
        </p>
        <div className="hero-btns">
          <button className="btn-primary" onClick={() => scrollTo("enquiry")}>
            Enquire Now
          </button>
          <button className="btn-secondary" onClick={() => scrollTo("about")}>
            Learn More
          </button>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><h3>500+</h3><p>Happy Students</p></div>
          <div className="hero-stat"><h3>10+</h3><p>Years of Care</p></div>
          <div className="hero-stat"><h3>4</h3><p>Programs</p></div>
          <div className="hero-stat"><h3>100%</h3><p>Safe Environment</p></div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-glow-orb" style={orbStyle} />

        <div className="hero-brand-stage" style={stageStyle}>
          <div className="hero-ring hero-ring-one" style={ringOneStyle} />
          <div className="hero-ring hero-ring-two" style={ringTwoStyle} />
          <div className="hero-depth-shadow" />

          <div className="hero-brand-card">
            <div className="hero-brand-mark hero-mascot-mark">
              <span className="hero-brand-star">*</span>
              <div className="hero-mascot-face">
                <div className="hero-eye"><span className="hero-pupil" style={pupilStyle} /></div>
                <div className="hero-eye"><span className="hero-pupil" style={pupilStyle} /></div>
              </div>
              <div className="hero-mascot-smile" />
              <span className="hero-brand-vt hero-brand-badge">VT</span>
            </div>
            <div className="hero-brand-text">
              <p>VT Kindergarten</p>
              <h3>Play. Learn. Shine.</h3>
            </div>
            <div className="hero-brand-floor">
              <span>Interactive 3D hero scene</span>
            </div>
          </div>

          <div className="hero-chip hero-chip-top" style={topChipStyle}>
            <strong>Safe Campus</strong>
            <span>Warm, protected learning spaces</span>
          </div>

          <div className="hero-chip hero-chip-left" style={leftChipStyle}>
            <strong>Creative Play</strong>
            <span>Music, stories and movement</span>
          </div>

          <div className="hero-chip hero-chip-right" style={rightChipStyle}>
            <strong>Expert Care</strong>
            <span>Personal attention for every child</span>
          </div>

          <div className="hero-scroll-meter">
            <span>Scroll</span>
            <div className="hero-scroll-track">
              <div className="hero-scroll-fill" style={{ height: `${18 + (scene.scroll * 82)}%` }} />
            </div>
          </div>
        </div>

        <div className="hero-bubble b1">*</div>
        <div className="hero-bubble b2">o</div>
        <div className="hero-bubble b3">+</div>
        <div className="hero-bubble b4">+</div>
        <div className="hero-bubble b5">*</div>
        <div className="hero-bubble b6">o</div>
      </div>
    </div>
  );
}
