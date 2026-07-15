const puppeteer = require("puppeteer");
const fs = require("fs");

const IMVU_SHOP_URL =
  "https://www.imvu.com/shop/web_search.php?manufacturers_id=315504714";

async function test() {

  console.log("🚀 فتح IMVU");

  const browser = await puppeteer.launch({
    headless: true,
    args:[
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  );

  await page.goto(IMVU_SHOP_URL,{
    waitUntil:"networkidle2",
    timeout:90000
  });


  await new Promise(r=>setTimeout(r,5000));


  const html = await page.content();


  fs.writeFileSync(
    "imvu-debug.html",
    html,
    "utf8"
  );


  console.log(
    "✅ تم حفظ imvu-debug.html"
  );


  console.log(
    "طول الصفحة:",
    html.length
  );


  await browser.close();

}


test();
