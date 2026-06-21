// ==========================================================================
// CONFIGURATION
// ==========================================================================

const CONFIG = {
    CSV_URL: 'products.csv',
    WHATSAPP_NUMBER: '9779705446407',
    WHATSAPP_API_URL: 'https://wa.me/'
};

// ==========================================================================
// GLOBAL VARIABLES
// ==========================================================================

let allProducts = [];
let filteredProducts = [];
let activeFilter = 'all'; 

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const productsGrid = document.getElementById('productsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', async function () {
    initLocationEngine();
    initPromoBannerEngine();
    initTravelServicesEngine(); // <-- ADD THIS CORE METHOD HERE
    initGA4FromMeta();
    await loadProducts();
    setupEventListeners();
    updateActiveNavLink();
    initSlideshow();
});

// ==========================================================================
// LOCATION MANAGEMENT ENGINE (Autocompleting, Restricting to Nepal)
// ==========================================================================

function initLocationEngine() {
    const locationDisplay = document.getElementById('locationDisplay');
    const editLocationBtn = document.getElementById('editLocationBtn');
    const locationModal = document.getElementById('locationModal');
    const closeLocationModal = document.getElementById('closeLocationModal');
    const saveLocationBtn = document.getElementById('saveLocationBtn');
    const manualLocationInput = document.getElementById('manualLocationInput');
    const modalDetectBtn = document.getElementById('modalDetectBtn');
    const autocompleteResults = document.getElementById('autocompleteResults');
    const locationErrorMsg = document.getElementById('locationErrorMsg');

    const LOCAL_STORAGE_KEY = 'jmdmall_user_location';
    let selectedLocationName = ""; 
    let debounceTimer;

    // Load saved data on launch if present
    let savedLocation = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedLocation) {
        if (locationDisplay) locationDisplay.textContent = `DELIVERING AT: ${savedLocation}`;
    } else {
        fallbackLocation();
    }

    function fallbackLocation() {
        if (locationDisplay) locationDisplay.textContent = `DELIVERING AT: Nepal`;
    }

    // NATIVE GPS RUNTIME LOOKUP FUNCTION
    async function performGPSDetection() {
        if (locationErrorMsg) locationErrorMsg.style.display = 'none';
        if (locationDisplay) locationDisplay.textContent = "📍 Detecting coordinates...";
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                        const data = await response.json();
                        
                        const country = data.address.country || "";
                        const detectedCity = data.address.city || data.address.town || data.address.village || data.address.state || "Nepal";

                        // Verify Country Bounds
                        if (country.toLowerCase() === "nepal") {
                            localStorage.setItem(LOCAL_STORAGE_KEY, detectedCity);
                            if (locationDisplay) locationDisplay.textContent = `DELIVERING AT: ${detectedCity}`;
                            if (locationModal) locationModal.style.display = 'none';
                        } else {
                            handleOutsideNepalError();
                        }
                    } catch (err) {
                        fallbackLocation();
                    }
                },
                () => { fallbackLocation(); }
            );
        } else {
            fallbackLocation();
        }
    }

    function handleOutsideNepalError() {
        fallbackLocation();
        if (locationErrorMsg) {
            locationErrorMsg.textContent = "❌ We don't deliver to your location. We are serving only Nepal.";
            locationErrorMsg.style.display = 'block';
        }
    }

    // AUTOCOMPLETE LOOKUP TRIGGER
    if (manualLocationInput) {
        manualLocationInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            const query = manualLocationInput.value.trim();
            
            // Lock save button since they modified the text line manually
            if (saveLocationBtn) {
                saveLocationBtn.disabled = true;
                saveLocationBtn.style.opacity = "0.5";
                saveLocationBtn.style.cursor = "not-allowed";
            }
            if (locationErrorMsg) locationErrorMsg.style.display = 'none';

            if (query.length < 3) {
                if (autocompleteResults) autocompleteResults.style.display = 'none';
                return;
            }

            // Debounce API calls to prevent flooding the server
            debounceTimer = setTimeout(async () => {
                try {
                    // Query Limited to Nepal bounds using viewbox parameters via Nominatim
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=np&addressdetails=1&limit=5`);
                    const results = await res.json();

                    if (results && results.length > 0) {
                        if (autocompleteResults) {
                            autocompleteResults.innerHTML = results.map(item => {
                                const cleanName = item.display_name.split(',').slice(0, 3).join(',');
                                return `<div class="autocomplete-item" data-full-name="${escapeHTML(cleanName)}" data-country="${escapeHTML(item.address.country)}">${escapeHTML(cleanName)}</div>`;
                            }).join('');
                            autocompleteResults.style.display = 'block';
                        }
                    } else {
                        if (autocompleteResults) autocompleteResults.style.display = 'none';
                    }
                } catch (e) {
                    console.error("Autocomplete fetch drop:", e);
                }
            }, 350);
        });
    }

    // SELECTION HOOK (Forces user to choose from list only)
    if (autocompleteResults) {
        autocompleteResults.addEventListener('click', function(e) {
            const clickedItem = e.target.closest('.autocomplete-item');
            if (!clickedItem) return;

            const country = clickedItem.dataset.country || "";
            selectedLocationName = clickedItem.dataset.fullName;

            if (manualLocationInput) manualLocationInput.value = selectedLocationName;
            autocompleteResults.style.display = 'none';

            // Validate that country is Nepal
            if (country.toLowerCase() === "nepal") {
                if (saveLocationBtn) {
                    saveLocationBtn.disabled = false;
                    saveLocationBtn.style.opacity = "1";
                    saveLocationBtn.style.cursor = "pointer";
                }
                if (locationErrorMsg) locationErrorMsg.style.display = 'none';
            } else {
                handleOutsideNepalError();
            }
        });
    }

    // MODAL BUTTON TRIGGERS
    if (editLocationBtn && locationModal) {
        editLocationBtn.addEventListener('click', () => {
            if (manualLocationInput) manualLocationInput.value = '';
            if (autocompleteResults) autocompleteResults.style.display = 'none';
            if (locationErrorMsg) locationErrorMsg.style.display = 'none';
            if (saveLocationBtn) {
                saveLocationBtn.disabled = true;
                saveLocationBtn.style.opacity = "0.5";
                saveLocationBtn.style.cursor = "not-allowed";
            }
            locationModal.style.display = 'flex';
        });
    }

    if (modalDetectBtn) modalDetectBtn.addEventListener('click', performGPSDetection);
    if (closeLocationModal && locationModal) {
        closeLocationModal.addEventListener('click', () => { locationModal.style.display = 'none'; });
    }

    if (saveLocationBtn && locationModal) {
        saveLocationBtn.addEventListener('click', () => {
            if (selectedLocationName) {
                localStorage.setItem(LOCAL_STORAGE_KEY, selectedLocationName);
                if (locationDisplay) locationDisplay.textContent = `DELIVERING AT: ${selectedLocationName}`;
                locationModal.style.display = 'none';
            }
        });
    }

    // Close autocomplete lists if clicking outside modal elements
    document.addEventListener('click', (e) => {
        if (autocompleteResults && e.target !== manualLocationInput) {
            autocompleteResults.style.display = 'none';
        }
        if (e.target === locationModal) {
            locationModal.style.display = 'none';
        }
    });
}

// ==========================================================================
// CACHING & ANALYTICS HELPERS
// ==========================================================================

async function getProductsCached(){
    try {
        const key = 'jmdmall_products_v1';
        const cached = sessionStorage.getItem(key);
        if (cached) {
            try { return JSON.parse(cached); } catch(e) { sessionStorage.removeItem(key); }
        }

        const res = await fetch(CONFIG.CSV_URL);
        if (!res.ok) throw new Error('CSV file not found');
        const text = await res.text();
        const parsed = parseCSV(text);
        try { sessionStorage.setItem(key, JSON.stringify(parsed)); } catch(e) { }
        return parsed;
    } catch(e) {
        console.error('getProductsCached error:', e);
        throw e;
    }
}

function initGA4FromMeta(){
    try {
        const meta = document.querySelector('meta[name="ga-id"]');
        const id = (meta && meta.content) || window.GA_MEASUREMENT_ID;
        if (!id) return;
        if (!window.gtag) {
            const s1 = document.createElement('script');
            s1.async = true;
            s1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
            document.head.appendChild(s1);
            window.dataLayer = window.dataLayer || [];
            window.gtag = function(){ window.dataLayer.push(arguments); };
            window.gtag('js', new Date());
            window.gtag('config', id, { 'send_page_view': false });
        }
    } catch(e) { console.warn('initGA4 error:', e); }
}

function trackEvent(name, data = {}){
    const payload = { event: name, ...data };
    try { if (window.dataLayer) window.dataLayer.push(payload); } catch(e){}
    try {
        if (window.gtag) {
            const gaName = String(name).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
            window.gtag('event', gaName, data);
        }
    } catch(e) { }
}

// ==========================================================================
// LOAD PRODUCTS
// ==========================================================================

async function loadProducts() {
    if (!productsGrid) return;

    try {
        allProducts = await getProductsCached();
        filteredProducts = [...allProducts];

        if (document.getElementById('categoriesGrid')) {
            renderCategories(allProducts);
            const featured = filteredProducts.slice(0, 12);
            renderProducts(featured);
            const viewAllWrapper = document.getElementById('viewAllWrapper');
            if (viewAllWrapper) {
                viewAllWrapper.style.display = 'block';
                const viewAllLink = document.getElementById('viewAllLink');
                if (viewAllLink) viewAllLink.href = 'all-products.html'; 
            }
            trackEvent('page_load', { page: 'index', initialProducts: featured.length });
        } else {
            renderProducts(filteredProducts);
            trackEvent('page_load', { page: 'products_full', totalProducts: filteredProducts.length });
        }
    } catch (error) {
        console.error(error);
        productsGrid.innerHTML = '<div class="loading">Unable to load products grid.</div>';
    }
}

// ==========================================================================
// CSV PARSER
// ==========================================================================

function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];

    const headers = parseCSVLine(lines[0]);
    const productsList = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = parseCSVLine(lines[i]);
        const product = {};

        headers.forEach((header, index) => {
            product[header] = values[index] ? values[index].trim() : '';
        });

        const images = [];
        if (product.main_image) images.push(product.main_image);
        ['img2','img3','img4','img5','img6'].forEach(k => {
            if (product[k] && product[k].trim()) images.push(product[k].trim());
        });

        if (product.image && !images.length) images.push(product.image);

        product.images = images;
        product.image = images[0] || product.image || 'images/placeholder.svg';

        productsList.push(product);
    }

    return productsList;
}

function parseCSVLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (ch === '"') {
            if (inQuotes && line[i+1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (ch === ',' && !inQuotes) {
            result.push(cur);
            cur = '';
            continue;
        }

        cur += ch;
    }

    result.push(cur);
    return result;
}

// ==========================================================================
// PRICE HELPERS
// ==========================================================================

function getDiscountPercent(mrp, sellingPrice) {
    mrp = Number(mrp || 0);
    sellingPrice = Number(sellingPrice || 0);
    if (!mrp) return 0;
    return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

// ==========================================================================
// CATEGORIES RENDERING (Restored Links & Images)
// ==========================================================================

function getUniqueCategoriesWithCount(productsArray){
    const map = {};
    productsArray.forEach(p => {
        const c = (p.category || 'Uncategorized').trim();
        if (!c) return;
        if (!map[c]) map[c] = { name: c, sampleImage: p.image || 'images/placeholder.svg', count: 0 };
        map[c].count++;
    });
    return Object.values(map);
}

// ==========================================================================
// CATEGORIES RENDERING ENGINE (Restored Links & Full Edge-to-Edge Images)
// ==========================================================================

function renderCategories(productsArray){
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    const cats = getUniqueCategoriesWithCount(productsArray);
    
    // Renders structural HTML markup cleanly to allow CSS to manage widths and padding
    container.innerHTML = cats.map(cat => `
        <div class="category-tile" data-category="${escapeHTML(cat.name)}">
            <a href="category.html?cat=${encodeURIComponent(cat.name)}" style="text-decoration:none; color:inherit; width:100%; display:block;">
                <div class="category-image">
                    <img src="${cat.sampleImage}" loading="lazy" alt="${escapeHTML(cat.name)}" onerror="this.src='images/placeholder.svg'">
                </div>
                <div class="category-name">${escapeHTML(cat.name)} (${cat.count})</div>
            </a>
        </div>
    `).join('');
}

// ==========================================================================
// HOMEPAGE CARD RENDERING (Restored Product Details Link Redirection)
// ==========================================================================

function renderProducts(productsArray) {
    if (!productsGrid) return;

    if (!productsArray.length) {
        productsGrid.innerHTML = '<div class="loading">No products found matching the selection.</div>';
        return;
    }

    productsGrid.innerHTML = productsArray.map(createProductCard).join('');
    requestAnimationFrame(() => { window.observeLazyImages && window.observeLazyImages(); });
}

function createProductCard(product) {
    const discountPercent = getDiscountPercent(product.mrp, product.selling_price);
    const flatDiscountAmount = Math.round(Number(product.mrp || 0) - Number(product.selling_price || 0));
    const shortDesc = product.short_description || (product.description || '').split('\n')[0] || '';

    const flatDiscountBadge = flatDiscountAmount > 0
        ? `<div class="flat-image-badge">Rs. ${flatDiscountAmount.toLocaleString('en-IN')} OFF</div>`
        : '';

    const mockRating = product.rating || (4.0 + (Number(product.id || 0) % 10) * 0.1).toFixed(1);
    const mockReviewsCount = product.reviews || (45 + (Number(product.id || 0) * 12));
    const imageRatingBadge = `<div class="image-rating-badge">⭐ ${mockRating} <span class="rating-count">(${formatCount(mockReviewsCount)})</span></div>`;
    const imgSrc = product.image || 'images/placeholder.svg';

    // Cards point natively back to product.html layout redirection without direct WhatsApp buttons
    return `
    <div class="product-card" data-product-id="${escapeHTML(product.id)}" data-product-name="${escapeHTML(product.name)}">
        <a href="product.html?id=${product.id}" style="text-decoration:none; color:inherit; display:flex; flex-direction:column; height:100%;">
            <div class="product-image-wrapper">
                <img class="product-image" src="${imgSrc}" alt="${escapeHTML(product.name)}" loading="lazy" onerror="this.src='images/placeholder.svg'">
                ${flatDiscountBadge}
                ${imageRatingBadge}
            </div>

            <div class="product-info compact">
                <span class="product-brand" style="font-size: 0.75rem; text-transform: uppercase; color: #888; font-weight: 700; margin-bottom: 2px;">${escapeHTML(product.brand || 'JMD')}</span>
                <h4 class="grid-product-name">${escapeHTML(product.name)}</h4>
                <p class="grid-product-desc">${escapeHTML(shortDesc)}</p>

                <div class="price-row-grid" style="margin-top:auto;">
                    <span class="selling-price">Rs. ${formatPrice(product.selling_price)}</span>
                    <span class="mrp-price">Rs. ${formatPrice(product.mrp)}</span>
                    ${discountPercent > 0 ? `<span class="discount-percent">${discountPercent}% OFF</span>` : ''}
                </div>
            </div>
        </a>
    </div>
    `;
}

// ==========================================================================
// SEARCH & NAVIGATION BAR TAB FILTERS
// ==========================================================================

function handleSearch() {
    const searchTerm = (searchInput && searchInput.value || '').toLowerCase().trim();

    if (!searchTerm) {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product =>
            (product.name || '').toLowerCase().includes(searchTerm) ||
            (product.category || '').toLowerCase().includes(searchTerm) ||
            (product.brand || '').toLowerCase().includes(searchTerm)
        );
    }
    
    activeFilter = 'all';
    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all');
    });

    renderProducts(filteredProducts);
}

function handleFilter(event) {
    const category = event.target.dataset.filter;

    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    activeFilter = category;

    if (category === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => product.category === category);
    }

    if (searchInput) searchInput.value = '';
    renderProducts(filteredProducts);
}

function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
    }
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    filterButtons.forEach(button => button.addEventListener('click', handleFilter));

    try {
        if (productsGrid) {
            productsGrid.addEventListener('click', function(e){
                const card = e.target.closest('.product-card');
                if (!card) return;
                const pid = card.dataset.productId;
                const pname = card.dataset.productName;
                trackEvent('product_click', { product_id: pid || '', product_name: pname || '' });
            });
        }
    } catch(e) { }
}

// ==========================================================================
// UTILITIES & DECORATORS HELPERS
// ==========================================================================

function formatPrice(price) { return Number(price || 0).toLocaleString('en-IN'); }
function escapeHTML(text) { if (!text) return ''; const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}; return String(text).replace(/[&<>\"']/g,m=>map[m]); }

function formatCount(value){
    const n = Number(String(value).replace(/[^0-9.-]+/g,'')) || 0;
    if (n >= 1000000) return (Math.round(n/100000)/10).toFixed(1).replace(/\.0$/,'') + 'M';
    if (n >= 1000) return (Math.round(n/100)/10).toFixed(1).replace(/\.0$/,'') + 'K';
    return String(n);
}

function updateActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) link.classList.add('active');
    });
}

// ==========================================================================
// AUTO SLIDESHOW ENGINE
// ==========================================================================

function initSlideshow() {
    const wrapper = document.getElementById('slidesWrapper');
    if (!wrapper) return;

    const slides = wrapper.querySelectorAll('.slide');
    const dotsContainer = document.getElementById('slideDots');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');

    let current = 0;
    dotsContainer.innerHTML = '';

    slides.forEach((slide, index) => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.dot');

    function goToSlide(index) {
        current = index;
        wrapper.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach(dot => dot.classList.remove('active'));
        dots[current].classList.add('active');
    }

    function nextSlide() { current = (current + 1) % slides.length; goToSlide(current); }
    function prevSlide() { current = (current - 1 + slides.length) % slides.length; goToSlide(current); }

    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    setInterval(nextSlide, 4000);
}

// ==========================================================================
// SESSION-BASED PROMOTIONAL ADVERTISEMENT NOTICE CONTROLLER
// ==========================================================================
function initPromoBannerEngine() {
    const noticeModal = document.getElementById('noticeModal');
    const closeNoticeBtn = document.getElementById('closeNoticeBtn');
    const SESSION_BANNER_KEY = 'jmdmall_promo_seen';

    if (!noticeModal || !closeNoticeBtn) return;

    const alertSeen = sessionStorage.getItem(SESSION_BANNER_KEY);

    if (!alertSeen) {
        setTimeout(() => {
            noticeModal.style.display = 'flex';
        }, 800);
    }

    closeNoticeBtn.addEventListener('click', dismissBanner);

    noticeModal.addEventListener('click', (e) => {
        if (e.target === noticeModal) {
            dismissBanner();
        }
    });

    function dismissBanner() {
        noticeModal.style.display = 'none';
        sessionStorage.setItem(SESSION_BANNER_KEY, 'true');
    }
}

// ==========================================================================
// TRAVEL & SERVICES BOOKING ENGINE CONTROLLER (AUTOCAMPLETE & WHATSAPP)
// ==========================================================================
function initTravelServicesEngine() {
    const tabsGrid = document.getElementById('servicesTabsGrid');
    const fieldsContainer = document.getElementById('dynamicFieldsContainer');
    const panelTitle = document.getElementById('bookingPanelTitle');
    
    if (!tabsGrid || !fieldsContainer) return;

    let currentActiveService = 'flight';

    // Field configuration templates map metrics cleanly matching premium apps UI UX
    const layouts = {
        flight: {
            title: "✈️ Book Domestic & International Flights",
            html: `
                <div class="input-field-block">
                    <label>From (Origin)</label>
                    <input type="text" id="srvFrom" placeholder="Type city or airport..." autocomplete="off" required>
                    <div id="srvFromList" class="autocomplete-results"></div>
                </div>
                <div class="input-field-block">
                    <label>To (Destination)</label>
                    <input type="text" id="srvTo" placeholder="Type destination city..." autocomplete="off" required>
                    <div id="srvToList" class="autocomplete-results"></div>
                </div>
                <div class="input-field-block">
                    <label>Departure Date</label>
                    <input type="date" id="srvDate" required>
                </div>
                <div class="input-field-block">
                    <label>Class & Passengers</label>
                    <select id="srvDetails">
                        <option>1 Adult, Economy</option>
                        <option>2 Adults, Economy</option>
                        <option>Family (2+2), Economy</option>
                        <option>1 Adult, Business Class</option>
                    </select>
                </div>
                <div class="input-field-block" style="grid-column: 1 / -1; margin-top: 1rem;">
                    <button type="submit" class="book-submit-btn" id="srvSubmitBtn">Proceed to Book via WhatsApp 🚀</button>
                </div>
            `
        },
        railway: {
            title: "🚂 Book IRCTC & Nepal Railway Train Tickets",
            html: `
                <div class="input-field-block">
                    <label>From Station</label>
                    <input type="text" id="srvFrom" placeholder="Type boarding station..." autocomplete="off" required>
                    <div id="srvFromList" class="autocomplete-results"></div>
                </div>
                <div class="input-field-block">
                    <label>To Station</label>
                    <input type="text" id="srvTo" placeholder="Type arrival station..." autocomplete="off" required>
                    <div id="srvToList" class="autocomplete-results"></div>
                </div>
                <div class="input-field-block">
                    <label>Journey Date</label>
                    <input type="date" id="srvDate" required>
                </div>
                <div class="input-field-block">
                    <label>Quota Class</label>
                    <select id="srvDetails">
                        <option>Sleeper Class (SL)</option>
                        <option>AC 3 Tier (3A)</option>
                        <option>AC 2 Tier (2A)</option>
                        <option>General / Second Sitting</option>
                    </select>
                </div>
                <div class="input-field-block" style="grid-column: 1 / -1; margin-top: 1rem;">
                    <button type="submit" class="book-submit-btn" id="srvSubmitBtn">Proceed to Book via WhatsApp 🚀</button>
                </div>
            `
        },
        hotel: {
            title: "🏨 Premium Hotel & Resort Booking Rooms",
            html: `
                <div class="input-field-block" style="grid-column: span 2;">
                    <label>Where / Destination City</label>
                    <input type="text" id="srvTo" placeholder="Type city, locality or hotel name..." autocomplete="off" required>
                    <div id="srvToList" class="autocomplete-results"></div>
                </div>
                <div class="input-field-block">
                    <label>Check-In Date</label>
                    <input type="date" id="srvDate" required>
                </div>
                <div class="input-field-block">
                    <label>Guests & Rooms</label>
                    <select id="srvDetails">
                        <option>1 Room, 1 Adult</option>
                        <option>1 Room, 2 Adults</option>
                        <option>2 Rooms, 4 Adults</option>
                    </select>
                </div>
                <div class="input-field-block" style="grid-column: 1 / -1; margin-top: 1rem;">
                    <button type="submit" class="book-submit-btn" id="srvSubmitBtn">Book Hotel via WhatsApp 🚀</button>
                </div>
            `
        },
        car: {
            title: "🚗 Outstation Cab & Local Car Rental Booking",
            html: `
                <div class="input-field-block">
                    <label>Pick-Up Location</label>
                    <input type="text" id="srvFrom" placeholder="Type pick-up address..." autocomplete="off" required>
                    <div id="srvFromList" class="autocomplete-results"></div>
                </div>
                <div class="input-field-block">
                    <label>Drop Destination</label>
                    <input type="text" id="srvTo" placeholder="Type drop-off address..." autocomplete="off" required>
                    <div id="srvToList" class="autocomplete-results"></div>
                </div>
                <div class="input-field-block">
                    <label>Travel Date</label>
                    <input type="date" id="srvDate" required>
                </div>
                <div class="input-field-block">
                    <label>Vehicle Choice</label>
                    <select id="srvDetails">
                        <option>Compact Hatchback (Swift/i20)</option>
                        <option>Premium Sedan (Dzire/Etios)</option>
                        <option>Suv / Scorpio / Ertiga</option>
                    </select>
                </div>
                <div class="input-field-block" style="grid-column: 1 / -1; margin-top: 1rem;">
                    <button type="submit" class="book-submit-btn" id="srvSubmitBtn">Hire Car via WhatsApp 🚀</button>
                </div>
            `
        }
    };

    function renderActiveForm(srvKey) {
        currentActiveService = srvKey;
        panelTitle.innerHTML = layouts[srvKey].title;
        fieldsContainer.innerHTML = layouts[srvKey].html;

        // Automatically configure date limits to prevent past choices
        const dateInput = document.getElementById('srvDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            dateInput.value = today;
        }

        // Attach strict type-and-select autocomplete controllers
        bindAutocompleteToField('srvFrom', 'srvFromList');
        bindAutocompleteToField('srvTo', 'srvToList');
    }

    // Toggle click listeners across dashboard buttons grid
    tabsGrid.addEventListener('click', (e) => {
        const targetTab = e.target.closest('.service-tab-card');
        if (!targetTab) return;

        tabsGrid.querySelectorAll('.service-tab-card').forEach(c => c.classList.remove('active-tab'));
        targetTab.classList.add('active-tab');
        
        renderActiveForm(targetTab.dataset.service);
    });

    // Handle form submissions: Packages parameters cleanly to WhatsApp API redirect parameters
    document.getElementById('travelBookingForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const fromVal = document.getElementById('srvFrom') ? document.getElementById('srvFrom').value.trim() : "N/A";
        const toVal = document.getElementById('srvTo') ? document.getElementById('srvTo').value.trim() : "N/A";
        const dateVal = document.getElementById('srvDate') ? document.getElementById('srvDate').value : "N/A";
        const detailsVal = document.getElementById('srvDetails') ? document.getElementById('srvDetails').value : "N/A";

        let message = `*JMD MALL - NEW SERVICE BOOKING REQUEST*%0A`;
        message += `==============================%0A`;
        message += `📁 *Service Type:* ${currentActiveService.toUpperCase()}%0A`;
        if (fromVal !== "N/A") message += `📍 *From:* ${fromVal}%0A`;
        message += `🎯 *To / Place:* ${toVal}%0A`;
        message += `📅 *Date:* ${dateVal}%0A`;
        message += `👥 *Configuration:* ${detailsVal}%0A`;
        message += `==============================%0A`;
        message += `Please confirm availability and share final quotes.`;

        const waUrl = `https://wa.me/9779705446407?text=${message}`;
        window.open(waUrl, '_blank');
    });

    // STRIC AUTOCOMPLETE TYPE-AND-SELECT BINDING LOGIC ENGINE
    function bindAutocompleteToField(fieldId, listId) {
        const input = document.getElementById(fieldId);
        const listContainer = document.getElementById(listId);
        if (!input || !listContainer) return;

        let debounceTimer;

        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const query = input.value.trim();

            if (query.length < 3) {
                listContainer.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    // Query localized context via Nominatim API bounded to Nepal & India map coordinates
                    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=np,in&limit=4`;
                    const res = await fetch(url);
                    const results = await res.json();

                    if (results && results.length > 0) {
                        listContainer.innerHTML = results.map(item => {
                            const cleanPlace = item.display_name.split(',').slice(0, 3).join(',');
                            return `<div class="autocomplete-item" data-value="${escapeHTML(cleanPlace)}">${escapeHTML(cleanPlace)}</div>`;
                        }).join('');
                        listContainer.style.display = 'block';
                    } else {
                        listContainer.style.display = 'none';
                    }
                } catch(err) {
                    console.error("Dashboard geocode drop:", err);
                }
            }, 300);
        });

        // Click execution logic forces element string selection securely
        listContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.autocomplete-item');
            if (!item) return;

            input.value = item.dataset.value;
            listContainer.style.display = 'none';
        });

        // Hide search options dropdown list upon clicking off container focus
        document.addEventListener('click', (e) => {
            if (e.target !== input) listContainer.style.display = 'none';
        });
    }

    // Default Initialization Render call
    renderActiveForm('flight');
}

// ==========================================================================
// MOBILE NATIVE SMART DEEP-LINK OPENER FOR FACEBOOK APP
// ==========================================================================
function openFacebookApp() {
    // Replace this string with your exact Facebook Page numeric ID numerical asset indicator 
    // If you don't know your ID, you can grab it instantly from findmyfbid.in
    const FACEBOOK_PAGE_ID = "655146487898613"; 
    const FALLBACK_WEB_URL = "https://www.facebook.com/jmdmall";

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    let appUrl = `fb://page/${FACEBOOK_PAGE_ID}`;

    if (isIOS) {
        // iOS alternative application routing protocol wrapper profile scheme
        appUrl = `fb://profile/${FACEBOOK_PAGE_ID}`;
    }

    if (isIOS || isAndroid) {
        // Try opening the native app protocol link route line
        window.location.href = appUrl;
        
        // If the app doesn't open within 1.2 seconds, redirect to the browser fallback link safely
        setTimeout(() => {
            window.open(FALLBACK_WEB_URL, '_blank');
        }, 1200);
    } else {
        // If they are on a standard desktop computer, open the web browser link directly
        window.open(FALLBACK_WEB_URL, '_blank');
    }
}

// ==========================================================================
// MOBILE NATIVE SMART DEEP-LINK OPENER FOR TWITTER (X) APP
// ==========================================================================
function openTwitterApp() {
    const TWITTER_USERNAME = "jmdmall"; // Your exact profile identifier handle
    const FALLBACK_WEB_URL = `https://x.com/${TWITTER_USERNAME}`;

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    // Deep link protocol string
    const appUrl = `twitter://user?screen_name=${TWITTER_USERNAME}`;

    if (isIOS || isAndroid) {
        window.location.href = appUrl;
        
        // Failover window handler loop
        setTimeout(() => {
            window.open(FALLBACK_WEB_URL, '_blank');
        }, 1200);
    } else {
        // Desktop device redirect fallthrough
        window.open(FALLBACK_WEB_URL, '_blank');
    }
}

// ==========================================================================
// ELITE NAV HUB INTERACTIVE DRAWER CONTROLLER SCRIPT LOCK
// ==========================================================================
document.addEventListener("DOMContentLoaded", function() {
    const menuToggleBtn = document.getElementById("menuToggleBtn");
    const drawerCloseBtn = document.getElementById("drawerCloseBtn");
    const mobileDrawer   = document.getElementById("mobileDrawer");

    if (menuToggleBtn && mobileDrawer) {
        // Toggle slide-out modal state open
        menuToggleBtn.addEventListener("click", function() {
            mobileDrawer.classList.add("active");
            document.body.style.overflow = "hidden"; // Prevents background body scrolling
        });
    }

    if (drawerCloseBtn && mobileDrawer) {
        // Dismiss slide drawer closed
        drawerCloseBtn.addEventListener("click", function() {
            mobileDrawer.classList.remove("active");
            document.body.style.overflow = ""; // Restores page scrolling smoothly
        });

        // Close drawer if clicking outside the side panel container bounds
        mobileDrawer.addEventListener("click", function(event) {
            if (event.target === mobileDrawer) {
                mobileDrawer.classList.remove("active");
                document.body.style.overflow = "";
            }
        });
    }
});