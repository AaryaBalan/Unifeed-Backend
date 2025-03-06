const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

async function scrapeInstagramPosts(keywords) {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();

    let results = [];

    for (let keyword of keywords) {
        console.log(`🔍 Searching Google for Instagram posts with keyword: ${keyword}`);

        const searchUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(keyword)}/`;
        await page.goto(searchUrl, { waitUntil: "networkidle2" });

        await page.waitForSelector("a", { timeout: 10000 }).catch(() => { });

        // Extract Instagram post URLs
        const postLink = await page.evaluate(() => {
            let links = Array.from(document.querySelectorAll("a"))
                .map(a => a.href)
                .filter(href => href.includes("instagram.com/"));
            return links.length > 0 ? links[0] : null;
        });

        if (postLink) {
            results.push({ keyword, url: postLink });
        }
    }

    await browser.close();
    console.log("✅ Scraped Instagram posts:", results);
    console.log(JSON.stringify(results)); // Output JSON format
}

// Read keywords from command line
const keywords = JSON.parse(process.argv[2] || "[]");
scrapeInstagramPosts(["sports"]);
