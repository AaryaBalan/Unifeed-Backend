const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function ndtv(searchText) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log("🔍 Opening NDTV Sports News Page...");

    await page.goto(`https://www.ndtv.com/search?searchtext=${searchText}`, { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('.SrchLstPg_ul', { timeout: 60000 });

    const news = await page.$$eval('.SrchLstPg_ul li', elements =>
        elements.map(el => {
            const divTag = el.querySelector('.SrchLstPg-a');
            if (!divTag) return null;

            const titleTag = divTag.querySelector('.SrchLstPg_ttl');
            const descriptionTag = divTag.querySelector('.SrchLstPg_txt');
            const authorInfoTag = divTag.querySelectorAll('.pst-by_lnk');
            const dateTag = authorInfoTag.length > 0 ? authorInfoTag[0] : null;
            const authorTag = authorInfoTag.length > 1 ? authorInfoTag[1] : null;
            const imgTag = divTag.querySelector('.SrchLstPg_img-full');
            const sourceTag = divTag.querySelector('.srch-bnd_lg');
            const sourceImgTag = divTag.querySelector('.list-txt_bt-im')

            const title = titleTag ? titleTag.textContent.trim() : 'No title';
            const description = descriptionTag ? descriptionTag.textContent.trim() : 'No description';
            const date = dateTag ? dateTag.textContent.trim() : 'No date';
            const author = authorTag ? authorTag.textContent.trim() : 'Unknown author';
            const imgUrl = imgTag ? (imgTag.dataset.src || imgTag.src) : 'No image';
            const link = titleTag ? titleTag.href : 'No link';
            const source = sourceTag ? sourceTag.textContent : 'No source';
            const sourceImg = sourceImgTag ? sourceImgTag.src : 'No source image';

            return { title, description, date, author, imgUrl, link, source, sourceImg };
        }).filter(news => news)
    );

    console.log(news);
    console.log(`✅ Total News Articles Scraped: ${news.length}`);
    
    await browser.close();
    return news
}

module.exports = ndtv;