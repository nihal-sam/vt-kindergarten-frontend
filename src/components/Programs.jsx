const programs = [
  {
    emoji: "🌱",
    name: 'Play Group',
    age: 'Age: 2+ Years',
    color: '#FF6B35',
    bg: '#FFF8F5',
  },
  {
    emoji: "🌸",
    name: 'Pre KG',
    age: 'Age: 3+ Years',
    color: '#0D9488',
    bg: '#F0FDFA',
  },
  {
    emoji: "📖",
    name: 'LKG',
    age: 'Age: 4+ Years',
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    emoji: "🎓",
    name: 'UKG',
    age: 'Age: 5+ Years',
    color: '#7C3AED',
    bg: '#FAF5FF',
  },
];

export default function Programs() {
  return (
    <div className="programs-section">
      <div className="section-header">
        <div className="section-tag">Our Programs</div>
        <h2 className="section-title">Classes We <span>Offer</span> 📚</h2>
        <p className="section-desc">
          Carefully designed programs for every stage of your child&apos;s early development journey.
        </p>
      </div>

      <div className="programs-grid">
        {programs.map((program, index) => (
          <div 
            className="program-card-clean" 
            key={index}
            style={{ 
              '--prog-color': program.color,
              '--prog-bg': program.bg 
            }}
          >
            <div className="program-emoji-circle">
              <span className="program-emoji">{program.emoji}</span>
            </div>
            <h3>{program.name}</h3>
            <span className="program-age">{program.age}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
