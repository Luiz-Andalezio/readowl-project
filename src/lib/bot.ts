export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  // cheap heuristics; refine as needed
  return /(bot|crawl|spider|slurp|curl|wget|python-requests|go-http-client|monitor|pingdom|datadog)/.test(ua);
}
