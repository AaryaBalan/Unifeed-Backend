const express = require('express');
const app = express();

const ndtv = require('./scrap/ndtv');
const youtube = require('./scrap/youtube');
const redditSearch = require('./scrap/redditSearch');

async function Dashboard(interest) {
    console.log("User Interests:", interest);

    let dashboardNews = [];
    let dashboardYoutube = [];
    let dashboardReddit = [];

    for (const key in interest) {
        try {
            console.log(`Fetching for: ${key}`);

            // Fetch 5 items per interest for each category
            const newsFeed = await ndtv(key);
            const youtubeFeed = await youtube(key);
            const redditFeed = await redditSearch(key);

            if (Array.isArray(newsFeed)) {
                dashboardNews.push(...newsFeed.slice(0, 5));
            }
            if (Array.isArray(youtubeFeed)) {
                dashboardYoutube.push(...youtubeFeed.slice(0, 5));
            }
            if (Array.isArray(redditFeed)) {
                dashboardReddit.push(...redditFeed.slice(0, 5));
            }

        } catch (error) {
            console.error(`Error fetching data for ${key}:`, error);
        }
    }

    console.log("✅ Dashboard Data Updated!");

    return {
        news: dashboardNews,
        youtube: dashboardYoutube,
        reddit: dashboardReddit
    };
}

module.exports = Dashboard;
