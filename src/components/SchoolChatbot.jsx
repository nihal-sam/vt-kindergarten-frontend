import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { IS_ENQUIRY_BLOCKED, ENQUIRY_BLOCKED_NOTICE } from "../utils/enquiryConfig";
import "./SchoolChatbot.css";

const QUICK_ACTIONS = [
  { id: "founder", label: "🏛️ Founders & Vision" },
  { id: "classes", label: "🏫 Classes & Age Limit" },
  { id: "about", label: "🌸 About VT School" },
  { id: "timings", label: "⏰ School Timings" },
  { id: "enquiry", label: IS_ENQUIRY_BLOCKED ? "📞 Admissions Desk" : "📝 Admission Enquiry" },
  { id: "location", label: "📍 Location & Maps" },
  { id: "facilities", label: "🎒 Facilities & Safety" },
  { id: "fees", label: "💳 Fees Information" },
  { id: "transport", label: "🚌 Van & Transport" },
  { id: "activities", label: "🎉 Joyful Activities" },
  { id: "contact", label: "📞 Contact & WhatsApp" },
];

export default function SchoolChatbot({ onNavigateToEnquiry }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Enquiry Form State (embedded inside chat)
  const [enquiryForm, setEnquiryForm] = useState({
    parentName: "",
    childName: "",
    grade: "Pre KG (3+ yrs)",
    phone: "",
    notes: "",
  });
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);

  // Initial Welcome Messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      time: "Just now",
      text: "👋 Vanakkam & Welcome to **VT Kindergarten**, Karaikudi! How can I help you today?",
      quickPills: ["🏛️ Founders & Vision", "🏫 Classes & Age Limit", "🌸 About School", "📝 Admission Enquiry", "⏰ Timings"],
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(scrollToBottom, 100);
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isTyping]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Bot response simulator
  const appendBotResponse = (responseObj) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "bot",
          time: getCurrentTime(),
          ...responseObj,
        },
      ]);
    }, 450);
  };

  // Navigate seamlessly to the official Admission Enquiry Box with mobile app spotlight
  const navigateToEnquirySection = (immediate = false) => {
    const executeScrollAndSpotlight = () => {
      // 1. Smoothly minimize chatbot modal to ensure full screen view
      setIsOpen(false);

      if (typeof onNavigateToEnquiry === "function") {
        onNavigateToEnquiry();
        return;
      }

      // 2. Fallback navigation if callback not provided
      setTimeout(() => {
        const eligibilitySec = document.getElementById("eligibility");
        const enquiryBox =
          document.getElementById("enquiry-box") ||
          eligibilitySec?.querySelector(".eligibility-panel") ||
          eligibilitySec;

        if (!eligibilitySec && !enquiryBox) return;

        const navbar = document.querySelector(".navbar");
        const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 85;
        const navbarOffset = navbarHeight + 20;

        const target = enquiryBox || eligibilitySec;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - navbarOffset;

        window.scrollTo({
          top: Math.max(targetTop, 0),
          behavior: "smooth",
        });
        window.history.replaceState(null, "", "#eligibility");

        // 3. Highlight the enquiry box with modern mobile-app spotlight pulse
        if (enquiryBox) {
          enquiryBox.classList.remove("vt-enquiry-box-spotlight");
          void enquiryBox.offsetWidth; // Force CSS reflow to replay animation
          enquiryBox.classList.add("vt-enquiry-box-spotlight");

          setTimeout(() => {
            enquiryBox.classList.remove("vt-enquiry-box-spotlight");
          }, 4500);
        }

        // 4. Auto-focus the child's name field
        setTimeout(() => {
          const firstInput =
            enquiryBox?.querySelector("input[autoComplete='name']") ||
            enquiryBox?.querySelector("input") ||
            eligibilitySec?.querySelector("input");
          if (firstInput) {
            firstInput.focus({ preventScroll: true });
          }
        }, 650);
      }, 200);
    };

    if (immediate) {
      executeScrollAndSpotlight();
    } else {
      // Allow user to briefly see the bot confirmation card before transition
      setTimeout(executeScrollAndSpotlight, 750);
    }
  };

  // Handle Quick Action Clicks or Keyword Matches
  const handleAction = (actionId) => {
    const act = actionId.toLowerCase();

    // Direct navigation button click
    if (act === "go_to_enquiry" || act === "direct_enquiry_scroll") {
      navigateToEnquirySection(true);
      return;
    }

    // Founders & Leadership
    if (
      act.includes("founder") ||
      act.includes("owner") ||
      act.includes("started") ||
      act.includes("trustee") ||
      act.includes("management") ||
      act.includes("venkatachalam") ||
      act.includes("chettiar") ||
      act.includes("meyyammai") ||
      act.includes("achi") ||
      act.includes("who founded") ||
      act.includes("who built") ||
      act.includes("who started") ||
      (act.includes("who") && (act.includes("run") || act.includes("head") || act.includes("lead") || act.includes("director")))
    ) {
      appendBotResponse({
        text: "🏛️ **Founders of VT Kindergarten:**\n\nVT Kindergarten was founded by **Thiru Venkatachalam Chettiar** and **Mrs. Meyyammai Achi** with a noble vision to make early childhood education joyful, caring, and deeply meaningful in Karaikkudi.",
        card: {
          title: "✨ Founders' Vision & Philosophy",
          items: [
            "🌟 **Core Belief**: The early years mark the zenith of a child's grasping power.",
            "🧸 **Nurturing Space**: Creating an environment where every child feels cherished, safe, and encouraged to shine.",
            "🧩 **Montessori Pedagogy**: Blending authentic Montessori methods with playful exploration to foster unshakeable confidence, creativity, and a lifelong love for learning.",
          ],
        },
        actions: [
          {
            type: "action",
            label: "📝 Submit Admission Enquiry",
            actionKey: "enquiry",
            btnClass: "primary",
          },
          {
            type: "action",
            label: "🌸 About Our School",
            actionKey: "about",
            btnClass: "maps",
          },
          {
            type: "link",
            label: "💬 WhatsApp Founders' Desk",
            url: "https://wa.me/917358293839?text=Hello%20VT%20Kindergarten,%20I%20would%20like%20to%20learn%20more%20about%20your%20school%20and%20founders.",
            btnClass: "whatsapp",
          },
        ],
        quickPills: ["🌸 About School", "🏫 Classes Offered", "⏰ School Timings", "📍 School Location"],
      });
      return;
    }

    // About School & Highlights
    if (
      act.includes("about") ||
      act.includes("why vt") ||
      act.includes("why choose") ||
      act.includes("special") ||
      act.includes("curriculum") ||
      act.includes("montessori") ||
      act.includes("pedagogy") ||
      act.includes("blossom") ||
      act.includes("reputation") ||
      act.includes("feedback") ||
      act.includes("best playschool")
    ) {
      appendBotResponse({
        text: "🌸 **About VT Kindergarten — Where Every Child Blossoms:**\n\n*Caring foundation, safe learning, confident futures.*\n\nParents across Karaikkudi place their highest trust in VT Kindergarten as one of the leading, best playschools. We prioritize safety, confidence-building, and holistic growth in every child's journey.",
        card: {
          title: "🌟 Key School Highlights",
          items: [
            "🧩 **Play-based learning & Montessori methodology** for sensory development.",
            "🎨 **Activity-enriched curriculum** designed to spark natural curiosity.",
            "🏃 **Gross & fine motor skills** development programs.",
            "💬 **Close parent-teacher communication** & regular developmental updates.",
            "❄️ **Spacious, air-conditioned classrooms** with toddler-safe soft flooring.",
            "💖 **Parent Feedback**: Caring and safe environment, nurturing confidence, fostering holistic development.",
          ],
        },
        actions: [
          {
            type: "action",
            label: "📝 Apply for Admission",
            actionKey: "enquiry",
            btnClass: "primary",
          },
          {
            type: "action",
            label: "🏛️ Meet the Founders",
            actionKey: "founder",
            btnClass: "maps",
          },
          {
            type: "link",
            label: "📞 Call School (+91 73582 93839)",
            url: "tel:+917358293839",
            btnClass: "phone",
          },
        ],
        quickPills: ["🏛️ Founders & Vision", "🏫 Classes Offered", "🎒 Campus Facilities", "📍 School Location"],
      });
      return;
    }

    // Location
    if (act.includes("location") || act.includes("address") || act.includes("map") || act.includes("where") || act.includes("directions") || act.includes("reach") || act.includes("karaikkudi") || act.includes("subramaniapuram")) {
      appendBotResponse({
        text: "📍 **VT Kindergarten Campus Location:**\n\nNo 11, 7th Street, Subramaniapuram, South Extension, Vairavapuram, Karaikkudi – 630002, Tamil Nadu.\n*(Near Reliance Smart Bazaar)*",
        card: {
          title: "📌 Campus Highlights",
          items: [
            "Central location in Karaikkudi with safe road access.",
            "Dedicated pickup/drop parking zone for parents.",
            "Near Reliance Smart Bazaar for easy navigation.",
          ],
        },
        actions: [
          {
            type: "link",
            label: "🗺️ Open in Google Maps",
            url: "https://maps.google.com/?q=VT+Kindergarten,+Play+school+and+Pre+school,+11,+7th+St,+near+Reliance+Smart+Bazaar,+Subramaniapuram,+south+extension,+Vairavapuram,+Karaikkudi+(M.Corp),+Tamil+Nadu+630002",
            btnClass: "maps",
          },
          {
            type: "link",
            label: "📞 Call School (+91 73582 93839)",
            url: "tel:+917358293839",
            btnClass: "phone",
          },
        ],
        quickPills: ["🏫 Classes & Age Limit", "⏰ School Timings", "📝 Admission Enquiry"],
      });
      return;
    }

    // Classes & Programs
    if (act.includes("class") || act.includes("program") || act.includes("age") || act.includes("eligible") || act.includes("grade") || act.includes("pre kg") || act.includes("lkg") || act.includes("ukg") || act.includes("playgroup") || act.includes("play group") || act.includes("cutoff") || act.includes("syllabus")) {
      appendBotResponse({
        text: "🏫 **Classes & Age Eligibility at VT Kindergarten (Cutoff: 31 March 2026):**\n\nWe offer four specialized early education programs structured by the child's age on **31 March 2026**:",
        card: {
          title: "📚 Academic Programs & Age Criteria",
          items: [
            "🌱 **Play Group**: Age 2+ Years *(Born on or before 31 March 2024)* — Sensory play, habit formation & motor skills.",
            "🌸 **Pre-KG**: Age 3+ Years *(Born on or before 31 March 2023)* — Phonics, rhymes, storytelling & creative art.",
            "📖 **LKG**: Age 4+ Years *(Born on or before 31 March 2022)* — Reading readiness, handwriting & foundational math.",
            "🎓 **UKG**: Age 5+ Years *(Born on or before 31 March 2021)* — Primary transition, verbal fluency & logic.",
          ],
        },
        actions: [
          {
            type: "action",
            label: "📝 Submit Admission Enquiry",
            actionKey: "enquiry",
            btnClass: "primary",
          },
          {
            type: "action",
            label: "🧮 Check Exact Age Calculator",
            actionKey: "calculator",
            btnClass: "maps",
          },
        ],
        quickPills: ["⏰ School Timings", "🎒 Facilities & Safety", "💳 Fees Information"],
      });
      return;
    }

    // Joyful Activities & Celebrations
    if (
      act.includes("activit") ||
      act.includes("event") ||
      act.includes("celebrat") ||
      act.includes("sport") ||
      act.includes("festival") ||
      act.includes("photo") ||
      act.includes("gallery") ||
      act.includes("life")
    ) {
      appendBotResponse({
        text: "🎉 **Joyful Activities & Campus Life at VT Kindergarten:**\n\nA glimpse into our activity-filled school environment where beautiful memories and happy childhoods are made!",
        card: {
          title: "📸 Student Life & Celebrations",
          items: [
            "🎨 **Creative Arts & Sensory Play**: Finger painting, craftwork, clay modeling, and color-themed days.",
            "📚 **Phonics & Story Circles**: Interactive rhymes, puppetry, and active vocabulary games.",
            "🏃 **Sports & Gross Motor Fun**: Child-friendly obstacle courses, balancing beams, and soft-play gym.",
            "🎭 **Cultural Festivals & Annual Day**: Pongal, Navratri, Grandparents Day, and stage confidence performances.",
            "🤝 **Good Habits & Social Etiquette**: Mealtime manners, sharing, clean-up habits, and kindness.",
          ],
        },
        actions: [
          {
            type: "link",
            label: "📸 Open Instagram (@vt_kindergarten)",
            url: "https://www.instagram.com/vt_kindergarten/",
            btnClass: "whatsapp",
          },
          {
            type: "action",
            label: "📝 Submit Admission Enquiry",
            actionKey: "enquiry",
            btnClass: "primary",
          },
        ],
        quickPills: ["🏫 Classes Offered", "🎒 Campus Facilities", "⏰ School Timings", "📍 Location"],
      });
      return;
    }

    // Email, Instagram & Social Channels
    if (
      act.includes("instagram") ||
      act.includes("ig") ||
      act.includes("email") ||
      act.includes("mail") ||
      act.includes("social")
    ) {
      appendBotResponse({
        text: "🌐 **Official Online & Social Channels:**\n\nConnect with VT Kindergarten across our official communication channels:",
        card: {
          title: "📱 Digital Channels",
          items: [
            "📧 **Official Email**: vtkindergarten@gmail.com",
            "📸 **Instagram Profile**: @vt_kindergarten",
            "💬 **Official WhatsApp**: +91 73582 93839",
            "📞 **Office Phone**: +91 73582 93839",
          ],
        },
        actions: [
          {
            type: "link",
            label: "📸 Open Instagram (@vt_kindergarten)",
            url: "https://www.instagram.com/vt_kindergarten/",
            btnClass: "whatsapp",
          },
          {
            type: "link",
            label: "✉️ Send Email",
            url: "mailto:vtkindergarten@gmail.com",
            btnClass: "phone",
          },
        ],
        quickPills: ["📍 School Location", "🏛️ Founders & Vision", "📝 Admission Enquiry"],
      });
      return;
    }

    // Timings
    if (act.includes("timing") || act.includes("time") || act.includes("hour") || act.includes("working") || act.includes("schedule") || act.includes("day") || act.includes("saturday")) {
      appendBotResponse({
        text: "⏰ **School Working Hours & Timings:**",
        card: {
          title: "🕒 Daily Schedule",
          items: [
            "🧸 **Play Group & Pre-KG**: 9:00 AM – 12:30 PM (Half Day)",
            "📚 **LKG & UKG**: 9:00 AM – 3:00 PM (Full Day)",
            "📅 **Working Days**: Monday to Friday",
            "🏫 **Saturday**: Activity day / Office Desk open (9:30 AM – 1:00 PM)",
            "🏖️ **Sunday**: Holiday",
          ],
        },
        actions: [
          {
            type: "action",
            label: "📝 Apply for Admission",
            actionKey: "enquiry",
            btnClass: "primary",
          },
        ],
        quickPills: ["📍 School Location", "🏫 Classes Offered", "🚌 Van & Transport"],
      });
      return;
    }

    // Enquiry / Admission Navigation (Mobile Application Pattern)
    if (
      act.includes("enquiry") ||
      act.includes("admission") ||
      act.includes("apply") ||
      act.includes("join") ||
      act.includes("register") ||
      act.includes("seat") ||
      act.includes("form") ||
      act.includes("fill") ||
      act.includes("enroll") ||
      act.includes("enrol")
    ) {
      if (IS_ENQUIRY_BLOCKED) {
        appendBotResponse({
          text: "🔒 **Online Admission Enquiries are Temporarily Paused:**\n\nWe are currently not accepting new online enquiries through the website. For admission availability, syllabus information, or to schedule a campus visit, please connect with our admissions office directly:",
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
              type: "link",
              label: "🗺️ Visit Campus (Karaikkudi)",
              url: "https://maps.google.com/?q=VT+Kindergarten,+Play+school+and+Pre+school,+11,+7th+St,+near+Reliance+Smart+Bazaar,+Subramaniapuram,+south+extension,+Vairavapuram,+Karaikkudi+(M.Corp),+Tamil+Nadu+630002",
              btnClass: "maps",
            },
          ],
          quickPills: ["📍 School Location", "🏫 Classes Offered", "⏰ School Timings"],
        });
        return;
      }

      appendBotResponse({
        text: "✨ **Directing you to the Admission Enquiry Box...**\n\nI am navigating you straight to our official Admission Enquiry & Eligibility section below so you can enter your child's details directly!",
        actions: [
          {
            type: "action",
            label: "👉 Open Admission Enquiry Box",
            actionKey: "go_to_enquiry",
            btnClass: "enquiry-nav",
          },
          {
            type: "link",
            label: "💬 WhatsApp Us Instead",
            url: "https://wa.me/917358293839?text=Hello%20VT%20Kindergarten,%20I%20would%20like%20to%20enquire%20about%20admission.",
            btnClass: "whatsapp",
          },
        ],
        quickPills: ["📍 School Location", "🏫 Classes Offered", "⏰ School Timings"],
      });

      // Smooth auto-scroll to the highlighted enquiry box just like in a modern mobile app
      navigateToEnquirySection(false);
      return;
    }

    // Age Calculator scroll
    if (act === "calculator") {
      navigateToEnquirySection(false);
      return;
    }

    // Facilities & Safety
    if (act.includes("facility") || act.includes("facilities") || act.includes("safe") || act.includes("safety") || act.includes("cctv") || act.includes("ac") || act.includes("classroom") || act.includes("water")) {
      appendBotResponse({
        text: "🎒 **Campus Facilities & Child Safety:**",
        card: {
          title: "✨ What We Provide for Your Child",
          items: [
            "🛡️ **24/7 CCTV Surveillance** covering campus and play areas.",
            "❄️ **Spacious Air-Conditioned Classrooms** designed for toddlers.",
            "🛝 **Safe Indoor & Outdoor Play Equipment** with soft flooring.",
            "👩‍🏫 **Trained & Caring Female Teaching Staff** + attentive care attendants.",
            "🚰 **Pure Filtered RO Drinking Water** & sanitized child-friendly restrooms.",
            "🎨 **Montessori & Phonics Learning Kits** for hands-on sensory learning.",
          ],
        },
        actions: [
          {
            type: "action",
            label: "📝 Book a Campus Visit",
            actionKey: "enquiry",
            btnClass: "primary",
          },
        ],
        quickPills: ["📍 School Location", "🚌 Van & Transport", "📞 Contact & WhatsApp"],
      });
      return;
    }

    // Fees Information
    if (act.includes("fee") || act.includes("fees") || act.includes("cost") || act.includes("charge") || act.includes("price") || act.includes("installment")) {
      appendBotResponse({
        text: "💳 **Fee Structure & Transparent Pricing:**\n\nAt VT Kindergarten, we maintain an affordable and transparent fee structure with zero hidden charges. Fees vary by grade level (Play Group, Pre-KG, LKG, UKG) and include books, learning activity kits, and celebrations.\n\nTerm-wise flexible installments are available for parents.",
        actions: [
          {
            type: "action",
            label: "📝 Request Fee Quote via Enquiry",
            actionKey: "enquiry",
            btnClass: "primary",
          },
          {
            type: "link",
            label: "💬 WhatsApp for Fee Structure",
            url: "https://wa.me/917358293839?text=Hello%20VT%20Kindergarten,%20I%20would%20like%20to%20know%20the%20fee%20structure%20for%20admissions.",
            btnClass: "whatsapp",
          },
        ],
        quickPills: ["🏫 Classes Offered", "⏰ School Timings", "📍 School Location"],
      });
      return;
    }

    // Transport / Van
    if (act.includes("van") || act.includes("bus") || act.includes("transport") || act.includes("pickup") || act.includes("drop") || act.includes("route")) {
      appendBotResponse({
        text: "🚌 **School Van & Transport Facility:**\n\nYes! We provide safe, GPS-monitored school van pickup and drop services across Karaikkudi and nearby residential areas with caring lady attendants onboard for your child's safety.",
        card: {
          title: "🚐 Van Service Coverage",
          items: [
            "Subramaniapuram, Vairavapuram & South Extension",
            "Kallukatti, College Road & Sekkalai",
            "Custom stop coordination for young toddlers",
          ],
        },
        actions: [
          {
            type: "link",
            label: "📞 Check Van Route (+91 73582 93839)",
            url: "tel:+917358293839",
            btnClass: "phone",
          },
        ],
        quickPills: ["📍 School Location", "📝 Admission Enquiry", "⏰ School Timings"],
      });
      return;
    }

    // Contact & WhatsApp
    if (act.includes("contact") || act.includes("phone") || act.includes("call") || act.includes("number") || act.includes("whatsapp") || act.includes("talk") || act.includes("mobile")) {
      appendBotResponse({
        text: "📞 **Contact VT Kindergarten Directly:**\n\nOur friendly admissions team is ready to assist you:",
        card: {
          title: "📱 Direct Contact Channels",
          items: [
            "📞 **Primary Phone**: +91 73582 93839",
            "📱 **Alternate Phone**: +91 99949 94291",
            "💬 **WhatsApp**: +91 73582 93839",
            "📍 **Campus Address**: No 11, 7th St, Subramaniapuram, Karaikkudi – 630002",
          ],
        },
        actions: [
          {
            type: "link",
            label: "💬 Chat on WhatsApp",
            url: "https://wa.me/917358293839?text=Hello%20VT%20Kindergarten,%20I%20have%20an%20enquiry%20regarding%20school%20admissions.",
            btnClass: "whatsapp",
          },
          {
            type: "link",
            label: "📞 Call +91 73582 93839",
            url: "tel:+917358293839",
            btnClass: "phone",
          },
        ],
        quickPills: ["📍 School Location", "🏫 Classes Offered", "📝 Admission Enquiry"],
      });
      return;
    }

    // Greetings
    if (act.includes("hi") || act.includes("hello") || act.includes("hey") || act.includes("morning") || act.includes("evening") || act.includes("vanakkam")) {
      appendBotResponse({
        text: "👋 Hello there! How may I assist you with VT Kindergarten today? You can choose a topic below or type your question:",
        quickPills: ["📍 School Location", "🏫 Classes Offered", "📝 Admission Enquiry", "⏰ Timings"],
      });
      return;
    }

    // Fallback response for unhandled questions
    appendBotResponse({
      text: `I'd love to help you with **"${actionId}"**! Here are the most popular topics parents ask about, or you can talk directly with our admissions coordinator:`,
      actions: [
        {
          type: "link",
          label: "💬 WhatsApp Coordinator Directly",
          url: `https://wa.me/917358293839?text=Hello%20VT%20Kindergarten,%20I%20have%20a%20question:%20${encodeURIComponent(actionId)}`,
          btnClass: "whatsapp",
        },
        {
          type: "link",
          label: "📞 Call Desk (+91 73582 93839)",
          url: "tel:+917358293839",
          btnClass: "phone",
        },
      ],
      quickPills: ["🏛️ Founders & Vision", "🏫 Classes Offered", "🌸 About School", "📝 Admission Enquiry", "⏰ School Timings"],
    });
  };

  // Submit Text Message from Input
  const handleSendMessage = (e) => {
    e?.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    // Append user message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        time: getCurrentTime(),
        text: query,
      },
    ]);
    setInputValue("");

    // Process and answer
    handleAction(query);
  };

  // Handle Enquiry Form Submission to Supabase
  const handleEnquirySubmit = async (e) => {
    e.preventDefault();

    if (IS_ENQUIRY_BLOCKED) {
      alert("Online enquiries are currently paused. Please contact our admissions desk at +91 73582 93839.");
      return;
    }

    if (!enquiryForm.parentName.trim()) {
      alert("Please enter the parent/guardian's name.");
      return;
    }
    if (!enquiryForm.childName.trim()) {
      alert("Please enter the child's name.");
      return;
    }
    const cleanPhone = enquiryForm.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmittingEnquiry(true);

    try {
      const parent = enquiryForm.parentName.trim();
      const child = enquiryForm.childName.trim();
      const grade = enquiryForm.grade;
      const phone = cleanPhone;
      const notes = enquiryForm.notes.trim();

      const messageContent = [
        `[ONLINE CHATBOT ADMISSION ENQUIRY]`,
        `Parent Name: ${parent}`,
        `Child Name: ${child}`,
        `Target Program: ${grade}`,
        `Contact Phone: ${phone}`,
        notes ? `Parent Query / Note: ${notes}` : null,
        `Submitted At: ${new Date().toLocaleString()}`,
        `Source: Website Interactive AI Chatbot`,
      ]
        .filter(Boolean)
        .join("\n\n");

      // 1. Primary insert into dedicated student_admissions table
      let { error: insertErr } = await supabase.from("student_admissions").insert([
        {
          child_name: child,
          parent_name: parent,
          dob: "Enquiry via Chatbot",
          program: grade,
          relation: "Enquiry",
          phone: phone,
          message: messageContent,
          status: "pending",
        },
      ]);

      // 2. Fallback to legacy admissions table if needed
      if (insertErr) {
        console.warn("Primary student_admissions insert error, attempting fallback:", insertErr);
        const { error: fallbackErr } = await supabase.from("admissions").insert([
          {
            child_name: child,
            parent_name: parent,
            dob: "Enquiry via Chatbot",
            program: grade,
            relation: "Enquiry",
            phone: phone,
            message: messageContent,
            status: "pending",
          },
        ]);
        insertErr = fallbackErr;
      }

      if (insertErr) {
        console.error("Enquiry submission failed:", insertErr);
        alert("Enquiry submission could not be saved. Please connect via WhatsApp or phone.");
      } else {
        setEnquirySubmitted(true);
        // Bot says thank you with WhatsApp button
        appendBotResponse({
          text: `🎉 **Thank you, ${parent}!**\n\nWe have received your admission enquiry for **${child}** (${grade}).\n\nOur admissions coordinator will contact you at **${phone}** shortly with full prospectus details.`,
          successCard: {
            title: "✅ Enquiry Saved Successfully!",
            phone: phone,
            child: child,
            grade: grade,
          },
          actions: [
            {
              type: "link",
              label: "💬 WhatsApp Us to Connect Instantly",
              url: `https://wa.me/917358293839?text=Hello%20VT%20Kindergarten,%20I%20just%20submitted%20an%20admission%20enquiry%20for%20my%20child%20${encodeURIComponent(
                child
              )}%20(${encodeURIComponent(grade)}).%20My%20contact%20number%20is%20${phone}.`,
              btnClass: "whatsapp",
            },
            {
              type: "link",
              label: "🗺️ Visit Campus (Karaikkudi)",
              url: "https://maps.google.com/?q=VT+Kindergarten,+Play+school+and+Pre+school,+11,+7th+St,+near+Reliance+Smart+Bazaar,+Subramaniapuram,+south+extension,+Vairavapuram,+Karaikkudi+(M.Corp),+Tamil+Nadu+630002",
              btnClass: "maps",
            },
          ],
          quickPills: ["📍 School Location", "⏰ School Timings", "🎒 Facilities & Safety"],
        });
      }
    } catch (err) {
      console.error("Network error during enquiry submit:", err);
      alert("Submission error. Please try again or WhatsApp us directly.");
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  // Reset Conversation
  const handleResetChat = () => {
    setEnquirySubmitted(false);
    setEnquiryForm({
      parentName: "",
      childName: "",
      grade: "Pre KG (3+ yrs)",
      phone: "",
      notes: "",
    });
    setMessages([
      {
        id: Date.now(),
        sender: "bot",
        time: getCurrentTime(),
        text: "🔄 Chat restarted! How may I assist you with VT Kindergarten?",
        quickPills: ["🏛️ Founders & Vision", "🏫 Classes Offered", "🌸 About School", "📝 Admission Enquiry", "⏰ Timings"],
      },
    ]);
  };

  return (
    <>
      {/* 1. Floating Launcher Button & Tooltip */}
      <div className="vt-chatbot-launcher">
        {!isOpen && (
          <div className="vt-chatbot-launcher-tooltip" onClick={() => setIsOpen(true)}>
            <span className="vt-tooltip-wave">👋</span>
            <span>Need Help? Ask VT Bot!</span>
          </div>
        )}

        <button
          className="vt-chatbot-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close VT Kindergarten Chatbot" : "Open VT Kindergarten Chatbot"}
        >
          {isOpen ? (
            <span className="vt-chatbot-btn-icon">✕</span>
          ) : (
            <>
              <span className="vt-chatbot-btn-icon">💬</span>
              {hasUnread && <span className="vt-chatbot-btn-badge" />}
            </>
          )}
        </button>
      </div>

      {/* 2. Interactive Chat Modal Window */}
      {isOpen && (
        <div className="vt-chatbot-window" role="dialog" aria-modal="true" aria-label="VT Kindergarten Chat Assistant">
          {/* Header */}
          <div className="vt-chatbot-header">
            <div className="vt-chatbot-header-info">
              <div className="vt-chatbot-avatar">☀️</div>
              <div className="vt-chatbot-title-box">
                <h3>VT Kindergarten Bot</h3>
                <div className="vt-chatbot-status-row">
                  <span className="vt-chatbot-status-indicator" />
                  <span>Online • Karaikkudi Campus</span>
                </div>
              </div>
            </div>
            <div className="vt-chatbot-header-actions">
              <button
                className="vt-chatbot-icon-btn"
                title="Restart conversation"
                onClick={handleResetChat}
                aria-label="Restart chat"
              >
                🔄
              </button>
              <button
                className="vt-chatbot-icon-btn"
                title="Close chat"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="vt-chatbot-body">
            <div className="vt-chat-time-divider">VT Kindergarten Admissions & Info Assistant</div>

            {messages.map((msg) => (
              <div key={msg.id} className={`vt-chat-msg-row ${msg.sender}`}>
                {msg.sender === "bot" && <div className="vt-chat-msg-avatar">🧸</div>}

                <div className="vt-chat-bubble">
                  {/* Formatted Markdown-like Text */}
                  <div
                    dangerouslySetInnerHTML={{
                      __html: msg.text
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>")
                        .replace(/\n/g, "<br />"),
                    }}
                  />

                  {/* Optional Rich Card */}
                  {msg.card && (
                    <div className="vt-chat-card">
                      <div className="vt-chat-card-title">{msg.card.title}</div>
                      <ul className="vt-chat-card-list">
                        {msg.card.items.map((item, idx) => (
                          <li
                            key={idx}
                            dangerouslySetInnerHTML={{
                              __html: item.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                            }}
                          />
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Optional Success Card */}
                  {msg.successCard && (
                    <div className="vt-chat-success-card">
                      <div className="vt-chat-success-title">{msg.successCard.title}</div>
                      <div>
                        Child: <strong>{msg.successCard.child}</strong> ({msg.successCard.grade})
                      </div>
                      <div>
                        Contact Phone: <strong>{msg.successCard.phone}</strong>
                      </div>
                    </div>
                  )}

                  {/* Embedded Admission Enquiry Box Card */}
                  {msg.showForm && !enquirySubmitted && (
                    <div
                      className="vt-chat-direct-box-card"
                      style={{
                        background: "#FFF7ED",
                        border: "1.5px solid #FFEDD5",
                        borderRadius: "16px",
                        padding: "16px",
                        marginTop: "10px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "14px",
                          color: "#C2410C",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "6px",
                        }}
                      >
                        <span>📝</span> Official Admission Enquiry Form Box
                      </div>
                      <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>
                        Please enter your child's details directly in our official Enquiry Form Box highlighted on the page.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigateToEnquirySection(true)}
                        className="vt-chat-action-btn primary enquiry-nav"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        👉 Open Enquiry Form Box
                      </button>
                    </div>
                  )}

                  {/* Message Action Buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="vt-chat-actions">
                      {msg.actions.map((act, aIdx) =>
                        act.type === "link" ? (
                          <a
                            key={aIdx}
                            href={act.url}
                            target={act.url.startsWith("http") ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className={`vt-chat-action-btn ${act.btnClass || ""}`}
                          >
                            {act.label}
                          </a>
                        ) : (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => handleAction(act.actionKey)}
                            className={`vt-chat-action-btn ${act.btnClass || ""}`}
                          >
                            {act.label}
                          </button>
                        )
                      )}
                    </div>
                  )}

                  <span className="vt-chat-time">{msg.time}</span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="vt-chat-msg-row bot">
                <div className="vt-chat-msg-avatar">🧸</div>
                <div className="vt-chat-bubble" style={{ padding: "8px 14px" }}>
                  <div className="vt-typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Pills */}
          <div className="vt-chatbot-quick-pills">
            {QUICK_ACTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="vt-quick-pill"
                onClick={() => handleAction(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Chat Input Box */}
          <form className="vt-chatbot-input-bar" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              className="vt-chatbot-input"
              placeholder="Type your question here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              type="submit"
              className="vt-chatbot-send-btn"
              disabled={!inputValue.trim()}
              title="Send message"
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
