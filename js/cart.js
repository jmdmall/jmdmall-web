// ===========================
// CART MANAGEMENT
// ===========================

const CART_KEY = 'jmdmall_cart_v1';
const WHATSAPP_NUMBER = '9779705446407';

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
});

// Load and display cart items
function loadCart() {
    const cart = getCart();
    const container = document.getElementById('cartItemsContainer');

    if (!cart || cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <p>Your cart is empty</p>
                <p style="font-size: 0.9rem; margin-top: 8px;"><a href="index.html">Continue Shopping</a></p>
            </div>
        `;
        return;
    }

    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image || 'images/placeholder.svg'}" alt="${escapeHTML(item.name)}" onerror="this.src='images/placeholder.svg'">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${escapeHTML(item.name)}</div>
                <div class="cart-item-price">
                    <span class="selling-price">₹${formatPrice(item.selling_price)}</span>
                </div>
                <div class="quantity-control">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">−</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <div style="margin-top: 8px;">
                    <span onclick="removeFromCart(${index})" class="cart-item-remove">Remove</span>
                </div>
            </div>
            <div style="text-align: right; min-width: 80px;">
                <div style="font-weight: 700; font-size: 1.1rem; color: var(--primary-color);">
                    ₹${formatPrice(item.selling_price * item.quantity)}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 4px;">
                    Qty: ${item.quantity}
                </div>
            </div>
        </div>
    `).join('');

    updateSummary();
}

// Get cart from localStorage
function getCart() {
    try {
        const cart = localStorage.getItem(CART_KEY);
        return cart ? JSON.parse(cart) : [];
    } catch (e) {
        console.error('Error reading cart:', e);
        return [];
    }
}

// Save cart to localStorage
function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error('Error saving cart:', e);
    }
}

// Add item to cart (called from product page)
function addToCart(product, quantity = 1) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            selling_price: parseFloat(product.selling_price) || 0,
            image: product.image || 'images/placeholder.svg',
            quantity: quantity
        });
    }

    saveCart(cart);
    showNotification('✅ Product added to cart!', 'success');
    
    // Optionally redirect to cart after 1 second
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 500);
}

// Update quantity
function updateQuantity(index, change) {
    const cart = getCart();
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart(cart);
        loadCart();
    }
}

// Remove item from cart
function removeFromCart(index) {
    if (confirm('Remove this item from cart?')) {
        const cart = getCart();
        cart.splice(index, 1);
        saveCart(cart);
        loadCart();
    }
}

// Update summary
function updateSummary() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    const couponCode = document.getElementById('couponInput')?.value || '';
    let discount = 0;

    // Apply simple coupon logic
    if (couponCode.toUpperCase() === 'SAVE10') {
        discount = subtotal * 0.10;
    } else if (couponCode.toUpperCase() === 'SAVE20') {
        discount = subtotal * 0.20;
    }

    const total = subtotal - discount;

    document.getElementById('subtotal').textContent = `₹${formatPrice(subtotal)}`;
    document.getElementById('total').textContent = `₹${formatPrice(total)}`;

    const discountRow = document.getElementById('discountRow');
    if (discount > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('discountAmount').textContent = `₹${formatPrice(discount)}`;
    } else {
        discountRow.style.display = 'none';
    }
}

// Apply coupon
function applyCoupon() {
    const couponCode = document.getElementById('couponInput').value.toUpperCase();
    const messageEl = document.getElementById('couponMessage');

    if (couponCode === 'SAVE10') {
        messageEl.textContent = '✅ Code applied! 10% discount';
        messageEl.style.color = '#388e3c';
    } else if (couponCode === 'SAVE20') {
        messageEl.textContent = '✅ Code applied! 20% discount';
        messageEl.style.color = '#388e3c';
    } else if (couponCode === '') {
        messageEl.textContent = 'Please enter a coupon code';
        messageEl.style.color = '#e63946';
    } else {
        messageEl.textContent = '❌ Invalid coupon code';
        messageEl.style.color = '#e63946';
    }

    updateSummary();
}

// Validate checkout form
function validateCheckout() {
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();

    if (!name) {
        showNotification('Please enter your name', 'error');
        return false;
    }
    if (!email || !email.includes('@')) {
        showNotification('Please enter a valid email', 'error');
        return false;
    }
    if (!phone || phone.length < 10) {
        showNotification('Please enter a valid phone number', 'error');
        return false;
    }
    if (!address) {
        showNotification('Please enter delivery address', 'error');
        return false;
    }

    return true;
}

// Checkout and send to WhatsApp
function checkout() {
    const cart = getCart();

    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    if (!validateCheckout()) {
        return;
    }

    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const coupon = document.getElementById('couponInput').value.toUpperCase();

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    let discount = 0;
    if (coupon === 'SAVE10') {
        discount = subtotal * 0.10;
    } else if (coupon === 'SAVE20') {
        discount = subtotal * 0.20;
    }
    const total = subtotal - discount;

    // Build order message
    let message = `
*🛒 JMD MALL - NEW ORDER* 

*CUSTOMER INFORMATION:*
📝 Name: ${name}
📧 Email: ${email}
📱 Phone: ${phone}
📍 Address: ${address}

*ORDER ITEMS:*
`;

    // Add items to message
    cart.forEach((item, index) => {
        message += `\n${index + 1}. ${item.name}
   Price: ₹${formatPrice(item.selling_price)}
   Quantity: ${item.quantity}
   Subtotal: ₹${formatPrice(item.selling_price * item.quantity)}`;
    });

    // Add totals
    message += `

*ORDER SUMMARY:*
━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${formatPrice(subtotal)}`;

    if (discount > 0) {
        message += `
Discount (${coupon}): -₹${formatPrice(discount)}`;
    }

    message += `
*Total: ₹${formatPrice(total)}*
━━━━━━━━━━━━━━━━━━━

💡 *Note:* Order will be confirmed once we review it on WhatsApp. Tracking details will be shared after confirmation.

Thank you for shopping with JMD Mall! 🎉`;

    // URL encode the message
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    // Show confirmation modal before redirecting
    showConfirmationModal(() => {
        // Clear cart after successful checkout
        saveCart([]);
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    });
}

// Show confirmation modal
function showConfirmationModal(onConfirm) {
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'flex';
    
    // Override close button
    window.closeModal = function() {
        modal.style.display = 'none';
        if (onConfirm) onConfirm();
    };
}

// Show notification
function showNotification(message, type = 'success') {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.className = `notification ${type}`;
    
    setTimeout(() => {
        notif.className = 'notification';
    }, 3000);
}

// Utility functions
function formatPrice(price) {
    return Number(price || 0).toLocaleString('en-IN');
}

function escapeHTML(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}
