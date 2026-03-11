const fs = require("fs");
const cheerio = require("cheerio");

async function getLatestPrices() {
  // Bước 1: Lấy danh sách thông cáo
  const listRes = await fetch("https://www.petrolimex.com.vn/ndi/thong-cao-bao-chi.html");
  const listHtml = await listRes.text();
  const $list = cheerio.load(listHtml);

  // Tìm link thông cáo mới nhất có chứa "giá xăng dầu" hoặc "điều chỉnh giá"
  let latestLink = null;
  $list("a").each((i, el) => {
    const text = $list(el).text().toLowerCase();
    if (text.includes("điều chỉnh giá xăng dầu") || text.includes("giá xăng dầu")) {
      if (!latestLink) {  // lấy cái đầu tiên (mới nhất)
        latestLink = $list(el).attr("href");
      }
    }
  });

  if (!latestLink) throw new Error("Không tìm thấy thông cáo giá mới nhất");

  // Bước 2: Vào bài chi tiết
  const fullUrl = new URL(latestLink, "https://www.petrolimex.com.vn/").href;
  console.log("Đang lấy từ:", fullUrl);

  const detailRes = await fetch(fullUrl);
  const detailHtml = await detailRes.text();
  const $ = cheerio.load(detailHtml);

  // Tìm phần nội dung chính (thường trong .content hoặc .detail-content)
  const content = $(".content, .detail-content, .nd-detail, article, .post-content").first();
  if (content.length === 0) throw new Error("Không tìm thấy nội dung bài viết");

  const text = content.text().replace(/\s+/g, " ").trim();

  // Cách đơn giản: extract các dòng có dạng "Xăng RON 95-V   22.XXX" hoặc tương tự
  const priceLines = text.match(/((Xăng|DO|Dầu|Diesel|Mazút)[^:]+?:\s*[\d.,]+(\s*(đồng|lít|kg))?)/gi) || [];

  const prices = priceLines.map(line => {
    const cleaned = line.replace(/\s+/g, " ").trim();
    return cleaned;
  });

  // Hoặc parse chi tiết hơn nếu cần (tên sản phẩm → giá)
  const result = {};
  priceLines.forEach(line => {
    const match = line.match(/(.+?)\s*[:\-]\s*([\d.,]+)/);
    if (match) {
      const product = match[1].trim();
      const price = match[2].trim().replace(/\./g, "");
      result[product] = parseInt(price, 10);
    }
  });

  return {
    date: $(".date, .time, meta[property='article:published_time']").text().trim() || "không rõ",
    sourceUrl: fullUrl,
    rawLines: prices,
    structured: result
  };
}

(async () => {
  try {
    const data = await getLatestPrices();

    fs.writeFileSync("petrolimex-prices.json", JSON.stringify(data, null, 2));

    console.log("Ngày điều chỉnh:", data.date);
    console.log("Link bài viết:", data.sourceUrl);
    console.log("\nGiá (structured):");
    console.table(data.structured);
    console.log("\nprices.json đã được tạo");
  } catch (err) {
    console.error("Lỗi:", err.message);
  }
})();