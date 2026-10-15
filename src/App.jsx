import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/HeroClean";
import AgeEligibilityCalculator from "./components/AgeEligibilityCalculator";
import About from "./components/About";
import Founder from "./components/Founder";
import Programs from "./components/Programs";
import Gallery from "./components/Gallery";
import Contact from "./components/Contact";
import { Footer } from "./components/Footer.jsx";
import FloatingBubbles from "./components/FloatingBubbles";
import InstagramSection from "./components/InstagramSection";
import ScrollProgress from "./components/ScrollProgress";

import { supabase } from "./supabaseClient";

const ELIGIBILITY_PROMPT_ASSETS = ["/assets/hero-elephant-bgless-v2.png"];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [ageCalculatorTouched, setAgeCalculatorTouched] = useState(false);

  useEffect(() => {
    const logVisit = async () => {
      if (!sessionStorage.getItem("vt_visit_logged")) {
        try {
          // Fetch location silently via IP geolocation (Zero permission dialogs)
          let locTag = "";
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            let geo = null;
            try {
              const res = await fetch("https://ipwho.is/", { signal: controller.signal });
              if (res.ok) {
                const data = await res.json();
                if (data && data.success !== false) {
                  geo = {
                    city: data.city,
                    region: data.region,
                    country: data.country_code || data.country,
                    flag: data.flag?.emoji || (data.country_code === "IN" ? "🇮🇳" : "📍"),
                  };
                }
              }
            } catch {
              try {
                const res2 = await fetch("https://freeipapi.com/api/json", { signal: controller.signal });
                if (res2.ok) {
                  const data2 = await res2.json();
                  if (data2 && data2.cityName) {
                    geo = {
                      city: data2.cityName,
                      region: data2.regionName,
                      country: data2.countryCode || data2.countryName,
                      flag: data2.countryCode === "IN" ? "🇮🇳" : "📍",
                    };
                  }
                }
              } catch {}
            }
            clearTimeout(timeoutId);

            if (geo) {
              const parts = [geo.city, geo.region, geo.country].filter(Boolean);
              if (parts.length > 0) {
                locTag = ` [${geo.flag} ${parts.join(", ")}]`;
              }
            }
          } catch {
            // Geolocation fetch failed/timed out, proceed silently
          }

          const rawReferrer = document.referrer || "Direct/Unknown";
          const referrerText = rawReferrer + locTag;

          await supabase.from('visits').insert([{ 
            user_agent: navigator.userAgent,
            referrer: referrerText,
            language: navigator.language || 'Unknown',
            screen_width: window.innerWidth
          }]);
          sessionStorage.setItem("vt_visit_logged", "true");
        } catch (error) {
          console.error("Tracking error:", error);
        }
      }
    };
    logVisit();
  }, []);

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
    // Disabled modal timer
  }, [loading, ageCalculatorTouched]);

  const markAgeCalculatorTouched = () => {
    setAgeCalculatorTouched(true);
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

  if (loading) return <LoadingScreen />;

  return (
    <div className="app-wrapper">
      <ScrollProgress />
      <FloatingBubbles />
      <Navbar />
      <main>
        <section id="home"><Hero /></section>
        <section id="eligibility">
          <AgeEligibilityCalculator
            onInteraction={markAgeCalculatorTouched}
          />
        </section>
        <section id="about"><About /></section>
        <section id="founder"><Founder /></section>
        <section id="programs"><Programs /></section>
        <section id="gallery"><Gallery /></section>
        <section id="instagram"><InstagramSection /></section>
        <section id="contact"><Contact /></section>
      </main>
      <Footer />
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
