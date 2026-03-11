const { chromium } = require("playwright");
const fs = require("fs");

async function getPrices() {

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(
    "https://www.petrolimex.com.vn/nd/bao-gia-xang-dau.html",
    { waitUntil: "domcontentloaded" }
  );

  await page.waitForFunction(() => window.__vieapps?.prices?.products);

  const products = await page.evaluate(() => {
    return window.__vieapps.prices.products;
  });

  await browser.close();

  return products;
}

(async () => {

  const prices = await getPrices();

  fs.writeFileSync(
    "prices.json",
    JSON.stringify(prices, null, 2)
  );

  console.log("prices.json created");

})();