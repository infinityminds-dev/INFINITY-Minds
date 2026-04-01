/* ---------------------------------------------------
    INFINITY MINDS - MASTER VERSION CONTROL (v2.10.1)
----------------------------------------------------- */

const changelogData = [
  {
    version: "2.10.1",
    date: "April 1, 2026",
    title: "🔐 The Authentication Era",
    added: [
      "Google Firebase Authentication (Secure Login 🛡️)",
      "New 'index.html' Login Gateway with Glassmorphism UI",
      "Dynamic User Personalization (Welcome, [User Name]! 👋)",
      "Real-time Leaderboard integration with Firestore"
    ],
    improved: [
      "Multi-page navigation flow (Login -> Home -> Quiz)",
      "Persistent XP & Level tracking via LocalStorage",
      "Redirect logic for game-over and unauthorized access"
    ],
    fixed: [
      "Unauthorized login bypass bug",
      "XP sync lag between Dashboard and Quiz pages",
      "Mobile button alignment on Login screen"
    ]
  },

  {
    version: "2.9.1",
    date: "March 27, 2026",
    title: "⚡ The Automation & UI Overhaul",
    added: [
      "Dynamic JS-based Changelog system (No more manual HTML! 🧠)",
      "Dedicated Changelog page with professional dark theme",
      "Back-to-About navigation button for seamless flow"
    ],
    improved: [
      "Image scaling fix (object-fit: contain) across all cards",
      "Optimized scroll performance for long version history",
      "Cleaned up 500+ lines of redundant HTML code"
    ],
    fixed: [
      "White background glitch in log sections",
      "Image cropping issue on mobile & desktop",
      "CSS conflicts between About and Changelog pages"
    ]
  },
  {
    version: "2.7.0",
    date: "March 9, 2026",
    title: "📬 Communication & Support",
    added: ["Contact page with Gmail integration", "FAQ section for user help"],
    improved: ["SEO Structured Data (FAQ & Breadcrumbs)", "Internal site linking"]
  },
  {
    version: "2.5.6",
    date: "March 1, 2026",
    title: "🎓 Tutorial Pack Launch",
    added: ["Complete Web Dev Tutorial Pack", "Netlify deployment guides"],
    improved: ["Mobile hierarchy for lessons"]
  },
  {
    version: "2.2.0",
    date: "Feb 25, 2026",
    title: "🤖 AI Ecosystem Expansion",
    added: ["AI Tools Section (Gemini, ChatGPT, Claude, Cursor)", "Firebase integration"],
    improved: ["Developer Tools grid layout", "Google Analytics setup"]
  },
  {
    version: "2.0.0",
    date: "Feb 22, 2026",
    title: "🎨 Major UI Upgrade",
    added: ["Complete Dark-Neon theme redesign", "Centralized theme.css"],
    improved: ["Smooth button animations", "Sidebar logic overhaul"]
  },
  {
    version: "1.0.0",
    date: "Jan 25, 2026",
    title: "🎉 Initial Launch",
    added: ["InfinityMind officially live!", "Core navigation & Course structure"],
    improved: ["Initial responsive design"]
  }
];

// --- RENDERING LOGIC ---
function renderChangelog() {
  const wrapper = document.getElementById("dynamic-changelog");
  if (!wrapper) return;

  wrapper.innerHTML = changelogData.map(item => `
    <div class="version-section" style="margin-bottom: 40px; border-left: 3px solid #a855f7; padding-left: 20px;">
      <h3 style="color: #a855f7; font-size: 1.4rem;">🚀 v${item.version} – ${item.date}</h3>
      <h4 style="color: #fff; margin: 10px 0;">${item.title}</h4>
      <ul style="color: #94a3b8; list-style: none; padding: 0; font-size: 0.95rem;">
        ${item.added.map(a => `<li style="margin-bottom:5px;">✅ ${a}</li>`).join('')}
        ${item.improved ? item.improved.map(i => `<li style="margin-bottom:5px;">⚡ ${i}</li>`).join('') : ''}
        ${item.fixed ? item.fixed.map(f => `<li style="margin-bottom:5px;">🛠️ ${f}</li>`).join('') : ''}
      </ul>
    </div>
  `).join('<hr style="border:0; border-top:1px solid rgba(168, 85, 247, 0.1); margin: 30px 0;">');
}

document.addEventListener("DOMContentLoaded", () => {
  renderChangelog();
  
  // Auto-update Version on About Page
  const latest = changelogData[0];
  const verBox = document.getElementById("version-number");
  const dateBox = document.getElementById("last-updated");
  if(verBox) verBox.textContent = "v" + latest.version;
  if(dateBox) dateBox.textContent = "Last Updated: " + latest.date;
});

 // Sidebar Logic 

function toggleSidebar() {
      document.getElementById("sidebar").classList.toggle("show");
    }








