// ===========================
// GLOBAL VARIABLES
// ===========================

const searchInput = document.getElementById('searchInput');
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

// Sample product database for search
const allProducts = [
    {
        name: 'Premium Wireless Headphones',
        category: 'Electronics',
        price: 2499
    },
    {
        name: 'Smart Watch Pro',
        category: 'Electronics',
        price: 5999
    },
    {
        name: 'Portable Charger 30000mAh',
        category: 'Electronics',
        price: 999
    },
    {
        name: 'Wireless Bluetooth Speaker',
        category: 'Electronics',
        price: 1499
    },
    {
        name: 'USB-C Fast Charging Cable',
        category: 'Electronics',
        price: 199
    },
    {
        name: 'Premium Screen Protector Pack',
        category: 'Electronics',
        price: 299
    },
    {
        name: 'Phone Stand Holder',
        category: 'Accessories',
        price: 149
    },
    {
        name: 'Wireless Mouse RGB',
        category: 'Electronics',
        price: 599
    }
];

// ===========================
// SEARCH FUNCTIONALITY
// ===========================

if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm.length === 0) {
            console.log('Search cleared');
            return;
        }

        // Filter products based on search term
        const results = allProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );

        if (results.length > 0) {
            console.log('Search results:', results);
            // In a real implementation, you would update the page to show filtered results
            // For now, we just log the results
        } else {
            console.log('No products found for:', searchTerm);
        }
    });

    // Handle search on Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch(this.value);
        }
    });
}

// ===========================
// SEARCH EXECUTION
// ===========================

function performSearch(searchTerm) {
    searchTerm = searchTerm.toLowerCase().trim();
    const results = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );

    if (results.length > 0) {
        console.log(`Found ${results.length} products:`, results);
        // Navigate to products or show results on the page
        // For now, just log
    } else {
        alert(`No products found matching "${searchTerm}". Try different keywords.`);
    }
}

// ===========================
// CONTACT FORM HANDLING
// ===========================

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form data
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const message = document.getElementById('message').value.trim();

        // Validate form
        if (!name || !email || !phone || !subject || !message) {
            showFormMessage('Please fill in all fields.', 'error');
            return;
        }

        // Validate email
        if (!isValidEmail(email)) {
            showFormMessage('Please enter a valid email address.', 'error');
            return;
        }

        // Validate phone
        if (!isValidPhone(phone)) {
            showFormMessage('Please enter a valid phone number.', 'error');
            return;
        }

        // In a real application, you would send this data to a server
        console.log('Form Data:', {
            name,
            email,
            phone,
            subject,
            message,
            timestamp: new Date().toISOString()
        });

        // Show success message
        showFormMessage(
            'Thank you! Your message has been received. We will get back to you soon.',
            'success'
        );

        // Reset form
        contactForm.reset();

        // Clear message after 5 seconds
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    });
}

// ===========================
// FORM HELPERS
// ===========================

function showFormMessage(message, type) {
    if (!formMessage) return;

    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';

    // Scroll to message
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// ===========================
// BUY NOW BUTTON HANDLERS
// ===========================

document.querySelectorAll('.buy-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();

        // Get product info from the card
        const card = this.closest('.deal-card');
        const productName = card.querySelector('.product-name').textContent;
        const price = card.querySelector('.price').textContent;

        // Create WhatsApp message
        const whatsappNumber = '91XXXXXXXXXX'; // Replace with actual number
        const message = encodeURIComponent(
            `Hi, I'm interested in buying: ${productName} (${price}). Please provide more details.`
        );

        // Open WhatsApp
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    });
});

// ===========================
// CATEGORY CARD HANDLERS
// ===========================

document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', function() {
        const category = this.querySelector('h3').textContent;
        console.log('Category selected:', category);

        // Show search results for category
        performSearch(category);
    });
});

// ===========================
// SMOOTH SCROLL BEHAVIOR
// ===========================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');

        // Skip if it's just "#"
        if (href === '#') return;

        e.preventDefault();

        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===========================
// MOBILE MENU (Future Enhancement)
// ===========================

// This function is prepared for future mobile menu toggle
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// ===========================
// PAGE INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    console.log('JMD Mall website loaded successfully!');

    // Set active navigation link based on current page
    updateActiveNavLink();

    // Initialize tooltips or other features if needed
    console.log('Total products available:', allProducts.length);
});

// ===========================
// UPDATE ACTIVE NAV LINK
// ===========================

function updateActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// ===========================
// SHOPPING CART (Future Enhancement)
// ===========================

// Prepared for future shopping cart functionality
const cart = {
    items: [],

    addItem: function(product) {
        const existingItem = this.items.find(item => item.name === product.name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                ...product,
                quantity: 1
            });
        }
        console.log('Cart updated:', this.items);
    },

    removeItem: function(productName) {
        this.items = this.items.filter(item => item.name !== productName);
        console.log('Cart updated:', this.items);
    },

    getTotal: function() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    clear: function() {
        this.items = [];
        console.log('Cart cleared');
    }
};

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Format price to Indian Rupees format
 */
function formatPrice(price) {
    return '₹' + price.toLocaleString('en-IN');
}

/**
 * Get current time in HH:MM:SS format
 */
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-IN');
}

/**
 * Log analytics event (prepared for future analytics integration)
 */
function logEvent(eventName, eventData) {
    console.log(`[${getCurrentTime()}] Event: ${eventName}`, eventData);
}

// ===========================
// PERFORMANCE MONITORING
// ===========================

// Log page load performance
window.addEventListener('load', function() {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log(`Page loaded in ${pageLoadTime}ms`);
});

// ===========================
// ERROR HANDLING
// ===========================

window.addEventListener('error', function(e) {
    console.error('Error occurred:', e.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});