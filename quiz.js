// --- 1. IMPORTS ---
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
provider.setCustomParameters({ prompt: 'select_account' });

// --- 2. GAME VARIABLES & DATABASE (With Unique IDs) ---
let xp = parseInt(localStorage.getItem('inf_xp')) || 0;
let level = parseInt(localStorage.getItem('inf_lvl')) || 1;
let hearts = 3; 
let currentUserName = localStorage.getItem('user_name') || "";
let currentUserEmail = localStorage.getItem('user_email') || ""; 
const REFILL_TIME = 3 * 60 * 60 * 1000;

const database = [
    // HTML (ID: 1-10)
    { id: 1, type: 'quiz', q: "Which tag is used for an image?", opt: ["<img>", "<pic>", "<src>"], c: "<img>" },
    { id: 2, type: 'quiz', q: "Largest heading tag?", opt: ["<h1>", "<h6>", "<head>"], c: "<h1>" },
    { id: 3, type: 'quiz', q: "Tag for a line break?", opt: ["<br>", "<lb>", "<break>"], c: "<br>" },
    { id: 4, type: 'quiz', q: "Tag for unordered list?", opt: ["<ul>", "<ol>", "<li>"], c: "<ul>" },
    { id: 5, type: 'quiz', q: "How to make a checkbox?", opt: ["<input type='checkbox'>", "<check>", "<checkbox>"], c: "<input type='checkbox'>" },
    // CSS (ID: 11-20)
    { id: 11, type: 'quiz', q: "CSS stands for?", opt: ["Cascading Style Sheets", "Color Style", "Creative Sheets"], c: "Cascading Style Sheets" },
    { id: 12, type: 'quiz', q: "Property for background color?", opt: ["background-color", "color", "bgcolor"], c: "background-color" },
    { id: 13, type: 'quiz', q: "Select element with id 'demo'?", opt: ["#demo", ".demo", "demo"], c: "#demo" },
    { id: 14, type: 'quiz', q: "Property to change text color?", opt: ["color", "font-color", "text-style"], c: "color" },
    { id: 15, type: 'quiz', q: "Make text bold in CSS?", opt: ["font-weight:bold", "style:bold", "font:bold"], c: "font-weight:bold" },
    // JS (ID: 21-30)
    { id: 21, type: 'quiz', q: "JS comments start with?", opt: ["//", "/*", "#"], c: "//" },
    { id: 22, type: 'quiz', q: "How to write an alert?", opt: ["alert('Hi')", "msg('Hi')", "log('Hi')"], c: "alert('Hi')" },
    { id: 23, type: 'quiz', q: "Symbol for strict equality?", opt: ["===", "==", "="], c: "===" },
    { id: 24, type: 'quiz', q: "Which is a JS variable?", opt: ["let", "var", "Both"], c: "Both" },
    // PUZZLES (ID: 31-40)
    { id: 31, type: 'puzzle', q: "What has a head and a tail but no body?", a: "Coin" },
    { id: 32, type: 'puzzle', q: "I have cities but no houses. What am I?", a: "Map" },
    { id: 33, type: 'puzzle', q: "The more of me there is, the less you see?", a: "Darkness" },
    { id: 34, type: 'puzzle', q: "I have keys but no locks?", a: "Keyboard" },
    { id: 35, type: 'puzzle', q: "What has many teeth but cannot bite?", a: "Comb" }
];

function getWeekIdentifier() {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    return `${now.getFullYear()}-W${Math.ceil((now.getDay() + 1 + numberOfDays) / 7)}`; 
}

// --- 3. AUTH & LOGOUT ---
window.logout = () => signOut(auth).then(() => { localStorage.clear(); window.location.replace("index.html"); });
window.loginWithGoogle = async () => { try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); } };

function handleAuthStatus() {
    onAuthStateChanged(auth, (user) => {
        const isLoginPage = window.location.pathname.includes("index.html") || window.location.pathname === "/";
        if (user) {
            currentUserName = user.displayName; currentUserEmail = user.email;
            localStorage.setItem('user_name', user.displayName); localStorage.setItem('user_email', user.email);
            if (isLoginPage) { window.location.href = "home.html"; return; }
            document.getElementById('login-screen').style.display = "none";
            document.getElementById('main-game-area').style.display = "block";
            generateNextChallenge(); syncStatsUI(); saveToFirebase();
        } else if(!isLoginPage) { window.location.replace("index.html"); }
    });
}

// --- 4. GAMEPLAY & SOLVE/SKIP LOGIC ---
function markAsSolved(id) {
    let solved = JSON.parse(localStorage.getItem('solved_ids')) || [];
    if(!solved.includes(id)) {
        solved.push(id);
        localStorage.setItem('solved_ids', JSON.stringify(solved));
    }
}

window.generateNextChallenge = function() {
    const container = document.getElementById('game-container');
    if(!container) return; 

    let solvedToday = JSON.parse(localStorage.getItem('solved_ids')) || [];
    const pool = database.filter(item => !solvedToday.includes(item.id));

    if (pool.length === 0) {
        container.innerHTML = `<div class="card"><h3>🏆 Quota Completed!</h3><p>Aapne aaj ke saare sawal solve kar liye hain. Kal naye challenges aayenge!</p></div>`;
        return;
    }

    const item = pool[Math.floor(Math.random() * pool.length)];
    
    if (item.type === 'puzzle') {
        container.innerHTML = `
            <div class="card">
                <h3>🧩 ${item.q}</h3>
                <input type="text" id="puzzle-answer" placeholder="Type answer...">
                <button class="btn-main" onclick="checkPuzzleAnswer('${item.a}', ${item.id})">Submit Answer 🚀</button>
                <button class="btn-secondary" style="background:none;border:none;color:#94a3b8;text-decoration:underline;margin-top:10px;cursor:pointer;" 
                    onclick="revealPuzzleSolution('${item.a}', ${item.id})">Show Answer (0 XP) 💡</button>
                <p id="solution-text" style="display:none; color:#10b981; margin-top:15px; font-weight:800;"></p>
            </div>`;
    } else {
        container.innerHTML = `
            <div class="card">
                <h3>💻 ${item.q}</h3>
                <div class="options">
                    ${item.opt.map(o => `<button onclick="checkAnswer(this, '${o}', '${item.c}', ${item.id})">${o}</button>`).join('')}
                </div>
            </div>`;
    }
}

window.skipChallenge = () => generateNextChallenge(); // Skip pool se ID nahi hatayega

window.checkPuzzleAnswer = (correct, id) => {
    const val = document.getElementById('puzzle-answer').value.trim().toLowerCase();
    if(val === correct.toLowerCase()) { 
        markAsSolved(id); // ID save: ab dobara nahi aayega
        updateXP(15); 
        generateNextChallenge(); 
    } else { 
        hearts--; syncStatsUI(); if(hearts <= 0) handleGameOver(); else alert("Wrong! -1 Heart 💔"); 
    }
};

window.revealPuzzleSolution = (ans, id) => {
    const p = document.getElementById('solution-text');
    p.innerText = "Ans: " + ans; p.style.display = "block";
    markAsSolved(id); // Show answer pe bhi solve mana jayega taaki spam na ho
    setTimeout(generateNextChallenge, 2500);
};

window.checkAnswer = (btn, sel, cor, id) => {
    if(sel === cor) { 
        btn.style.background = "#10b981"; 
        markAsSolved(id); // ID save
        updateXP(20); 
        setTimeout(generateNextChallenge, 800); 
    } else { 
        btn.style.background = "#ef4444"; hearts--; syncStatsUI(); if(hearts <= 0) handleGameOver(); 
    }
};

// --- 5. XP, FIREBASE & UI ---
function updateXP(val) {
    xp += val; if(xp >= level * 100) { level++; xp = 0; alert("🎉 LEVEL UP!"); }
    localStorage.setItem('inf_xp', xp); localStorage.setItem('inf_lvl', level);
    syncStatsUI(); saveToFirebase();
}

async function saveToFirebase() {
    if(!currentUserEmail) return;
    const currentWeek = getWeekIdentifier();
    const totalScore = Number((level * 100) + xp);
    try {
        const lbRef = collection(db, "leaderboard");
        const q = query(lbRef, where("email", "==", currentUserEmail));
        const snap = await getDocs(q);
        const data = { name: currentUserName, email: currentUserEmail, score: totalScore, level: Number(level), week: currentWeek, lastSeen: new Date() };
        if (snap.empty) { await addDoc(lbRef, data); }
        else {
            const dRef = doc(db, "leaderboard", snap.docs[0].id);
            if (snap.docs[0].data().week !== currentWeek) { await updateDoc(dRef, data); }
            else if(totalScore > snap.docs[0].data().score) { await updateDoc(dRef, { score: totalScore, level: Number(level) }); }
        }
    } catch (e) { console.error(e); }
}

const lbList = document.getElementById('leaderboard-list');
if(lbList) {
    onSnapshot(query(collection(db, "leaderboard"), where("week", "==", getWeekIdentifier()), orderBy("score", "desc"), limit(5)), (snap) => {
        lbList.innerHTML = "";
        snap.forEach(d => { 
            const res = d.data();
            lbList.innerHTML += `<li><span>${res.name} (Lvl ${res.level})</span> <b>${res.score} XP</b></li>`; 
        });
    });
}

function syncStatsUI() {
    const el = {'user-hearts': hearts, 'user-xp': xp, 'user-level': level, 'display-name': currentUserName || "Explorer"};
    for (const [id, val] of Object.entries(el)) { if(document.getElementById(id)) document.getElementById(id).innerText = val; }
}

function handleGameOver() { localStorage.setItem('last_heart_zero_time', new Date().getTime().toString()); window.location.reload(); }

function checkHeartStatus() {
    const lastZeroTime = localStorage.getItem('last_heart_zero_time');
    const timerScreen = document.getElementById('timer-screen');
    const mainGame = document.getElementById('main-game-area');
    if (lastZeroTime) {
        const diff = new Date().getTime() - parseInt(lastZeroTime);
        if (diff < REFILL_TIME) {
            const remaining = REFILL_TIME - diff;
            const h = Math.floor(remaining / 3600000).toString().padStart(2, '0');
            const m = Math.floor((remaining % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
            if(document.getElementById('countdown-display')) document.getElementById('countdown-display').innerText = `${h}:${m}:${s}`;
            if(timerScreen) timerScreen.style.display = "block";
            if(mainGame) mainGame.style.display = "none";
            return;
        }
        localStorage.removeItem('last_heart_zero_time');
        hearts = 3; window.location.reload();
    }
}

setInterval(checkHeartStatus, 1000);
window.onload = () => { handleAuthStatus(); syncStatsUI(); };
