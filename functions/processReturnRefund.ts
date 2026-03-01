import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { returnId } = await req.json();

    // Get return request
    const returnRequest = await base44.asServiceRole.entities.Return.get(returnId);
    if (!returnRequest) {
      return Response.json({ error: 'Return request not found' }, { status: 404 });
    }

    if (returnRequest.status !== 'approved') {
      return Response.json({ error: 'Return must be approved first' }, { status: 400 });
    }

    // Get or create buyer wallet
    let wallet = (await base44.asServiceRole.entities.BuyerWallet.filter({ 
      buyer_email: returnRequest.buyer_email 
    }))[0];

    if (!wallet) {
      wallet = await base44.asServiceRole.entities.BuyerWallet.create({
        buyer_email: returnRequest.buyer_email,
        buyer_name: returnRequest.buyer_name,
        balance: returnRequest.refund_amount,
        total_credited: returnRequest.refund_amount
      });
    } else {
      await base44.asServiceRole.entities.BuyerWallet.update(wallet.id, {
        balance: (wallet.balance || 0) + returnRequest.refund_amount,
        total_credited: (wallet.total_credited || 0) + returnRequest.refund_amount
      });
    }

    // Create wallet transaction
    const transaction = await base44.asServiceRole.entities.WalletTransaction.create({
      buyer_email: returnRequest.buyer_email,
      type: 'credit',
      amount: returnRequest.refund_amount,
      reason: `Refund for returned ${returnRequest.product_name}`,
      order_id: returnRequest.order_id,
      shop_name: returnRequest.shop_name
    });

    // Update return status
    await base44.asServiceRole.entities.Return.update(returnId, {
      status: 'refunded',
      refund_id: transaction.id
    });

    // Notify buyer
    await base44.asServiceRole.entities.Notification.create({
      user_email: returnRequest.buyer_email,
      type: 'order_update',
      title: 'Refund Processed',
      message: `ZMW ${returnRequest.refund_amount} has been credited to your wallet for the returned ${returnRequest.product_name}`,
      related_id: returnId
    });

    return Response.json({ 
      success: true,
      walletId: wallet.id,
      transactionId: transaction.id,
      message: `Refund of ZMW ${returnRequest.refund_amount} processed to buyer's wallet.`
    });
  } catch (error) {
    console.error('Return refund error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});