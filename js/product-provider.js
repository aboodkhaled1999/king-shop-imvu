class ProductProvider {
    async getProducts() {
        throw new Error("ProductProvider must implement getProducts()");
    }
}

class LocalJsonProvider extends ProductProvider {
    constructor(url = "products.json") {
        super();
        this.url = url;
    }

    async getProducts() {
        const response = await fetch(this.url, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Failed to load ${this.url}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("products.json is invalid");
        }

        // حذف المنتجات المكررة
        const map = new Map();

        for (const product of data) {
            if (!product.id) continue;

            map.set(String(product.id), {
                id: String(product.id),
                name: product.name || "Unnamed Product",
                image: product.image || "",
                url: product.url || "#",
                price: product.price || "",
                category: product.category || "IMVU Item"
            });
        }

        return [...map.values()].sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }
}

class ImvuApiProvider extends ProductProvider {
    constructor(shopUrl) {
        super();
        this.shopUrl = shopUrl;
    }

    async getProducts() {
        console.warn("IMVU API Provider غير مفعل حالياً.");
        return [];
    }
}

class ProviderManager {
    constructor() {
        this.providers = [];
    }

    add(provider) {
        this.providers.push(provider);
    }

    async loadProducts() {
        for (const provider of this.providers) {
            try {
                const products = await provider.getProducts();

                if (Array.isArray(products) && products.length) {
                    console.log(
                        `✅ Loaded ${products.length} products from ${provider.constructor.name}`
                    );
                    return products;
                }
            } catch (err) {
                console.error(
                    `❌ ${provider.constructor.name}:`,
                    err.message
                );
            }
        }

        console.warn("⚠️ No products found.");
        return [];
    }
}
