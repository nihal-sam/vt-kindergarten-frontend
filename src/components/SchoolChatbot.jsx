import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { IS_ENQUIRY_BLOCKED, ENQUIRY_BLOCKED_NOTICE } from "../utils/enquiryConfig";
import "./SchoolChatbot.css";

const QUICK_ACTIONS = [
  { id: "location", label: "📍 Location & Maps" },
  { id: "classes", label: "🏫 Classes & Age Limit" },
  { id: "timings", label: "⏰ School Timings" },
  { id: "enquiry", label: IS_ENQUIRY_BLOCKED ? "📞 Admissions Desk" : "📝 Admission Enquiry" },
  { id: "facilities", label: "🎒 Facilities & Safety" },
  { id: "fees", label: "💳 Fees Information" },
  { id: "transport", label: "🚌 Van & Transport" },
  { id: "contact", label: "📞 Contact & WhatsApp" },
];

export default function SchoolChatbot() {
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
      text: "👋 Hello! Welcome to **VT Kindergarten**, Karaikudi! How can I help you today?",
      quickPills: ["📍 School Location", "🏫 Classes Offered", "📝 Admission Enquiry", "⏰ Timings"],
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

  // Handle Quick Action Clicks or Keyword Matches
  const handleAction = (actionId) => {
    const act = actionId.toLowerCase();

    // Location
    if (act.includes("location") || act.includes("address") || act.includes("map") || act.includes("where") || act.includes("directions")) {
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
    if (act.includes("class") || act.includes("program") || act.includes("age") || act.includes("eligible") || act.includes("grade") || act.includes("pre kg") || act.includes("lkg") || act.includes("ukg") || act.includes("playgroup")) {
      appendBotResponse({
        text: "🏫 **Classes & Age Eligibility at VT Kindergarten:**\nWe offer nurturing, child-centric early education programs:",
        card: {
          title: "📚 Academic Programs & Age Criteria",
          items: [
            "🌱 **Play Group**: Age 2+ Years (Sensory play, habit formation & motor skills)",
            "🌸 **Pre-KG**: Age 3+ Years (Phonics, rhymes, storytelling & creative art)",
            "📖 **LKG**: Age 4+ Years (Reading readiness, handwriting & basic math)",
            "🎓 **UKG**: Age 5+ Years (Primary school transition, fluency & logic)",
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

    // Enquiry / Admission Form
    if (act.includes("enquiry") || act.includes("admission") || act.includes("apply") || act.includes("join") || act.includes("register") || act.includes("seat") || act.includes("form")) {
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
        text: "📝 **VT Kindergarten Admission Enquiry Form**\nPlease fill out your details below. Our admissions desk will call you back with full syllabus details and fee breakdown:",
        showForm: true,
      });
      return;
    }

    // Age Calculator scroll
    if (act === "calculator") {
      const calcSec = document.getElementById("eligibility");
      if (calcSec) {
        calcSec.scrollIntoView({ behavior: "smooth" });
        setIsOpen(false);
      } else {
        appendBotResponse({
          text: "You can find our interactive **Age Eligibility Calculator** on our homepage right below the hero banner!",
          quickPills: ["📝 Submit Admission Enquiry", "🏫 Classes Offered"],
        });
      }
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
      quickPills: ["📍 School Location", "🏫 Classes & Age Limit", "📝 Admission Enquiry", "⏰ School Timings"],
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
        quickPills: ["📍 School Location", "🏫 Classes Offered", "📝 Admission Enquiry", "⏰ Timings"],
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

                  {/* Embedded Admission Enquiry Form */}
                  {msg.showForm && !enquirySubmitted && (
                    <form className="vt-chat-form" onSubmit={handleEnquirySubmit}>
                      <div className="vt-chat-form-title">📝 Quick Admission Form</div>

                      <div className="vt-chat-form-group">
                        <label className="vt-chat-form-label">Parent / Guardian Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Anand Kumar"
                          value={enquiryForm.parentName}
                          onChange={(e) =>
                            setEnquiryForm({ ...enquiryForm, parentName: e.target.value })
                          }
                          className="vt-chat-form-input"
                        />
                      </div>

                      <div className="vt-chat-form-group">
                        <label className="vt-chat-form-label">Child's Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Diya Anand"
                          value={enquiryForm.childName}
                          onChange={(e) =>
                            setEnquiryForm({ ...enquiryForm, childName: e.target.value })
                          }
                          className="vt-chat-form-input"
                        />
                      </div>

                      <div className="vt-chat-form-group">
                        <label className="vt-chat-form-label">Applying For Class *</label>
                        <select
                          value={enquiryForm.grade}
                          onChange={(e) =>
                            setEnquiryForm({ ...enquiryForm, grade: e.target.value })
                          }
                          className="vt-chat-form-select"
                        >
                          <option value="Play Group (2+ yrs)">Play Group (Age 2+)</option>
                          <option value="Pre KG (3+ yrs)">Pre-KG (Age 3+)</option>
                          <option value="LKG (4+ yrs)">LKG (Age 4+)</option>
                          <option value="UKG (5+ yrs)">UKG (Age 5+)</option>
                        </select>
                      </div>

                      <div className="vt-chat-form-group">
                        <label className="vt-chat-form-label">Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          maxLength="10"
                          placeholder="10-digit mobile number"
                          value={enquiryForm.phone}
                          onChange={(e) =>
                            setEnquiryForm({
                              ...enquiryForm,
                              phone: e.target.value.replace(/\D/g, ""),
                            })
                          }
                          className="vt-chat-form-input"
                        />
                      </div>

                      <div className="vt-chat-form-group">
                        <label className="vt-chat-form-label">Note / Query (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Looking for van facility"
                          value={enquiryForm.notes}
                          onChange={(e) =>
                            setEnquiryForm({ ...enquiryForm, notes: e.target.value })
                          }
                          className="vt-chat-form-input"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingEnquiry}
                        className="vt-chat-form-submit"
                      >
                        {isSubmittingEnquiry ? "Saving Enquiry..." : "🚀 Submit Enquiry"}
                      </button>
                    </form>
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
