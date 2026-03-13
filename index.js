const puppeteer = require('puppeteer');  // npm install puppeteer
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,          // false để debug thấy trình duyệt
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // cần cho một số server/VPS
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...'); // tránh bị chặn

  await page.goto('https://www.petrolimex.com.vn/lien-he.html', {
    waitUntil: 'networkidle2',   // chờ JS load xong, network yên tĩnh
    timeout: 30000
  });

  // Chờ selector cụ thể xuất hiện (rất quan trọng!)
  const menu=await page.waitForSelector('.f-list', { timeout: 15000 })
    .catch(() => console.log('Không thấy class sau 15s'));

    
  const html = await menu.evaluate(el => el.innerHTML);
  
  const regex = /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<\/tr>/g;

  const regexTime = /<p[^>]*>(?:<span[^>]*>[^<]*<\/span>)?\s*([\s\S]*?)<\/p>/i;
  const matchTime = html.match(regexTime);
  const textTime = matchTime ? matchTime[1].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';


  const data = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    const [, sanPham, vung1, vung2] = match;
    data.push({
      san_pham: sanPham.trim(),
      vung_1: vung1.trim(),
      vung_2: vung2.trim()
    });
  }
  const price=JSON.stringify(data, null, 2);
  const result={
    time: textTime,
    price
  }
  // console.log(result);
  
  
  fs.writeFileSync('public/prices.json', JSON.stringify(result, null, 2), 'utf8');
  console.log('Đã ghi thành công file: public/prices.json');

  await browser.close();
})();

function getTodayVCBDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

async function getVCBRates() {

  const date = getTodayVCBDate();
  const url = `https://www.vietcombank.com.vn/api/exchangerates?date=${date}`;
  const base = "https://www.vietcombank.com.vn";
  const flagMap = {
    USD: "🇺🇸",
    EUR: "🇪🇺",
    GBP: "🇬🇧",
    JPY: "🇯🇵",
    AUD: "🇦🇺",
    CAD: "🇨🇦",
    CHF: "🇨🇭",
    CNY: "🇨🇳",
    HKD: "🇭🇰",
    SGD: "🇸🇬",
    KRW: "🇰🇷",
    THB: "🇹🇭",
    MYR: "🇲🇾",
    TWD: "🇹🇼",
    DKK: "🇩🇰",
    NOK: "🇳🇴",
    SEK: "🇸🇪",
    RUB: "🇷🇺",
    INR: "🇮🇳"
  };

  const res = await fetch(url);
  const json = await res.json();

  const updated = json.UpdatedDate;

  function normalizeVCB(json) {
    return {
      ...json,
      Data: json.Data.map(c => ({
        ...c,
        icon: base + c.icon,              // giữ icon + thêm base url
        emoji: flagMap[c.currencyCode] || "🏳️"
      }))
    };
  }
  const data = normalizeVCB(json);


  fs.writeFileSync('public/rates.json', JSON.stringify(data, null, 2), 'utf8');
  console.log('Đã ghi thành công file: public/rates.json');
}

getVCBRates();
