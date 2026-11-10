import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { IS_ENQUIRY_BLOCKED, ENQUIRY_BLOCKED_NOTICE } from "../utils/enquiryConfig";
import { processLocalAiQuery, navigateToSection, PAGE_SECTIONS } from "../utils/schoolLocalAi";
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
  { id: "food", label: "🍎 Food & Snack Policy" },
  { id: "contact", label: "📞 Contact & WhatsApp" },
];

export default function SchoolChatbot({ onNavigateToEnquiry }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeLocatedSection, setActiveLocatedSection] = useState(null);

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
      quickPills: [
        "🏛️ Founders & Vision",
        "🏫 Classes & Age Limit",
        "🌸 About School",
        "📝 Admission Enquiry",
        "⏰ School Timings",
        "📍 Location & Maps",
      ],
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
    }, 400);
  };

  // Universal Section Locator with page spotlight animation
  const handleLocateSection = (sectionKey, shouldMinimize = false) => {
    const targetSection = PAGE_SECTIONS[sectionKey] || { id: sectionKey, name: sectionKey };
    setActiveLocatedSection(targetSection);

    // Minimize on mobile or if explicit so user sees the spotlighted section
    if (shouldMinimize || window.innerWidth < 768) {
      setIsOpen(false);
    }

    setTimeout(() => {
      if (sectionKey === "eligibility" && typeof onNavigateToEnquiry === "function") {
        onNavigateToEnquiry();
      } else {
        navigateToSection(sectionKey);
      }
    }, 150);
  };

  // Handle Quick Action Clicks or Keyword Matches via Local AI
  const handleAction = (actionId) => {
    const act = (actionId || "").toLowerCase();

    // Direct navigation button click
    if (act === "go_to_enquiry" || act === "direct_enquiry_scroll") {
      handleLocateSection("eligibility", true);
      return;
    }

    if (act === "calculator") {
      handleLocateSection("eligibility", true);
      return;
    }

    // Process query through Local AI
    const aiResponse = processLocalAiQuery(actionId);
    appendBotResponse(aiResponse);

    // If explicit navigation was requested, automatically locate the page section
    if (aiResponse.sectionTarget?.autoScroll && aiResponse.sectionTarget?.key) {
      handleLocateSection(aiResponse.sectionTarget.key, false);
    }
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

    // Process and answer with Local AI
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
              type: "locate",
              label: "📍 View Campus Location on Page",
              sectionKey: "contact",
              btnClass: "locate",
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
    setActiveLocatedSection(null);
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
        quickPills: [
          "🏛️ Founders & Vision",
          "🏫 Classes & Age Limit",
          "🌸 About School",
          "📝 Admission Enquiry",
          "⏰ School Timings",
          "📍 Location & Maps",
        ],
      },
    ]);
  };

  return (
    <>
      {/* 1. Floating Launcher Button, Viewing Pill & Tooltip */}
      <div className="vt-chatbot-launcher">
        {/* Floating Viewing Pill when a section is located on the page and chat is closed */}
        {activeLocatedSection && !isOpen && (
          <div
            className="vt-chatbot-viewing-pill"
            onClick={() => {
              setIsOpen(true);
              setActiveLocatedSection(null);
            }}
          >
            <span>📍 Viewing: <strong>{activeLocatedSection.name}</strong></span>
            <span className="vt-viewing-back-badge">💬 Return to Chat</span>
          </div>
        )}

        {!isOpen && !activeLocatedSection && (
          <div className="vt-chatbot-launcher-tooltip" onClick={() => setIsOpen(true)}>
            <span className="vt-tooltip-wave">👋</span>
            <span>Need Help? Ask VT Bot!</span>
          </div>
        )}

        <button
          className="vt-chatbot-btn"
          onClick={() => {
            setIsOpen(!isOpen);
            if (activeLocatedSection) setActiveLocatedSection(null);
          }}
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

                  {/* Message Action Buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="vt-chat-actions">
                      {msg.actions.map((act, aIdx) => {
                        if (act.type === "locate") {
                          return (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => handleLocateSection(act.sectionKey, true)}
                              className={`vt-chat-action-btn ${act.btnClass || "locate"}`}
                            >
                              {act.label}
                            </button>
                          );
                        }
                        if (act.type === "link") {
                          return (
                            <a
                              key={aIdx}
                              href={act.url}
                              target={act.url.startsWith("http") ? "_blank" : undefined}
                              rel="noopener noreferrer"
                              className={`vt-chat-action-btn ${act.btnClass || ""}`}
                            >
                              {act.label}
                            </a>
                          );
                        }
                        return (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => handleAction(act.actionKey)}
                            className={`vt-chat-action-btn ${act.btnClass || ""}`}
                          >
                            {act.label}
                          </button>
                        );
                      })}
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

          {/* Chat Input Bar */}
          <form className="vt-chatbot-input-bar" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              className="vt-chatbot-input"
              placeholder="Ask about classes, founders, timings, fees..."
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
