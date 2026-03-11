const fs = require("fs");

async function getPrices() {
  const res = await fetch("https://www.petrolimex.com.vn/nd/bao-gia-xang-dau.html");
  const html = await res.text();

  const start = html.indexOf("window.__vieapps");
  if (start === -1) throw new Error("Không tìm thấy vieapps");

  const jsonStart = html.indexOf("{", start);
  const jsonEnd = html.indexOf("};", jsonStart) + 1;

  const jsonStr = html.slice(jsonStart, jsonEnd);
  const data = JSON.parse(jsonStr);

  return data.prices.products;
}

(async () => {
  try {
    const prices = await getPrices();

    fs.writeFileSync(
      "prices.json",
      JSON.stringify(prices, null, 2)
    );

    console.log(prices);
    console.log("prices.json created");
  } catch (err) {
    console.error(err);
  }
})();