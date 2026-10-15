import { useState, useEffect, useRef, useCallback } from "react";

const links = [
  { id: 'home', label: 'Home' },
  { id: 'eligibility', label: 'Age Check' },
  { id: 'about', label: 'About' },
  { id: 'founder', label: 'Founder' },
  { id: 'programs', label: 'Programs' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [pillStyle, setPillStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  const navListRef = useRef(null);
  const isManualScrolling = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Measure and update the sliding pill box position and dimensions
  const updatePill = useCallback((targetId) => {
    const list = navListRef.current;
    if (!list) return;

    const targetLink = list.querySelector(`[data-nav-id="${targetId}"]`);
    if (!targetLink) {
      setPillStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }

    const listRect = list.getBoundingClientRect();
    const targetRect = targetLink.getBoundingClientRect();

    setPillStyle({
      left: Math.round(targetRect.left - listRect.left),
      top: Math.round(targetRect.top - listRect.top),
      width: Math.round(targetRect.width),
      height: Math.round(targetRect.height),
      opacity: 1,
    });
  }, []);

  // Update pill position whenever active state changes
  useEffect(() => {
    updatePill(active);
  }, [active, updatePill]);

  // Recalculate on window resize, orientation change, or font load
  useEffect(() => {
    const handleResize = () => updatePill(active);
    window.addEventListener('resize', handleResize);

    if (document.fonts) {
      document.fonts.ready.then(() => updatePill(active));
    }

    const timer = setTimeout(() => updatePill(active), 150);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [active, updatePill]);

  // If mobile drawer is opened, recalculate after drawer slide-in animation
  useEffect(() => {
    if (menuOpen) {
      const timer = setTimeout(() => updatePill(active), 260);
      return () => clearTimeout(timer);
    }
  }, [menuOpen, active, updatePill]);

  // Scroll spy tracking active section as user scrolls
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);

      if (isManualScrolling.current) return;

      const scrollPos = window.scrollY + 140;
      for (let i = links.length - 1; i >= 0; i--) {
        const el = document.getElementById(links[i].id);
        if (el && el.offsetTop <= scrollPos) {
          if (active !== links[i].id) {
            setActive(links[i].id);
          }
          break;
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [active]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const navbarOffset = 85;
      const targetTop = el.getBoundingClientRect().top + window.scrollY - navbarOffset;
      window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
    }
  };

  const handleLinkClick = (id) => {
    // 1. Immediately move the sliding pill to target link
    setActive(id);
    updatePill(id);
    setMenuOpen(false);

    // 2. Lock scroll spy during smooth scroll so the box glides directly to destination
    isManualScrolling.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isManualScrolling.current = false;
    }, 850);

    // 3. Smooth scroll to the target section
    scrollTo(id);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <a
          href="#home"
          className="nav-logo"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('home');
          }}
        >
          <div className="nav-logo-icon" aria-hidden="true">
            <img src="/assets/vt-logo.png" alt="VT Kindergarten" />
          </div>
          <div className="nav-logo-text">
            <h2>VT Kindergarten</h2>
            <span>Pre School - Karaikudi</span>
          </div>
        </a>

        {/* Premium Floating Track with Smoothly Moving Box */}
        <ul className={`nav-links ${menuOpen ? 'open' : ''}`} ref={navListRef}>
          {/* Hardware-Accelerated Sliding Indicator Box */}
          <li
            className="nav-sliding-pill"
            aria-hidden="true"
            style={{
              transform: `translate3d(${pillStyle.left}px, ${pillStyle.top}px, 0)`,
              width: `${pillStyle.width}px`,
              height: `${pillStyle.height}px`,
              opacity: pillStyle.opacity,
            }}
          />

          {links.map(link => {
            const isActive = active === link.id;
            return (
              <li key={link.id} className="nav-item">
                <a
                  href={`#${link.id}`}
                  data-nav-id={link.id}
                  className={`nav-link-btn ${isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick(link.id);
                  }}
                >
                  {link.label}
                </a>
              </li>
            );
          })}

          <li className="nav-cta-item">
            <a
              href="#eligibility"
              className="nav-cta"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('eligibility');
              }}
            >
              Enquiry Now
            </a>
          </li>
        </ul>

        <div className="nav-actions-right">
          <a
            href="#eligibility"
            className="nav-cta nav-cta-desktop"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('eligibility');
            }}
          >
            Enquiry Now
          </a>

          <button
            className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  );
}
