const express = require('express');
const cors = require('cors');
const axios = require('axios'); // For making HTTP requests
const app = express();

const ndtv = require('./scrap/ndtv');
const youtube = require('./scrap/youtube');
const reddit = require('./scrap/reddit');
const redditSearch = require('./scrap/redditSearch');
const dashboard = require('./dashboard');

app.use(cors());
app.use(express.json());

let interest;
let ndtvNews = [];
let ytContent = [];
let redditContent = [];
let dashboardFeed;

// Function to fetch data from NDTV, YouTube, and Reddit
async function main(searchText = 'trending') {
    try {
        ndtvNews = await ndtv(searchText);
        ytContent = await youtube(searchText);
        if (searchText === 'trending') {
            redditContent = await reddit();
        } else {
            redditContent = await redditSearch(searchText);
        }

        // Routes to serve scraped data
        app.get('/ndtv', (req, res) => {
            res.json(ndtvNews);
        });

        app.get('/youtube', (req, res) => {
            res.json(ytContent);
        });

        app.get('/reddit', (req, res) => {
            res.json(redditContent);
        });

    } catch (error) {
        console.error("Error during scraping:", error);
    }
}

// Initialize the main function with default search text
main();

// Route to handle search requests
app.post('/search', async (req, res) => {
    const searchText = req.body.searchText;
    console.log(req.body);
    await main(searchText);
    res.json({ success: true });
});

// Route to receive interests from the client
app.post('/sendInterest', async (req, res) => {
    interest = req.body.data;
    console.log(interest);
    res.json({ success: true });
});

// Route to fetch dashboard data
app.get('/dashboard/:userid', async (req, res) => {
    if (dashboardFeed) {
        res.json(dashboardFeed);
        return
    }
    const userId = req.params.userid;
    console.log(`Fetching interests for user: ${userId}`);

    try {
        // Fetch user interests from Django backend
        const response = await axios.get(`http://0.0.0.0:8000/user-keyword-api/${userId}`);
        const userData = response.data;
        console.log("Response from Django backend:", userData);

        // Extract the keys (interests) from the keyword_clicks object
        const interests = Object.keys(userData[0].keyword_clicks);
        console.log("Extracted interests:", interests);

        // Generate dashboard data using the Dashboard function
        dashboardFeed = await dashboard(interests);
        console.log("Dashboard data:", dashboardFeed);

        // Send the dashboard data back to the client
        res.json(dashboardFeed);
    } catch (error) {
        console.error('Error generating dashboard:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
const port = 7000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});