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
let hearts = 3; 
let currentUserName = localStorage.getItem('user_name') || "";
let currentUserEmail = localStorage.getItem('user_email') || ""; 
const REFILL_TIME = 3 * 60 * 60 * 1000;

// --- 3. FULL DATABASE (55 QUESTIONS) ---
const database = [
    { id: 1, type: 'quiz', q: "Which tag is used for an image?", opt: ["<img>", "<pic>", "<src>"], c: "<img>" },
    { id: 2, type: 'quiz', q: "Largest heading tag?", opt: ["<h1>", "<h6>", "<head>"], c: "<h1>" },
    { id: 3, type: 'quiz', q: "Tag for a line break?", opt: ["<br>", "<lb>", "<break>"], c: "<br>" },
    { id: 4, type: 'quiz', q: "Tag for unordered list?", opt: ["<ul>", "<ol>", "<li>"], c: "<ul>" },
    { id: 5, type: 'quiz', q: "How to make a checkbox?", opt: ["<input type='checkbox'>", "<check>", "<checkbox>"], c: "<input type='checkbox'>" },
    { id: 6, type: 'quiz', q: "Which property makes text italic?", opt: ["font-style:italic", "font-weight:italic", "text-decoration:italic"], c: "font-style:italic" },
    { id: 7, type: 'quiz', q: "Correct way to write an Array in JS?", opt: ["let x = [1,2,3]", "let x = (1,2,3)", "let x = {1,2,3}"], c: "let x = [1,2,3]" },
    { id: 8, type: 'quiz', q: "Tag for a table row?", opt: ["<tr>", "<td>", "<th>"], c: "<tr>" },
    { id: 9, type: 'quiz', q: "How to add background color in CSS?", opt: ["background-color: blue", "color: blue", "bg-color: blue"], c: "background-color: blue" },
    { id: 10, type: 'quiz', q: "Which event occurs when user clicks?", opt: ["onclick", "onmouseclick", "onchange"], c: "onclick" },
    { id: 11, type: 'quiz', q: "CSS stands for?", opt: ["Cascading Style Sheets", "Color Style", "Creative Sheets"], c: "Cascading Style Sheets" },
    { id: 12, type: 'quiz', q: "Property for background color?", opt: ["background-color", "color", "bgcolor"], c: "background-color" },
    { id: 13, type: 'quiz', q: "Select element with id 'demo'?", opt: ["#demo", ".demo", "demo"], c: "#demo" },
    { id: 14, type: 'quiz', q: "Property to change text color?", opt: ["color", "font-color", "text-style"], c: "color" },
    { id: 15, type: 'quiz', q: "Make text bold in CSS?", opt: ["font-weight:bold", "style:bold", "font:bold"], c: "font-weight:bold" },
    { id: 16, type: 'quiz', q: "Which tag is a 'Self-Closing' tag?", opt: ["<img>", "<div>", "<p>"], c: "<img>" },
    { id: 17, type: 'quiz', q: "How to display an 'Alert' box?", opt: ["alert('Hello')", "msg('Hello')", "prompt('Hello')"], c: "alert('Hello')" },
    { id: 21, type: 'quiz', q: "JS comments start with?", opt: ["//", "/*", "#"], c: "//" },
    { id: 23, type: 'quiz', q: "Symbol for strict equality?", opt: ["===", "==", "="], c: "===" },
    { id: 24, type: 'quiz', q: "Which is a JS variable declaration?", opt: ["let", "var", "Both"], c: "Both" },
    { id: 31, type: 'puzzle', q: "What has a head and a tail but no body?", a: "Coin" },
    { id: 32, type: 'puzzle', q: "I have cities but no houses. What am I?", a: "Map" },
    { id: 33, type: 'puzzle', q: "The more of me there is, the less you see?", a: "Darkness" },
    { id: 34, type: 'puzzle', q: "I have keys but no locks?", a: "Keyboard" },
    { id: 35, type: 'puzzle', q: "What has many teeth but cannot bite?", a: "Comb" },
    { id: 36, type: 'puzzle', q: "When the sun sets, I am gone. What am I?", a: "Shadow" },
    { id: 37, type: 'puzzle', q: "I have a thumb and four fingers. What am I?", a: "Glove" },
    { id: 38, type: 'puzzle', q: "What can you catch but not throw?", a: "Cold" },
    { id: 39, type: 'puzzle', q: "The more you take, the more you leave behind?", a: "Footsteps" },
    { id: 40, type: 'puzzle', q: "I am full of holes but hold water?", a: "Sponge" },
    { id: 41, type: 'quiz', q: "Property used to change font family?", opt: ["font-family", "font-style", "font-weight"], c: "font-family" },
    { id: 42, type: 'quiz', q: "Inside which tag do we put JS?", opt: ["<script>", "<js>", "<javascript>"], c: "<script>" },
    { id: 43, type: 'quiz', q: "How to create a JS function?", opt: ["function x()", "func x()", "def x()"], c: "function x()" },
    { id: 44, type: 'quiz', q: "Define inline styles with attribute?", opt: ["style", "class", "font"], c: "style" },
    { id: 45, type: 'quiz', q: "Insert CSS comment?", opt: ["/* c */", "// c", "# c"], c: "/* c */" },
    { id: 46, type: 'quiz', q: "Assign value to variable operator?", opt: ["=", "==", "==="], c: "=" },
    { id: 47, type: 'quiz', q: "Show 'Hello' in alert?", opt: ["alert('Hello')", "msg('Hello')", "log('Hello')"], c: "alert('Hello')" },
    { id: 48, type: 'quiz', q: "CSS property for text size?", opt: ["font-size", "text-size", "size"], c: "font-size" },
    { id: 49, type: 'quiz', q: "Is JS case-sensitive?", opt: ["Yes", "No", "Maybe"], c: "Yes" },
    { id: 50, type: 'quiz', q: "Tag for a hyperlink?", opt: ["<a>", "<img>", "<link>"], c: "<a>" },
    { id: 51, type: 'puzzle', q: "I have branches but no fruit or leaves?", a: "Bank" },
    { id: 52, type: 'puzzle', q: "Stays in a corner but travels the world?", a: "Stamp" },
    { id: 53, type: 'puzzle', q: "What has a neck but no head?", a: "Bottle" },
    { id: 54, type: 'puzzle', q: "Fragile that name breaks it?", a: "Silence" },
    { id: 55, type: 'puzzle', q: "What can you break without touching it?", a: "Promise" }
];

// --- 4. HELPERS & WEEK LOGIC ---
function getWeekIdentifier(offset = 0) {
    const now = new Date();
    if (offset !== 0) now.setDate(now.getDate() + (offset * 7));
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    return `${now.getFullYear()}-W${Math.ceil((now.getDay() + 1 + numberOfDays) / 7)}`; 
}

function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// --- 5. AUTH & RESET LOGIC ---
window.loginWithGoogle = async () => { try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); } };
window.logout = () => signOut(auth).then(() => { localStorage.clear(); window.location.replace("index.html"); });

function handleAuthStatus() {
    onAuthStateChanged(auth, (user) => {
        const isLoginPage = window.location.pathname.includes("index.html") || window.location.pathname === "/";
        if (user) {
            currentUserName = user.displayName; currentUserEmail = user.email;
            localStorage.setItem('user_name', user.displayName); localStorage.setItem('user_email', user.email);
            if (isLoginPage) { window.location.href = "home.html"; return; }
            
            // WEEKLY RESET (XP goes to 0, Level stays)
            const lastSavedWeek = localStorage.getItem('inf_last_week');
            if (lastSavedWeek && lastSavedWeek !== getWeekIdentifier()) {
                xp = 0; localStorage.setItem('inf_xp', 0);
                localStorage.setItem('solved_ids', JSON.stringify([]));
            }
            localStorage.setItem('inf_last_week', getWeekIdentifier());

            if(document.getElementById('main-game-area')) document.getElementById('main-game-area').style.display = "block";
            if(document.getElementById('login-screen')) document.getElementById('login-screen').style.display = "none";
            generateNextChallenge(); syncStatsUI(); saveToFirebase();
        } else if(!isLoginPage) { window.location.replace("index.html"); }
    });
}

// --- 6. GAMEPLAY ENGINE ---
window.generateNextChallenge = function() {
    const container = document.getElementById('game-container');
    if(!container) return; 

    let solved = JSON.parse(localStorage.getItem('solved_ids')) || [];
    const pool = database.filter(item => !solved.includes(item.id));

    if (pool.length === 0) {
        container.innerHTML = `<div class="card"><h3>🏆 Quota Completed!</h3><p>Sab sawal khatam! Kal naye milenge.</p></div>`;
        return;
    }

    const item = pool[Math.floor(Math.random() * pool.length)];
    
    if (item.type === 'puzzle') {
        container.innerHTML = `
            <div class="card">
                <h3>🧩 ${item.q}</h3>
                <input type="text" id="puzzle-answer" placeholder="Type answer...">
                <button class="btn-main" onclick="checkPuzzleAnswer('${item.a}', ${item.id})">Submit Answer 🚀</button>
            </div>`;
    } else {
        container.innerHTML = `
            <div class="card">
                <h3>💻 ${item.q}</h3>
                <div class="options">
                    ${item.opt.map(o => `<button onclick="checkAnswer(this, '${o.replace(/'/g, "\\'")}', '${item.c.replace(/'/g, "\\'")}', ${item.id})">${escapeHTML(o)}</button>`).join('')}
                </div>
            </div>`;
    }
}

window.checkAnswer = (btn, sel, cor, id) => {
    if(sel === cor) { 
        btn.style.background = "#10b981"; btn.style.color = "white";
        markAsSolved(id); updateXP(20); 
        setTimeout(generateNextChallenge, 800); 
    } else { 
        btn.style.background = "#ef4444"; btn.style.color = "white";
        hearts--; syncStatsUI(); if(hearts <= 0) handleGameOver(); else alert("Wrong! 💔");
    }
};

window.checkPuzzleAnswer = (correct, id) => {
    const val = document.getElementById('puzzle-answer').value.trim().toLowerCase();
    if(val === correct.toLowerCase()) { 
        markAsSolved(id); updateXP(15); generateNextChallenge(); 
    } else { 
        hearts--; syncStatsUI(); if(hearts <= 0) handleGameOver(); else alert("Wrong! 💔"); 
    }
};

function markAsSolved(id) {
    let solved = JSON.parse(localStorage.getItem('solved_ids')) || [];
    if(!solved.includes(id)) { solved.push(id); localStorage.setItem('solved_ids', JSON.stringify(solved)); }
}

// --- 7. XP & CLOUD SYNC ---
function updateXP(val) {
    xp += val; 
    const target = level * 100;
    if(xp >= target) { xp -= target; level++; alert("🎉 LEVEL UP!"); }
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
            const cloudData = snap.docs[0].data();
            if (cloudData.week !== currentWeek) { await updateDoc(dRef, { ...data, score: Number(level * 100) }); }
            else if (totalScore > cloudData.score) { await updateDoc(dRef, { score: totalScore, level: Number(level) }); }
        }
    } catch (e) { console.error(e); }
}

// --- 8. LEADERBOARD & HIGHLIGHTING ---
const lbList = document.getElementById('leaderboard-list');
if(lbList) {
    onSnapshot(query(collection(db, "leaderboard"), where("week", "==", getWeekIdentifier()), orderBy("score", "desc"), limit(5)), (snap) => {
        lbList.innerHTML = "";
        snap.forEach(d => { 
            const res = d.data();
            const isMe = res.email === currentUserEmail; 
            const style = isMe ? "background:rgba(59,130,246,0.2); border:1px solid #3b82f6; border-radius:8px; padding:8px; margin-bottom:5px;" : "padding:8px; border-bottom:1px solid #eeeeee22;";
            lbList.innerHTML += `<li style="list-style:none; ${style}">
                <span style="${isMe ? 'font-weight:bold; color:#3b82f6;' : ''}">${res.name} (Lvl ${res.level}) ${isMe ? '<b>(YOU)</b>' : ''}</span>
                <b style="float:right; ${isMe ? 'color:#3b82f6;' : ''}">${res.score} XP</b>
            </li><div style="clear:both;"></div>`; 
        });
    });
}

const winnerBox = document.getElementById('winner-list');
if(winnerBox) {
    const lastWeek = getWeekIdentifier(-1);
    getDocs(query(collection(db, "leaderboard"), where("week", "==", lastWeek), orderBy("score", "desc"), limit(3))).then(snap => {
        if(!snap.empty) {
            winnerBox.innerHTML = "";
            snap.forEach((d, i) => {
                const w = d.data();
                const medal = i===0 ? "🥇" : i===1 ? "🥈" : "🥉";
                winnerBox.innerHTML += `<p style="font-size:14px; margin:5px 0;">${medal} ${w.name} - <b>Lvl ${w.level}</b></p>`;
            });
        }
    });
}

function syncStatsUI() {
    const el = {'user-hearts': hearts, 'user-xp': xp, 'user-level': level, 'display-name': currentUserName || "Explorer"};
    for (const [id, val] of Object.entries(el)) { if(document.getElementById(id)) document.getElementById(id).innerText = val; }
}

function handleGameOver() { localStorage.setItem('last_heart_zero_time', new Date().getTime().toString()); window.location.reload(); }

function checkHeartStatus() {
    const lastZeroTime = localStorage.getItem('last_heart_zero_time');
    if (lastZeroTime) {
        const diff = new Date().getTime() - parseInt(lastZeroTime);
        if (diff < REFILL_TIME) {
            const remaining = REFILL_TIME - diff;
            const h = Math.floor(remaining / 3600000).toString().padStart(2, '0');
            const m = Math.floor((remaining % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
            if(document.getElementById('countdown-display')) document.getElementById('countdown-display').innerText = `${h}:${m}:${s}`;
            if(document.getElementById('timer-screen')) document.getElementById('timer-screen').style.display = "block";
            if(document.getElementById('main-game-area')) document.getElementById('main-game-area').style.display = "none";
            return;
        }
        localStorage.removeItem('last_heart_zero_time');
        hearts = 3; window.location.reload();
    }
}

setInterval(checkHeartStatus, 1000);
window.onload = () => { handleAuthStatus(); syncStatsUI(); };
