import { INTENTS, intentRules, normalise } from "./intents.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Dev2 CommonJS module (must be named dataService.cjs)
const { getClubInfo, getNextFixture, getLatestResult, searchFaq } =
  require("./dataService.cjs");

function makeResponse(text, buttons = []) {
  return { text, buttons };
}

export function detectIntent(message = "") {
  const msg = normalise(message);

  if (["hi", "hey", "hello", "yo"].includes(msg)) return INTENTS.GREETING;

  for (const rule of intentRules) {
    if (rule.keywords.some((kw) => msg.includes(kw))) return rule.intent;
  }

  return INTENTS.FALLBACK;
}

function extractFaqAnswer(faqItem) {
  if (!faqItem) return null;

  // Dev2 returns an object like { question, answer, keywords: [...] }
  if (typeof faqItem === "string") return faqItem;

  return (
    faqItem.answer ||
    faqItem.response ||
    faqItem.text ||
    null
  );
}

export async function handleMessage(message = "") {
  const intent = detectIntent(message);

  try {
    switch (intent) {
      case INTENTS.GREETING:
        return makeResponse(
          "Hi! I’m the Luton Town FC chatbot. Ask me about fixtures, results, tickets, or club info.",
          [
            { label: "Next fixture", value: "fixtures" },
            { label: "Latest result", value: "results" },
            { label: "Tickets", value: "tickets" },
            { label: "Club info", value: "club info" },
          ]
        );

      case INTENTS.HELP:
        return makeResponse(
          "Try: “next fixture”, “latest result”, “ticket prices”, or “club info”.",
          [
            { label: "Fixtures", value: "fixtures" },
            { label: "Results", value: "results" },
            { label: "Tickets", value: "tickets" },
            { label: "Club info", value: "club info" },
          ]
        );

      case INTENTS.FIXTURES: {
        const f = await getNextFixture();

        if (!f) {
          return makeResponse("I couldn’t find the next fixture right now.");
        }

        // Try multiple field names in case Dev2 JSON uses different keys
        const opponent = f.opponent || f.opposition || f.awayTeam || f.homeTeam || "Unknown opponent";
        const date = f.date || f.kickoff || f.time || "Unknown date";
        const venue = f.venue || f.location || f.ground || "Unknown venue";

        return makeResponse(`Next fixture: ${opponent} on ${date} (${venue}).`, [
          { label: "Latest result", value: "results" },
          { label: "Tickets", value: "tickets" },
        ]);
      }

      case INTENTS.RESULTS: {
        const r = await getLatestResult();

        if (!r) {
          return makeResponse("I couldn’t find the latest result right now.");
        }

        const opponent = r.opponent || r.opposition || r.awayTeam || r.homeTeam || "Unknown opponent";
        const date = r.date || r.playedOn || "Unknown date";

        // Score formats vary, support multiple possibilities
        const lutonScore = r.lutonScore ?? r.homeScore ?? r.scoreFor ?? null;
        const oppScore = r.opponentScore ?? r.awayScore ?? r.scoreAgainst ?? null;

        let scoreText = `Luton vs ${opponent}`;
        if (lutonScore !== null && oppScore !== null) {
          scoreText = `Luton ${lutonScore}-${oppScore} ${opponent}`;
        }

        return makeResponse(`Latest result: ${scoreText} (${date}).`, [
          { label: "Next fixture", value: "fixtures" },
          { label: "Club info", value: "club info" },
        ]);
      }

      case INTENTS.CLUB_INFO: {
        const info = await getClubInfo();

        if (!info) {
          return makeResponse("I couldn’t load club info right now.");
        }

        const founded = info.founded ?? "Unknown";
        const stadium = info.stadium ?? "Unknown";
        const nickname = info.nickname ?? "Unknown";

        return makeResponse(
          `Luton Town FC: Founded ${founded}. Stadium: ${stadium}. Nickname: ${nickname}.`,
          [
            { label: "Fixtures", value: "fixtures" },
            { label: "Help", value: "help" },
          ]
        );
      }

      case INTENTS.TICKETS: {
        const faqItem = await searchFaq(message);
        const answer = extractFaqAnswer(faqItem);

        if (answer) {
          return makeResponse(answer, [
            { label: "Next fixture", value: "fixtures" },
            { label: "Help", value: "help" },
          ]);
        }

        return makeResponse(
          "I can help with ticket info. Try asking: “ticket prices” or “how to buy tickets”.",
          [
            { label: "Ticket prices", value: "ticket prices" },
            { label: "How to buy", value: "how to buy tickets" },
          ]
        );
      }

      default: {
        // Smart fallback: try FAQ search first
        const faqItem = await searchFaq(message);
        const answer = extractFaqAnswer(faqItem);

        if (answer) {
          return makeResponse(answer, [
            { label: "Fixtures", value: "fixtures" },
            { label: "Results", value: "results" },
          ]);
        }

        return makeResponse(
          "Sorry — I didn’t understand that. Ask about fixtures, results, tickets, or club info.",
          [
            { label: "Help", value: "help" },
            { label: "Fixtures", value: "fixtures" },
            { label: "Results", value: "results" },
            { label: "Tickets", value: "tickets" },
          ]
        );
      }
    }
  } catch (e) {
    return makeResponse("Something went wrong. Please try again.", [
      { label: "Help", value: "help" },
    ]);
  }
}
