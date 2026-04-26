import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { orderId, updates } = await req.json();

    // Use filter to find the order first, then update
    const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });
    if (!orders || orders.length === 0) {
      return Response.json({ error: 'Order not found: ' + orderId }, { status: 404 });
    }

    const order = await base44.asServiceRole.entities.Order.update(orderId, updates);
    return Response.json({ success: true, order });
  } catch (error) {
    console.error('Error:', JSON.stringify(error));
    return Response.json({ error: error.message, detail: error.toString() }, { status: 500 });
  }
});