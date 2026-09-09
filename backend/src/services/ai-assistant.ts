import { z } from "zod";

export const aiAssistanceSchema = z.object({
  risk_summary: z.string().min(1),
  recommended_next_action: z.string().min(1),
  draft_message: z.string().min(1),
});

export type AiAssistanceResult =
  z.infer<typeof aiAssistanceSchema>;

export interface AiCustomerContext {
  customer_name: string;
  company: string;
  account_value: number;
  owner: string | null;
  risk_score: number | null;
  risk_level: string | null;

  signals: Array<{
    signal_type: string;
    weight: number;
    explanation: string;
  }>;

  recent_events: Array<{
    event_type: string;
    description: string | null;
    occurred_at: string;
  }>;
}

export function generateFallbackAssistance(
  context: AiCustomerContext
): AiAssistanceResult {
  const topSignals = [...context.signals]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  const signalText =
    topSignals.length > 0
      ? topSignals
          .map((signal) => signal.explanation)
          .join(" ")
      : "No major active churn signals are currently present.";

  const riskSummary =
    context.risk_score !== null
      ? `${context.company} currently has a ${
          context.risk_level ?? "unknown"
        } churn-risk level with a score of ${
          context.risk_score
        }/100. ${signalText}`
      : `${context.company} does not yet have a calculated churn-risk score. ${signalText}`;

  let recommendedNextAction =
    "Continue monitoring the account and maintain normal customer success follow-up.";

  if (
    context.risk_level === "critical" ||
    context.risk_level === "high"
  ) {
    recommendedNextAction =
      "Have the account owner review the active risk signals and conduct personalized outreach before taking any sensitive recovery action.";
  } else if (context.risk_level === "medium") {
    recommendedNextAction =
      "Review recent activity and contact the customer with a helpful check-in focused on the strongest risk signal.";
  }

  const firstName =
    context.customer_name.split(" ")[0] || "there";

  const draftMessage =
    `Hi ${firstName}, I wanted to check in and see how things have been going with ${context.company}. ` +
    `We noticed some recent account activity that may be worth discussing, and we'd like to make sure you're getting the support you need. ` +
    `If there's anything we can help address, we'd be happy to work through it with you.`;

  return {
    risk_summary: riskSummary,
    recommended_next_action: recommendedNextAction,
    draft_message: draftMessage,
  };
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export async function generateOpenRouterAssistance(
  apiKey: string,
  context: AiCustomerContext
): Promise<AiAssistanceResult> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Revenue Recovery OS",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content:
              "You are a customer retention assistant. Return only valid JSON. Do not invent facts. Use only the supplied customer context.",
          },
          {
            role: "user",
            content: `
Analyze this customer account.

Customer context:
${JSON.stringify(context, null, 2)}

Return exactly this JSON shape:

{
  "risk_summary": "string",
  "recommended_next_action": "string",
  "draft_message": "string"
}

Rules:
- Do not change or calculate the risk score.
- Do not invent policies, discounts, commitments, timelines, or completed actions.
- Keep the summary concise.
- The recommendation is advisory only.
- The outreach draft must be polite and non-committal.
`,
          },
        ],
        temperature: 0.2,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `OpenRouter request failed: ${response.status}`
    );
  }

  const result =
    (await response.json()) as OpenRouterResponse;

  const content =
    result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenRouter returned no content");
  }

  const parsed = JSON.parse(content);

  return aiAssistanceSchema.parse(parsed);
}

export async function generateAiAssistance(
  context: AiCustomerContext,
  apiKey?: string
): Promise<{
  data: AiAssistanceResult;
  provider: "openrouter" | "fallback";
}> {
  if (!apiKey) {
    return {
      data: generateFallbackAssistance(context),
      provider: "fallback",
    };
  }

  try {
    const data = await generateOpenRouterAssistance(
      apiKey,
      context
    );

    return {
      data,
      provider: "openrouter",
    };
  } catch (error) {
    console.error(
      "AI provider failed, using fallback:",
      error
    );

    return {
      data: generateFallbackAssistance(context),
      provider: "fallback",
    };
  }
}