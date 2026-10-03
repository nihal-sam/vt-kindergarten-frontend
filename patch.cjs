const fs = require('fs');
let c = fs.readFileSync('src/AdminApp.jsx', 'utf8');

c = c.replace(/sidebar: \{ width: 260, background: 'linear-gradient\(180deg,#1a1a2e,#16213e\)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, position: 'fixed', top: 0, left: 0, bottom: 0, overflowY: 'auto', zIndex: 100 \},/,
  "sidebar: { width: 280, background: 'linear-gradient(180deg, #0F172A, #1E293B)', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 12, position: 'fixed', top: 16, left: 16, bottom: 16, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflowY: 'auto', zIndex: 100, border: '1px solid rgba(255,255,255,0.08)' },");

c = c.replace(/sideTop: \{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px 24px', borderBottom: '1px solid rgba\(255,255,255,0\.08\)', marginBottom: 8 \},/,
  "sideTop: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 },");

c = c.replace(/sideLogo: \{ width: 46, height: 46, display: 'block', padding: 3, borderRadius: '50%', background: 'white', objectFit: 'contain', boxShadow: '0 8px 22px rgba\(255,107,53,0\.22\)', flexShrink: 0, boxSizing: 'border-box' \},/,
  "sideLogo: { width: 50, height: 50, display: 'block', padding: 4, borderRadius: '50%', background: 'white', objectFit: 'contain', boxShadow: '0 8px 22px rgba(255,107,53,0.22)', flexShrink: 0, boxSizing: 'border-box' },");

c = c.replace(/navBtn: \{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: 'transparent', border: 'none', borderRadius: 12, color: 'rgba\(255,255,255,0\.65\)', fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer', textAlign: 'left', width: '100%' \},/,
  "navBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'transparent', border: 'none', borderRadius: 16, color: 'rgba(255,255,255,0.65)', fontFamily: \"'Nunito',sans-serif\", fontSize: 15, fontWeight: 700, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.3s ease' },");

c = c.replace(/navActive: \{ background: 'rgba\(255,107,53,0\.18\)', color: 'white', borderLeft: '3px solid #FF6B35' \},/,
  "navActive: { background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,107,53,0.05))', color: 'white', borderLeft: '4px solid #FF6B35', boxShadow: 'inset 0 0 20px rgba(255,107,53,0.05)' },");

c = c.replace(/logoutBtn: \{ background: 'rgba\(255,255,255,0\.05\)', border: '1px solid rgba\(255,255,255,0\.1\)', borderRadius: 10, padding: '10px 16px', color: 'rgba\(255,255,255,0\.6\)', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 14 \},/,
  "logoutBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: \"'Nunito',sans-serif\", fontWeight: 700, fontSize: 14, transition: 'all 0.3s ease' },");

c = c.replace(/statCard: \{ background: 'white', borderRadius: 16, padding: '28px 20px', textAlign: 'center', boxShadow: '0 4px 20px rgba\(0,0,0,0\.06\)' \},/,
  "statCard: { background: 'white', borderRadius: 24, padding: '32px 24px', textAlign: 'center', boxShadow: '0 10px 40px rgba(226, 236, 249, 0.5)', border: '1px solid #E2E8F0', transition: 'transform 0.3s ease' },");

c = c.replace(/panel: \{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba\(0,0,0,0\.06\)', marginBottom: 24 \},/,
  "panel: { background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 10px 40px rgba(226, 236, 249, 0.5)', marginBottom: 24, border: '1px solid #E2E8F0' },");

fs.writeFileSync('src/AdminApp.jsx', c);
console.log('done');
