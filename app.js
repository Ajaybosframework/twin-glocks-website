// ==================== FIREBASE CONFIG ====================
const firebaseConfig = {
  apiKey: "AIzaSyDNHmox9X-XQF9LE-SjQpuR_LyrU1oBTGM",
  authDomain: "twin-glocks.firebaseapp.com",
  projectId: "twin-glocks",
  storageBucket: "twin-glocks.firebasestorage.app",
  messagingSenderId: "233223778947",
  appId: "1:233223778947:web:28a193f4e1b579fb5ee1b6",
  measurementId: "G-V28WDH62T8"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully!");
} catch (error) {
    console.log('Firebase already initialized');
}

const auth = firebase.auth();

// ==================== USER DATA STORAGE ====================
function saveUserData(user) {
    const userData = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        isLoggedIn: true,
        loginTime: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        cart: [],
        wishlist: [],
        orders: []
    };
    
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log("✅ User data saved to localStorage");
}

function loadUserData() {
    const saved = localStorage.getItem('userData');
    if (saved) {
        return JSON.parse(saved);
    }
    return null;
}

function clearUserData() {
    localStorage.removeItem('userData');
    console.log("🗑️ User data cleared");
}

// ==================== SOCIAL LOGIN FUNCTIONALITY ====================
const googleBtn = document.querySelector('.googleBtn');
const facebookBtn = document.querySelector('.facebookBtn');
const githubBtn = document.querySelector('.githubBtn');
const loginStatus = document.getElementById('loginStatus');

let currentUser = null;

// Google Login
googleBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    signInWithProvider(provider, 'Google');
});

// Facebook Login
facebookBtn.addEventListener('click', () => {
    alert('Facebook login coming soon! Use Google for now.');
});

// GitHub Login
githubBtn.addEventListener('click', () => {
    alert('GitHub login coming soon! Use Google for now.');
});

function signInWithProvider(provider, providerName) {
    auth.signInWithPopup(provider)
        .then((result) => {
            currentUser = result.user;
            saveUserData(currentUser); // Save user data
            showLoginSuccess(`Welcome, ${currentUser.displayName}!`);
            updateUserInterface();
        })
        .catch((error) => {
            console.error('Login error:', error);
            showLoginError(`${providerName} login failed. Please try again.`);
        });
}

function showLoginSuccess(message) {
    loginStatus.style.display = 'block';
    loginStatus.style.background = '#e8f5e8';
    loginStatus.style.color = '#2e7d32';
    loginStatus.innerHTML = `✅ ${message}`;
}

function showLoginError(message) {
    loginStatus.style.display = 'block';
    loginStatus.style.background = '#ffebee';
    loginStatus.style.color = '#c62828';
    loginStatus.innerHTML = `❌ ${message}`;
    
    setTimeout(() => {
        loginStatus.style.display = 'none';
    }, 5000);
}

function updateUserInterface() {
    const socialButtons = document.querySelector('.socialLoginButtons');
    
    // ADD THIS CHECK - Fix the error
    if (!socialButtons) {
        console.log("Social buttons not found - page might still be loading");
        return;
    }
    
    const userInfoDiv = document.createElement('div');
    userInfoDiv.className = 'userInfo';
    userInfoDiv.innerHTML = `
        <img src="${currentUser.photoURL}" alt="User" class="userAvatar" onerror="this.src='https://via.placeholder.com/32'">
        <div class="userDetails">
            <div class="userName">${currentUser.displayName}</div>
            <div class="userEmail">${currentUser.email}</div>
        </div>
        <button class="logoutBtn">Logout</button>
    `;
    
    // ADD THIS CHECK - Fix the error
    if (socialButtons.parentNode) {
        socialButtons.parentNode.replaceChild(userInfoDiv, socialButtons);
        
        // Wait a bit before adding event listener
        setTimeout(() => {
            const logoutBtn = document.querySelector('.logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
            }
        }, 100);
    }
}

function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        clearUserData(); // Clear user data
        location.reload();
    });
}

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        saveUserData(currentUser); // Save user data
        updateUserInterface();
        showLoginSuccess(`Welcome back, ${currentUser.displayName}!`);
    }
});

// ==================== YOUR EXISTING PRODUCT CODE ====================
const wrapper = document.querySelector(".sliderWrapper");
const menuItems = document.querySelectorAll(".menuItem");

const products = [
  {
    id: 1,
    title: "Air Force",
    price: 119,
    colors: [
      {
        code: "black",
        img: "./images/air.png",
      },
      {
        code: "darkblue",
        img: "./images/air2.png",
      },
    ],
  },
  {
    id: 2,
    title: "Air Jordan",
    price: 149,
    colors: [
      {
        code: "lightgray",
        img: "./images/jordan.png",
      },
      {
        code: "green",
        img: "./images/jordan2.png",
      },
    ],
  },
  {
    id: 3,
    title: "Blazer",
    price: 109,
    colors: [
      {
        code: "lightgray",
        img: "./images/blazer.png",
      },
      {
        code: "green",
        img: "./images/blazer2.png",
      },
    ],
  },
  {
    id: 4,
    title: "Crater",
    price: 129,
    colors: [
      {
        code: "black",
        img: "./images/crater.png",
      },
      {
        code: "lightgray",
        img: "./images/crater2.png",
      },
    ],
  },
  {
    id: 5,
    title: "Hippie",
    price: 99,
    colors: [
      {
        code: "gray",
        img: "./images/hippie.png",
      },
      {
        code: "black",
        img: "./images/hippie2.png",
      },
    ],
  },
];

let choosenProduct = products[0];

const currentProductImg = document.querySelector(".productImg");
const currentProductTitle = document.querySelector(".productTitle");
const currentProductPrice = document.querySelector(".productPrice");
const currentProductColors = document.querySelectorAll(".color");
const currentProductSizes = document.querySelectorAll(".size");

menuItems.forEach((item, index) => {
  item.addEventListener("click", () => {
    wrapper.style.transform = `translateX(${-100 * index}vw)`;
    choosenProduct = products[index];
    currentProductTitle.textContent = choosenProduct.title;
    currentProductPrice.textContent = "$" + choosenProduct.price;
    currentProductImg.src = choosenProduct.colors[0].img;
    currentProductColors.forEach((color, index) => {
      color.style.backgroundColor = choosenProduct.colors[index].code;
    });
  });
});

currentProductColors.forEach((color, index) => {
  color.addEventListener("click", () => {
    currentProductImg.src = choosenProduct.colors[index].img;
  });
});

currentProductSizes.forEach((size, index) => {
  size.addEventListener("click", () => {
    currentProductSizes.forEach((size) => {
      size.style.backgroundColor = "white";
      size.style.color = "black";
    });
    size.style.backgroundColor = "black";
    size.style.color = "white";
  });
});

const productButton = document.querySelector(".productButton");
const payment = document.querySelector(".payment");
const close = document.querySelector(".close");

// Replace your current buy button code with this:
productButton.addEventListener("click", () => {
    if (!currentUser) {
        alert('Please login with Google first to make a purchase!');
        // Scroll to login section
        document.querySelector('.footerRight').scrollIntoView({ behavior: 'smooth' });
        return;
    }
    payment.style.display = "flex";
});

close.addEventListener("click", () => {
    payment.style.display = "none";

});

// ==================== PRODUCT SEARCH FUNCTIONALITY ====================

const searchInput = document.getElementById('searchInput');
const searchIcon = document.getElementById('searchIcon');
const searchResults = document.getElementById('searchResults');

// Only initialize search if elements exist
if (searchInput && searchIcon && searchResults) {
    
    // Search function
    function searchProducts(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        if (term.length === 0) {
            searchResults.style.display = 'none';
            return;
        }

        const filteredProducts = products.filter(product => 
            product.title.toLowerCase().includes(term) ||
            product.title.toLowerCase().replace(/\s+/g, '').includes(term.replace(/\s+/g, ''))
        );

        displaySearchResults(filteredProducts);
    }

    // Display search results
    function displaySearchResults(results) {
        searchResults.innerHTML = '';

        if (results.length === 0) {
            searchResults.innerHTML = '<div class="noResults">No products found</div>';
            searchResults.style.display = 'block';
            return;
        }

        results.forEach(product => {
            const resultItem = document.createElement('div');
            resultItem.className = 'searchResultItem';
            resultItem.innerHTML = `
                <img src="${product.colors[0].img}" alt="${product.title}" class="searchResultImage">
                <div class="searchResultInfo">
                    <div class="searchResultName">${product.title}</div>
                    <div class="searchResultPrice">$${product.price}</div>
                </div>
            `;
            
            resultItem.addEventListener('click', () => {
                selectProductFromSearch(product);
            });
            
            searchResults.appendChild(resultItem);
        });

        searchResults.style.display = 'block';
    }

    // When user selects a product from search
    function selectProductFromSearch(product) {
        const productIndex = products.findIndex(p => p.id === product.id);
        
        if (productIndex !== -1) {
            menuItems[productIndex].click();
            document.getElementById('product').scrollIntoView({ 
                behavior: 'smooth' 
            });
        }
        
        searchInput.value = '';
        searchResults.style.display = 'none';
    }

    // Event listeners for search
    searchInput.addEventListener('input', (e) => {
        searchProducts(e.target.value);
    });

    searchIcon.addEventListener('click', () => {
        searchProducts(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchProducts(searchInput.value);
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search')) {
            searchResults.style.display = 'none';
        }
    });

    // Also close results when scrolling
    window.addEventListener('scroll', () => {
        searchResults.style.display = 'none';
    });

} else {
    console.log('Search elements not found - search functionality disabled');
}
