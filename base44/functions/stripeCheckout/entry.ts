// Stripe has been removed. This function is deprecated.
// Card payments are handled by ngeniusCheckout.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  return Response.json({ error: 'Stripe checkout is no longer available. Please use the N-Genius or MTN MoMo payment options.' }, { status: 410 });
});