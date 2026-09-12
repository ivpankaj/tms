export interface LeadScoringInput {
  title?: string;
  company?: string;
  source?: string;
  email?: string;
  phone?: string;
}

export function calculateLeadScore(lead: LeadScoringInput): number {
  let score = 20; // Base score for any captured lead

  const title = (lead.title || "").toLowerCase();
  // C-level, VP, or Director titles have strong purchase authority
  if (
    title.includes("cxo") ||
    title.includes("chief") ||
    title.includes("ceo") ||
    title.includes("cto") ||
    title.includes("cio") ||
    title.includes("ciso") ||
    title.includes("president") ||
    title.includes("founder")
  ) {
    score += 35;
  } else if (title.includes("vp") || title.includes("vice president")) {
    score += 25;
  } else if (title.includes("director") || title.includes("head of")) {
    score += 20;
  } else if (title.includes("manager") || title.includes("lead")) {
    score += 10;
  }

  // Source attribution scoring
  const source = (lead.source || "").toLowerCase();
  if (source.includes("referral") || source.includes("executive")) {
    score += 25;
  } else if (source.includes("event") || source.includes("webinar")) {
    score += 20;
  } else if (source.includes("inbound") || source.includes("website") || source.includes("web form")) {
    score += 15;
  } else if (source.includes("organic") || source.includes("search")) {
    score += 10;
  }

  // Completeness check
  if (lead.phone && lead.phone.trim().length > 5) {
    score += 10;
  }
  if (lead.company && lead.company.trim().length > 1) {
    score += 10;
  }

  // Business vs free consumer email domain
  const email = (lead.email || "").toLowerCase();
  const freeDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"];
  const domain = email.split("@")[1];
  if (domain && !freeDomains.includes(domain)) {
    score += 10; // Corporate domain bonus
  }

  return Math.min(100, Math.max(0, score));
}
