export function getFinalQuoteText(quote) {
  return [
    quote?.before,
    quote?.highlight,
    quote?.middle,
    quote?.secondHighlight,
    quote?.after,
  ].filter(Boolean).join("");
}

export function getFinalQuoteAuthor(quote) {
  return quote ? `- ${quote.finalAuthor ?? "Henrique B. Fiorotti"}` : "";
}
