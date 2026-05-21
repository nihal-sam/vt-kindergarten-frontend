const programs = [
  {
    emoji: "\u{1F331}",
    name: 'Play Group',
    age: 'Age: 2+ Years',
    desc: 'Introduction to school life through sensory play, songs, and social interaction.',
    features: ['Sensory activities', 'Circle time', 'Story telling', 'Music & movement'],
  },
  {
    emoji: "\u{1F338}",
    name: 'Pre KG',
    age: 'Age: 3+ Years',
    desc: 'Foundation of language, numbers, and social skills through play-based activities.',
    features: ['Pre-reading skills', 'Number awareness', 'Art & craft', 'Outdoor play'],
  },
  {
    emoji: "\u{1F4D6}",
    name: 'LKG',
    age: 'Age: 4+ Years',
    desc: 'Structured learning of alphabets, numbers, and motor skill development.',
    features: ['Alphabet learning', 'Writing practice', 'Science activities', 'Sports'],
  },
  {
    emoji: "\u{1F393}",
    name: 'UKG',
    age: 'Age: 5+ Years',
    desc: 'School readiness with advanced literacy, numeracy, and critical thinking.',
    features: ['Reading readiness', 'Math concepts', 'Environmental studies', 'Leadership'],
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
            <p>{program.desc}</p>
            <ul className="program-features">
              {program.features.map((feature, featureIndex) => <li key={featureIndex}>{feature}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
