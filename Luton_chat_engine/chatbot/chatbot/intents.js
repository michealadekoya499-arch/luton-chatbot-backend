export const INTENTS = {
  GREETING: "greeting",
  FIXTURES: "fixtures",
  RESULTS: "results",
  TICKETS: "tickets",
  CLUB_INFO: "club_info",
  HELP: "help",
  FALLBACK: "fallback",
};

export const intentRules = [
  { intent: INTENTS.GREETING, keywords: ["hi", "hello", "hey", "yo"] },
  { intent: INTENTS.FIXTURES, keywords: ["fixture", "fixtures", "next match", "upcoming", "schedule", "when do we play"] },
  { intent: INTENTS.RESULTS, keywords: ["result", "results", "score", "latest result", "last match", "previous game"] },
  { intent: INTENTS.TICKETS, keywords: ["ticket", "tickets", "buy tickets", "prices", "how much", "booking"] },
  { intent: INTENTS.CLUB_INFO, keywords: ["club info", "about", "stadium", "manager", "history", "kenilworth"] },
  { intent: INTENTS.HELP, keywords: ["help", "menu", "options", "what can you do"] },
];

export function normalise(text = "") {
  return text.toLowerCase().trim();
}
