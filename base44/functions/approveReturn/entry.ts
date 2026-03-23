import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'shop_owner' && user.role !== 'admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { returnId, approvalNotes = '' } = await req.json();

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
      status: 'approved',
      approval_notes: approvalNotes
    });

    // Notify buyer
    await base44.asServiceRole.entities.Notification.create({
      user_email: returnRequest.buyer_email,
      type: 'order_update',
      title: 'Return Approved',
      message: `Your return for ${returnRequest.product_name} has been approved. Refund will be processed.`,
      related_id: returnId
    });

    return Response.json({ 
      success: true,
      message: 'Return approved. You can now process the refund.'
    });
  } catch (error) {
    console.error('Return approval error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});