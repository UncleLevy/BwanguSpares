import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Only trigger on order status change to 'confirmed' or 'processing'
    if (event.type === 'update' && data.shipping_option === 'deliver' && 
        (data.status === 'confirmed' || data.status === 'processing') && 
        old_data?.status !== data.status) {
      
      // Check if shipment already exists for this order
      const existingShipments = await base44.asServiceRole.entities.Shipment.filter({ 
        order_id: data.id 
      });
      
      if (existingShipments.length > 0) {
        console.log(`Shipment already exists for order ${data.id}`);
        return Response.json({ success: true, message: 'Shipment already exists' });
      }

      // Get shop details
      const shops = await base44.asServiceRole.entities.Shop.filter({ id: data.shop_id });
      const shop = shops[0];
      
      if (!shop) {
        console.error(`Shop not found for order ${data.id}`);
        return Response.json({ error: 'Shop not found' }, { status: 404 });
      }

      // Get delivery town details
      let deliveryTown = null;
      if (data.delivery_address) {
        const addressParts = data.delivery_address.split(',');
        const townName = addressParts[addressParts.length - 1]?.trim() || addressParts[0]?.trim();
        const towns = await base44.asServiceRole.entities.Town.filter({ name: townName });
        deliveryTown = towns[0];
      }

      // Determine if intercity based on shop town vs delivery town
      const isIntercity = shop.town && deliveryTown && shop.town !== deliveryTown.name;
      
      // Generate tracking number
      const trackingNumber = `BS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Calculate estimated delivery date (3-5 days for intercity, 1-2 for local)
      const daysToAdd = isIntercity ? 4 : 2;
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);

      // Create shipment record
      const shipment = await base44.asServiceRole.entities.Shipment.create({
        order_id: data.id,
        shop_id: data.shop_id,
        shop_name: data.shop_name || shop.name,
        shop_town: shop.town,
        shop_region: shop.region_name,
        buyer_email: data.buyer_email,
        buyer_name: data.buyer_name,
        buyer_phone: data.delivery_phone,
        delivery_address: data.delivery_address,
        delivery_town: deliveryTown?.name || '',
        delivery_region: deliveryTown?.region_name || '',
        is_intercity: isIntercity,
        requires_handoff: isIntercity,
        tracking_number: trackingNumber,
        status: 'pending',
        shipping_cost: data.shipping_cost || 0,
        estimated_delivery_date: estimatedDate.toISOString().split('T')[0],
        tracking_updates: [
          {
            timestamp: new Date().toISOString(),
            status: 'pending',
            location: shop.town || shop.region_name || 'Shop location',
            notes: 'Shipment created and awaiting courier assignment'
          }
        ]
      });

      // Update order with tracking number
      await base44.asServiceRole.entities.Order.update(data.id, {
        tracking_number: trackingNumber
      });

      // Notify buyer about shipment creation
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'BwanguSpares',
        to: data.buyer_email,
        subject: `📦 Your Order is Being Prepared for Shipment`,
        body: `
          <h2>Order Confirmed & Ready for Shipping</h2>
          <p>Hi ${data.buyer_name || 'there'},</p>
          <p>Great news! Your order from <strong>${data.shop_name}</strong> has been confirmed and is being prepared for shipment.</p>
          
          <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; border-left: 4px solid #0891b2; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-weight: 600; color: #1a1a1a;">📦 Shipment Details</p>
            <p style="margin: 6px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p style="margin: 6px 0;"><strong>Estimated Delivery:</strong> ${estimatedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <p style="margin: 6px 0;"><strong>Delivery Type:</strong> ${isIntercity ? '🚚 Intercity Delivery' : '🏪 Local Delivery'}</p>
            <p style="margin: 6px 0;"><strong>Delivery Address:</strong> ${data.delivery_address}</p>
          </div>
          
          ${isIntercity ? `
          <div style="background: #fef3c7; padding: 12px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">
              📍 <strong>Multi-Courier Delivery:</strong> Your package will be transported via intercity courier and then handed off to a local courier for final delivery.
            </p>
          </div>
          ` : ''}
          
          <p style="margin: 16px 0 0; font-size: 13px; color: #666;">
            You'll receive updates as your shipment progresses. Track it anytime from your Buyer Dashboard.
          </p>
        `
      }).catch(() => {});

      // Notify shop to assign courier
      if (shop.owner_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'BwanguSpares',
          to: shop.owner_email,
          subject: `📦 Action Required: Assign Courier for Order ${data.id.slice(0, 8)}`,
          body: `
            <h2>Courier Assignment Required</h2>
            <p>Hi ${shop.name} team,</p>
            <p>A shipment has been created for order and requires courier assignment.</p>
            
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #d97706; margin: 20px 0;">
              <p style="margin: 0 0 12px; font-weight: 600; color: #1a1a1a;">📦 Shipment Details</p>
              <p style="margin: 6px 0;"><strong>Tracking #:</strong> ${trackingNumber}</p>
              <p style="margin: 6px 0;"><strong>Customer:</strong> ${data.buyer_name}</p>
              <p style="margin: 6px 0;"><strong>Delivery:</strong> ${data.delivery_address}</p>
              <p style="margin: 6px 0;"><strong>Type:</strong> ${isIntercity ? 'Intercity (requires handoff)' : 'Local delivery'}</p>
            </div>
            
            <p style="margin: 16px 0; font-size: 14px;">
              <strong>⚠️ Action Required:</strong> Please assign a courier to this shipment in your Shop Dashboard → Shipping section.
            </p>
          `
        }).catch(() => {});
      }

      console.log(`Shipment ${shipment.id} created for order ${data.id}`);
      return Response.json({ success: true, shipment_id: shipment.id });
    }

    return Response.json({ success: true, message: 'No action needed' });
  } catch (error) {
    console.error('Error creating shipment:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});