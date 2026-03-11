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
  const menu=await page.waitForSelector('.f-list table tbody', { timeout: 15000 })
    .catch(() => console.log('Không thấy class sau 15s'));

    
  const html = await menu.evaluate(el => el.innerHTML);
  
  const regex = /<tr><td>([^<]+)<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><\/tr>/g;

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
  const result=JSON.stringify(data, null, 2);
  fs.writeFileSync('price.json', JSON.stringify(result, null, 2), 'utf8');
  console.log('Đã ghi thành công file: price.json');

  await browser.close();
})();