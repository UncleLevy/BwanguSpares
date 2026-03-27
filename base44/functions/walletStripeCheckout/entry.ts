// Stripe has been removed. This function is deprecated.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  return Response.json({ error: 'Stripe checkout is no longer available.' }, { status: 410 });
});