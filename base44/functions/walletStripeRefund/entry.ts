// Stripe has been removed. This function is deprecated.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  return Response.json({ error: 'Stripe refunds are no longer available. Please contact support for manual refunds.' }, { status: 410 });
});