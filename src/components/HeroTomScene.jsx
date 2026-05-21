import { useEffect, useMemo, useState } from "react";

const phrases = ["Bright Future", "Joyful Learning", "Happy Childhood", "Smart Growth"];
const jerryRunners = [
  { id: 1, lagX: 0, lagY: 0, scale: 1, delay: "0s" },
  { id: 2, lagX: -54, lagY: 26, scale: 0.9, delay: "0.25s" },
  { id: 3, lagX: -108, lagY: 54, scale: 0.8, delay: "0.5s" },
];

export default function HeroTomScene() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [scene, setScene] = useState({
    x: 0,
    y: 0,
    scroll: 0,
    cursorX: 320,
    cursorY: 320,
  });

  useEffect(() => {
    const timer = setInterval(() => setPhraseIdx((current) => (current + 1) % phrases.length), 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updatePointer = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      setScene((current) => ({
        ...current,
        x,
        y,
        cursorX: event.clientX,
        cursorY: event.clientY,
      }));
    };

    const updateScroll = () => {
      const scroll = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
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
      perspective(1600px)
      rotateX(${(-scene.y * 8) + (scene.scroll * 7)}deg)
      rotateY(${scene.x * 12}deg)
      translateY(${scene.scroll * 18}px)
    `,
  }), [scene]);

  const orbStyle = useMemo(() => ({
    transform: `translate(${scene.x * 24}px, ${scene.y * 18}px) scale(${1 + scene.scroll * 0.08})`,
  }), [scene]);

  const tomStyle = useMemo(() => ({
    transform: `
      translate3d(${scene.x * 18}px, ${scene.y * -14}px, 90px)
      rotateY(${scene.x * -11}deg)
      rotateX(${scene.y * 5}deg)
      scale(${1 + scene.scroll * 0.035})
    `,
  }), [scene]);

  const tomHeadStyle = useMemo(() => ({
    transform: `translate3d(${scene.x * 9}px, ${scene.y * 7}px, 30px)`,
  }), [scene]);

  const tomPupilStyle = useMemo(() => ({
    transform: `translate(${scene.x * 6}px, ${scene.y * 4}px)`,
  }), [scene]);

  const chipTopStyle = useMemo(() => ({
    transform: `translate3d(${scene.x * 12}px, ${scene.y * -10}px, 24px)`,
  }), [scene]);

  const chipLeftStyle = useMemo(() => ({
    transform: `translate3d(${scene.x * -16}px, ${scene.y * -8}px, 30px)`,
  }), [scene]);

  const chipRightStyle = useMemo(() => ({
    transform: `translate3d(${scene.x * 18}px, ${scene.y * 10}px, 30px)`,
  }), [scene]);

  const cursorStageStyle = useMemo(() => ({
    transform: `translate(${scene.x * 12}px, ${scene.y * 8}px)`,
  }), [scene]);

  return (
    <div className="hero">
      <div className="hero-bg-overlay" />

      <div className="hero-content">
        <div className="hero-badge">
          <span>Tom and Jerry Motion</span>
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
          VT Kindergarten Play School near Reliance Smart Bazaar, Subramaniapuram, Karaikudi.
          Explore a premium homepage scene where Tom stands tall while Jerry runners chase your cursor.
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

        <div className="hero-brand-stage hero-tom-stage" style={stageStyle}>
          <div className="hero-ring hero-ring-one" />
          <div className="hero-ring hero-ring-two" />
          <div className="hero-depth-shadow" />

          <div className="hero-tom-spotlight" />

          <div className="hero-chip hero-chip-top hero-chip-premium" style={chipTopStyle}>
            <strong>Scroll Depth</strong>
            <span>3D stage tilts and glows while you move through the page.</span>
          </div>

          <div className="hero-chip hero-chip-left hero-chip-premium" style={chipLeftStyle}>
            <strong>Tom Focus</strong>
            <span>Tom's eyes follow your cursor for a lively premium hero scene.</span>
          </div>

          <div className="hero-chip hero-chip-right hero-chip-premium" style={chipRightStyle}>
            <strong>Jerry Chase</strong>
            <span>Three Jerry runners trail the cursor with playful staggered motion.</span>
          </div>

          <div className="hero-tom-wrap" style={tomStyle}>
            <div className="hero-tom-copy">
              <span className="hero-character-tag">Premium Interactive Hero</span>
              <h3>Tom Stands Guard</h3>
              <p>Move the cursor across the hero and let the whole stage react.</p>
            </div>

            <div className="hero-tom-head" style={tomHeadStyle}>
              <div className="hero-tom-ear hero-tom-ear-left" />
              <div className="hero-tom-ear hero-tom-ear-right" />
              <div className="hero-tom-face">
                <div className="hero-tom-eye hero-tom-eye-left">
                  <span className="hero-tom-pupil" style={tomPupilStyle} />
                </div>
                <div className="hero-tom-eye hero-tom-eye-right">
                  <span className="hero-tom-pupil" style={tomPupilStyle} />
                </div>
                <div className="hero-tom-nose" />
                <div className="hero-tom-smile" />
                <span className="hero-tom-whisker hero-tom-whisker-l1" />
                <span className="hero-tom-whisker hero-tom-whisker-l2" />
                <span className="hero-tom-whisker hero-tom-whisker-r1" />
                <span className="hero-tom-whisker hero-tom-whisker-r2" />
              </div>
            </div>

            <div className="hero-tom-body">
              <img src="/assets/tom.png" alt="Tom character" className="hero-tom-image" />
            </div>

            <div className="hero-tom-floor">Tom x Jerry premium motion scene</div>
          </div>

          <div className="hero-cursor-stage" style={cursorStageStyle}>
            {jerryRunners.map((runner) => (
              <div
                key={runner.id}
                className="hero-jerry-runner"
                style={{
                  left: scene.cursorX + runner.lagX,
                  top: scene.cursorY + runner.lagY,
                  transform: `translate(-50%, -50%) scale(${runner.scale})`,
                  animationDelay: runner.delay,
                }}
              >
                <div className="hero-jerry-body">
                  <span className="hero-jerry-ear hero-jerry-ear-left" />
                  <span className="hero-jerry-ear hero-jerry-ear-right" />
                  <span className="hero-jerry-eye hero-jerry-eye-left" />
                  <span className="hero-jerry-eye hero-jerry-eye-right" />
                  <span className="hero-jerry-nose" />
                  <span className="hero-jerry-tail" />
                </div>
              </div>
            ))}
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


