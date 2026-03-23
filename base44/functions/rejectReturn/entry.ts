import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'shop_owner' && user.role !== 'admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { returnId, reason = '' } = await req.json();

    // Get return request
    const returnRequest = await base44.asServiceRole.entities.Return.get(returnId);
    if (!returnRequest) {
      return Response.json({ error: 'Return request not found' }, { status: 404 });
    }

    if (returnRequest.status !== 'pending') {
      return Response.json({ error: 'Return already processed' }, { status: 400 });
    }

    // Update return status
    await base44.asServiceRole.entities.Return.update(returnId, {
      status: 'rejected',
      approval_notes: reason
    });

    // Notify buyer
    await base44.asServiceRole.entities.Notification.create({
      user_email: returnRequest.buyer_email,
      type: 'order_update',
      title: 'Return Request Rejected',
      message: `Your return request for ${returnRequest.product_name} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
      related_id: returnId
    });

    return Response.json({ 
      success: true,
      message: 'Return request rejected.'
    });
  } catch (error) {
    console.error('Return rejection error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});