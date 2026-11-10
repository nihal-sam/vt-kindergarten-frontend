/**
 * =========================================================================
 * VT KINDERGARTEN - LOCAL AI KNOWLEDGE BASE & INTENT ENGINE
 * =========================================================================
 * Comprehensive real school knowledge base with semantic intent recognition,
 * colloquial query matching, page section locators, and interactive chat responses.
 */

import { IS_ENQUIRY_BLOCKED, ENQUIRY_BLOCKED_NOTICE } from "./enquiryConfig.js";

// Section Locators on the website
export const PAGE_SECTIONS = {
  home: { id: "home", name: "Welcome Page", selector: "#home" },
  eligibility: { id: "eligibility", name: "Age Calculator & Admission Enquiry", selector: "#eligibility" },
  about: { id: "about", name: "About VT Kindergarten", selector: "#about" },
  founder: { id: "founder", name: "Founders' Note & Vision", selector: "#founder" },
  programs: { id: "programs", name: "Classes & Programs", selector: "#programs" },
  gallery: { id: "gallery", name: "Campus Life & Gallery", selector: "#gallery" },
  instagram: { id: "instagram", name: "Instagram Updates", selector: "#instagram" },
  contact: { id: "contact", name: "Contact & Campus Location", selector: "#contact" },
};

// Verified Real School Knowledge Base
export const SCHOOL_KNOWLEDGE = {
  name: "VT Kindergarten",
  type: "Pre School & Play School",
  tagline: "Where Every Child Blossoms 🌸",
  philosophy: "Caring foundation, safe learning, confident futures.",
  location: {
    address: "No 11, 7th Street, Subramaniapuram, South Extension, Vairavapuram, Karaikkudi – 630002, Tamil Nadu.",
    landmark: "Near Reliance Smart Bazaar",
    city: "Karaikudi",
    googleMapsUrl: "https://maps.google.com/?q=VT+Kindergarten,+Play+school+and+Pre+school,+11,+7th+St,+near+Reliance+Smart+Bazaar,+Subramaniapuram,+south+extension,+Vairavapuram,+Karaikkudi+(M.Corp),+Tamil+Nadu+630002",
  },
  contacts: {
    primaryPhone: "+91 73582 93839",
    altPhone: "+91 99949 94291",
    whatsapp: "+91 73582 93839",
    whatsappUrl: "https://wa.me/917358293839?text=Hello%20VT%20Kindergarten,%20I%20have%20an%20enquiry%20regarding%20school%20admissions.",
    email: "vtkindergarten@gmail.com",
    instagram: "@vt_kindergarten",
    instagramUrl: "https://www.instagram.com/vt_kindergarten/",
  },
  founders: {
    names: ["Thiru Venkatachalam Chettiar", "Mrs. Meyyammai Achi"],
    vision: "To make early childhood education joyful, caring, and deeply meaningful in Karaikkudi.",
    principles: [
      "The early years mark the zenith of a child's grasping power.",
      "Every child deserves a nurturing, safe environment where they feel cherished and confident.",
      "Blends authentic Montessori methods with playful exploration to foster confidence, creativity, and a lifelong love for learning.",
    ],
  },
  timings: {
    playGroupPreKg: "9:00 AM – 12:30 PM (Half Day)",
    lkgUkg: "9:00 AM – 3:00 PM (Full Day)",
    workingDays: "Monday to Friday",
    saturday: "Activity Day & Office Helpdesk (9:30 AM – 1:00 PM)",
    sunday: "Holiday",
  },
  programs: [
    {
      name: "Play Group",
      age: "Age 2+ Years",
      cutoff: "Born on or before 31 March 2024",
      emoji: "🌱",
      focus: "Sensory exploration, habit formation, toilet training support, motor skills, and social sharing.",
    },
    {
      name: "Pre-KG",
      age: "Age 3+ Years",
      cutoff: "Born on or before 31 March 2023",
      emoji: "🌸",
      focus: "Phonics readiness, fun rhymes, storytelling, creative art, numbers 1-10, and gross motor activities.",
    },
    {
      name: "LKG",
      age: "Age 4+ Years",
      cutoff: "Born on or before 31 March 2022",
      emoji: "📖",
      focus: "Reading readiness, English & Tamil phonics, handwriting, basic numeracy, shapes, patterns, and conversational fluency.",
    },
    {
      name: "UKG",
      age: "Age 5+ Years",
      cutoff: "Born on or before 31 March 2021",
      emoji: "🎓",
      focus: "Primary school transition, English sentence reading & writing, basic math (addition/subtraction concepts), logic, and science exploration.",
    },
  ],
  facilities: [
    "24/7 CCTV surveillance covering campus, classrooms, corridors, and outdoor play zones.",
    "Spacious, air-conditioned classrooms with child-friendly soft flooring for toddler safety.",
    "Safe indoor soft-play sensory area & outdoor playground equipment.",
    "Pure multi-stage RO filtered drinking water stations.",
    "Clean, child-height sanitized restrooms with caring female attendant assistance.",
    "Certified female teachers with early childhood training + dedicated care attendants (Ayyahs).",
    "First-aid certified campus with pediatrician contact on call.",
  ],
  transport: {
    available: true,
    details: "Safe, GPS-monitored school van pickup and drop services with caring female attendants onboard.",
    routes: [
      "Subramaniapuram, Vairavapuram & South Extension",
      "Kallukatti, College Road & Sekkalai",
      "Kottaiyur, Burma Colony & nearby Karaikudi residential extensions",
    ],
  },
  fees: {
    policy: "Affordable and transparent fee structure with zero hidden donation fees.",
    coverage: "Covers tuition, books, activity kits, art materials, and school celebrations.",
    installments: "Flexible term-wise installment payments available (Term 1, Term 2, Term 3).",
    paymentMethods: "UPI (Google Pay, PhonePe, Paytm), Net Banking, and Bank transfer with instant digital receipts.",
  },
  admissions: {
    status: IS_ENQUIRY_BLOCKED ? "Temporarily Paused Online" : "Open for Academic Year 2026–2027",
    cutoffDate: "31 March 2026",
    documentsNeeded: [
      "Child's Birth Certificate copy",
      "Child's Aadhaar Card copy (if available)",
      "Parent's Aadhaar Card copy",
      "3 Passport-size photos of child",
    ],
  },
  foodPolicy: {
    policy: "Parents pack healthy homemade vegetarian snacks / lunch.",
    junkFood: "Packaged junk food, chips, chocolates, and sodas are strictly discouraged.",
    support: "Caring attendants assist young toddlers during snack time with opening tiffin boxes, eating, and handwashing.",
  },
};

/**
 * Universal Section Highlighter & Smooth Scroller
 * Scrolls to the given section and triggers a spotlight glow
 */
export function navigateToSection(sectionKey, options = {}) {
  const section = PAGE_SECTIONS[sectionKey] || PAGE_SECTIONS.eligibility;
  if (!section) return;

  const targetEl = document.querySelector(section.selector);
  if (!targetEl) return;

  // Calculate position accounting for fixed navbar
  const navbar = document.querySelector(".navbar");
  const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 85;
  const navbarOffset = navbarHeight + 15;

  const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - navbarOffset;

  window.scrollTo({
    top: Math.max(targetTop, 0),
    behavior: "smooth",
  });

  // Update URL hash smoothly
  window.history.replaceState(null, "", `#${section.id}`);

  // Apply spotlight animation
  const spotlightTarget =
    targetEl.querySelector(".eligibility-panel") ||
    targetEl.querySelector(".founder-card-premium") ||
    targetEl.querySelector(".programs-grid") ||
    targetEl.querySelector(".about-grid") ||
    targetEl.querySelector(".contact-container") ||
    targetEl.querySelector(".gallery-section") ||
    targetEl;

  if (spotlightTarget) {
    spotlightTarget.classList.remove("vt-section-spotlight");
    spotlightTarget.classList.remove("vt-enquiry-box-spotlight");
    void spotlightTarget.offsetWidth; // Force CSS reflow

    if (section.id === "eligibility") {
      spotlightTarget.classList.add("vt-enquiry-box-spotlight");
      setTimeout(() => spotlightTarget.classList.remove("vt-enquiry-box-spotlight"), 4500);

      // Auto-focus first input field
      setTimeout(() => {
        const input = spotlightTarget.querySelector("input[autoComplete='name']") || spotlightTarget.querySelector("input");
        input?.focus({ preventScroll: true });
      }, 700);
    } else {
      spotlightTarget.classList.add("vt-section-spotlight");
      setTimeout(() => spotlightTarget.classList.remove("vt-section-spotlight"), 4500);
    }
  }
}

/**
 * Local AI Query Analyzer
 * Performs semantic matching against school knowledge and returns structured response with page locators
 */
export function processLocalAiQuery(rawQuery) {
  const query = (rawQuery || "").trim().toLowerCase();
  if (!query) {
    return getGreetingResponse();
  }

  // 1. Explicit Page Navigation commands (e.g. "go to founder", "take me to enquiry", "show classes page")
  const isDirectNav =
    query.startsWith("go to ") ||
    query.startsWith("goto ") ||
    query.startsWith("take me to ") ||
    query.startsWith("show me ") ||
    query.startsWith("scroll to ") ||
    query.startsWith("navigate to ") ||
    query.startsWith("open ") ||
    query.includes("page") ||
    query.includes("section");

  // 2. Founders & Leadership
  if (
    query.includes("founder") ||
    query.includes("owner") ||
    query.includes("started") ||
    query.includes("trustee") ||
    query.includes("management") ||
    query.includes("venkatachalam") ||
    query.includes("meyyammai") ||
    query.includes("chettiar") ||
    query.includes("achi") ||
    query.includes("who built") ||
    query.includes("who founded") ||
    query.includes("who is running") ||
    query.includes("who runs") ||
    query.includes("head") ||
    query.includes("principal") ||
    query.includes("director") ||
    (query.includes("who") && query.includes("school"))
  ) {
    return {
      text: "🏛️ **Founders of VT Kindergarten:**\n\nVT Kindergarten was founded by **Thiru Venkatachalam Chettiar** and **Mrs. Meyyammai Achi** with a noble vision to make early childhood education joyful, caring, and deeply meaningful in Karaikkudi.",
      card: {
        title: "✨ Founders' Vision & Philosophy",
        items: [
          "🌟 **Core Belief**: The early years mark the zenith of a child's grasping power.",
          "🧸 **Nurturing Space**: A joyful campus where every toddler feels cherished, safe, and empowered to shine.",
          "🧩 **Montessori Pedagogy**: Blending authentic Montessori methods with playful exploration to foster confidence, creativity, and a lifelong love for learning.",
        ],
      },
      sectionTarget: {
        key: "founder",
        name: "Founders' Note & Vision",
        autoScroll: isDirectNav,
      },
      actions: [
        {
          type: "locate",
          label: "📍 View Founders Section on Page",
          sectionKey: "founder",
          btnClass: "locate",
        },
        {
          type: "action",
          label: "📝 Submit Admission Enquiry",
          actionKey: "enquiry",
          btnClass: "primary",
        },
        {
          type: "link",
          label: "💬 WhatsApp Us",
          url: SCHOOL_KNOWLEDGE.contacts.whatsappUrl,
          btnClass: "whatsapp",
        },
      ],
      quickPills: ["🏫 Classes Offered", "🌸 About School", "⏰ School Timings", "📍 School Location"],
    };
  }

  // 3. Campus Facilities, AC Classrooms, Safety & Hygiene
  if (
    query.includes("facility") ||
    query.includes("facilities") ||
    query.includes("safe") ||
    query.includes("safety") ||
    query.includes("cctv") ||
    query.includes("camera") ||
    query.includes("ac") ||
    query.includes("air condition") ||
    query.includes("air-condition") ||
    query.includes("classroom") ||
    query.includes("water") ||
    query.includes("restroom") ||
    query.includes("toilet") ||
    query.includes("ayyah") ||
    query.includes("care") ||
    query.includes("hygiene") ||
    query.includes("security")
  ) {
    return {
      text: "🎒 **Campus Facilities & Child Safety Standards:**\n\nAt VT Kindergarten, child safety and hygiene are our #1 priority:",
      card: {
        title: "✨ Infrastructure & Care Highlights",
        items: [
          "🛡️ **24/7 CCTV Surveillance**: Monitoring all classrooms, corridors, entrances, and playground.",
          "❄️ **Spacious AC Classrooms**: Air-conditioned with toddler-safe soft flooring.",
          "🛝 **Indoor & Outdoor Play Zones**: Safe, rounded play equipment and soft landing mats.",
          "🚰 **Pure RO Drinking Water**: Multi-stage filtration for clean, safe hydration.",
          "🚻 **Sanitized Restrooms**: Child-height fixtures with caring female attendant support.",
          "👩‍🏫 **Certified Female Staff**: Loving, patient teachers and caring attendants.",
          "🩺 **First-Aid Protocol**: First-aid kit and on-call pediatrician support.",
        ],
      },
      sectionTarget: {
        key: "about",
        name: "Facilities & Highlights",
        autoScroll: isDirectNav,
      },
      actions: [
        {
          type: "locate",
          label: "📍 View Facilities & Highlights on Page",
          sectionKey: "about",
          btnClass: "locate",
        },
        {
          type: "action",
          label: "📝 Book a Campus Visit",
          actionKey: "enquiry",
          btnClass: "primary",
        },
      ],
      quickPills: ["🚌 Van & Transport", "🏫 Classes Offered", "⏰ School Timings", "📍 School Location"],
    };
  }

  // 4. Classes, Academic Programs & Age Eligibility
  if (
    query.includes("class") ||
    query.includes("program") ||
    query.includes("grade") ||
    query.includes("age") ||
    query.includes("eligible") ||
    query.includes("pre kg") ||
    query.includes("prekg") ||
    query.includes("lkg") ||
    query.includes("ukg") ||
    query.includes("playgroup") ||
    query.includes("play group") ||
    query.includes("playschool") ||
    query.includes("cutoff") ||
    query.includes("cut off") ||
    query.includes("syllabus") ||
    query.includes("curriculum") ||
    query.includes("how old") ||
    query.includes("which class")
  ) {
    return {
      text: "🏫 **Classes & Age Criteria at VT Kindergarten (Cutoff: 31 March 2026):**\n\nWe offer four structured early development programs tailored to your child's age on **31 March 2026**:",
      card: {
        title: "📚 Academic Programs & Age Limits",
        items: [
          "🌱 **Play Group**: Age 2+ Years *(Born on or before 31 March 2024)* — Sensory play, habit formation & socialization.",
          "🌸 **Pre-KG**: Age 3+ Years *(Born on or before 31 March 2023)* — Phonics, rhymes, storytelling & creative art.",
          "📖 **LKG**: Age 4+ Years *(Born on or before 31 March 2022)* — Reading readiness, handwriting & foundational math.",
          "🎓 **UKG**: Age 5+ Years *(Born on or before 31 March 2021)* — Primary transition, English reading & math logic.",
        ],
      },
      sectionTarget: {
        key: "programs",
        name: "Classes We Offer",
        autoScroll: isDirectNav,
      },
      actions: [
        {
          type: "locate",
          label: "📍 View Classes Section on Page",
          sectionKey: "programs",
          btnClass: "locate",
        },
        {
          type: "action",
          label: "🧮 Check Exact Age on Calculator",
          actionKey: "calculator",
          btnClass: "enquiry-nav",
        },
        {
          type: "action",
          label: "📝 Submit Admission Enquiry",
          actionKey: "enquiry",
          btnClass: "primary",
        },
      ],
      quickPills: ["⏰ School Timings", "💳 Fees Information", "🎒 Facilities & Safety", "🚌 Van & Transport"],
    };
  }

  // 4. About School, Philosophy & Reputation
  if (
    query.includes("about") ||
    query.includes("why vt") ||
    query.includes("why choose") ||
    query.includes("special") ||
    query.includes("method") ||
    query.includes("montessori") ||
    query.includes("pedagogy") ||
    query.includes("reputation") ||
    query.includes("feedback") ||
    query.includes("best") ||
    query.includes("quality")
  ) {
    return {
      text: "🌸 **About VT Kindergarten — Where Every Child Blossoms:**\n\n*Caring foundation, safe learning, confident futures.*\n\nVT Kindergarten is trusted by families as one of Karaikudi's leading playschools. We blend authentic Montessori pedagogy with activity-based learning to nurture confidence, creativity, and cognitive skills.",
      card: {
        title: "🌟 Key School Highlights",
        items: [
          "🧩 **Montessori & Play-Based Methodology**: Hands-on sensorial learning materials.",
          "🎨 **Activity-Enriched Curriculum**: Phonics, story circles, creative arts, and music.",
          "🏃 **Motor Skills Development**: Fine and gross motor coordination exercises.",
          "❄️ **Air-Conditioned Classrooms**: Toddler-safe soft flooring and comfortable climate.",
          "👩‍🏫 **Caring Female Staff**: Loving teachers and attentive care attendants.",
          "💖 **Parent Feedback**: 'Caring and safe environment, nurturing confidence, fostering development.'",
        ],
      },
      sectionTarget: {
        key: "about",
        name: "About VT Kindergarten",
        autoScroll: isDirectNav,
      },
      actions: [
        {
          type: "locate",
          label: "📍 View About Section on Page",
          sectionKey: "about",
          btnClass: "locate",
        },
        {
          type: "action",
          label: "🏛️ Meet the Founders",
          actionKey: "founder",
          btnClass: "maps",
        },
        {
          type: "action",
          label: "📝 Apply for Admission",
          actionKey: "enquiry",
          btnClass: "primary",
        },
      ],
      quickPills: ["🏛️ Founders & Vision", "🏫 Classes Offered", "🎒 Campus Facilities", "📍 School Location"],
    };
  }

  // 5. School Timings & Working Hours
  if (
    query.includes("timing") ||
    query.includes("time") ||
    query.includes("hour") ||
    query.includes("working") ||
    query.includes("schedule") ||
    query.includes("open") ||
    query.includes("close") ||
    query.includes("holiday") ||
    query.includes("saturday") ||
    query.includes("sunday")
  ) {
    return {
      text: "⏰ **VT Kindergarten Working Hours & Schedule:**",
      card: {
        title: "🕒 Daily School Timings",
        items: [
          "🧸 **Play Group & Pre-KG**: 9:00 AM – 12:30 PM *(Half Day for Toddlers)*",
          "📚 **LKG & UKG**: 9:00 AM – 3:00 PM *(Full Day Program)*",
          "📅 **Working Days**: Monday to Friday",
          "🏫 **Saturday**: Activity Day & Office Consultations (9:30 AM – 1:00 PM)",
          "🏖️ **Sunday**: Holiday",
        ],
      },
      sectionTarget: {
        key: "about",
        name: "School Info",
        autoScroll: false,
      },
      actions: [
        {
          type: "action",
          label: "📝 Submit Admission Enquiry",
          actionKey: "enquiry",
          btnClass: "primary",
        },
        {
          type: "link",
          label: "📞 Call School (+91 73582 93839)",
          url: "tel:+917358293839",
          btnClass: "phone",
        },
      ],
      quickPills: ["🏫 Classes Offered", "🚌 Van & Transport", "📍 School Location", "💳 Fees Information"],
    };
  }

  // 6. Location, Address, Map & How to Reach
  if (
    query.includes("location") ||
    query.includes("address") ||
    query.includes("where") ||
    query.includes("map") ||
    query.includes("direction") ||
    query.includes("reach") ||
    query.includes("karaikudi") ||
    query.includes("karaikkudi") ||
    query.includes("subramaniapuram") ||
    query.includes("vairavapuram") ||
    query.includes("landmark") ||
    query.includes("enga irukku") ||
    query.includes("enga")
  ) {
    return {
      text: "📍 **VT Kindergarten Campus Location in Karaikudi:**\n\n**No 11, 7th Street, Subramaniapuram, South Extension, Vairavapuram, Karaikkudi – 630002, Tamil Nadu.**\n*(Landmark: Near Reliance Smart Bazaar)*",
      card: {
        title: "📌 Campus Highlights & Accessibility",
        items: [
          "🚗 Peaceful residential neighborhood with broad roads and easy parking.",
          "🛒 Convenient landmark near Reliance Smart Bazaar.",
          "🚌 Safe school van pickup points across all surrounding areas.",
        ],
      },
      sectionTarget: {
        key: "contact",
        name: "Location & Campus Map",
        autoScroll: isDirectNav,
      },
      actions: [
        {
          type: "locate",
          label: "📍 View Map Section on Page",
          sectionKey: "contact",
          btnClass: "locate",
        },
        {
          type: "link",
          label: "🗺️ Open in Google Maps",
          url: SCHOOL_KNOWLEDGE.location.googleMapsUrl,
          btnClass: "maps",
        },
        {
          type: "link",
          label: "📞 Call School Desk",
          url: "tel:+917358293839",
          btnClass: "phone",
        },
      ],
      quickPills: ["🚌 Van & Transport", "⏰ School Timings", "📝 Admission Enquiry"],
    };
  }

  // 7. Contact Details, Phone, WhatsApp & Email
  if (
    query.includes("contact") ||
    query.includes("phone") ||
    query.includes("call") ||
    query.includes("number") ||
    query.includes("whatsapp") ||
    query.includes("email") ||
    query.includes("mail") ||
    query.includes("mobile") ||
    query.includes("talk") ||
    query.includes("speak") ||
    query.includes("pesa")
  ) {
    return {
      text: "📞 **Contact VT Kindergarten Directly:**\n\nOur friendly admissions desk is happy to help you with admissions, campus tours, and syllabus queries:",
      card: {
        title: "📱 Official School Channels",
        items: [
          "📞 **Primary Phone**: +91 73582 93839",
          "📱 **Alternate Phone**: +91 99949 94291",
          "💬 **WhatsApp**: +91 73582 93839",
          "📧 **Official Email**: vtkindergarten@gmail.com",
          "📸 **Instagram**: @vt_kindergarten",
          "📍 **Campus Address**: No 11, 7th St, Subramaniapuram, Karaikkudi – 630002",
        ],
      },
      sectionTarget: {
        key: "contact",
        name: "Contact Us Section",
        autoScroll: isDirectNav,
      },
      actions: [
        {
          type: "locate",
          label: "📍 View Contact Section on Page",
          sectionKey: "contact",
          btnClass: "locate",
        },
        {
          type: "link",
          label: "💬 Chat on WhatsApp",
          url: SCHOOL_KNOWLEDGE.contacts.whatsappUrl,
          btnClass: "whatsapp",
        },
        {
          type: "link",
          label: "📞 Call +91 73582 93839",
          url: "tel:+917358293839",
          btnClass: "phone",
        },
      ],
      quickPills: ["📍 School Location", "📝 Admission Enquiry", "🏫 Classes Offered"],
    };
  }


  // 9. Transport / School Van
  if (
    !query.includes("vanakkam") &&
    (/\b(van|vans|bus|buses|transport|pickup|pick up|drop|route|routes)\b/i.test(query) ||
      query.includes("school van") ||
      query.includes("van facility") ||
      query.includes("van irukka") ||
      query.includes("sekkalai") ||
      query.includes("kallukatti") ||
      query.includes("kottaiyur"))
  ) {
    return {
      text: "🚌 **School Van & Transport Facility:**\n\nYes! We provide safe, school-operated van transport across Karaikkudi with caring female attendants onboard for safe boarding and handovers.",
      card: {
        title: "🚐 Van Service Details & Coverage",
        items: [
          "🗺️ **Key Coverage Areas**: Subramaniapuram, Vairavapuram, South Extension, Kallukatti, Sekkalai, College Road, and nearby residential zones.",
          "👩‍👧 **Attendant Onboard**: Caring lady attendant ensures toddlers are safely strapped and supervised.",
          "📍 **Door-to-Door Coordination**: Convenient pickup and drop coordination with parents.",
        ],
      },
      sectionTarget: {
        key: "contact",
        name: "Transport Desk",
        autoScroll: false,
      },
      actions: [
        {
          type: "link",
          label: "📞 Check Route (+91 73582 93839)",
          url: "tel:+917358293839",
          btnClass: "phone",
        },
        {
          type: "action",
          label: "📝 Enquire for Transport",
          actionKey: "enquiry",
          btnClass: "primary",
        },
      ],
      quickPills: ["📍 School Location", "⏰ School Timings", "🏫 Classes Offered"],
    };
  }

  // 10. Fees & Payment Structure
  if (
    query.includes("fee") ||
    query.includes("fees") ||
    query.includes("cost") ||
    query.includes("charge") ||
    query.includes("price") ||
    query.includes("installment") ||
    query.includes("donation") ||
    query.includes("evlo") ||
    query.includes("how much")
  ) {
    return {
      text: "💳 **Transparent & Affordable Fee Structure:**\n\nAt VT Kindergarten, we believe high-quality early education should be accessible and transparent. **We do not charge any donation fees.**\n\nFees vary moderately by grade level (Play Group, Pre-KG, LKG, UKG) and include books, activity supplies, art kits, and celebration events.",
      card: {
        title: "💰 Fee Payment Features",
        items: [
          "✨ **Zero Donation**: Clear, transparent tuition structure.",
          "📅 **Term-Wise Installments**: Flexible 3-term payment schedule to ease parent budgets.",
          "📱 **Digital Payments**: Instant digital receipts via UPI (GPay/PhonePe), Net Banking, or cash.",
        ],
      },
      sectionTarget: {
        key: "eligibility",
        name: "Admission Desk",
        autoScroll: false,
      },
      actions: [
        {
          type: "action",
          label: "📝 Request Fee Quote via Enquiry",
          actionKey: "enquiry",
          btnClass: "primary",
        },
        {
          type: "link",
          label: "💬 WhatsApp for Exact Fees",
          url: "https://wa.me/917358293839?text=Hello%20VT%20Kindergarten,%20I%20would%20like%20to%20know%20the%20fee%20structure%20for%20admissions.",
          btnClass: "whatsapp",
        },
      ],
      quickPills: ["🏫 Classes Offered", "⏰ School Timings", "📍 School Location"],
    };
  }

  // 11. Joyful Activities, Events, Celebrations & Gallery
  if (
    query.includes("activit") ||
    query.includes("event") ||
    query.includes("celebrat") ||
    query.includes("festival") ||
    query.includes("sport") ||
    query.includes("photo") ||
    query.includes("picture") ||
    query.includes("image") ||
    query.includes("gallery") ||
    query.includes("video") ||
    query.includes("instagram") ||
    query.includes("ig") ||
    query.includes("life")
  ) {
    return {
      text: "🎉 **Joyful Activities & Campus Life at VT Kindergarten:**\n\nA glimpse into our vibrant school environment where beautiful memories and happy childhoods are created!",
      card: {
        title: "📸 Student Life & Celebrations",
        items: [
          "🎨 **Creative Arts & Sensory Play**: Clay modeling, finger painting, and color-themed days.",
          "📚 **Phonics & Story Circles**: Interactive rhymes, puppetry, and vocabulary games.",
          "🏃 **Sports & Gross Motor Fun**: Child-safe obstacle courses and soft gym play.",
          "🎭 **Cultural Festivals & Annual Day**: Pongal, Navratri Golu, Krishna Jayanthi, Grandparents Day, and stage performances.",
          "🤝 **Good Habits & Manners**: Mealtime etiquette, sharing, and clean-up habits.",
        ],
      },
      sectionTarget: {
        key: "gallery",
        name: "Campus Gallery",
        autoScroll: isDirectNav,
      },
      actions: [
        {
          type: "locate",
          label: "📍 View Photo Gallery on Page",
          sectionKey: "gallery",
          btnClass: "locate",
        },
        {
          type: "locate",
          label: "📸 View Instagram Feed on Page",
          sectionKey: "instagram",
          btnClass: "maps",
        },
        {
          type: "link",
          label: "🌐 Open Instagram (@vt_kindergarten)",
          url: SCHOOL_KNOWLEDGE.contacts.instagramUrl,
          btnClass: "whatsapp",
        },
      ],
      quickPills: ["🏫 Classes Offered", "🎒 Campus Facilities", "⏰ School Timings", "📍 School Location"],
    };
  }

  // 12. Food, Snacks & Lunch Policy
  if (
    query.includes("food") ||
    query.includes("snack") ||
    query.includes("lunch") ||
    query.includes("eat") ||
    query.includes("diet") ||
    query.includes("tiffin") ||
    query.includes("feed")
  ) {
    return {
      text: "🍎 **Food, Snacks & Nutrition Policy:**",
      card: {
        title: "🍱 Healthy Eating Guidelines",
        items: [
          "🥗 **Homemade Food**: Parents are requested to pack healthy vegetarian snacks or lunch (fruits, idli, boiled corn, nuts).",
          "🚫 **Zero Junk Food Rule**: Packaged chips, chocolates, and carbonated drinks are strictly discouraged during school hours.",
          "👩‍👧 **Attendant Assistance**: Attendants gently help toddlers open tiffin boxes, eat without mess, and wash hands with soap.",
          "🚰 **Pure RO Water**: Clean, filtered drinking water is available across the campus.",
        ],
      },
      sectionTarget: {
        key: "about",
        name: "Campus Standards",
        autoScroll: false,
      },
      actions: [
        {
          type: "action",
          label: "📝 Submit Admission Enquiry",
          actionKey: "enquiry",
          btnClass: "primary",
        },
        {
          type: "link",
          label: "📞 Contact School Desk",
          url: "tel:+917358293839",
          btnClass: "phone",
        },
      ],
      quickPills: ["⏰ School Timings", "🎒 Facilities & Safety", "🏫 Classes Offered"],
    };
  }

  // 13. Admissions, Enquiry & Age Calculator
  if (
    query.includes("enquiry") ||
    query.includes("admission") ||
    query.includes("apply") ||
    query.includes("join") ||
    query.includes("register") ||
    query.includes("seat") ||
    query.includes("form") ||
    query.includes("enroll") ||
    query.includes("enrol") ||
    query.includes("calculator") ||
    query.includes("how to apply") ||
    query.includes("procedure") ||
    query.includes("document")
  ) {
    if (IS_ENQUIRY_BLOCKED) {
      return {
        text: "🔒 **Online Admission Enquiries are Temporarily Paused:**\n\nWe are currently not accepting new online enquiries through the website. For admission availability or to schedule an in-person campus visit, please connect directly with our admissions office:",
        actions: [
          {
            type: "link",
            label: "📞 Call Admissions (+91 73582 93839)",
            url: "tel:+917358293839",
            btnClass: "phone",
          },
          {
            type: "link",
            label: "💬 WhatsApp Coordinator",
            url: ENQUIRY_BLOCKED_NOTICE.whatsappUrl,
            btnClass: "whatsapp",
          },
          {
            type: "locate",
            label: "📍 View Campus Location on Page",
            sectionKey: "contact",
            btnClass: "locate",
          },
        ],
        quickPills: ["📍 School Location", "🏫 Classes Offered", "⏰ School Timings"],
      };
    }

    return {
      text: "📝 **Admission Process & Enquiry at VT Kindergarten:**\n\nAdmissions are open for the academic year 2026–2027! You can use our online **Age Eligibility Calculator & Enquiry Form** below to check your child's eligible class and submit an enquiry directly.",
      card: {
        title: "📋 3-Step Admission Procedure",
        items: [
          "1️⃣ **Check Eligibility**: Enter child's date of birth in the calculator below.",
          "2️⃣ **Submit Enquiry**: Fill parent name and phone number.",
          "3️⃣ **Campus Visit**: Our coordinator will call you to schedule a friendly campus visit and walkthrough.",
        ],
      },
      sectionTarget: {
        key: "eligibility",
        name: "Age Calculator & Admission Enquiry",
        autoScroll: true, // Seamlessly take the user right to the form!
      },
      actions: [
        {
          type: "locate",
          label: "👉 Open Admission Enquiry Form on Page",
          sectionKey: "eligibility",
          btnClass: "enquiry-nav",
        },
        {
          type: "link",
          label: "💬 WhatsApp Us Directly",
          url: SCHOOL_KNOWLEDGE.contacts.whatsappUrl,
          btnClass: "whatsapp",
        },
      ],
      quickPills: ["🏫 Classes Offered", "⏰ School Timings", "💳 Fees Information", "📍 School Location"],
    };
  }

  // 14. Greetings & Conversational
  if (
    query === "hi" ||
    query === "hello" ||
    query === "hey" ||
    query.includes("good morning") ||
    query.includes("good evening") ||
    query.includes("vanakkam") ||
    query.includes("namaste") ||
    query.includes("welcome")
  ) {
    return getGreetingResponse();
  }

  // 15. Intelligent Fallback (Generates helpful guidance and highlights popular topics)
  return {
    text: `I'd love to help you with **"${rawQuery}"**! Here are the most frequently explored topics by parents, or you can connect directly with our admissions coordinator:`,
    sectionTarget: null,
    actions: [
      {
        type: "locate",
        label: "📍 View Classes & Programs",
        sectionKey: "programs",
        btnClass: "locate",
      },
      {
        type: "action",
        label: "📝 Submit Admission Enquiry",
        actionKey: "enquiry",
        btnClass: "primary",
      },
      {
        type: "link",
        label: "💬 Ask Coordinator on WhatsApp",
        url: `https://wa.me/917358293839?text=Hello%20VT%20Kindergarten,%20I%20have%20a%20question:%20${encodeURIComponent(rawQuery)}`,
        btnClass: "whatsapp",
      },
      {
        type: "link",
        label: "📞 Call School Desk",
        url: "tel:+917358293839",
        btnClass: "phone",
      },
    ],
    quickPills: ["🏛️ Founders & Vision", "🏫 Classes Offered", "🌸 About School", "📝 Admission Enquiry", "⏰ School Timings", "📍 School Location"],
  };
}

function getGreetingResponse() {
  return {
    text: "👋 **Vanakkam & Welcome to VT Kindergarten, Karaikudi!**\n\nHow can I help you today? You can choose a topic below or type any question regarding classes, admissions, founders, timings, or location:",
    sectionTarget: null,
    quickPills: [
      "🏛️ Founders & Vision",
      "🏫 Classes & Age Limit",
      "🌸 About School",
      "📝 Admission Enquiry",
      "⏰ School Timings",
      "📍 School Location",
      "🎒 Facilities & Safety",
      "💳 Fees Information",
    ],
  };
}
