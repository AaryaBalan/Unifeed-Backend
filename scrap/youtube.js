const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function youtube(searchText) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log("Opening YouTube Trending Page...");

    const searchLink = searchText == 'trending' ? 'https://www.youtube.com/feed/trending' : 'https://www.youtube.com/results?search_query=' + searchText;
    await page.goto((searchLink), { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for the first video element to appear
    await page.waitForSelector('ytd-video-renderer', { timeout: 60000 });

    // Scroll to the bottom of the page
    async function scrollToEnd(page) {
        let lastHeight = await page.evaluate(() => document.body.scrollHeight);
        while (true) {
            console.log("🛠 Scrolling...");
            await page.evaluate(() => window.scrollBy(0, window.innerHeight)); // Scroll down
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for content to load

            let newHeight = await page.evaluate(() => document.body.scrollHeight);
            if (newHeight === lastHeight) {
                console.log("✅ Reached the end of the page.");
                break; // Stop scrolling if the height doesn't change
            }
            lastHeight = newHeight;
        }
    }

    await scrollToEnd(page);

    const videos = await page.$$eval('ytd-video-renderer', elements => {
        return elements.map(el => {
            const titleElement = el.querySelector('#video-title');
            const discriptionElement = el.querySelector('#description-text')
            const metaData = el.querySelector('#metadata-line')
            const spanInMetaData = metaData.querySelectorAll('span')
            const viewsTag = spanInMetaData[0]
            const timeTag = spanInMetaData[1]
            const authorTag = el.querySelector('yt-formatted-string a');


            const link = titleElement ? 'https://www.youtube.com' + titleElement.getAttribute('href') : null;
            const title = titleElement ? titleElement.textContent.trim() : null;
            const discriptionText = discriptionElement ? discriptionElement.textContent.trim() : null;
            const views = viewsTag ? viewsTag.textContent.trim() : null;
            const time = timeTag ? timeTag.textContent.trim() : null;
            const authorName = authorTag ? authorTag.innerHTML : null;
            const authorLink = authorTag ? 'https://www.youtube.com' + authorTag.getAttribute('href') : null;


            return { title, link, discriptionText, views, time, authorName, authorLink };
        });
    });

    console.log(videos);
    await browser.close();
    return videos;
}

module.exports = youtube