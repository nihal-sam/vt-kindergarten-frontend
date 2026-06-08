import { useEffect, useState } from "react";

const phrases = ['Bright Future', 'Joyful Learning', 'Happy Childhood', 'Smart Growth'];

export default function Hero() {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setPhraseIdx((current) => (current + 1) % phrases.length), 2500);
    return () => clearInterval(timer);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="hero">
      <div className="hero-bg-overlay" />

      <div className="hero-content">
        <div className="hero-badge">
          <span>VT</span>
          <span>Karaikudi's Trusted Pre School Since 2015</span>
        </div>
        <h1>
          Where Little<br/>
          <em>Stars</em> Begin Their<br/>
          <span>{phrases[phraseIdx]}</span>
        </h1>
        <p className="hero-desc">
          VT Kindergarten Pre School - located near Reliance Smart Bazaar, Subramaniapuram, Karaikudi.
          We nurture every child's cognitive, social, and creative development with love and expert care.
        </p>
        <div className="hero-btns">
          <button className="btn-primary" onClick={() => scrollTo('enquiry')}>
            Enquire Now
          </button>
          <button className="btn-secondary" onClick={() => scrollTo('about')}>
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
        <div className="hero-glow-orb" />
        <div className="cartoon-float barbie-float"><img src="/assets/barbie.png" alt="Barbie" /><div className="char-label">Barbie</div></div>
        <div className="cartoon-float tom-float"><img src="/assets/tom.png" alt="Tom the Cat" /><div className="char-label">Tom</div></div>
        <div className="cartoon-float cocomelon-float"><img src="/assets/cocomelon.png" alt="Cocomelon" /><div className="char-label">Cocomelon</div></div>
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
