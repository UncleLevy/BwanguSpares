import { base44 } from "@/api/base44Client";

/**
 * Record an audit log entry.
 * @param {object} user   - Current user object from base44.auth.me()
 * @param {string} action - AuditLog action enum value
 * @param {object} meta   - { entity_type, entity_id, entity_label, details }
 */
export async function logAudit(user, action, meta = {}) {
  try {
    await base44.entities.AuditLog.create({
      actor_email: user?.email || "unknown",
      actor_name: user?.full_name || "",
      actor_role: user?.role || "",
      action,
      entity_type: meta.entity_type || "",
      entity_id: meta.entity_id || "",
      entity_label: meta.entity_label || "",
      details: meta.details || "",
    });
  } catch (e) {
    console.warn("Audit log failed:", e);
  }
}