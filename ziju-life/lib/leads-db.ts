import { sql } from './database'

export type LeadStatus = 'novy' | 'kontaktovan' | 'rezervovano' | 'odmitnuto'

export interface LeadInput {
  email: string
  name?: string
  source?: string
  message?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export interface Lead {
  id: string
  email: string
  name: string | null
  source: string
  status: LeadStatus
  message: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  clickupTaskId: string | null
  createdAt: string
  updatedAt: string
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const rows = await sql`
    SELECT id, email, name, source, status, message,
           utm_source, utm_medium, utm_campaign, clickup_task_id,
           created_at, updated_at
    FROM leads
    WHERE id = ${id}
    LIMIT 1
  ` as { id: string; email: string; name: string | null; source: string; status: string; message: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; clickup_task_id: string | null; created_at: Date; updated_at: Date }[]
  const r = rows[0]
  if (!r) return null
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    source: r.source,
    status: r.status as LeadStatus,
    message: r.message,
    utm_source: r.utm_source,
    utm_medium: r.utm_medium,
    utm_campaign: r.utm_campaign,
    clickupTaskId: r.clickup_task_id ?? null,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  }
}

export async function setLeadClickUpTaskId(leadId: string, taskId: string): Promise<void> {
  await sql`
    UPDATE leads SET clickup_task_id = ${taskId}, updated_at = NOW() WHERE id = ${leadId}
  `
}

export async function addLead(input: LeadInput): Promise<Lead> {
  const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const now = new Date()

  await sql`
    INSERT INTO leads (
      id, email, name, source, status, message,
      utm_source, utm_medium, utm_campaign, created_at, updated_at
    ) VALUES (
      ${id},
      ${input.email.trim().toLowerCase()},
      ${input.name?.trim() || null},
      ${input.source || 'koucing'},
      'novy',
      ${input.message?.trim() || null},
      ${input.utm_source || null},
      ${input.utm_medium || null},
      ${input.utm_campaign || null},
      ${now},
      ${now}
    )
  `

  return {
    id,
    email: input.email.trim().toLowerCase(),
    name: input.name?.trim() || null,
    source: input.source || 'koucing',
    status: 'novy',
    message: input.message?.trim() || null,
    utm_source: input.utm_source || null,
    utm_medium: input.utm_medium || null,
    utm_campaign: input.utm_campaign || null,
    clickupTaskId: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}
