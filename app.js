// ==================== 1. FIREBASE SETUP ====================
const firebaseConfig = {
  apiKey: "AIzaSyDNHmox9X-XQF9LE-SjQpuR_LyrU1oBTGM",
  authDomain: "twin-glocks.firebaseapp.com",
  projectId: "twin-glocks",
  storageBucket: "twin-glocks.firebasestorage.app",
  messagingSenderId: "233223778947",
  appId: "1:233223778947:web:28a193f4e1b579fb5ee1b6",
  measurementId: "G-V28WDH62T8"
};

try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully!");
} catch (error) {
    console.log('Firebase already initialized');
}

const auth = firebase.auth();

// When user logs in, just print EVERYTHING
//auth.onAuthStateChanged((user) => {
    //if (user) {
       // console.log('COMPLETE USER OBJECT:', user);
   // }
//});

// ==================== 2. USER DATA ====================
let userData = {
    uid: null,
    name: null,
    email: null,
    photo: null,
    isLoggedIn: false,
    cart: []
};

let currentUser = null;

// ==================== 3. AUTHENTICATION ====================
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        saveUserData(user);
        updateUserInterface();
    } else {
        currentUser = null;
        clearUserData();
    }
});

function saveUserData(user) {
    userData.uid = user.uid;
    userData.name = user.displayName;
    userData.email = user.email;
    userData.photo = user.photoURL;
    userData.isLoggedIn = true;
    userData.loginTime = new Date().toISOString();
    
    loadCartFromLocalStorage();
    updateCartCount();
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
}

// ==================== 4. LOGIN SYSTEM ====================
function initializeSocialLogin() {
    const googleBtn = document.querySelector('.googleBtn');
    const facebookBtn = document.querySelector('.facebookBtn');
    const githubBtn = document.querySelector('.githubBtn');

    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then((result) => {
                    const user = result.user;
                    currentUser = user;
                    saveUserData(user);
                    showLoginSuccess(`Welcome, ${user.displayName}!`);
                    updateUserInterface();
                })
                .catch((error) => {
                    console.error('Login error:', error);
                    if (error.code === 'auth/popup-closed-by-user') {
                    } else {
                        showLoginError('Login failed. Please try again.');
                    }
                });
        });
    }

    if (facebookBtn) {
        facebookBtn.addEventListener('click', () => {
            alert('Facebook login coming soon! Use Google for now.');
        });
    }

    if (githubBtn) {
        githubBtn.addEventListener('click', () => {
            alert('GitHub login coming soon! Use Google for now.');
        });
    }
}

function updateUserInterface() {
    const socialButtons = document.querySelector('.socialLoginButtons');
    
    if (!socialButtons || !currentUser) return;
    
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
        
        const logoutBtn = userInfoDiv.querySelector('.logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
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

// ==================== 5. LOCAL STORAGE ====================
function saveCartToLocalStorage() {
    if (userData.isLoggedIn && userData.uid) {
        const key = `cart_${userData.uid}`;
        localStorage.setItem(key, JSON.stringify(userData.cart));
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
        }
    }
}

// ==================== 6. CART CORE FUNCTIONS ====================
function addToCart(product, size, colorCode, colorImage) {
    if (!userData.isLoggedIn) {
        alert('Please login first to add items to cart!');
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
    saveCartToLocalStorage();
}

function removeFromCart(itemId) {
    userData.cart = userData.cart.filter(item => item.id !== itemId);
    updateCartCount();
    updateCartModal();
    showNotification('Item removed from cart');
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
            saveCartToLocalStorage();
        }
    }
}

// ==================== 7. CART DISPLAY FUNCTIONS ====================
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

    if (!userData.isLoggedIn) {
        cartItems.innerHTML = `
            <div style="text-align: center; padding: 3rem 2rem; color: #666;">
                <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;">🛒</div>
                <h2 style="margin-bottom: 1rem;">Login Required</h2>
                <p style="margin-bottom: 2rem; line-height: 1.5;">Please login to view your cart items.</p>
                <button style="background: #007cba; color: white; border: none; padding: 0.75rem 2rem; border-radius: 5px; cursor: pointer; font-size: 1rem;"
                        onclick="redirectToLogin()">
                    Login Now
                </button>
            </div>
        `;
        if (cartFooter) cartFooter.style.display = 'none';
        return;
    }

    if (cartFooter) cartFooter.style.display = 'block';

    if (userData.cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 20px;">Your cart is empty<br><small>Start shopping now!</small></p>';
        if (cartTotal) cartTotal.textContent = '₹0';
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
                <div style="font-weight: 600; color: #369e62;">₹${item.price}</div>
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
        cartTotal.textContent = `₹${getCartTotal()}`;
    }
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
    if (!userData.isLoggedIn) {
        alert('Please login first to proceed to checkout');
        redirectToLogin();
        return;
    }

    if (userData.cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const cartModal = document.querySelector('.cartModal');
    if (cartModal) cartModal.style.display = 'none';
    
    const productSection = document.querySelector('.product');
    if (productSection) {
        productSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    setTimeout(() => {
        const payment = document.querySelector(".payment");
        if (payment) {
            payment.style.display = "flex";
        }
    }, 500);
}

function redirectToLogin() {
    const cartModal = document.querySelector('.cartModal');
    if (cartModal) cartModal.style.display = 'none';
    document.querySelector('.footerRight').scrollIntoView({ behavior: 'smooth' });
}

// ==================== 8. PRODUCTS DATA ====================
const products = [
  {
    id: 1,
    title: "Air Force",
    price: 4999,
    colors: [
      { code: "black", img: "./images/air.png" },
      { code: "darkblue", img: "./images/air2.png" }
    ]
  },
  {
    id: 2,
    title: "Air Jordan",
    price: 3999,
    colors: [
      { code: "lightgray", img: "./images/jordan.png" },
      { code: "green", img: "./images/jordan2.png" }
    ]
  },
  {
    id: 3,
    title: "Blazer",
    price: 2999,
    colors: [
      { code: "lightgray", img: "./images/blazer.png" },
      { code: "green", img: "./images/blazer2.png" }
    ]
  },
  {
    id: 4,
    title: "Crater",
    price: 3500,
    colors: [
      { code: "black", img: "./images/crater.png" },
      { code: "lightgray", img: "./images/crater2.png" }
    ]
  },
  {
    id: 5,
    title: "Hippie",
    price: 1999,
    colors: [
      { code: "gray", img: "./images/hippie.png" },
      { code: "black", img: "./images/hippie2.png" }
    ]
  }
];

let choosenProduct = products[0];
let selectedSize = null;
let selectedColor = 0;
let selectedColorCode = 'black';

// ==================== 9. PRODUCT DISPLAY ====================
const wrapper = document.querySelector(".sliderWrapper");
const menuItems = document.querySelectorAll(".menuItem");
const currentProductImg = document.querySelector(".productImg");
const currentProductTitle = document.querySelector(".productTitle");
const currentProductPrice = document.querySelector(".productPrice");
const currentProductColors = document.querySelectorAll(".color");
const currentProductSizes = document.querySelectorAll(".size");

menuItems.forEach((item, index) => {
  item.addEventListener("click", () => {
    wrapper.style.transform = `translateX(${-100 * index}vw)`;
    choosenProduct = products[index];
    selectedSize = null;
    selectedColor = 0;
    selectedColorCode = choosenProduct.colors[0].code;
    
    currentProductTitle.textContent = choosenProduct.title;
    currentProductPrice.textContent = "₹" + choosenProduct.price;
    currentProductImg.src = choosenProduct.colors[0].img;
    
    currentProductSizes.forEach((s) => {
      s.style.backgroundColor = "white";
      s.style.color = "black";
    });
    
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

// ==================== 10. ADD TO CART BUTTON ====================
const productButton = document.querySelector(".productButton");
const payment = document.querySelector(".payment");
const close = document.querySelector(".close");

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

// ==================== 11. NOTIFICATIONS ====================
function showNotification(message) {
    const notification = document.createElement('div');
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

function showLoginSuccess(message) {
    const loginStatus = document.getElementById('loginStatus');
    if (loginStatus) {
        loginStatus.style.display = 'block';
        loginStatus.style.background = '#e8f5e8';
        loginStatus.style.color = '#2e7d32';
        loginStatus.innerHTML = `✅ ${message}`;
        setTimeout(() => {
            loginStatus.style.display = 'none';
        }, 3000);
    }
}

function showLoginError(message) {
    const loginStatus = document.getElementById('loginStatus');
    if (loginStatus) {
        loginStatus.style.display = 'block';
        loginStatus.style.background = '#ffebee';
        loginStatus.style.color = '#c62828';
        loginStatus.innerHTML = `❌ ${message}`;
        setTimeout(() => {
            loginStatus.style.display = 'none';
        }, 3000);
    }
}

// ==================== 12. GLOBAL FUNCTIONS & INIT ====================
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.proceedToCheckout = proceedToCheckout;
window.redirectToLogin = redirectToLogin;

document.addEventListener('DOMContentLoaded', function() {
    initializeSocialLogin();
    updateCartCount();
});
