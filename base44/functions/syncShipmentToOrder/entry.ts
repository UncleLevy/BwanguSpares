import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Only process status updates
    if (event.type !== 'update' || !data.order_id) {
      return Response.json({ success: true, skipped: true });
    }

    // Check if shipment status changed to delivered
    if (old_data?.status !== 'delivered' && data.status === 'delivered') {
      // Update the associated order to delivered
      await base44.asServiceRole.entities.Order.update(data.order_id, {
        status: 'delivered',
        current_location: data.delivery_address || 'Delivered',
        estimated_delivery: data.actual_delivery_date || new Date().toISOString().split('T')[0]
      });

      console.log(`✓ Order ${data.order_id} marked as delivered via shipment ${data.tracking_number}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Shipment sync error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});