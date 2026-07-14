const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// https://www.imvu.com/shop/web_search.php?manufacturers_id=315504714
const IMVU_SHOP_URL = process.env.IMVU_SHOP_URL || "https://www.imvu.com/shop/web_search.php?manufacturers_id=YOUR_CREATOR_ID"; 

async function syncProducts() {
  console.log("🚀 جاري بدء عملية جلب المنتجات من IMVU...");
  let browser;
  
  try {
    // تشغيل المتصفح الوهمي
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // محاكاة متصفح حقيقي لتجنب الحظر
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log(`🔗 جاري الانتقال إلى المتجر: ${IMVU_SHOP_URL}`);
    await page.goto(IMVU_SHOP_URL, { waitUntil: 'networkidle2' });

    // الانتظار حتى تظهر عناصر المنتجات في الصفحة (قم بتعديل الـ selector حسب هيكل صفحة IMVU)
    await page.waitForSelector('.cat-product, [id^="product_"]', { timeout: 15000 });

    console.log("📸 جاري استخراج بيانات المنتجات...");
    
    const products = await page.evaluate(() => {
      // هذه الدالة تعمل داخل المتصفح الوهمي لاستخراج البيانات
      // قمنا باستهداف عناصر متجر IMVU التقليدية (قد تحتاج لتعديل بسيط حسب الـ HTML الدقيق لمتجرك)
      const items = Array.from(document.querySelectorAll('.cat-product, [id^="product_"]'));
      
      return items.map(item => {
        // استخراج الرابط ورقم المنتج
        const linkElement = item.querySelector('a[href*="product_id"]');
        const href = linkElement ? linkElement.href : '';
        
        // استخراج رقم المنتج ID من الرابط
        let id = '';
        if (href) {
          const match = href.match(/product_id=(\d+)/);
          id = match ? match[1] : '';
        }

        // استخراج الاسم والصورة
        const nameElement = item.querySelector('.product-name, h3, a');
        const name = nameElement ? nameElement.innerText.trim() : 'Unknown Product';
        
        const imgElement = item.querySelector('img');
        const image = imgElement ? imgElement.src : '';

        // محاولة استخراج الفئة من البيانات أو الخصائص
        let category = "IMVU Item";
        const categoryElement = item.querySelector('.category, .product-category, [class*="category"]');
        if (categoryElement) {
          category = categoryElement.innerText.trim();
        }

        return {
          id: id,
          name: name,
          image: image,
          url: href,
          category: category
        };
      }).filter(p => p.id !== ''); // تصفية أي عناصر غير مكتملة
    });

    if (products.length === 0) {
      console.warn("⚠️  لم يتم العثور على أي منتجات. تحقق من الـ selectors أو أن المتجر يحتاج تحديث.");
    } else {
      console.log(`✅ تم استخراج ${products.length} منتج بنجاح.`);
    }

    // مسار حفظ ملف products.json في مشروعك
    const filePath = path.join(__dirname, 'products.json');
    
    // حفظ البيانات في الملف بصيغة JSON منظمة
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
    console.log("💾 تم تحديث ملف products.json بنجاح!");

  } catch (error) {
    console.error("❌ حدث خطأ أثناء جلب البيانات:", error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

syncProducts();
