export function getClubInfo() {
  return { founded: 1885, stadium: "Kenilworth Road", nickname: "The Hatters" };
}

export function getNextFixture() {
  return { opponent: "Example FC", date: "2026-02-15", venue: "Home" };
}

export function getLatestResult() {
  return { opponent: "Sample United", lutonScore: 2, opponentScore: 1, date: "2026-02-08" };
}

export function searchFaq(message = "") {
  const m = message.toLowerCase();
  if (m.includes("ticket") || m.includes("price")) {
    return "Tickets: Prices vary by match. Check the official ticket page for the latest availability and pricing.";
  }
  if (m.includes("stadium") || m.includes("ground")) {
    return "Luton Town FC play at Kenilworth Road.";
  }
  return null;
}
