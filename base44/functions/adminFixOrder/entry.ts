import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { orderId, updates } = await req.json();

    if (!orderId || !updates) {
      return Response.json({ error: 'orderId and updates are required' }, { status: 400 });
    }

    // Use service role to bypass RLS entirely
    const order = await base44.asServiceRole.entities.Order.update(orderId, updates);
    return Response.json({ success: true, order });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});