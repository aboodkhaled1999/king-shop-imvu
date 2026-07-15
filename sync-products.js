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


      const names = [
        ...document.querySelectorAll("img")
      ];


      names.forEach(img=>{


        let name =
          img.alt ||
          img.title ||
          "";


        name=name.trim();


        if(!name) return;


        const ignore=[
          "logo",
          "avatar",
          "banner"
        ];


        if(
          ignore.some(x =>
            name.toLowerCase().includes(x)
          )
        ) return;



        const link =
          img.closest("a");


        if(!link) return;


        const url =
          link.href || "";


        if(!url.includes("product")) return;



        if(seen.has(url)) return;


        seen.add(url);



        results.push({

          id:
            url.match(/\d+/)?.[0] ||
            Date.now().toString(),


          name,


          image:
            img.src || "",


          url,


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



    if(products.length===0){

      throw new Error(
        "لم يتم العثور على منتجات"
      );

    }


    fs.writeFileSync(
      output,
      JSON.stringify(products,null,2),
      "utf8"
    );


    console.log(
      "✅ تم حفظ المنتجات بنجاح"
    );



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
