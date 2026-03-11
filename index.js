const axios = require("axios");
const fs = require("fs");

async function run() {

  const url = "https://www.petrolimex.com.vn/nd/bao-gia-xang-dau.html";

  const { data: html } = await axios.get(url, {
    headers: {
      "user-agent": "Mozilla/5.0"
    }
  });

  // lấy object __vieapps.prices
  const match = html.match(/__vieapps\.prices\s*=\s*({[\s\S]*?});/);

  if (!match) {
    throw new Error("prices object not found");
  }

  const obj = eval("(" + match[1] + ")");

  const products = obj.products;

  fs.writeFileSync(
    "prices.json",
    JSON.stringify(products, null, 2)
  );

  console.log("prices.json updated");
}

run();