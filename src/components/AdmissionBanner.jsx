const items = [
  'Admissions Open 2025-26',
  'Play Group - Pre KG - LKG - UKG',
  'Near Reliance Smart Bazaar, Subramaniapuram, Karaikudi',
  'Call Now to Book a School Tour',
  'Expert & Experienced Teachers',
  'Safe & Secure Environment',
  'Play-Based Learning Approach',
  'Limited Seats Available - Enroll Today',
];

export default function AdmissionBanner() {
  return (
    <div className="admission-banner">
      <div className="banner-track">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="banner-item">
            <span className="banner-star">*</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
