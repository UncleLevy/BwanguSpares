// Stripe auto-payout has been removed.
// Manual payouts are handled via the Admin Payouts panel.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  return Response.json({ message: 'Auto Stripe payouts have been disabled. Use the Admin Payouts panel for manual payouts.' }, { status: 200 });
});