// Sidebar Logic 

function toggleSidebar() {
      document.getElementById("sidebar").classList.toggle("show");
    }



window.onload = () => {
    // LocalStorage se naam uthao jo index.html ne save kiya tha
    const name = localStorage.getItem('user_name');
    const displayName = document.getElementById('display-name');
    
    if (name && displayName) {
        displayName.innerText = name;
    }
};
