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
        "--disable-setuid-sandbox"
      ]
    });


    const page = await browser.newPage();


    await page.setViewport({
      width:1600,
      height:3000
    });


    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    );


    console.log("🌐 فتح متجر IMVU...");


    await page.goto(IMVU_SHOP_URL,{
      waitUntil:"networkidle2",
      timeout:90000
    });


    await new Promise(r=>setTimeout(r,5000));


    console.log("📦 استخراج المنتجات...");


    const products = await page.evaluate(()=>{


      const results=[];
      const seen=new Set();


      document.querySelectorAll("*").forEach(el=>{


        const text = el.innerText || "";


        const match =
          text.match(/product_id=(\d+)/);


        if(!match) return;


        const id=match[1];


        if(seen.has(id)) return;


        seen.add(id);



        const parent =
          el.closest("div");



        const img =
          parent?.querySelector("img");



        let name =
          parent?.innerText
          ?.split("\n")
          ?.filter(x=>x.trim())[0]
          ||
          "IMVU Product";



        results.push({

          id,

          name:name.trim(),

          image:
            img?.src || "",


          url:
            "https://www.imvu.com/shop/product.php?product_id="+id,


          category:"IMVU Item"

        });


      });



      return results;


    });



    console.log(
      `وجدنا ${products.length} منتج`
    );



    const output =
      path.join(__dirname,"products.json");



    if(products.length){

      fs.writeFileSync(
        output,
        JSON.stringify(products,null,2),
        "utf8"
      );


      console.log(
        "✅ تم تحديث المنتجات"
      );


    } else {


      throw new Error(
        "لم يتم العثور على منتجات"
      );

    }



  } catch(err){

    console.error(err.message);

    process.exit(1);


  } finally {

    if(browser){
      await browser.close();
    }

  }

}


syncProducts();
