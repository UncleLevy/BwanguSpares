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
    const allShops = await base44.entities.Shop.filter(
      { status: 'approved' },
      null,
      1000
    );

    // Filter for shops in same region with standard or premium tier
    const eligibleShops = allShops.filter(s => 
      ['standard', 'premium'].includes(s.slot_type) && 
      s.region_name === partsRequest.buyer_region
    );

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