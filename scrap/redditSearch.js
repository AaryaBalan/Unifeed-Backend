const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function redditSearch(searchText) {
    const browser = await puppeteer.launch({
        // headless: false,  // See the browser actions
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(`https://www.reddit.com/search/?q=${searchText}`, { waitUntil: 'domcontentloaded' });

    // Wait for the first batch of posts to load
    await page.waitForSelector('span[avatar].inline-flex');

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

    // Extract post titles
    const posts = await page.$$eval('search-telemetry-tracker[data-testid="search-sdui-post"]', elements =>
        elements.map(el => {
            const anchor = el.querySelector('a[data-testid="post-title-text"]');
            const imgElement = el.querySelector('faceplate-img[data-testid="search_post_thumbnail"]');
            const timeElement = el.querySelector('time');
            const channelNameTag = el.querySelector('search-telemetry-tracker > a');
            const channelImgTag = channelNameTag.querySelector('span > span img')
            

            const title = anchor ? anchor.textContent.trim() : 'No title';
            const link = anchor ? anchor.href : 'No link';
            const imgUrl = imgElement ? imgElement.src : 'No image';
            const time = timeElement ? timeElement.textContent.trim() : 'No time';
            const channelName = channelNameTag ? channelNameTag.innerText.trim() : 'No channel name';
            const channelImg = channelImgTag ? channelImgTag.src : 'https://styles.redditmedia.com/t5_6/styles/communityIcon_a8uzjit9bwr21.png';
            const channelLink = channelNameTag ? channelNameTag.href : 'No channel link';
            return { title, link, imgUrl, time, channelName, channelImg, channelLink };
        }).filter(post => post.imgUrl != 'No image')
    );

    console.log(posts);
    console.log(`Total posts scraped: ${posts.length}`);

    await browser.close();
    return posts
};

module.exports = redditSearch;