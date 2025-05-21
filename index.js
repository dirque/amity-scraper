const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer-core");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Amity Scraper API is live 🚀" });
});

app.post("/scrape", async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
      executablePath: "/usr/bin/google-chrome",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("table tr"));
      return rows.map(row => {
        const cols = row.querySelectorAll("td");
        return {
          course: cols[0]?.innerText.trim() || null,
          duration: cols[1]?.innerText.trim() || null,
          eligibility: cols[2]?.innerText.trim() || null
        };
      }).filter(row => row.course);
    });

    await browser.close();
    res.json({ success: true, data });
  } catch (err) {
    console.error("Scrape error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Scraper live on port ${PORT}`);
});
