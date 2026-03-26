import fs from "fs";
import path from "path";

function getAllJsonFiles(dir, base = "") {
  let results: string[] = [];

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const full = path.join(dir, file);
    const rel = path.join(base, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      results = results.concat(getAllJsonFiles(full, rel));
    } else if (file.endsWith(".json")) {
      results.push(rel.replace(/\\/g, "/"));
    }
  }

  return results;
}

export default function handler(req, res) {
  const publicDir = path.join(process.cwd(), "public");
  const files = getAllJsonFiles(publicDir);

  const links = files
    .map((f) => `<li><a href="/${f.split('.')[0]}">${f.split('.')[0]}</a></li>`)
    .join("");

  const html = `
  <html>
  <head>
    <link rel="shortcut icon" href="https://bg.khoand.xyz/img/favicon.ico">
  </head>
  <body>
    <h1>JSON files</h1>
    <ul>
      ${links}
    </ul>
  </body>
  </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
}
