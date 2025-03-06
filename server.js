const express = require('express');
const cors = require('cors');
const app = express();

const ndtv = require('./scrap/ndtv');
const youtube = require('./scrap/youtube');
const reddit = require('./scrap/reddit');
const redditSearch = require('./scrap/redditSearch');

const dashboard = require('./dashboard')

app.use(cors());
app.use(express.json());

let interest

let ndtvNews = [];
let ytContent = [];
let redditContent = [];

let dashboardNdtv

async function main(searchText = 'trending') {
    try {
        ndtvNews = await ndtv(searchText);
        ytContent = await youtube(searchText);
        if(searchText == 'trending'){
            redditContent = await reddit();
        }else{
            redditContent = await redditSearch(searchText);
        }

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

main();

app.post('/search', async (req, res) => {
    const searchText = req.body.searchText;
    console.log(req.body);
    await main(searchText);
    res.json({ success: true });
});

app.post('/sendInterest', async (req, res) => {
    interest = req.body.data
    console.log(interest)
    dashboardNdtv = await dashboard(interest[0].keyword_clicks)
})

app.get('/dashboard/ndtv', (req, res) => {
    res.json(dashboardNdtv)
})

const port = 7000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});