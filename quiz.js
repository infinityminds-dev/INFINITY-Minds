// --- 1. FIREBASE SETUP ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, doc, updateDoc, getDocs, where } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAFRj4L-nsDW37e5gc4WC41pbGgostvN6A",
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
const REFILL_TIME = 3 * 60 * 60 * 1000; // 3 Hours

const database = [
    { type: 'quiz', q: "Which tag is used for an image?", opt: ["<img>", "<pic>", "<src>"], c: "<img>" },
    { type: 'puzzle', q: "What has a head and a tail but no body?", a: "A Coin 🪙" },
    { type: 'quiz', q: "CSS stands for?", opt: ["Cascading Style Sheets", "Color Style", "Creative Sheets"], c: "Cascading Style Sheets" },
    { type: 'puzzle', q: "I have cities but no houses. What am I?", a: "A Map 🗺️" },
    { type: 'quiz', q: "JS comments start with?", opt: ["//", "/*", "#"], c: "//" },
    { type: 'puzzle', q: "The more of me there is, the less you see. What am I?", a: "Darkness 🌑" }
];

// --- 3. GOOGLE LOGIN FUNCTION ---
window.loginWithGoogle = async function() {
    try {
        console.log("Login start...");
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Save to LocalStorage
        localStorage.setItem('user_name', user.displayName);
        localStorage.setItem('user_email', user.email);
        localStorage.setItem('user_photo', user.photoURL);
        
        // Update local variables for immediate use
        currentUserName = user.displayName;
        currentUserEmail = user.email;
        
        console.log("Login Success! Redirecting...");
        window.location.replace("home.html");
    } catch (error) {
        console.error("Login Error:", error);
        alert("Login Fail! Check if you are using HTTPS (Netlify link) and not a local file.");
    }
};

// --- 4. HEART & TIMER LOGIC ---
function checkHeartStatus() {
    const lastZeroTime = localStorage.getItem('last_heart_zero_time');
    const timerScreen = document.getElementById('timer-screen');
    const mainGame = document.getElementById('main-game-area');

    if (lastZeroTime) {
        const now = new Date().getTime();
        const diff = now - parseInt(lastZeroTime);

        if (diff < REFILL_TIME) {
            const remaining = REFILL_TIME - diff;
            const h = Math.floor(remaining / 3600000).toString().padStart(2, '0');
            const m = Math.floor((remaining % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
            
            const display = document.getElementById('countdown-display');
            if(display) display.innerText = `${h}:${m}:${s}`;
            
            if(timerScreen) timerScreen.style.display = "block";
            if(mainGame) mainGame.style.display = "none";
            return false;
        } else {
            localStorage.removeItem('last_heart_zero_time');
            hearts = 3;
            if(timerScreen) timerScreen.style.display = "none";
            if(mainGame) mainGame.style.display = "block";
            return true;
        }
    }
    return true;
}

// --- 5. GAMEPLAY LOGIC ---
function generateNextChallenge() {
    const container = document.getElementById('game-container');
    if(!container) return; 
    
    const item = database[Math.floor(Math.random() * database.length)];
    if (item.type === 'puzzle') {
        container.innerHTML = `
            <div class="card">
                <h3>🧩 ${item.q}</h3>
                <button class="btn-main" onclick="revealPuzzle(this, '${item.a}')">Show Answer 💡</button>
                <p style="display:none; color:#10b981; margin-top:15px; font-weight:800;">Ans: ${item.a}</p>
            </div>`;
    } else {
        container.innerHTML = `
            <div class="card">
                <h3>💻 ${item.q}</h3>
                <div class="options">
                    ${item.opt.map(o => `<button onclick="checkAnswer(this, '${o}', '${item.c}')">${o}</button>`).join('')}
                </div>
            </div>`;
    }
}

window.revealPuzzle = function(btn, ans) {
    const p = btn.nextElementSibling;
    if(p && p.style.display === "none") {
        p.style.display = "block";
        updateXP(10);
        btn.innerText = "Next Challenge ➡️";
        btn.onclick = generateNextChallenge;
    }
};

window.checkAnswer = function(btn, sel, cor) {
    if(sel === cor) {
        btn.style.background = "#10b981";
        btn.style.color = "white";
        updateXP(20);
        setTimeout(generateNextChallenge, 800);
    } else {
        btn.style.background = "#ef4444";
        btn.style.color = "white";
        hearts--;
        syncStatsUI();
        if(hearts <= 0) handleGameOver();
    }
};

function handleGameOver() {
    localStorage.setItem('last_heart_zero_time', new Date().getTime().toString());
    alert("💥 GAME OVER! 3 ghante baad refill hoga.");
    window.location.reload(); 
}

function updateXP(val) {
    xp += val;
    if(xp >= level * 100) { 
        level++; 
        xp = 0; 
        alert("🎉 LEVEL UP! Level " + level); 
    }
    localStorage.setItem('inf_xp', xp);
    localStorage.setItem('inf_lvl', level);
    syncStatsUI();
    saveToFirebase(); 
}

function syncStatsUI() {
    const hEl = document.getElementById('user-hearts');
    const xEl = document.getElementById('user-xp');
    const lEl = document.getElementById('user-level');
    const nEl = document.getElementById('display-name');

    if(hEl) hEl.innerText = hearts;
    if(xEl) xEl.innerText = xp;
    if(lEl) lEl.innerText = level;
    if(nEl) nEl.innerText = currentUserName || "Explorer";
}

// --- 6. FIREBASE SYNC & LEADERBOARD ---
async function saveToFirebase() {
    if(!currentUserEmail) return;
    const totalScore = (level * 100) + xp;
    try {
        const q = query(collection(db, "leaderboard"), where("email", "==", currentUserEmail));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            await addDoc(collection(db, "leaderboard"), { name: currentUserName, email: currentUserEmail, score: totalScore, level: level });
        } else {
            const userDoc = querySnapshot.docs[0];
            if(totalScore > userDoc.data().score) {
                await updateDoc(doc(db, "leaderboard", userDoc.id), { score: totalScore, level: level });
            }
        }
    } catch (e) { console.error("Firebase Save Error", e); }
}

// Real-time Leaderboard Listener
const lbList = document.getElementById('leaderboard-list');
if(lbList) {
    onSnapshot(query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(5)), (snapshot) => {
        lbList.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            lbList.innerHTML += `<li><span>${data.name} (Lvl ${data.level})</span> <b>${data.score} XP</b></li>`;
        });
    });
}

// Initial Run
setInterval(checkHeartStatus, 1000);

window.onload = () => {
    checkHeartStatus();
    syncStatsUI();
    if(document.getElementById('game-container')) generateNextChallenge();
};
