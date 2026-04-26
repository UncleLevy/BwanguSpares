import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { order_id, updates } = await req.json();

    const order = await base44.asServiceRole.entities.Order.update(order_id, updates);

    return Response.json({ success: true, order });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});