const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const IMVU_SHOP_URL =
  "https://www.imvu.com/shop/web_search.php?manufacturers_id=315504714";

async function syncProducts() {
  console.log("🚀 بدء مزامنة منتجات IMVU...");

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1600,
      height: 3000
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36"
    );

    console.log("🌐 فتح متجر IMVU...");
    await page.goto(IMVU_SHOP_URL, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    // تمرير الصفحة لتحميل الصور والمنتجات
    await page.evaluate(async () => {
      let lastHeight = 0;

      while (lastHeight < document.body.scrollHeight) {
        lastHeight += 1000;
        window.scrollTo(0, lastHeight);
        await new Promise(r => setTimeout(r, 500));
      }

      window.scrollTo(0, 0);
    });

    await page.waitForTimeout(2000);

    console.log("📦 استخراج المنتجات...");

    const products = await page.evaluate(() => {
      const results = [];
      const seen = new Set();

      const links = [
        ...document.querySelectorAll('a[href*="product_id="]')
      ];

      for (const link of links) {
        const href = link.href || "";

        const match = href.match(/product_id=(\d+)/);

        if (!match) continue;

        const id = match[1];

        if (seen.has(id)) continue;
        seen.add(id);

        const card =
          link.closest("li") ||
          link.closest(".product") ||
          link.closest(".cat-product") ||
          link.closest("div") ||
          link.parentElement;

        if (!card) continue;

        const img =
          card.querySelector("img") ||
          link.querySelector("img");

        const image =
          img?.src ||
          img?.dataset?.src ||
          img?.getAttribute("data-src") ||
          "";

        let name =
          img?.alt ||
          link.title ||
          card.querySelector("h3")?.textContent ||
          card.querySelector(".product-name")?.textContent ||
          link.textContent ||
          "";

        name = name.replace(/\s+/g, " ").trim();

        if (!name)
          name = `IMVU Product ${id}`;

        let price = "";

        const all = [...card.querySelectorAll("*")];

        for (const el of all) {
          const text = el.textContent.trim();

          if (
            /\$\s*\d+/i.test(text) ||
            /\d+\s*credits?/i.test(text)
          ) {
            price = text;
            break;
          }
        }

        results.push({
          id,
          name,
          image,
          url: href,
          price,
          category: "IMVU Item"
        });
      }

      return results;
    });

    products.sort((a, b) => a.name.localeCompare(b.name));

    const file = path.join(__dirname, "products.json");

    fs.writeFileSync(
      file,
      JSON.stringify(products, null, 2),
      "utf8"
    );

    console.log(`✅ تم حفظ ${products.length} منتج في products.json`);

    if (products.length === 0) {
      console.warn("⚠️ لم يتم العثور على منتجات. قد تكون IMVU غيّرت تصميم الصفحة.");
    }

  } catch (err) {
    console.error("❌", err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

syncProducts();
