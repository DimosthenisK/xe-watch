const env = require('dotenv').config()
const req = require('request');
const $ = require('cheerio');
const moment = require('moment');

let url = process.env.XE_SEARCH_URL;
let loginurl = "https://my.xe.gr/app/login";

let urlLoginInfo = {
    email: process.env.XE_USER,
    password: process.env.XE_PASSWORD,
    autologin: 1,
    redirect: "https://www.xe.gr/"
}

let reqLoginHeaders = {
    Accept: "*/*",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Type": "application/x-www-form-urlencoded",
    Host: "my.xe.gr",
    Origin: "https://my.xe.gr",
    Referer: "https://my.xe.gr/login?redirect=https://www.xe.gr/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest"
};
let reqSearchHeaders = {
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    Host: "www.xe.gr",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest"
}

function l(message) {
    console.log(moment().format("MMMM Do YYYY, HH:mm:ss") + " | " + message)
}

async function doLogin() {
    req.post({
        url: loginurl,
        jar: true,
        form: urlLoginInfo,
        headers: reqLoginHeaders
    }, function (err, httpResponse, body) {
        if (err) throw err;
        return true;
    })
}

async function readIfNew() {
    l("Starting Process")
    await doLogin();

    l("Completed login")
    req.get({
        url: url,
        jar: true,
        headers: reqSearchHeaders
    }, function (err, httpResponse, body) {
        l("Got Results")
        let found = parseInt(body.match(/Βρέθηκαν <strong>([0-9]*)<\/strong> αγγελίες με τα κριτήρια που έχετε επιλέξει/)[1]);
        if (found != 0)
            l(`Βρέθηκαν ${found} νέες αγγελίες!`)
        else {
            l("Δεν βρέθηκαν αποτελέσματα")
        }
    })
}

(async () => {
    await doLogin();
    setInterval(async () => {
        await readIfNew();
    }, process.env.SEARCH_INTERVAL || 10000)
})();