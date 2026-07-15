const config = window.KING_CONFIG;
const $ = (s) => document.querySelector(s);

function setExternalLinks() {
    ["profile-link", "profile-nav", "hero-link"].forEach(id => {
        const el = $("#" + id);
        if (el) el.href = config.urls.profile;
    });

    ["products-link", "all-products-link"].forEach(id => {
        const el = $("#" + id);
        if (el) el.href = config.urls.products;
    });
}

function escapeHtml(text = "") {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function productCard(product) {
    return `
    <article class="product-card">
        <div class="product-image">
            <img
                src="${product.image}"
                alt="${escapeHtml(product.name)}"
                loading="lazy"
                onerror="this.src='images/placeholder.png'"
            >
        </div>

        <div class="card-info">
            <small>${escapeHtml(product.category || "IMVU Item")}</small>

            <h3>${escapeHtml(product.name)}</h3>

            ${product.price ? `<p class="price">${product.price}</p>` : ""}

            <a href="${product.url}"
               target="_blank"
               rel="noopener">
                View Product
            </a>
        </div>
    </article>
    `;
}

async function loadProducts() {

    const carousel = $("#carousel");

    carousel.innerHTML =
        `<div class="loading">Loading products...</div>`;

    try {

        const response = await fetch("products.json?time=" + Date.now(), {
            cache: "no-store"
        });

        if (!response.ok)
            throw new Error();

        const products = await response.json();

        if (!Array.isArray(products))
            throw new Error();

        return products;

    } catch (e) {

        console.error(e);

        carousel.innerHTML =
            `<div class="empty">Unable to load products.</div>`;

        return [];
    }

}

async function start() {

    setExternalLinks();

    $("#year").textContent = new Date().getFullYear();

    const carousel = $("#carousel");

    const products = await loadProducts();

    function render(items) {

        if (!items.length) {

            carousel.innerHTML =
                `<div class="empty">No products found.</div>`;

            return;

        }

        carousel.innerHTML = items
            .map(productCard)
            .join("");

    }

    render(products);

    const search = $("#search");

    if (search) {

        search.addEventListener("input", e => {

            const q = e.target.value
                .trim()
                .toLowerCase();

            render(products.filter(p =>
                (
                    p.name +
                    " " +
                    (p.category || "")
                )
                .toLowerCase()
                .includes(q)
            ));

        });

    }

}

window.addEventListener("load", () => {

    const loader = $("#loader");

    if (loader)
        loader.classList.add("done");

    start();

});

window.addEventListener("scroll", () => {

    const nav = $(".nav");

    if (nav)
        nav.classList.toggle(
            "scrolled",
            window.scrollY > 20
        );

}, {
    passive: true
});

const menu = $(".menu-toggle");

if (menu) {

    menu.addEventListener("click", () => {

        const nav = $("nav");

        if (!nav) return;

        nav.classList.toggle("open");

    });

}
