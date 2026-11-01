import type { SupabaseClient } from '@supabase/supabase-js'

export type AuditEntry = {
  action: string
  entity_type: string
  entity_id?: string | null
  reason?: string | null
  details?: Record<string, unknown>
}

/**
 * Records an administrative action in admin_audit_logs.
 * Never throws — audit failures must not break the admin operation,
 * but they are surfaced in server logs.
 */
export async function logAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  entry: AuditEntry
): Promise<void> {
  const { error } = await supabase.from('admin_audit_logs').insert({
    admin_id: adminId,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id ?? null,
    reason: entry.reason ?? null,
    details: entry.details ?? {},
  })
  if (error) {
    console.error('[admin-audit] failed to write audit log:', error.message)
  }
}
