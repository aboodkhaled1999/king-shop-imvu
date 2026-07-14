const config = window.KING_CONFIG;
const $ = (selector) => document.querySelector(selector);

const setExternalLinks = () => {
  ['profile-link', 'profile-nav', 'hero-link'].forEach((id) => { 
    const el = $(`#${id}`);
    if (el) el.href = config.urls.profile; 
  });
  ['products-link', 'all-products-link'].forEach((id) => { 
    const el = $(`#${id}`);
    if (el) el.href = config.urls.products; 
  });
};

function productCard(product, index) {
  return `<article class="product-card" tabindex="0" style="--card:${index}">
    <div class="product-image"><span>${String(index + 1).padStart(2, '0')}</span><div class="product-orb"></div><div class="product-silhouette"></div></div>
    <div class="card-info"><div><p>${product.category}</p><h3>${product.name}</h3></div><a href="${config.urls.products}" target="_blank" rel="noreferrer" aria-label="View ${product.name} on IMVU">Shop Now</a></div></div>
  </article>`;
}

async function loadProducts() {
  try {
    // Try to load from products.json
    const response = await fetch('products.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Failed to load products:', error);
  }
  return [];
}

async function start() {
  setExternalLinks();
  $('#year').textContent = new Date().getFullYear();
  
  const products = await loadProducts();
  const carousel = $('#carousel');
  
  const render = (items) => {
    carousel.innerHTML = items.length 
      ? items.map(productCard).join('') 
      : '<p class="empty">The collection is being prepared. Visit the IMVU shop to explore it.</p>';
  };
  
  render(products);
  
  // Search functionality
  $('#search').addEventListener('input', (event) => {
    const term = event.target.value.trim().toLowerCase();
    render(products.filter((product) => 
      `${product.name} ${product.category}`.toLowerCase().includes(term)
    ));
  });
  
  // Mouse wheel scroll
  carousel.addEventListener('wheel', (event) => { 
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) { 
      carousel.scrollLeft += event.deltaY; 
      event.preventDefault(); 
    } 
  }, { passive: false });
  
  // Touch drag functionality
  let down = false, startX = 0, scrollStart = 0;
  carousel.addEventListener('pointerdown', (event) => { 
    down = true; 
    startX = event.clientX; 
    scrollStart = carousel.scrollLeft; 
    carousel.setPointerCapture(event.pointerId); 
    carousel.classList.add('dragging');
  });
  
  carousel.addEventListener('pointermove', (event) => { 
    if (down) carousel.scrollLeft = scrollStart - (event.clientX - startX); 
  });
  
  ['pointerup', 'pointercancel'].forEach((name) => 
    carousel.addEventListener(name, () => { 
      down = false; 
      carousel.classList.remove('dragging'); 
    })
  );
  
  // Auto-scroll with pause on interaction
  let paused = false;
  ['mouseenter', 'focusin', 'pointerdown', 'touchstart'].forEach((name) => 
    carousel.addEventListener(name, () => { paused = true; }, { passive: true })
  );
  ['mouseleave', 'focusout', 'pointerup', 'touchend'].forEach((name) => 
    carousel.addEventListener(name, () => { paused = false; }, { passive: true })
  );
  
  setInterval(() => {
    if (paused || !carousel.children.length) return;
    const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 2;
    carousel.scrollLeft = atEnd ? 0 : carousel.scrollLeft + 1;
  }, 28);
}

// Page load events
window.addEventListener('load', () => { 
  setTimeout(() => $('#loader').classList.add('done'), 450); 
});

window.addEventListener('scroll', () => 
  $('.nav').classList.toggle('scrolled', window.scrollY > 20), 
  { passive: true }
);

// Mobile menu toggle
$('.menu-toggle').addEventListener('click', (event) => { 
  const nav = $('nav'); 
  const open = nav.classList.toggle('open'); 
  event.currentTarget.setAttribute('aria-expanded', open); 
});

document.querySelectorAll('nav a').forEach((link) => 
  link.addEventListener('click', () => $('nav').classList.remove('open'))
);

// Start the app
start();
