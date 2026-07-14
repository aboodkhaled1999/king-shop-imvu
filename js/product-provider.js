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
        const response = await fetch(this.url);

        if (!response.ok) {
            throw new Error("Unable to load products.json");
        }

        return await response.json();
    }
}

class ImvuApiProvider extends ProductProvider {
    constructor(shopUrl) {
        super();
        this.shopUrl = shopUrl;
    }

    async getProducts() {
        throw new Error("IMVU API provider is not implemented yet.");
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

                if (products && products.length > 0) {
                    console.log("Loaded products from", provider.constructor.name);
                    return products;
                }

            } catch (err) {

                console.warn(provider.constructor.name, err.message);

            }

        }

        return [];

    }

}
