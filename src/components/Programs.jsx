const programs = [
  {
    emoji: "🌱",
    name: 'Play Group',
    age: 'Age: 2+ Years',
    color: '#FF6B35',
    bg: '#FFF5F0',
    tag: 'Foundation Stage',
    desc: 'A gentle, joyful transition from home to school filled with sensory exploration, music, and playful routines.',
    milestones: [
      'Sensory play & fine motor activities',
      'Rhymes, music & expressive language initiation',
      'Social interaction & healthy peer habits'
    ]
  },
  {
    emoji: "🌸",
    name: 'Pre KG',
    age: 'Age: 3+ Years',
    color: '#0D9488',
    bg: '#F0FDFA',
    tag: 'Curiosity Stage',
    desc: 'Fostering active curiosity, phonics awareness, creative art, and daily vocabulary through hands-on exploration.',
    milestones: [
      'Phonics recognition & conversational skills',
      'Early numeracy, shapes & color sorting',
      'Emotional sharing & self-confidence building'
    ]
  },
  {
    emoji: "📖",
    name: 'LKG',
    age: 'Age: 4+ Years',
    color: '#D97706',
    bg: '#FFFBEB',
    tag: 'Readiness Stage',
    desc: 'Structured pre-writing strokes, mathematical reasoning, nature studies, and imaginative storytelling.',
    milestones: [
      'Writing readiness, letters & sight words',
      'Number concepts, patterns & basic logic',
      'Hands-on science & environment discovery'
    ]
  },
  {
    emoji: "🎓",
    name: 'UKG',
    age: 'Age: 5+ Years',
    color: '#7C3AED',
    bg: '#FAF5FF',
    tag: 'Graduation Stage',
    desc: 'Comprehensive primary school preparation ensuring confident literacy, math mastery, and stage presence.',
    milestones: [
      'Independent reading & sentence construction',
      'Mental math, analytical thinking & addition',
      'Public speaking, stage confidence & leadership'
    ]
  },
];

export default function Programs() {
  const scrollToEligibility = (programName) => {
    const el = document.getElementById('eligibility');
    if (el) {
      const offset = 85;
      const target = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(target, 0), behavior: "smooth" });

      // If there's an input or message field, optionally hint
      const firstInput = el.querySelector('input');
      firstInput?.focus();
    }
  };

  return (
    <div className="programs-section">
      <div className="section-header text-center" style={{ maxWidth: '780px', margin: '0 auto 48px', textAlign: 'center' }}>
        <div className="section-tag">Academic Programs</div>
        <h2 className="section-title">Classes We <span>Offer</span> 📚</h2>
        <p className="section-desc">
          Thoughtfully curated early childhood programs matching every developmental milestone from toddlerhood to primary school readiness.
        </p>
      </div>

      <div className="programs-grid">
        {programs.map((program, index) => (
          <div 
            className="program-card-premium" 
            key={index}
            style={{ '--prog-color': program.color, '--prog-bg': program.bg }}
          >
            <div className="program-card-header">
              <span className="program-card-emoji">{program.emoji}</span>
              <span className="program-card-tag">{program.tag}</span>
            </div>

            <div className="program-card-title-wrap">
              <h3 className="program-card-title">{program.name}</h3>
              <span className="program-card-age-badge">{program.age}</span>
            </div>

            <p className="program-card-desc">{program.desc}</p>

            <div className="program-milestones-list">
              <span className="milestones-heading">Key Milestones:</span>
              {program.milestones.map((m, mIdx) => (
                <div className="program-milestone-item" key={mIdx}>
                  <span className="milestone-check">✓</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>

            <button 
              type="button" 
              className="program-enroll-btn"
              onClick={() => scrollToEligibility(program.name)}
            >
              <span>Check Eligibility &amp; Enroll</span>
              <span>&rarr;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
