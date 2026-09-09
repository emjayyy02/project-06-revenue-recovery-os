import { z } from "zod";
import type { Json } from "./types/database";
import {
  createSupabaseClient,
  type Env,
} from "./lib/supabase";
import { calculateRiskFromEvents } from "./services/risk-engine";
import { generateAiAssistance } from "./services/ai-assistant";
import { getAnalytics } from "./services/analytics";
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders,
  });
}

const interventionSchema = z.object({
    customer_id: z.string().guid(),
    playbook_id: z.string().guid(),
    type: z.string().min(1),
    recommended_action: z.string().min(1),
    draft_message: z.string().optional(),
      });

const eventSchema = z.object({
  customer_id: z.string().guid(),
  event_type: z.enum([
    "login",
    "usage_decline",
    "login_inactivity",
    "payment_failed",
    "negative_support",
    "negative_feedback",
    "customer_reply",
    "successful_payment",
    "usage_recovered",
  ]),
  source: z.string().min(1),
  event_value: z.unknown().optional(),
  description: z.string().optional(),
  occurred_at: z.string().datetime(),
});

const executionResultSchema = z.object({
  status: z.enum(["sent", "failed"]),
  error: z.string().optional(),
});

const outcomeSchema = z.object({
  outcome: z.enum(["recovered", "not_recovered"]),
}).strict();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const supabase = createSupabaseClient(env);

    try {
      if (request.method === "GET" && url.pathname === "/api/analytics") {
        return json({ data: await getAnalytics(supabase) });
      }

      const outcomeMatch = url.pathname.match(
        /^\/api\/interventions\/([0-9a-f-]+)\/outcome$/i
      );

      if (request.method === "POST" && outcomeMatch) {
        const result = outcomeSchema.safeParse(await request.json().catch(() => null));
        if (!result.success) {
          return json({ error: "Invalid outcome payload", details: result.error.flatten() }, 400);
        }

        const interventionId = outcomeMatch[1];
        const { data: existing, error: existingError } = await supabase
          .from("interventions")
          .select("id, status, outcome")
          .eq("id", interventionId)
          .maybeSingle();

        if (existingError) return json({ error: existingError.message }, 500);
        if (!existing) return json({ error: "Intervention not found" }, 404);
        if (existing.status !== "sent") {
          return json({ error: "Only sent interventions can have a recovery outcome recorded" }, 409);
        }
        if (existing.outcome !== null && existing.outcome !== "pending") {
          return json({ error: "This intervention outcome is already resolved" }, 409);
        }

        // Recheck eligibility in the same write that records both fields.
        // A concurrent resolution must never overwrite the first decision.
        const { data, error } = await supabase
          .from("interventions")
          .update({
            outcome: result.data.outcome,
            outcome_recorded_at: new Date().toISOString(),
          })
          .eq("id", interventionId)
          .eq("status", "sent")
          .or("outcome.is.null,outcome.eq.pending")
          .select()
          .maybeSingle();

        if (error) return json({ error: error.message }, 500);
        if (!data) return json({ error: "Intervention changed or its outcome was already resolved" }, 409);
        return json({ data });
      }

      // HEALTH
      if (
        request.method === "GET" &&
        url.pathname === "/api/health"
      ) {
        return json({
          status: "ok",
          service: "revenue-recovery-api",
        });
      }

      // ALL CUSTOMERS
      if (
        request.method === "GET" &&
        url.pathname === "/api/customers"
      ) {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .order("company");

        if (error) {
          return json({ error: error.message }, 500);
        }

        return json({ data });
      }

      // CUSTOMER EVENTS
      const eventsMatch = url.pathname.match(
        /^\/api\/customers\/([0-9a-f-]+)\/events$/i
      );

      if (request.method === "GET" && eventsMatch) {
        const customerId = eventsMatch[1];

        const { data, error } = await supabase
          .from("customer_events")
          .select("*")
          .eq("customer_id", customerId)
          .order("occurred_at", { ascending: false });

        if (error) {
          return json({ error: error.message }, 500);
        }

        return json({ data });
      }


      // SINGLE CUSTOMER
      const customerMatch = url.pathname.match(
        /^\/api\/customers\/([0-9a-f-]+)$/i
      );

      if (request.method === "GET" && customerMatch) {
        const customerId = customerMatch[1];

        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customerId)
          .maybeSingle();

        if (error) {
          return json({ error: error.message }, 500);
        }

        if (!data) {
          return json(
            { error: "Customer not found" },
            404
          );
        }

        return json({ data });
      }

	const recalculateMatch = url.pathname.match(
  		/^\/api\/customers\/([0-9a-f-]+)\/risk\/recalculate$/i
);

	if (request.method === "POST" && recalculateMatch) {
  		const customerId = recalculateMatch[1];

  		const { data: events, error: eventsError } = await supabase
    		.from("customer_events")
    		.select("*")
    		.eq("customer_id", customerId)
    		.order("occurred_at", { ascending: true });

 	if (eventsError) {
    	return json({ error: eventsError.message }, 500);
  }

  		const result = calculateRiskFromEvents(
    		customerId,
    		events ?? []
  );

 		const { error: clearSignalsError } = await supabase
    		.from("risk_signals")
    		.delete()
    		.eq("customer_id", customerId);

  	if (clearSignalsError) {
    	return json({ error: clearSignalsError.message }, 500);
  }

  	if (result.signals.length > 0) {
    	const { error: signalsError } = await supabase
      	.from("risk_signals")
      	.insert(result.signals);

    if (signalsError) {
      return json({ error: signalsError.message }, 500);
    }
  }

  		const { data: riskScore, error: scoreError } = await supabase
    		.from("risk_scores")
    		.insert({
     			customer_id: customerId,
      			score: result.score,
      	risk_level: result.riskLevel,
    		})
    		.select()
    		.single();

  	if (scoreError) {
    	return json({ error: scoreError.message }, 500);
  }

  		return json({
    		data: {
      		score: riskScore,
      		signals: result.signals,
    },
  });
}
      // CREATE CUSTOMER EVENT
      if (
        request.method === "POST" &&
        url.pathname === "/api/events"
      ) {
        const body = await request.json();
        const result = eventSchema.safeParse(body);

        if (!result.success) {
          return json(
            {
              error: "Invalid event payload",
              details: result.error.flatten(),
            },
            400
          );
        }

        const event = result.data;

        const { data, error } = await supabase
          .from("customer_events")
          .insert({
            customer_id: event.customer_id,
            event_type: event.event_type,
            source: event.source,
            event_value:
              (event.event_value as Json | undefined) ?? null,
            description: event.description ?? null,
            occurred_at: event.occurred_at,
          })
          .select()
          .single();

        if (error) {
          return json({ error: error.message }, 500);
        }

        return json({ data }, 201);
      }
    
      const riskMatch = url.pathname.match(
        /^\/api\/customers\/([0-9a-f-]+)\/risk$/i
);

      if (request.method === "GET" && riskMatch) {
        const customerId = riskMatch[1];

        const { data, error } = await supabase
          .from("risk_scores")
          .select("*")
          .eq("customer_id", customerId)
          .order("calculated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (error) {
        return json({ error: error.message }, 500);
      }
      return json({ data });
    }

    const signalsMatch = url.pathname.match(
  /^\/api\/customers\/([0-9a-f-]+)\/signals$/i
);

      if (request.method === "GET" && signalsMatch) {
        const customerId = signalsMatch[1];

        const { data, error } = await supabase
          .from("risk_signals")
          .select("*")
          .eq("customer_id", customerId)
          .eq("active", true)
          .order("weight", { ascending: false });

        if (error) {
          return json({ error: error.message }, 500);
        }

        return json({ data });
      }

      if (
        request.method === "GET" &&
        url.pathname === "/api/interventions"
      ) {
        const { data, error } = await supabase
          .from("interventions")
          .select(`
            *,
            customers (
              full_name,
              company,
              account_value,
              owner
            ),
            recovery_playbooks (
              name,
              requires_approval,
              action_type
            )
          `)
          .order("created_at", { ascending: false });

        if (error) {
          return json({ error: error.message }, 500);
        }
        
      return json({ data });
}
    if (
      request.method === "POST" &&
      url.pathname === "/api/interventions"
    ) {
      const body = await request.json();
      const result = interventionSchema.safeParse(body);

      if (!result.success) {
        return json(
          {
            error: "Invalid intervention payload",
            details: result.error.flatten(),
          },
          400
        );
      }

    const intervention = result.data;

      const { data: existingPending, error: existingPendingError } =
        await supabase
        .from("interventions")
        .select("id")
        .eq("customer_id", intervention.customer_id)
        .eq("playbook_id", intervention.playbook_id)
        .eq("status", "pending_approval")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingPendingError) {
        return json({ error: existingPendingError.message }, 500);
      }

      if (existingPending) {
        return json(
          {
            error:
              "A pending intervention already exists for this customer and playbook",
          },
          409
        );
  }

    const { data, error } = await supabase
        .from("interventions")
        .insert({
          customer_id: intervention.customer_id,
          playbook_id: intervention.playbook_id,
          type: intervention.type,
          status: "pending_approval",
          recommended_action: intervention.recommended_action,
          draft_message: intervention.draft_message ?? null,
        })
        .select()
        .single();

      if (error) {
        return json({ error: error.message }, 500);
      }

      return json({ data }, 201);
    }

    const approveMatch = url.pathname.match(
      /^\/api\/interventions\/([0-9a-f-]+)\/approve$/i
);

    if (request.method === "POST" && approveMatch) {
      const interventionId = approveMatch[1];

      const { data: existing, error: existingError } = await supabase
        .from("interventions")
        .select("*")
        .eq("id", interventionId)
        .maybeSingle();

      if (existingError) {
        return json({ error: existingError.message }, 500);
      }

      if (!existing) {
        return json({ error: "Intervention not found" }, 404);
      }

      if (existing.status !== "pending_approval") {
        return json(
          { error: "Only pending interventions can be approved" },
          409
        );
      }

      const { data, error } = await supabase
        .from("interventions")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", interventionId)
        .select()
        .single();

      if (error) {
        return json({ error: error.message }, 500);
      }

      return json({ data });
    }

    const rejectMatch = url.pathname.match(
      /^\/api\/interventions\/([0-9a-f-]+)\/reject$/i
);

    if (request.method === "POST" && rejectMatch) {
      const interventionId = rejectMatch[1];

      const { data: existing, error: existingError } = await supabase
        .from("interventions")
        .select("*")
        .eq("id", interventionId)
        .maybeSingle();

      if (existingError) {
        return json({ error: existingError.message }, 500);
      }

      if (!existing) {
        return json({ error: "Intervention not found" }, 404);
      }

      if (existing.status !== "pending_approval") {
        return json(
          { error: "Only pending interventions can be rejected" },
          409
        );
      }

      const { data, error } = await supabase
        .from("interventions")
        .update({
          status: "rejected",
        })
        .eq("id", interventionId)
        .select()
        .single();

      if (error) {
        return json({ error: error.message }, 500);
      }

      return json({ data });
    }

    const aiAssistanceMatch = url.pathname.match(
      /^\/api\/customers\/([0-9a-f-]+)\/ai-assistance$/i
);

    if (request.method === "POST" && aiAssistanceMatch) {
      const customerId = aiAssistanceMatch[1];

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .maybeSingle();

      if (customerError) {
        return json({ error: customerError.message }, 500);
      }

      if (!customer) {
        return json({ error: "Customer not found" }, 404);
      }

      const { data: risk, error: riskError } = await supabase
        .from("risk_scores")
        .select("*")
        .eq("customer_id", customerId)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (riskError) {
        return json({ error: riskError.message }, 500);
      }

      const { data: signals, error: signalsError } = await supabase
        .from("risk_signals")
        .select("*")
        .eq("customer_id", customerId)
        .eq("active", true)
        .order("weight", { ascending: false });

      if (signalsError) {
        return json({ error: signalsError.message }, 500);
      }

      const { data: events, error: eventsError } = await supabase
        .from("customer_events")
        .select("*")
        .eq("customer_id", customerId)
        .order("occurred_at", { ascending: false })
        .limit(10);

      if (eventsError) {
        return json({ error: eventsError.message }, 500);
      }

      const result = await generateAiAssistance(
        {
          customer_name: customer.full_name,
          company: customer.company,
          account_value: customer.account_value,
          owner: customer.owner,
          risk_score: risk?.score ?? null,
          risk_level: risk?.risk_level ?? null,

          signals: (signals ?? []).map((signal) => ({
            signal_type: signal.signal_type,
            weight: signal.weight,
            explanation: signal.explanation,
          })),

          recent_events: (events ?? []).map((event) => ({
            event_type: event.event_type,
            description: event.description,
            occurred_at: event.occurred_at,
          })),
        },
        env.OPENROUTER_API_KEY
      );

      return json({
        data: result.data,
        provider: result.provider,
      });
}

    const executeMatch = url.pathname.match(
      /^\/api\/interventions\/([0-9a-f-]+)\/execute$/i
    );

    if (request.method === "POST" && executeMatch) {
      const interventionId = executeMatch[1];

      if (!env.N8N_INTERVENTION_WEBHOOK_URL) {
        return json(
          { error: "n8n execution webhook is not configured" },
          503
        );
      }

      const { data: intervention, error: interventionError } =
        await supabase
          .from("interventions")
          .select(`
            *,
            customers (
              full_name,
              email,
              company,
              account_value,
              owner
            ),
            recovery_playbooks (
              name,
              action_type
            )
          `)
          .eq("id", interventionId)
          .maybeSingle();

      if (interventionError) {
        return json({ error: interventionError.message }, 500);
      }

      if (!intervention) {
        return json({ error: "Intervention not found" }, 404);
      }

      if (
        intervention.status !== "approved" &&
        intervention.status !== "failed"
      ) {
        return json(
          {
            error:
              "Only approved or failed interventions can be executed",
          },
          409
        );
      }

      const nextAttempt =
        (intervention.execution_attempts ?? 0) + 1;

      const { error: updateError } = await supabase
        .from("interventions")
        .update({
          status: "executing",
          execution_attempts: nextAttempt,
          execution_error: null,
          last_execution_at: new Date().toISOString(),
        })
        .eq("id", interventionId);

      if (updateError) {
        return json({ error: updateError.message }, 500);
      }

      try {
        const n8nResponse = await fetch(
          env.N8N_INTERVENTION_WEBHOOK_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              intervention_id: intervention.id,
              customer: intervention.customers,
              playbook: intervention.recovery_playbooks,
              type: intervention.type,
              recommended_action:
                intervention.recommended_action,
              draft_message: intervention.draft_message,
              attempt: nextAttempt,
            }),
          }
        );

        if (!n8nResponse.ok) {
          throw new Error(
            `n8n webhook returned ${n8nResponse.status}`
          );
        }

        return json(
          {
            data: {
              intervention_id: interventionId,
              status: "executing",
              attempt: nextAttempt,
            },
          },
          202
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown execution error";

        await supabase
          .from("interventions")
          .update({
            status: "failed",
            execution_error: message,
          })
          .eq("id", interventionId);

        return json(
          {
            error: "Failed to start automation",
            details: message,
          },
          502
        );
      }
    }

    const executionResultMatch = url.pathname.match(
      /^\/api\/interventions\/([0-9a-f-]+)\/execution-result$/i
    );

    if (
      request.method === "POST" &&
      executionResultMatch
    ) {
      const interventionId = executionResultMatch[1];

      const body = await request.json();
      const result = executionResultSchema.safeParse(body);

      if (!result.success) {
        return json(
          {
            error: "Invalid execution result",
            details: result.error.flatten(),
          },
          400
        );
      }

      const { data: existing, error: existingError } =
        await supabase
          .from("interventions")
          .select("id, status")
          .eq("id", interventionId)
          .maybeSingle();

      if (existingError) {
        return json({ error: existingError.message }, 500);
      }

      if (!existing) {
        return json({ error: "Intervention not found" }, 404);
      }

      const { data, error } = await supabase
        .from("interventions")
        .update({
          status: result.data.status,
          executed_at:
            result.data.status === "sent"
              ? new Date().toISOString()
              : null,
          execution_error:
            result.data.status === "failed"
              ? result.data.error ??
                "Automation execution failed"
              : null,
        })
        .eq("id", interventionId)
        .select()
        .single();

      if (error) {
        return json({ error: error.message }, 500);
      }

      return json({ data });
    }

      return json({ error: "Not Found" }, 404);
    } catch (error) {
      console.error(error);

      return json(
        {
          error: "Internal Server Error",
        },
        500
      );
    }
  },
};
