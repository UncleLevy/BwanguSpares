import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BRAND_GRADIENT = "linear-gradient(135deg, #1a3fa8 0%, #0891b2 100%)";
const BRAND_LOGO = "https://media.base44.com/images/public/699f775333a30acfe3b73c4e/097f0a26f_DynamicBlueSwooshwithCohesiveTypography9.jpg";
const APP_URL = "https://bwanguspares.com";

const emailTemplate = ({ title, badgeText, badgeColor, content, ctaText }) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} – BwanguSpares</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
  <tr><td align="center">
    <table width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,63,168,0.10);">
      <tr><td style="background:${BRAND_GRADIENT};padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><img src="${BRAND_LOGO}" alt="BwanguSpares" width="40" height="40" style="border-radius:10px;vertical-align:middle;margin-right:10px;display:inline-block;"/><span style="color:#fff;font-size:20px;font-weight:700;vertical-align:middle;">Bwangu<span style="color:#7dd3fc;">Spares</span></span></td>
          <td align="right" style="color:rgba(255,255,255,0.75);font-size:12px;">Zambia's Auto Spares Marketplace</td>
        </tr></table>
      </td></tr>
      <tr><td style="background:${badgeColor}18;border-bottom:3px solid ${badgeColor};padding:20px 32px 16px;">
        <span style="display:inline-block;background:${badgeColor};color:#fff;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:4px 12px;border-radius:20px;">${badgeText}</span>
        <h1 style="margin:10px 0 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${title}</h1>
      </td></tr>
      <tr><td style="padding:28px 32px;color:#374151;font-size:14px;line-height:1.7;">${content}</td></tr>
      <tr><td align="center" style="padding:0 32px 28px;"><a href="${APP_URL}" style="display:inline-block;background:${BRAND_GRADIENT};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 32px;border-radius:10px;">${ctaText || "View My Appointments"}</a></td></tr>
      <tr><td style="height:1px;background:#e2e8f0;"></td></tr>
      <tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;">BwanguSpares — Zambia's Auto Spares Marketplace</p>
        <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;">Flat 15C Kalewa Complex, Ndola · <a href="mailto:admin@bwangu.com" style="color:#0891b2;text-decoration:none;">admin@bwangu.com</a> · +260 763 109 823</p>
        <p style="margin:0;font-size:11px;color:#cbd5e1;">© 2026 BwanguSpares. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

const infoRow = (label, value) => `
  <tr>
    <td style="padding:8px 16px;font-size:13px;color:#64748b;width:40%;">${label}</td>
    <td style="padding:8px 16px;font-size:13px;color:#0f172a;font-weight:600;">${value}</td>
  </tr>
  <tr><td colspan="2" style="height:1px;background:#e2e8f0;padding:0;"></td></tr>`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Fetch all pending/confirmed upcoming appointments
    const appointments = await base44.asServiceRole.entities.Appointment.filter({ status: "confirmed" });

    let sent = 0;
    let skipped = 0;

    for (const appt of appointments) {
      const apptDate = new Date(appt.scheduled_date || appt.appointment_date);
      if (isNaN(apptDate.getTime())) { skipped++; continue; }

      const hoursUntil = (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Send reminder if appointment is 23–25h away (24h reminder) or 1–2h away (same-day)
      const is24hWindow = hoursUntil >= 23 && hoursUntil <= 25;
      const is2hWindow = hoursUntil >= 1 && hoursUntil <= 2;

      if (!is24hWindow && !is2hWindow) { skipped++; continue; }
      if (!appt.buyer_email) { skipped++; continue; }

      const formattedDate = apptDate.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      const formattedTime = apptDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const isToday = hoursUntil <= 24;

      const rows = [
        infoRow("&#128295; Service", appt.service_type?.replace(/_/g, ' ') || appt.problem_type?.replace(/_/g, ' ') || "Technician Appointment"),
        infoRow("&#127981; Shop", appt.shop_name || "—"),
        infoRow("&#128205; Location", appt.location || appt.delivery_address || "At shop"),
        ...(appt.technician_name ? [infoRow("&#128736;&#65039; Technician", appt.technician_name)] : []),
        ...(appt.notes ? [infoRow("&#128221; Notes", appt.notes)] : []),
      ].join('');

      const urgencyBox = isToday
        ? `<div style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;padding:14px;margin:16px 0;"><p style="margin:0;font-size:13px;color:#166534;font-weight:600;">&#9989; Your appointment is in about ${Math.round(hoursUntil)} hour(s). Please get ready!</p></div>`
        : `<div style="background:#eff6ff;border-radius:10px;border:1px solid #bfdbfe;padding:14px;margin:16px 0;"><p style="margin:0;font-size:13px;color:#1e40af;">&#128337; Your appointment is <strong>tomorrow</strong>. Please plan accordingly.</p></div>`;

      const content = `
        <p style="margin:0 0 16px;">Hi <strong>${appt.buyer_name || "there"}</strong>,</p>
        <p style="margin:0 0 16px;">This is a friendly reminder about your upcoming appointment${isToday ? " <strong>today</strong>" : " <strong>tomorrow</strong>"}.</p>

        <div style="background:${BRAND_GRADIENT};border-radius:14px;padding:24px;text-align:center;margin:20px 0;">
          <div style="font-size:40px;margin-bottom:8px;">&#128197;</div>
          <p style="margin:0;color:rgba(255,255,255,0.85);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your Appointment</p>
          <p style="margin:8px 0 4px;color:#fff;font-size:20px;font-weight:800;">${formattedDate}</p>
          <p style="margin:0;color:#7dd3fc;font-size:16px;font-weight:600;">at ${formattedTime}</p>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;border-left:4px solid ${isToday ? '#059669' : '#1a3fa8'};margin:18px 0;overflow:hidden;">
          ${rows}
        </table>

        ${urgencyBox}
        <p style="font-size:13px;color:#64748b;margin:12px 0 0;">Need to reschedule? Contact the shop directly or email us at <a href="mailto:admin@bwangu.com" style="color:#0891b2;">admin@bwangu.com</a>.</p>
      `;

      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: "BwanguSpares",
        to: appt.buyer_email,
        subject: `${isToday ? "⏰ Today:" : "📅 Tomorrow:"} Appointment at ${appt.shop_name || "BwanguSpares"} – ${formattedTime}`,
        body: emailTemplate({
          title: isToday ? "Your Appointment is Today!" : "Appointment Tomorrow",
          badgeText: "Appointment Reminder",
          badgeColor: isToday ? "#059669" : "#1a3fa8",
          content,
          ctaText: "View My Appointments",
        }),
      });

      console.log(`Reminder sent to ${appt.buyer_email} for appt ${appt.id} (${Math.round(hoursUntil)}h away)`);
      sent++;
    }

    console.log(`Appointment reminders: ${sent} sent, ${skipped} skipped`);
    return Response.json({ success: true, sent, skipped });

  } catch (error) {
    console.error("sendAppointmentReminders error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});