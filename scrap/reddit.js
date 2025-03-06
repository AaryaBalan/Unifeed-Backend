const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function reddit() {
    const browser = await puppeteer.launch({
        // headless: false,  // See the browser actions
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto('https://www.reddit.com/r/popular/', { waitUntil: 'domcontentloaded' });

    // Wait for the first batch of posts to load
    await page.waitForSelector('shreddit-feed');

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
    const posts = await page.$$eval('shreddit-feed article', elements =>
        elements.map(el => {
            const anchor = el.querySelector('a[id^="post-title-"]');
            const imgElement = el.querySelector('.media-lightbox-img img');
            const timeElement = el.querySelector('time');
            const metaDataTag = el.querySelector('a[data-testid="subreddit-name"]')
            const channelNameTag = metaDataTag.querySelector('span')
            const channelImgTag = metaDataTag.querySelector('div > img')

            const title = anchor ? anchor.textContent.trim() : 'No title';
            const link = anchor ? anchor.href : 'No link';
            const imgUrl = imgElement ? imgElement.src : 'No image';
            const time = timeElement ? timeElement.textContent.trim() : 'No time';
            const channelName = channelNameTag ? channelNameTag.textContent.trim() : 'No channel name';
            const channelLink = metaDataTag ? metaDataTag.href : 'No channel link';
            const channelImg = channelImgTag ? channelImgTag.src : 'https://styles.redditmedia.com/t5_6/styles/communityIcon_a8uzjit9bwr21.png';

            return { title, link, imgUrl, time, channelName, channelLink, channelImg };
        }).filter(post => post.imgUrl != 'No image')
    );

    console.log(posts);
    console.log(`Total posts scraped: ${posts.length}`);

    await browser.close();
    return posts
};

module.exports = reddit