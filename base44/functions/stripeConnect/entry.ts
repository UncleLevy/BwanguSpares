// Stripe Connect has been removed.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  return Response.json({ error: 'Stripe Connect is no longer available.' }, { status: 410 });
});