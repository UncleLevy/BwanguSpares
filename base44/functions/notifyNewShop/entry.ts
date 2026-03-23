import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type === 'create') {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      
      await Promise.all(
        admins.map(admin =>
          base44.asServiceRole.entities.Notification.create({
            user_email: admin.email,
            type: 'shop_registration',
            title: 'New Shop Registration',
            message: `${data.name} has registered and is awaiting approval`,
            related_id: data.id,
            action_url: '/AdminDashboard',
          })
        )
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});