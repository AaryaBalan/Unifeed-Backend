const ndtv = require('./scrap/ndtv');
const youtube = require('./scrap/youtube');
const redditSearch = require('./scrap/redditSearch');

async function Dashboard(interests) {
    console.log("User Interests:", interests);

    let dashboardData = {};

    for (const interest of interests) {
        try {
            console.log(`Fetching data for interest: ${interest}`);

            // Fetch 5 items per interest for each category
            const newsFeed = await ndtv(interest);
            const youtubeFeed = await youtube(interest);
            const redditFeed = await redditSearch(interest);

            console.log(`NDTV data for ${interest}:`, newsFeed);
            console.log(`YouTube data for ${interest}:`, youtubeFeed);
            console.log(`Reddit data for ${interest}:`, redditFeed);

            dashboardData[interest] = [
                ...(Array.isArray(newsFeed) ? newsFeed.slice(0, 5) : []),
                ...(Array.isArray(youtubeFeed) ? youtubeFeed.slice(0, 5) : []),
                ...(Array.isArray(redditFeed) ? redditFeed.slice(0, 5) : [])
            ];
        } catch (error) {
            console.error(`Error fetching data for ${interest}:`, error);
        }
    }

    console.log("✅ Dashboard Data Updated!");
    console.log("Final Dashboard Data:", dashboardData);

    return dashboardData;
}

module.exports = Dashboard;
