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
  createdAt: string
  updatedAt: string
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
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}
