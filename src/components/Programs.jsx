const programs = [
  {
    emoji: "🌱",
    name: 'Play Group',
    age: 'Age: 2+ Years',
  },
  {
    emoji: "🌸",
    name: 'Pre KG',
    age: 'Age: 3+ Years',
  },
  {
    emoji: "📖",
    name: 'LKG',
    age: 'Age: 4+ Years',
  },
  {
    emoji: "🎓",
    name: 'UKG',
    age: 'Age: 5+ Years',
  },
];

export default function Programs() {
  return (
    <div className="programs-section">
      <div className="section-header">
        <div className="section-tag">Our Programs</div>
        <h2 className="section-title">Classes We <span>Offer</span> {"\u{1F4DA}"}</h2>
        <p className="section-desc">
          Carefully designed programs for every stage of your child's early development journey.
        </p>
      </div>
      <div className="programs-grid">
        {programs.map((program, index) => (
          <div className="program-card" key={index}>
            <span className="program-emoji" style={{ animationDelay: `${index * 0.2}s` }}>{program.emoji}</span>
            <h3>{program.name}</h3>
            <span className="program-age">{program.age}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
