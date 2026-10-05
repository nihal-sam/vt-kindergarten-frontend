import { useState, useEffect } from "react";

const links = [
  { id: 'home', label: 'Home' },
  { id: 'eligibility', label: 'Age Check' },
  { id: 'about', label: 'About Us' },
  { id: 'programs', label: 'Programs' },
  { id: 'founder', label: 'Founders' },
  { id: 'gallery', label: 'Life at VT' },
  { id: 'contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);

      // Simple active link detection
      const scrollPos = window.scrollY + 120;
      for (let i = links.length - 1; i >= 0; i--) {
        const el = document.getElementById(links[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActive(links[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const navbarOffset = 85;
      const targetTop = el.getBoundingClientRect().top + window.scrollY - navbarOffset;
      window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
    }
    setActive(id);
    setMenuOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <a href="#home" className="nav-logo" onClick={(e) => { e.preventDefault(); scrollTo('home'); }}>
          <div className="nav-logo-icon" aria-hidden="true">
            <img src="/assets/vt-logo.png" alt="VT Kindergarten" />
          </div>
          <div className="nav-logo-text">
            <h2>VT Kindergarten</h2>
            <span>Pre School • Karaikudi</span>
          </div>
        </a>

        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {links.map(link => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                className={active === link.id ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); scrollTo(link.id); }}
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="nav-cta-item">
            <a
              href="#eligibility"
              className="nav-cta"
              onClick={(e) => { e.preventDefault(); scrollTo('eligibility'); }}
            >
              <span>✨ Admissions Open</span>
            </a>
          </li>
          <li className="nav-phone-item">
            <a href="tel:+917358293839" className="nav-phone-btn">
              <span>📞 +91 73582 93839</span>
            </a>
          </li>
        </ul>

        <div className="nav-actions-right">
          <a
            href="#eligibility"
            className="nav-cta nav-cta-desktop"
            onClick={(e) => { e.preventDefault(); scrollTo('eligibility'); }}
          >
            <span>✨ Admissions Open</span>
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
