import { z } from "zod";
import type { Json } from "./types/database";
import {
  createSupabaseClient,
  type Env,
} from "./lib/supabase";
import { calculateRiskFromEvents } from "./services/risk-engine";

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

const eventSchema = z.object({
  customer_id: z.string().uuid(),
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