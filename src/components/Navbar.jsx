import { useState, useEffect } from "react";

const links = ['home','eligibility','about','founder','programs','gallery','contact'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const navbarOffset = 90;
      const targetTop = el.getBoundingClientRect().top + window.scrollY - navbarOffset;
      window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
    }
    setActive(id);
    setMenuOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <a href="#home" className="nav-logo" onClick={(e) => { e.preventDefault(); scrollTo('home'); }}>
        <div className="nav-logo-icon" aria-hidden="true">
          <img src="/assets/vt-logo.png" alt="" />
        </div>
        <div className="nav-logo-text">
          <h2>VT Kindergarten</h2>
          <span>Pre School - Karaikudi</span>
        </div>
      </a>

      <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
        {links.map(link => (
          <li key={link}>
            <a
              href={`#${link}`}
              className={active === link ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); scrollTo(link); }}
              style={link === 'founder' ? { color: 'var(--primary)', fontWeight: 'bold' } : {}}
            >
              {link === 'enquiry' ? 'Enquiry' :
               link === 'eligibility' ? 'Age Check' :
               link.charAt(0).toUpperCase() + link.slice(1)}
            </a>
          </li>
        ))}
        <li>
          <a href="#enquiry" className="nav-cta" onClick={(e) => { e.preventDefault(); scrollTo('enquiry'); }}>
            Enquiry Now
          </a>
        </li>
      </ul>

      <button
        className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
        type="button"
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span><span></span><span></span>
      </button>
    </nav>
  );
}
