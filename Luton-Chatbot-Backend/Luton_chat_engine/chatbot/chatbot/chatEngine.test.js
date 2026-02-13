import { handleMessage } from "./chatEngine.js";

const tests = [
  "hi",
  "what is the next fixture?",
  "latest result?",
  "tickets prices?",
  "tell me about the club",
  "stadium?",
  "asdasdasd",
];

for (const t of tests) {
  console.log("\nUSER:", t);
  console.log("BOT :", await handleMessage(t));
}
