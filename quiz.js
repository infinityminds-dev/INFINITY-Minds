// --- 1. IMPORTS & CONFIG ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    limit, 
    doc, 
    updateDoc, 
    getDocs, 
    where 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Saare Auth functions (Added Popup and Persistence for Mobile fix)
import { 
    getAuth, 
    signInWithRedirect, 
    signInWithPopup, 
    getRedirectResult, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signOut,
    setPersistence,
    browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

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

    // --- ☕ PROGRAMMING: JAVA ---
    { id: 220,type: 'quiz', category: 'java', q: "Which keyword is used to define a method in Java?",opt: ["public", "void", "static"], c: "void" },
    { id: 221, type: 'quiz', category: 'java', q: "Who developed the Java programming language?", opt: ["James Gosling", "Dennis Ritchie", "Bjarne Stroustrup"], c: "James Gosling"},
    {id: 222, type: 'quiz', category: 'java', q: "Which keyword is used to create an object in Java?", opt: ["new", "create", "alloc"], c: "new" }

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
    if(!solved.includes(id)) { 
        solved.push(id); 
        localStorage.setItem('solved_ids', JSON.stringify(solved)); 
    }
}

function updateXP(val) {
    // 1. Permanent Progress (Level Up Logic)
    xp += val; 
    if(xp >= level * 100) { 
        xp -= level * 100; 
        level++; 
        alert("🎉 LEVEL UP!"); 
    }
    localStorage.setItem('inf_xp', xp); 
    localStorage.setItem('inf_lvl', level);

    // 2. Weekly Competition Logic (Reset every Monday)
    const currentWeek = getWeekIdentifier();
    const lastSavedWeek = localStorage.getItem('last_saved_week');
    let weeklyXP = parseInt(localStorage.getItem('weekly_xp')) || 0;

    // Agar hafta badal gaya hai toh weekly score 0 se shuru hoga
    if (lastSavedWeek !== currentWeek) {
        weeklyXP = val; 
        localStorage.setItem('last_saved_week', currentWeek);
    } else {
        weeklyXP += val;
    }
    localStorage.setItem('weekly_xp', weeklyXP);

    syncStatsUI(); 
    saveToFirebase(weeklyXP); // Sirf Weekly XP Firebase bhej rahe hain
}

// FIXED: Monday Refresh & Fairness Score
async function saveToFirebase(weeklyScore) {
    if(!currentUserEmail) return;
    try {
        const currentWeek = getWeekIdentifier();
        // Database mein sirf is hafte ka entry dhoondo
        const q = query(collection(db, "leaderboard"), 
                  where("email", "==", currentUserEmail),
                  where("week", "==", currentWeek));
        
        const snap = await getDocs(q);
        
        // Data format (Level safe hai, par rank Weekly Score se decide hogi)
        const data = { 
            name: currentUserName, 
            email: currentUserEmail, 
            score: weeklyScore, // Rank ke liye sirf is hafte ki mehnat
            level: level,       // Level bas dikhane ke liye
            week: currentWeek, 
            lastSeen: new Date() 
        };

        if (snap.empty) { 
            await addDoc(collection(db, "leaderboard"), data); 
        } else { 
            await updateDoc(doc(db, "leaderboard", snap.docs[0].id), data); 
        }
        
        if (typeof updateLeaderboard === "function") updateLeaderboard();
        
    } catch (e) { 
        console.error("Firebase Sync Error:", e); 
    }
}

function syncStatsUI() {
    localStorage.setItem('inf_hearts', hearts);
    // UI par display stats
    const el = {
        'user-hearts': hearts, 
        'user-xp': xp, // Ye total progress dikhayega
        'user-level': level, 
        'display-name': currentUserName || "Explorer"
    };
    for (const [id, val] of Object.entries(el)) { 
        if(document.getElementById(id)) document.getElementById(id).innerText = val; 
    }
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
        hearts = 3; 
        syncStatsUI(); 
        window.location.reload();
    }
}



// --- 8. AUTH & STATE LOGIC ---

// A. Persistence (Login yaad rakhne ke liye)
const initializeAuth = async () => {
    try {
        await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
        console.error("Persistence Error:", e);
    }
};
initializeAuth();

// B. Redirect Result Handle
getRedirectResult(auth).then((result) => {
    if (result && result.user) {
        localStorage.setItem('user_name', result.user.displayName);
        window.location.replace("home.html");
    }
}).catch((e) => console.error("Redirect Login Error:", e));

// C. Login Trigger
window.loginWithGoogle = async () => { 
    try { 
        const result = await signInWithPopup(auth, provider);
        if (result.user) {
            localStorage.setItem('user_name', result.user.displayName);
            // Agar quiz page par hi ho, toh reload ya redirect ki zarurat nahi, State handle kar lega
        }
    } catch (e) { 
        console.warn("Popup blocked, trying redirect..."); 
        await signInWithRedirect(auth, provider); 
    } 
};

// D. Logout
window.logout = () => signOut(auth).then(() => { 
    localStorage.clear(); 
    window.location.replace("index.html"); 
});

// E. State Persistence & UI Toggle (Main Magic Here)
onAuthStateChanged(auth, (user) => {
    const loginScreen = document.getElementById('login-screen');
    const gameArea = document.getElementById('main-game-area');
    const timerScreen = document.getElementById('timer-screen');
    const isLoginPage = window.location.pathname.includes("index.html") || window.location.pathname === "/";

    if (user) {
        currentUserName = user.displayName; 
        currentUserEmail = user.email;
        localStorage.setItem('user_name', user.displayName);
        
        // Agar index page par hai toh home bhej do
        if (isLoginPage) {
            window.location.replace("home.html");
            return;
        }

        // --- QUIZ PAGE UI LOGIC ---
        // 1. Login card chhupao
        if (loginScreen) loginScreen.style.display = 'none';

        // 2. Stats update karo
        if (typeof syncStatsUI === "function") syncStatsUI();

        // 3. Hearts check karke Game ya Timer dikhao
        const hearts = parseInt(localStorage.getItem('hearts')) || 3;
        if (hearts > 0) {
            if (gameArea) gameArea.style.display = 'block';
            if (timerScreen) timerScreen.style.display = 'none';
            if (typeof generateNextChallenge === "function") generateNextChallenge(); 
        } else {
            if (gameArea) gameArea.style.display = 'none';
            if (timerScreen) timerScreen.style.display = 'block';
        }
        
    } else {
        // User logout hai: Login screen dikhao, baki sab chhupao
        if (loginScreen) loginScreen.style.display = 'block';
        if (gameArea) gameArea.style.display = 'none';
        if (timerScreen) timerScreen.style.display = 'none';
    }
});

// --- 9. FINAL INITIALIZATION (With Weekly Reset Logic) ---

window.onload = async () => {
    // 1. Permanent Stats Load (Level aur Total XP jo kabhi reset nahi honge)
    xp = parseInt(localStorage.getItem('inf_xp')) || 0;
    level = parseInt(localStorage.getItem('inf_lvl')) || 1;
    hearts = parseInt(localStorage.getItem('inf_hearts')) || 3;

    // 2. WEEKLY RESET CHECK (Leaderboard Fairness ke liye)
    const currentWeek = getWeekIdentifier();
    const lastSavedWeek = localStorage.getItem('last_saved_week');

    if (lastSavedWeek !== currentWeek) {
        // Naya hafta shuru! Weekly score reset karo par Level wahi rahega
        localStorage.setItem('weekly_xp', 0); 
        localStorage.setItem('last_saved_week', currentWeek);
        console.log("Naya hafta shuru! Weekly XP reset ho gayi hai. 🚀");
    }

    // 3. Stats UI update (XP, Hearts, etc.)
    syncStatsUI(); 
    
    // 4. User ka naam update logic
    const name = localStorage.getItem('user_name');
    const displayNameElement = document.getElementById('display-name');
    if (name && displayNameElement) {
        displayNameElement.innerText = name;
    }

    // 5. Heart refill check
    checkHeartStatus();

    // 6. LEADERBOARD & WINNERS LOAD
    if (typeof updateLeaderboard === "function") {
        updateLeaderboard(); 
    }
    if (typeof updateWinners === "function") {
        updateWinners();
    }
};

// Timer refresh
setInterval(checkHeartStatus, 1000);


// --- 10. LEADERBOARD & WINNERS UI ---

// A. Weekly Leaderboard with (You) highlight
window.updateLeaderboard = function() {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;

    const currentWeek = getWeekIdentifier();
    const q = query(collection(db, "leaderboard"), 
                  where("week", "==", currentWeek), 
                  orderBy("score", "desc"), 
                  limit(10));

    onSnapshot(q, (snapshot) => {
        list.innerHTML = "";
        if (snapshot.empty) {
            list.innerHTML = "<p style='text-align:center; font-size:12px; opacity:0.5;'>New week started! Be the first.</p>";
            return;
        }

        snapshot.forEach((docSnap) => {
            const user = docSnap.data();
            const isMe = user.email === currentUserEmail;
            const li = document.createElement('li');
            
            li.style.cssText = `
                display:flex; justify-content:space-between; padding:10px; 
                border-bottom:1px solid rgba(255,255,255,0.1); list-style:none;
                ${isMe ? 'background: rgba(59, 130, 246, 0.2); border-radius: 8px; border: 1px solid #3b82f6;' : ''}
            `;
            
            li.innerHTML = `
                <span style="color:white; font-weight: ${isMe ? 'bold' : 'normal'};">
                    ${user.name} ${isMe ? '<small style="color:#10b981;">(You)</small>' : ''}
                </span>
                <span style="color:#fbbf24; font-weight: bold;">${user.score} XP</span>
            `;
            list.appendChild(li);
        });
    });
};

// B. Weekly Winners (Pichle Hafte ke Top 3)
window.updateWinners = function() {
    const winnerList = document.getElementById('winner-list');
    if (!winnerList) return;

    // --- LAST WEEK NIKALNE KA LOGIC ---
    const d = new Date();
    // Aaj se 7 din peeche jao pichle hafte ka ID nikalne ke liye
    d.setDate(d.getDate() - 7); 
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const lastWeekID = `${d.getFullYear()}-W${Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 86400000) + 1) / 7)}`;

    console.log("Fetching Winners for:", lastWeekID);

    // Sirf pichle hafte (lastWeekID) ka Top 3 data uthao
    const q = query(collection(db, "leaderboard"), 
                  where("week", "==", lastWeekID), 
                  orderBy("score", "desc"), 
                  limit(3));
    
    onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            winnerList.innerHTML = "";
            let rank = 1;
            snapshot.forEach(doc => {
                const d = doc.data();
                const crown = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : '🥉');
                winnerList.innerHTML += `
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom: 1px dashed rgba(251,191,36,0.2); padding-bottom: 5px;">
                        <span style="font-size:13px; color:#fbbf24;">${crown} ${d.name}</span>
                        <span style="font-size:11px; opacity:0.7;">Score: ${d.score}</span>
                    </div>`;
                rank++;
            });
        } else {
            winnerList.innerHTML = `<p style="font-size:12px; color:gray;">Next winners announced this Monday! 🏆</p>`;
        }
    });
};
