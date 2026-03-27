import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Allow scheduled automations (no user session) OR admin-triggered
    // Only block if there's a real non-admin user making a manual call
    try {
      const user = await base44.auth.me();
      if (user?.email && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      // No session = scheduled automation, allow through
    }

    // Find all orders with delivery_confirmed status
    const orders = await base44.asServiceRole.entities.Order.filter(
      { payout_status: 'delivery_confirmed' },
      '-delivery_confirmed_at',
      1000
    );

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let processed = 0;

    for (const order of orders) {
      const confirmedDate = new Date(order.delivery_confirmed_at);
      
      if (confirmedDate <= sevenDaysAgo) {
        // Create automatic payout
        const payout = await base44.asServiceRole.entities.Payout.create({
          shop_id: order.shop_id,
          shop_name: order.shop_name,
          owner_email: order.shop_id,
          amount: order.total_amount,
          method: 'bank_transfer',
          status: 'completed',
          processed_by: 'system',
          processed_at: new Date().toISOString()
        });

        // Update order
        await base44.asServiceRole.entities.Order.update(order.id, {
          payout_status: 'payout_completed',
          payout_id: payout.id
        });

        processed++;
      }
    }

    return Response.json({ 
      success: true,
      processed_count: processed,
      message: `Auto-payout triggered for ${processed} orders.`
    });
  } catch (error) {
    console.error('Auto-payout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});