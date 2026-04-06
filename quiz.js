// --- 1. IMPORTS & CONFIG ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, doc, updateDoc, getDocs, where } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAFRj4L-nsDW37e5gc4WC4lpbGgostvN6A",
    authDomain: "infinitybraingym.firebaseapp.com",
    projectId: "infinitybraingym",
    storageBucket: "infinitybraingym.firebasestorage.app",
    messagingSenderId: "218368274077",
    appId: "1:218368274077:web:9827f219a718ef14546e74"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- 2. GAME VARIABLES ---
let xp = parseInt(localStorage.getItem('inf_xp')) || 0;
let level = parseInt(localStorage.getItem('inf_lvl')) || 1;
let hearts = localStorage.getItem('inf_hearts') !== null ? parseInt(localStorage.getItem('inf_hearts')) : 3; 
let currentUserName = localStorage.getItem('user_name') || "";
let currentUserEmail = localStorage.getItem('user_email') || ""; 
let currentCategory = 'all'; 
const REFILL_TIME = 3 * 60 * 60 * 1000;

// --- 3. MEGA DATABASE (FIXED & MERGED) ---
const database = [
    // --- 🌐 WEB & JS (Old Questions with Categories) ---
    { id: 1, type: 'quiz', category: 'webdev', q: "Which tag is used for an image?", opt: ["<img>", "<pic>", "<src>"], c: "<img>" },
    { id: 2, type: 'quiz', category: 'webdev', q: "Largest heading tag?", opt: ["<h1>", "<h6>", "<head>"], c: "<h1>" },
    { id: 11, type: 'quiz', category: 'webdev', q: "CSS stands for?", opt: ["Cascading Style Sheets", "Color Style", "Creative Sheets"], c: "Cascading Style Sheets" },
    { id: 24, type: 'quiz', category: 'javascript', q: "Which is a JS variable declaration?", opt: ["let", "var", "Both"], c: "Both" },
    { id: 70, type: 'quiz', category: 'javascript', q: "In JS, 'null' is what type?", opt: ["Object", "String", "Undefined"], c: "Object" },

    // --- 🐍 PROGRAMMING: PYTHON ---
    { id: 201, type: 'quiz', category: 'python', q: "Python function define karne ka keyword?", opt: ["def", "func", "lambda"], c: "def" },
    { id: 202, type: 'quiz', category: 'python', q: "Python file extension?", opt: [".py", ".pyt", ".python"], c: ".py" },

    // --- 💻 PROGRAMMING: C++ ---
    { id: 210, type: 'quiz', category: 'cpp', q: "C++ output operator?", opt: ["<<", ">>", "cout"], c: "<<" },

    // --- 📊 MS OFFICE (Sub-Categories) ---
    { id: 301, type: 'quiz', category: 'word', q: "MS Word primarily used for?", opt: ["Documents", "Calculations", "Slides"], c: "Documents" },
    { id: 302, type: 'quiz', category: 'excel', q: "Excel formula starts with?", opt: ["=", "@", "#"], c: "=" },
    { id: 303, type: 'quiz', category: 'ppt', q: "MS PowerPoint extension?", opt: [".pptx", ".docx", ".xlsx"], c: ".pptx" },

    // --- 🖥️ COMPUTER & CYBER ---
    { id: 105, type: 'quiz', category: 'computer', q: "Main memory of computer?", opt: ["RAM", "Hard Disk", "CPU"], c: "RAM" },
    { id: 121, type: 'quiz', category: 'cyber', q: "What is Phishing?", opt: ["Fake link scam", "Virus", "Hardware error"], c: "Fake link scam" },

    // --- 🚀 DSA ---
    { id: 74, type: 'quiz', category: 'dsa', q: "LIFO data structure?", opt: ["Stack", "Queue", "Tree"], c: "Stack" },

    // --- 🧩 PUZZLES (Merged IDs) ---
    { id: 31, type: 'puzzle', category: 'puzzle', q: "What has a head and a tail but no body?", a: "Coin" },
    { id: 67, type: 'puzzle', category: 'puzzle', q: "What goes up but never comes down?", a: "Age" },
    { id: 68, type: 'puzzle', category: 'puzzle', q: "I shave every day, but my beard stays the same. Who am I?", a: "Barber" }
];

// --- 4. CATEGORY SELECTOR ---
window.setCategory = (cat) => {
    currentCategory = cat;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(`'${cat}'`));
    });
    generateNextChallenge();
};

// --- 5. HELPERS ---
function getWeekIdentifier() {
    const d = new Date();
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return `${d.getFullYear()}-W${Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 86400000) + 1) / 7)}`;
}

function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// --- 6. GAME ENGINE (FIXED CATEGORY LOGIC) ---
window.generateNextChallenge = function() {
    const container = document.getElementById('game-container');
    if(!container) return; 

    const today = new Date().toDateString();
    let solved = JSON.parse(localStorage.getItem('solved_ids')) || [];
    let dailyDone = JSON.parse(localStorage.getItem('daily_completed_cats')) || {};

    // 1. Daily Lock Check
    if (currentCategory !== 'all' && dailyDone[currentCategory] === today) {
        container.innerHTML = `
            <div class="card" style="text-align:center;">
                <h2 style="font-size:50px;">⏳</h2>
                <h3>Category Locked!</h3>
                <p>Aapne aaj ke liye <b>${currentCategory.toUpperCase()}</b> poora kar liya hai.</p>
                <button class="btn-main" onclick="setCategory('all')">Try Other Topics</button>
            </div>`;
        return;
    }

    // 2. Filtering Pool
    let pool = database.filter(item => !solved.includes(item.id));
    if (currentCategory !== 'all') {
        pool = pool.filter(item => item.category === currentCategory);
    }

    // 3. Category Finished Logic
    if (pool.length === 0) {
        if (currentCategory !== 'all') {
            dailyDone[currentCategory] = today;
            localStorage.setItem('daily_completed_cats', JSON.stringify(dailyDone));
        }
        container.innerHTML = `
            <div class="card" style="text-align:center;">
                <h3>🎯 Category Mastered!</h3>
                <p>Ab hum home par chalte hain.</p>
                <button class="btn-main" onclick="setCategory('all')">Go Home</button>
            </div>`;
        return;
    }

    // 4. Render Challenge
    const item = pool[Math.floor(Math.random() * pool.length)];
    const typeIcon = item.type === 'puzzle' ? '🧩' : '💻';
    
    container.innerHTML = `
        <div class="card">
            <div class="badge" style="background:#3b82f6; color:white; padding:2px 8px; border-radius:5px; font-size:10px; display:inline-block; margin-bottom:10px;">
                ${item.category.toUpperCase()}
            </div>
            <h3>${typeIcon} ${item.q}</h3>
            ${item.type === 'puzzle' ? 
                `<input type="text" id="puzzle-answer" placeholder="Type answer...">
                 <button class="btn-main" onclick="checkPuzzleAnswer('${item.a}', ${item.id})">Submit 🚀</button>` :
                `<div class="options">
                    ${item.opt.map(o => `<button onclick="checkAnswer(this, '${o.replace(/'/g, "\\'")}', '${item.c.replace(/'/g, "\\'")}', ${item.id})">${escapeHTML(o)}</button>`).join('')}
                </div>`
            }
        </div>`;
};


// --- 7. CORE LOGIC (XP, HEARTS, SYNC) ---
window.checkAnswer = (btn, sel, cor, id) => {
    if(sel === cor) { 
        btn.style.background = "#10b981"; btn.style.color = "white";
        markAsSolved(id); updateXP(20); setTimeout(generateNextChallenge, 800); 
    } else { 
        btn.style.background = "#ef4444"; btn.style.color = "white";
        hearts--; syncStatsUI(); hearts <= 0 ? handleGameOver() : alert("Wrong! 💔");
    }
};

window.checkPuzzleAnswer = (correct, id) => {
    const val = document.getElementById('puzzle-answer').value.trim().toLowerCase();
    if(val === correct.toLowerCase()) { 
        markAsSolved(id); updateXP(25); generateNextChallenge(); 
    } else { 
        hearts--; syncStatsUI(); hearts <= 0 ? handleGameOver() : alert("Wrong! 💔"); 
    }
};

function markAsSolved(id) {
    let solved = JSON.parse(localStorage.getItem('solved_ids')) || [];
    if(!solved.includes(id)) { solved.push(id); localStorage.setItem('solved_ids', JSON.stringify(solved)); }
}

function updateXP(val) {
    xp += val; 
    if(xp >= level * 100) { xp -= level * 100; level++; alert("🎉 LEVEL UP!"); }
    localStorage.setItem('inf_xp', xp); localStorage.setItem('inf_lvl', level);
    syncStatsUI(); saveToFirebase();
}

async function saveToFirebase() {
    if(!currentUserEmail) return;
    try {
        const q = query(collection(db, "leaderboard"), where("email", "==", currentUserEmail));
        const snap = await getDocs(q);
        const data = { name: currentUserName, email: currentUserEmail, score: (level * 100) + xp, level: level, week: getWeekIdentifier(), lastSeen: new Date() };
        if (snap.empty) { await addDoc(collection(db, "leaderboard"), data); }
        else { await updateDoc(doc(db, "leaderboard", snap.docs[0].id), data); }
    } catch (e) { console.error(e); }
}

function syncStatsUI() {
    localStorage.setItem('inf_hearts', hearts);
    const el = {'user-hearts': hearts, 'user-xp': xp, 'user-level': level, 'display-name': currentUserName || "Explorer"};
    for (const [id, val] of Object.entries(el)) { if(document.getElementById(id)) document.getElementById(id).innerText = val; }
}

function handleGameOver() { 
    localStorage.setItem('inf_hearts', 0);
    localStorage.setItem('last_heart_zero_time', new Date().getTime().toString()); 
    window.location.reload(); 
}

function checkHeartStatus() {
    const lastZero = localStorage.getItem('last_heart_zero_time');
    if (lastZero) {
        const diff = new Date().getTime() - parseInt(lastZero);
        if (diff < REFILL_TIME) {
            const rem = REFILL_TIME - diff;
            const h = Math.floor(rem / 3600000).toString().padStart(2, '0');
            const m = Math.floor((rem % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((rem % 60000) / 1000).toString().padStart(2, '0');
            if(document.getElementById('countdown-display')) document.getElementById('countdown-display').innerText = `${h}:${m}:${s}`;
            if(document.getElementById('timer-screen')) document.getElementById('timer-screen').style.display = "block";
            if(document.getElementById('main-game-area')) document.getElementById('main-game-area').style.display = "none";
            return;
        }
        localStorage.removeItem('last_heart_zero_time');
        hearts = 3; syncStatsUI(); window.location.reload();
    }
}

// --- 8. AUTH & INIT ---
window.loginWithGoogle = async () => { try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); } };
window.logout = () => signOut(auth).then(() => { localStorage.clear(); window.location.replace("index.html"); });

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserName = user.displayName; currentUserEmail = user.email;
        localStorage.setItem('user_name', user.displayName);
        if (window.location.pathname.includes("index.html")) window.location.href = "home.html";
        generateNextChallenge(); syncStatsUI();
    } else if (!window.location.pathname.includes("index.html")) {
        window.location.replace("index.html");
    }
});

setInterval(checkHeartStatus, 1000);
window.onload = syncStatsUI;


