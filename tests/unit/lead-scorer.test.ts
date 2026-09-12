import { calculateLeadScore } from "@/lib/utils/lead-scorer";

describe("Lead Scoring Algorithm", () => {
  it("should assign baseline score of 20 to an empty lead", () => {
    const score = calculateLeadScore({});
    expect(score).toBe(20);
  });

  it("should score executive C-level titles higher", () => {
    const ceoScore = calculateLeadScore({ title: "Chief Technology Officer" });
    const internScore = calculateLeadScore({ title: "Summer Intern" });

    expect(ceoScore).toBeGreaterThan(internScore);
    // 20 base + 35 CXO = 55
    expect(ceoScore).toBe(55);
  });

  it("should award bonuses for referrals and corporate domains", () => {
    const score = calculateLeadScore({
      title: "VP of Engineering",
      company: "Acme Corp",
      source: "Referral from Board",
      email: "alex@acmecorp.com",
      phone: "+1-555-0199",
    });

    // 20 (base) + 25 (VP) + 25 (Referral) + 10 (Phone) + 10 (Company) + 10 (Corporate Domain) = 100
    expect(score).toBe(100);
  });

  it("should not exceed maximum cap of 100", () => {
    const score = calculateLeadScore({
      title: "CEO & Founder",
      company: "Mega Enterprises Inc",
      source: "Executive Referral",
      email: "ceo@megaenterprises.com",
      phone: "+1-555-123-4567",
    });

    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBe(100);
  });

  it("should differentiate free email domains from corporate domains", () => {
    const personalLead = calculateLeadScore({
      title: "Manager",
      email: "john.doe@gmail.com",
    });

    const businessLead = calculateLeadScore({
      title: "Manager",
      email: "john.doe@stripe.com",
    });

    // Business email should score 10 points higher
    expect(businessLead - personalLead).toBe(10);
  });
});
