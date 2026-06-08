import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/HeroClean";
import AgeEligibilityCalculator from "./components/AgeEligibilityCalculator";
import About from "./components/About";
import Programs from "./components/Programs";
import Gallery from "./components/Gallery";
import Enquiry from "./components/Enquiry";
import Contact from "./components/Contact";
import { Footer } from "./components/Footer.jsx";
import FloatingBubbles from "./components/FloatingBubbles";
import AdmissionBanner from "./components/AdmissionBanner";
import InstagramSection from "./components/InstagramSection";
import ScrollProgress from "./components/ScrollProgress";

const ELIGIBILITY_PROMPT_ASSETS = ["/assets/jerry-enquiry.png", "/assets/tom-enquiry.png"];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [enquiryPrefill, setEnquiryPrefill] = useState(null);
  const [showEligibilityPrompt, setShowEligibilityPrompt] = useState(false);
  const [ageCalculatorTouched, setAgeCalculatorTouched] = useState(false);

  useEffect(() => {
    ELIGIBILITY_PROMPT_ASSETS.forEach((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      image.decode?.().catch(() => {});
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || ageCalculatorTouched) return undefined;

    const timer = setTimeout(() => {
      if (!ageCalculatorTouched) setShowEligibilityPrompt(true);
    }, 7000);

    return () => clearTimeout(timer);
  }, [loading, ageCalculatorTouched]);

  useEffect(() => {
    if (!showEligibilityPrompt) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowEligibilityPrompt(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showEligibilityPrompt]);

  const markAgeCalculatorTouched = () => {
    setAgeCalculatorTouched(true);
    setShowEligibilityPrompt(false);
  };

  const goToEligibility = () => {
    markAgeCalculatorTouched();

    const eligibilitySection = document.getElementById("eligibility");
    if (!eligibilitySection) return;

    const navbarOffset = 90;
    const targetTop = eligibilitySection.getBoundingClientRect().top + window.scrollY - navbarOffset;

    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });
    window.history.replaceState(null, "", "#eligibility");

    window.setTimeout(() => {
      const firstField = eligibilitySection.querySelector("input");
      firstField?.focus({ preventScroll: true });
    }, 650);
  };

  const goToEnquiry = (prefill = null) => {
    if (prefill) setEnquiryPrefill({ ...prefill, requestedAt: Date.now() });

    const enquirySection = document.getElementById("enquiry");
    if (!enquirySection) return;

    const navbarOffset = 90;
    const targetTop = enquirySection.getBoundingClientRect().top + window.scrollY - navbarOffset;

    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });
    window.history.replaceState(null, "", "#enquiry");

    window.setTimeout(() => {
      const firstField =
        enquirySection.querySelector('input[name="phone"]') ||
        enquirySection.querySelector("input, select, textarea");
      firstField?.focus({ preventScroll: true });
    }, 650);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="app-wrapper">
      <ScrollProgress />
      <FloatingBubbles />
      <Navbar />
      <main>
        <section id="home"><Hero /></section>
        <AdmissionBanner />
        <section id="eligibility">
          <AgeEligibilityCalculator
            onApply={goToEnquiry}
            onInteraction={markAgeCalculatorTouched}
          />
        </section>
        <section id="about"><About /></section>
        <section id="programs"><Programs /></section>
        <section id="gallery"><Gallery /></section>
        <section id="instagram"><InstagramSection /></section>
        <section id="enquiry"><Enquiry prefill={enquiryPrefill} /></section>
        <section id="contact"><Contact /></section>
      </main>
      {showEligibilityPrompt && (
        <AgeEligibilityPromptModal
          onConfirm={goToEligibility}
          onClose={() => setShowEligibilityPrompt(false)}
        />
      )}
      <Footer />
    </div>
  );
}

function AgeEligibilityPromptModal({ onConfirm, onClose }) {
  return (
    <div className="enquiry-prompt-overlay" onClick={onClose}>
      <div className="enquiry-prompt-scene" aria-hidden="true">
        <div className="enquiry-character enquiry-character-jerry">
          <img src="/assets/jerry-enquiry.png" alt="" />
        </div>
        <div className="enquiry-character enquiry-character-tom">
          <img src="/assets/tom-enquiry.png" alt="" />
        </div>
      </div>
      <div
        className="enquiry-prompt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="eligibility-prompt-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="enquiry-prompt-close" type="button" aria-label="Close eligibility prompt" onClick={onClose}>
          x
        </button>
        <div className="enquiry-prompt-icon" aria-hidden="true">2+</div>
        <p className="enquiry-prompt-tag">Age Eligibility</p>
        <h2 id="eligibility-prompt-title">Do you want to check your child's grade eligibility?</h2>
        <p className="enquiry-prompt-copy">
          Check the correct class for VT Kindergarten using the 31 March 2026 admission age rule.
        </p>
        <div className="enquiry-prompt-actions">
          <button className="btn-primary" type="button" onClick={onConfirm}>
            Yes, Check Eligibility
          </button>
          <button className="btn-secondary" type="button" onClick={onClose}>
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        <img src="/assets/loading-sun.png" alt="Loading" className="loading-sun-img" />
        <h1>VT Kindergarten</h1>
        <p>Pre School</p>
        <div className="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  );
}
