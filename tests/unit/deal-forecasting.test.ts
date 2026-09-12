describe("Deal Stage Transitions & Weighted Forecasting", () => {
  const STAGE_PROBABILITIES: Record<string, number> = {
    "Lead In": 10,
    "Contact Made": 25,
    "Meeting Scheduled": 40,
    "Proposal Sent": 60,
    "Negotiation": 80,
    "Closed Won": 100,
    "Closed Lost": 0,
  };

  function calculateWeightedForecast(deals: Array<{ value: number; stage: string; customProbability?: number }>) {
    return deals.reduce((total, deal) => {
      const probability =
        deal.customProbability !== undefined
          ? deal.customProbability
          : STAGE_PROBABILITIES[deal.stage] || 0;
      return total + deal.value * (probability / 100);
    }, 0);
  }

  function calculateWinRate(deals: Array<{ stage: string }>) {
    const won = deals.filter((d) => d.stage === "Closed Won").length;
    const lost = deals.filter((d) => d.stage === "Closed Lost").length;
    const closed = won + lost;
    return closed > 0 ? Math.round((won / closed) * 100) : 0;
  }

  it("should accurately calculate weighted pipeline value based on stage probability", () => {
    const mockDeals = [
      { value: 100000, stage: "Proposal Sent" }, // 100,000 * 0.60 = 60,000
      { value: 50000, stage: "Negotiation" },    // 50,000 * 0.80 = 40,000
      { value: 20000, stage: "Lead In" },        // 20,000 * 0.10 = 2,000
    ];

    const forecast = calculateWeightedForecast(mockDeals);
    expect(forecast).toBe(102000);
  });

  it("should respect manual probability overrides if explicitly set", () => {
    const deals = [
      { value: 100000, stage: "Proposal Sent", customProbability: 90 }, // 100,000 * 0.90 = 90,000
    ];

    const forecast = calculateWeightedForecast(deals);
    expect(forecast).toBe(90000);
  });

  it("should properly calculate win rate ignoring open pipeline deals", () => {
    const deals = [
      { stage: "Closed Won" },
      { stage: "Closed Won" },
      { stage: "Closed Won" },
      { stage: "Closed Lost" },
      { stage: "Negotiation" }, // open, ignored in win rate
      { stage: "Lead In" },     // open, ignored in win rate
    ];

    // 3 won out of 4 closed = 75%
    expect(calculateWinRate(deals)).toBe(75);
  });

  it("Closed Won deals contribute 100% and Closed Lost contribute 0% to weighted forecast", () => {
    const deals = [
      { value: 250000, stage: "Closed Won" },
      { value: 100000, stage: "Closed Lost" },
    ];

    const forecast = calculateWeightedForecast(deals);
    expect(forecast).toBe(250000);
  });
});
