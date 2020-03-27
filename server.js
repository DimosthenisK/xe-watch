const env = require("dotenv").config();
const req = require("request");
const notifier = require("node-notifier");
const moment = require("moment");
const opn = require("opn");
const cheerio = require("cheerio");
const sg = require("@sendgrid/mail");
const ppt = require("puppeteer-extra"); // Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
ppt.use(StealthPlugin());

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
ppt.use(AdblockerPlugin({ blockTrackers: true }));
sg.setApiKey(process.env.SENDGRID);

let url = process.env.XE_SEARCH_URL;

notifier.on("click", function(notifierObj, options) {
  opn(url);
});

let previousResultCount = 2;

function l(message) {
  console.log(moment().format("MMMM Do YYYY, HH:mm:ss") + " | " + message);
}

async function readIfNew(page) {
  await page.reload();
  let foundText = "";
  try {
    foundText = await page.$eval(".count_classifieds", el => el.textContent);
  } catch (ex) {
    console.error(ex);
  }

  let found = Number(foundText.split(" ")[1].split("")[0]);

  if (found != 0) {
    l(`Βρέθηκαν ${found} νέες αγγελίες!`);

    if (previousResultCount < found) {
      sg.send({
        to: process.env.OBSERVERS.split(","),
        from: "ftv.voidblaze@gmail.com",
        subject: "Βρέθηκαν Νέες Αγγελίες στην XE!",
        html: 'Δες εδώ: <a href="' + url + '">Χρυσή Ευκαιρία</a>'
      });

      previousResultCount = found;
    } else {
      l("Όσες και πριν");
    }
  } else {
    l("Δεν βρέθηκαν αποτελέσματα");
  }
}

let runFunc = async () => {
  const browser = await ppt.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);
  await readIfNew(page);
  //await browser.close();
};

(async () => {
  l("Starting Process");
  l(process.env.XE_SEARCH_URL);

  await runFunc();

  setInterval(runFunc, process.env.SEARCH_INTERVAL || 10000);
})();
