interface MerchantRule {
  max_discount_pct: number;
  trigger_time_start: string;
  trigger_time_end: string;
  trigger_weather: string[];
  trigger_payone_threshold: number;
  active?: boolean;
}

export async function extractRuleFromGoal(goalPrompt: string): Promise<Partial<MerchantRule>> {
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "phi3:mini",
      system: `You are a business rule extractor. Extract merchant offer parameters from a natural language goal.
Return ONLY valid JSON: {"max_discount_pct": 20, "trigger_time_start": "14:00", "trigger_time_end": "17:00", "trigger_weather": ["cold","rain"], "trigger_payone_threshold": 35}
Rules: max_discount between 5-30, trigger_weather from [cold,rain,overcast,sunny], threshold between 20-60.`,
      prompt: `Extract parameters from this merchant goal: "${goalPrompt}"`,
      stream: false,
      options: { temperature: 0.3, num_predict: 150 },
    }),
  });
  const data = await res.json();
  return JSON.parse(data.response.trim());
}