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
let userData = {
    uid: null,
    name: null,
    email: null,
    photo: null,
    isLoggedIn: false,
    cart: []
};

// ==================== LOCAL STORAGE FUNCTIONS ====================
function saveCartToLocalStorage() {
    if (userData.isLoggedIn && userData.uid) {
        const key = `cart_${userData.uid}`;
        localStorage.setItem(key, JSON.stringify(userData.cart));
        console.log("💾 Cart saved to localStorage");
    }
}

function loadCartFromLocalStorage() {
    if (userData.isLoggedIn && userData.uid) {
        const key = `cart_${userData.uid}`;
        const savedCart = localStorage.getItem(key);
        if (savedCart) {
            userData.cart = JSON.parse(savedCart);
            updateCartCount();
            updateCartModal();
            console.log("📥 Cart loaded from localStorage");
        }
    }
}

function saveUserData(user) {
    userData.uid = user.uid;
    userData.name = user.displayName;
    userData.email = user.email;
    userData.photo = user.photoURL;
    userData.isLoggedIn = true;
    userData.loginTime = new Date().toISOString();
    
    // Load existing data from localStorage
    loadCartFromLocalStorage();
    updateCartCount();
    console.log("✅ User data saved");
}

function clearUserData() {
    userData = {
        uid: null,
        name: null,
        email: null,
        photo: null,
        isLoggedIn: false,
        cart: []
    };
    updateCartCount();
    console.log("🗑️ User data cleared");
}

// ==================== CART FUNCTIONALITY ====================
function addToCart(product, size, colorCode, colorImage) {
    if (!userData.isLoggedIn) {
        alert('Please login with Google first to add items to cart!');
        document.querySelector('.footerRight').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    if (!size) {
        alert('Please select a size before adding to cart!');
        return;
    }

    const existingItem = userData.cart.find(item => 
        item.productId === product.id && 
        item.size === size && 
        item.color === colorCode
    );

    if (existingItem) {
        existingItem.quantity++;
        showNotification('Item quantity updated in cart!');
    } else {
        const cartItem = {
            id: Date.now(),
            productId: product.id,
            title: product.title,
            price: product.price,
            size: size,
            color: colorCode,
            image: colorImage,
            quantity: 1,
            addedDate: new Date().toISOString()
        };
        userData.cart.push(cartItem);
        showNotification('Item added to cart!');
    }

    updateCartCount();
    updateCartModal();
    
    // Save to localStorage
    saveCartToLocalStorage();
}

function removeFromCart(itemId) {
    userData.cart = userData.cart.filter(item => item.id !== itemId);
    updateCartCount();
    updateCartModal();
    showNotification('Item removed from cart');
    
    // Save to localStorage
    saveCartToLocalStorage();
}

function updateCartQuantity(itemId, change) {
    const item = userData.cart.find(i => i.id === itemId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(itemId);
        } else {
            updateCartModal();
            updateCartCount();
            // Save to localStorage
            saveCartToLocalStorage();
        }
    }
}

function updateCartCount() {
    const cartCountEl = document.querySelector('.cartCount');
    if (cartCountEl) {
        const totalItems = userData.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.textContent = totalItems;
        cartCountEl.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

function getCartTotal() {
    return userData.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function updateCartModal() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartFooter = document.querySelector('.cartFooter');
    
    if (!cartItems) return;

    // Check if user is logged in
    if (!userData.isLoggedIn) {
        // Show login required message
        cartItems.innerHTML = `
            <div class="cartLoginMessage">
                <div class="cartLoginIcon">🛒</div>
                <h2>Login Required</h2>
                <p>Please login to view your cart items and proceed to checkout.</p>
                <button class="cartLoginBtn" onclick="redirectToLogin()">
                    Login Now
                </button>
            </div>
        `;
        // Hide checkout buttons
        if (cartFooter) cartFooter.style.display = 'none';
        return;
    }

    // User is logged in, show cart items
    if (cartFooter) cartFooter.style.display = 'block';

    if (userData.cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 20px;">Your cart is empty<br><small>Start shopping now!</small></p>';
        if (cartTotal) cartTotal.textContent = '$0';
        return;
    }

    cartItems.innerHTML = userData.cart.map(item => `
        <div class="cartItem">
            <img src="${item.image}" alt="${item.title}">
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 5px;">${item.title}</div>
                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                    Size: ${item.size} | Color: ${item.color}
                </div>
                <div style="font-weight: 600; color: #369e62;">$${item.price}</div>
            </div>
            <div class="quantityControls">
                <button class="quantityBtn" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                <span style="min-width: 20px; text-align: center;">${item.quantity}</span>
                <button class="quantityBtn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
            </div>
            <button class="removeBtn" onclick="removeFromCart(${item.id})">×</button>
        </div>
    `).join('');

    if (cartTotal) {
        cartTotal.textContent = `$${getCartTotal()}`;
    }
}

function redirectToLogin() {
    // Close cart modal
    const cartModal = document.querySelector('.cartModal');
    if (cartModal) cartModal.style.display = 'none';
    
    // Scroll to login section in footer
    document.querySelector('.footerRight').scrollIntoView({ behavior: 'smooth' });
}

function toggleCart() {
    const cartModal = document.querySelector('.cartModal');
    if (cartModal) {
        const isVisible = cartModal.style.display === 'block';
        cartModal.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            updateCartModal();
        }
    }
}

function proceedToCheckout() {
    if (userData.cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Close cart modal
    const cartModal = document.querySelector('.cartModal');
    if (cartModal) cartModal.style.display = 'none';
    
    // Scroll to product section where payment form is
    const productSection = document.querySelector('.product');
    if (productSection) {
        productSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Show payment form after scroll
    setTimeout(() => {
        const payment = document.querySelector(".payment");
        if (payment) {
            payment.style.display = "flex";
        }
    }, 500);
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #369e62;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 500;
        opacity: 1;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== SOCIAL LOGIN FUNCTIONALITY ====================
const googleBtn = document.querySelector('.googleBtn');
const facebookBtn = document.querySelector('.facebookBtn');
const githubBtn = document.querySelector('.githubBtn');
const loginStatus = document.getElementById('loginStatus');

let currentUser = null;

// Google Login
if (googleBtn) {
    googleBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        signInWithProvider(provider, 'Google');
    });
}

// Facebook Login
if (facebookBtn) {
    facebookBtn.addEventListener('click', () => {
        alert('Facebook login coming soon! Use Google for now.');
    });
}

// GitHub Login
if (githubBtn) {
    githubBtn.addEventListener('click', () => {
        alert('GitHub login coming soon! Use Google for now.');
    });
}

function signInWithProvider(provider, providerName) {
    auth.signInWithPopup(provider)
        .then((result) => {
            currentUser = result.user;
            saveUserData(currentUser);
            showLoginSuccess(`Welcome, ${currentUser.displayName}!`);
            updateUserInterface();
        })
        .catch((error) => {
            console.error('Login error:', error);
            showLoginError(`${providerName} login failed. Please try again.`);
        });
}

function showLoginSuccess(message) {
    if (loginStatus) {
        loginStatus.style.display = 'block';
        loginStatus.style.background = '#e8f5e8';
        loginStatus.style.color = '#2e7d32';
        loginStatus.innerHTML = `✅ ${message}`;
    }
}

function showLoginError(message) {
    if (loginStatus) {
        loginStatus.style.display = 'block';
        loginStatus.style.background = '#ffebee';
        loginStatus.style.color = '#c62828';
        loginStatus.innerHTML = `❌ ${message}`;
        
        setTimeout(() => {
            loginStatus.style.display = 'none';
        }, 5000);
    }
}

function updateUserInterface() {
    const socialButtons = document.querySelector('.socialLoginButtons');
    
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
    
    if (socialButtons.parentNode) {
        socialButtons.parentNode.replaceChild(userInfoDiv, socialButtons);
        
        setTimeout(() => {
            const logoutBtn = document.querySelector('.logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
            }
        }, 100);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.signOut().then(() => {
            currentUser = null;
            clearUserData();
            location.reload();
        });
    }
}

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        saveUserData(currentUser);
        updateUserInterface();
        showLoginSuccess(`Welcome back, ${currentUser.displayName}!`);
    }
});

// ==================== PRODUCT CODE ====================
const wrapper = document.querySelector(".sliderWrapper");
const menuItems = document.querySelectorAll(".menuItem");

const products = [
  {
    id: 1,
    title: "Air Force",
    price: 119,
    colors: [
      { code: "black", img: "./images/air.png" },
      { code: "darkblue", img: "./images/air2.png" }
    ]
  },
  {
    id: 2,
    title: "Air Jordan",
    price: 149,
    colors: [
      { code: "lightgray", img: "./images/jordan.png" },
      { code: "green", img: "./images/jordan2.png" }
    ]
  },
  {
    id: 3,
    title: "Blazer",
    price: 109,
    colors: [
      { code: "lightgray", img: "./images/blazer.png" },
      { code: "green", img: "./images/blazer2.png" }
    ]
  },
  {
    id: 4,
    title: "Crater",
    price: 129,
    colors: [
      { code: "black", img: "./images/crater.png" },
      { code: "lightgray", img: "./images/crater2.png" }
    ]
  },
  {
    id: 5,
    title: "Hippie",
    price: 99,
    colors: [
      { code: "gray", img: "./images/hippie.png" },
      { code: "black", img: "./images/hippie2.png" }
    ]
  }
];

let choosenProduct = products[0];
let selectedSize = null;
let selectedColor = 0; // Index of selected color
let selectedColorCode = 'black';

const currentProductImg = document.querySelector(".productImg");
const currentProductTitle = document.querySelector(".productTitle");
const currentProductPrice = document.querySelector(".productPrice");
const currentProductColors = document.querySelectorAll(".color");
const currentProductSizes = document.querySelectorAll(".size");

menuItems.forEach((item, index) => {
  item.addEventListener("click", () => {
    wrapper.style.transform = `translateX(${-100 * index}vw)`;
    choosenProduct = products[index];
    selectedSize = null; // Reset size selection
    selectedColor = 0; // Reset to first color
    selectedColorCode = choosenProduct.colors[0].code;
    
    currentProductTitle.textContent = choosenProduct.title;
    currentProductPrice.textContent = "$" + choosenProduct.price;
    currentProductImg.src = choosenProduct.colors[0].img;
    
    // Reset size selection UI
    currentProductSizes.forEach((s) => {
      s.style.backgroundColor = "white";
      s.style.color = "black";
    });
    
    // Update color options
    currentProductColors.forEach((color, idx) => {
      if (choosenProduct.colors[idx]) {
        color.style.backgroundColor = choosenProduct.colors[idx].code;
        color.style.display = "block";
      } else {
        color.style.display = "none";
      }
    });
  });
});

currentProductColors.forEach((color, index) => {
  color.addEventListener("click", () => {
    if (choosenProduct.colors[index]) {
      currentProductImg.src = choosenProduct.colors[index].img;
      selectedColor = index;
      selectedColorCode = choosenProduct.colors[index].code;
    }
  });
});

currentProductSizes.forEach((size) => {
  size.addEventListener("click", () => {
    currentProductSizes.forEach((s) => {
      s.style.backgroundColor = "white";
      s.style.color = "black";
    });
    size.style.backgroundColor = "black";
    size.style.color = "white";
    selectedSize = size.textContent;
  });
});

const productButton = document.querySelector(".productButton");
const payment = document.querySelector(".payment");
const close = document.querySelector(".close");

// Add to cart with size validation
if (productButton) {
    productButton.addEventListener("click", () => {
        if (!selectedSize) {
            alert('Please select a size before adding to cart!');
            return;
        }
        addToCart(choosenProduct, selectedSize, selectedColorCode, choosenProduct.colors[selectedColor].img);
    });
}

if (close) {
    close.addEventListener("click", () => {
        payment.style.display = "none";
    });
}

// Make functions globally available
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.proceedToCheckout = proceedToCheckout;
