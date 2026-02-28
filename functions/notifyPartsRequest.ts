import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || event.entity_name !== 'PartsRequest') {
      return Response.json({ ok: true });
    }

    const partsRequest = data;

    // Get all standard and premium shops for the region
    const shops = await base44.entities.Shop.filter({
      region_id: partsRequest.buyer_region,
      status: 'approved'
    });

    // Filter for standard and premium shops only
    const eligibleShops = shops.filter(s => ['standard', 'premium'].includes(s.slot_type));

    // Create notifications for each eligible shop
    const notifications = eligibleShops.map(shop => ({
      user_email: shop.owner_email,
      type: 'system_alert',
      title: 'New Parts Request',
      message: `${partsRequest.buyer_name} is looking for ${partsRequest.part_name} - Budget: K${partsRequest.budget || 'Not specified'}`,
      related_id: partsRequest.id,
      action_url: '/shop-dashboard?view=parts-requests'
    }));

    // Batch create notifications
    if (notifications.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
    }

    return Response.json({ 
      ok: true, 
      notified_shops: notifications.length 
    });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});