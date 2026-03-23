import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type === 'create' && data.shop_id) {
      const shops = await base44.asServiceRole.entities.Shop.filter({ id: data.shop_id });
      if (shops.length > 0) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: shops[0].owner_email,
          type: 'new_review',
          title: 'New Review Received',
          message: `${data.reviewer_name} left a ${data.rating}-star review`,
          related_id: data.id,
          action_url: '/ShopDashboard',
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});