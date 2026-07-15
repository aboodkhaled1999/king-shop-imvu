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
      headless: true,
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
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138 Safari/537.36"
    );

    console.log("🌐 فتح متجر IMVU...");

    await page.goto(IMVU_SHOP_URL, {
      waitUntil: "networkidle2",
      timeout: 90000
    });

    await new Promise(r => setTimeout(r, 5000));


    // تمرير الصفحة لتحميل العناصر
    await page.evaluate(async () => {
      for (let i = 0; i < 10; i++) {
        window.scrollBy(0, 1000);
        await new Promise(r => setTimeout(r, 800));
      }

      window.scrollTo(0, 0);
    });


    await new Promise(r => setTimeout(r, 3000));


    console.log("📦 استخراج المنتجات...");


    const products = await page.evaluate(() => {

      const results = [];
      const seen = new Set();


      function addProduct(data) {

        if (!data.id) return;

        if (seen.has(data.id)) return;

        seen.add(data.id);

        results.push({
          id: data.id,
          name: data.name || "IMVU Product",
          image: data.image || "",
          url: data.url || "",
          price: data.price || "",
          category: "IMVU Item"
        });

      }



      // 1- البحث عن روابط المنتجات
      document.querySelectorAll("a").forEach(a => {

        const href = a.href || "";

        const match =
          href.match(/product[_-]?id[=\/](\d+)/i) ||
          href.match(/products\/(\d+)/i);


        if (!match) return;


        const card =
          a.closest("div") ||
          a.parentElement;


        const img =
          card?.querySelector("img");


        addProduct({

          id: match[1],

          name:
            img?.alt ||
            a.innerText ||
            a.title ||
            "IMVU Product",

          image:
            img?.src ||
            img?.dataset?.src ||
            "",

          url: href

        });


      });



      // 2- البحث داخل بيانات JSON في الصفحة
      document.querySelectorAll("script").forEach(script => {

        const text = script.textContent;


        const ids =
          text.match(/product_id["']?\s*[:=]\s*["']?(\d+)/gi);


        if (!ids) return;


        ids.forEach(item => {

          const id =
            item.match(/\d+/)?.[0];


          if (id) {

            addProduct({

              id,

              name: "IMVU Product",

              url:
                "https://www.imvu.com/shop/product.php?product_id=" + id

            });

          }

        });


      });



      return results;

    });



    products.sort((a,b)=>
      a.name.localeCompare(b.name)
    );


    const output =
      path.join(__dirname,"products.json");


    if(products.length > 0){

      fs.writeFileSync(
        output,
        JSON.stringify(products,null,2),
        "utf8"
      );


      console.log(
        `✅ تم حفظ ${products.length} منتج`
      );


    } else {


      console.log(
        "❌ لم يتم العثور على منتجات"
      );


      process.exit(1);

    }


  } catch(err){

    console.error(
      "خطأ:",
      err
    );

    process.exit(1);


  } finally {


    if(browser){

      await browser.close();

    }

  }

}


syncProducts();
