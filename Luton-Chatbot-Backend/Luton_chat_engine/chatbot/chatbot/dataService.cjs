const path = require("path");
const fs = require("fs/promises");

const DATA_DIR = path.join(__dirname, "data");

const cache = {
  fixtures: null,
  results: null,
  faq: null,
  clubInfo: null,
};

async function loadJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function getClubInfo() {
  if (!cache.clubInfo) cache.clubInfo = await loadJson("clubInfo.json");
  return cache.clubInfo;
}

async function getFixtures() {
  if (!cache.fixtures) cache.fixtures = await loadJson("fixtures.json");
  return cache.fixtures;
}

async function getResults() {
  if (!cache.results) cache.results = await loadJson("results.json");
  return cache.results;
}

async function getFaq() {
  if (!cache.faq) cache.faq = await loadJson("faq.json");
  return cache.faq;
}

async function getNextFixture() {
  const fixtures = await getFixtures();
  return fixtures.length ? fixtures[0] : null;
}

async function getLatestResult() {
  const results = await getResults();
  return results.length ? results[0] : null;
}

async function getUpcomingFixtures(limit = 5) {
  const fixtures = await getFixtures();
  return fixtures.slice(0, limit);
}


async function searchFaq(message) {
  const msg = (message || "").toLowerCase();
  const faqs = await getFaq();

  let best = null;
  let bestScore = 0;

  for (const item of faqs) {
    const keywords = item.keywords || [];
    let score = 0;

    for (const kw of keywords) {
      if (msg.includes(kw.toLowerCase())) score++;
    }

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return bestScore > 0 ? best : null;
}

function clearCache() {
  cache.fixtures = null;
  cache.results = null;
  cache.faq = null;
  cache.clubInfo = null;
}

module.exports = {
  getClubInfo,
  getFixtures,
  getResults,
  getFaq,
  getNextFixture,
  getLatestResult,
  getUpcomingFixtures,
  searchFaq,
  clearCache,
};
