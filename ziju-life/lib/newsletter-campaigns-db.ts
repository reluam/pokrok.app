import { sql } from './database'

export interface NewsletterSection {
  title: string
  description: string
}

export interface NewsletterCampaign {
  id: string
  subject: string
  sender: string
  body: string // HTML content
  scheduledAt: Date | null
  sentAt: Date | null
  status: 'draft' | 'scheduled' | 'sent'
  showOnBlog: boolean
  createdAt: Date
  updatedAt: Date
}

export interface NewsletterTemplate {
  subject: string
  sender: string
  body: string
}

// Ensure campaigns table exists
async function ensureCampaignsTable() {
  try {
    // First, check if we need to migrate from old structure
    const tableInfo = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'newsletter_campaigns' AND column_name = 'content'
    `
    
    // If content column exists, we need to migrate
    if (tableInfo.length > 0) {
      // Add sections column if it doesn't exist
      await sql`
        ALTER TABLE newsletter_campaigns 
        ADD COLUMN IF NOT EXISTS sections JSONB
      `
      
      // Migrate existing content to sections format
      await sql`
        UPDATE newsletter_campaigns
        SET sections = jsonb_build_array(
          jsonb_build_object('title', '', 'description', COALESCE(content, ''))
        )
        WHERE sections IS NULL AND content IS NOT NULL
      `
      
      // Set default for sections where it's still NULL
      await sql`
        UPDATE newsletter_campaigns
        SET sections = '[]'::jsonb
        WHERE sections IS NULL
      `
      
      // Make content column nullable (remove NOT NULL constraint)
      await sql`
        ALTER TABLE newsletter_campaigns 
        ALTER COLUMN content DROP NOT NULL
      `
      
      // Set default value for content column
      await sql`
        ALTER TABLE newsletter_campaigns 
        ALTER COLUMN content SET DEFAULT ''
      `
    }
    
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_campaigns (
        id VARCHAR(255) PRIMARY KEY,
        subject TEXT NOT NULL,
        sender TEXT DEFAULT 'Matěj Mauler <matej@mail.ziju.life>',
        body TEXT DEFAULT '',
        scheduled_at TIMESTAMP WITH TIME ZONE,
        sent_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
        show_on_blog BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Add sender column if table exists but column doesn't
    await sql`
      ALTER TABLE newsletter_campaigns 
      ADD COLUMN IF NOT EXISTS sender TEXT DEFAULT 'Matěj Mauler <matej@mail.ziju.life>'
    `
    
    // Add body column if table exists but column doesn't
    await sql`
      ALTER TABLE newsletter_campaigns 
      ADD COLUMN IF NOT EXISTS body TEXT DEFAULT ''
    `
    
    // Migrate from old structure (sections) to new structure (body)
    // Check if sections column exists and migrate data
    const sectionsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'newsletter_campaigns' AND column_name = 'sections'
    `
    
    if (sectionsCheck.length > 0) {
      // Migrate sections to body HTML
      await sql`
        UPDATE newsletter_campaigns
        SET body = COALESCE(
          (
            SELECT string_agg(
              CASE 
                WHEN section->>'title' != '' AND section->>'description' != '' 
                THEN '<h2>' || (section->>'title') || '</h2><p>' || (section->>'description') || '</p>'
                WHEN section->>'title' != '' 
                THEN '<h2>' || (section->>'title') || '</h2>'
                WHEN section->>'description' != '' 
                THEN '<p>' || (section->>'description') || '</p>'
                ELSE ''
              END,
              ''
            )
            FROM jsonb_array_elements(sections) AS section
          ),
          ''
        )
        WHERE body = '' OR body IS NULL
      `
    }
    
    // Add show_on_blog column if table exists but column doesn't
    await sql`
      ALTER TABLE newsletter_campaigns 
      ADD COLUMN IF NOT EXISTS show_on_blog BOOLEAN DEFAULT false
    `
    
    // Make sure sections is NOT NULL with default
    await sql`
      ALTER TABLE newsletter_campaigns 
      ALTER COLUMN sections SET DEFAULT '[]'::jsonb
    `
    
    await sql`
      UPDATE newsletter_campaigns
      SET sections = '[]'::jsonb
      WHERE sections IS NULL
    `
    
    // Try to make content nullable if it exists
    try {
      await sql`
        ALTER TABLE newsletter_campaigns 
        ALTER COLUMN content DROP NOT NULL
      `
    } catch (e) {
      // Column might not exist or constraint might not exist, ignore
    }
    
    try {
      await sql`
        ALTER TABLE newsletter_campaigns 
        ALTER COLUMN content SET DEFAULT ''
      `
    } catch (e) {
      // Column might not exist, ignore
    }
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_campaigns_status ON newsletter_campaigns(status)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON newsletter_campaigns(scheduled_at)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON newsletter_campaigns(created_at DESC)
    `
  } catch (error) {
    console.log('Campaigns table check:', error)
  }
}

export async function createNewsletterCampaign(
  subject: string,
  sender: string,
  body: string,
  scheduledAt?: Date,
  showOnBlog: boolean = false
): Promise<NewsletterCampaign> {
  await ensureCampaignsTable()
  
  const id = Date.now().toString()
  const now = new Date()
  const status = scheduledAt && scheduledAt > now ? 'scheduled' : 'draft'
  
  await sql`
    INSERT INTO newsletter_campaigns (id, subject, sender, body, scheduled_at, status, show_on_blog, created_at, updated_at)
    VALUES (${id}, ${subject}, ${sender}, ${body}, ${scheduledAt || null}, ${status}, ${showOnBlog}, ${now}, ${now})
  `
  
  return {
    id,
    subject,
    sender,
    body,
    scheduledAt: scheduledAt || null,
    sentAt: null,
    status,
    showOnBlog,
    createdAt: now,
    updatedAt: now,
  }
}

export async function updateNewsletterCampaign(
  id: string,
  subject: string,
  sender: string,
  body: string,
  scheduledAt?: Date,
  showOnBlog?: boolean
): Promise<NewsletterCampaign> {
  await ensureCampaignsTable()
  
  const now = new Date()
  const existing = await sql`
    SELECT * FROM newsletter_campaigns WHERE id = ${id} LIMIT 1
  `
  
  if (existing.length === 0) {
    throw new Error('Campaign not found')
  }
  
  const existingCampaign = existing[0]
  
  // Don't allow editing sent campaigns (except showOnBlog)
  if (existingCampaign.status === 'sent' && showOnBlog === undefined) {
    throw new Error('Cannot edit sent campaign')
  }
  
  const status = scheduledAt && scheduledAt > now ? 'scheduled' : existingCampaign.status
  
  // If updating showOnBlog for sent campaign, only update that field
  if (existingCampaign.status === 'sent' && showOnBlog !== undefined) {
    await sql`
      UPDATE newsletter_campaigns
      SET show_on_blog = ${showOnBlog},
          updated_at = ${now}
      WHERE id = ${id}
    `
  } else {
    await sql`
      UPDATE newsletter_campaigns
      SET subject = ${subject},
          sender = ${sender},
          body = ${body},
          scheduled_at = ${scheduledAt || null},
          status = ${status},
          ${showOnBlog !== undefined ? sql`show_on_blog = ${showOnBlog},` : sql``}
          updated_at = ${now}
      WHERE id = ${id}
    `
  }
  
  const updated = await sql`
    SELECT * FROM newsletter_campaigns WHERE id = ${id} LIMIT 1
  `
  
  const campaign = updated[0]
  
  // Get body - prefer new body field, fallback to sections if body is empty
  let bodyContent = campaign.body || ''
  if (!bodyContent && campaign.sections) {
    // Migrate from sections to body
    const sectionsData = Array.isArray(campaign.sections) ? campaign.sections : JSON.parse(campaign.sections as any)
    bodyContent = sectionsData.map((section: any) => {
      let html = ''
      if (section.title) html += `<h2>${section.title}</h2>`
      if (section.description) html += `<p>${section.description}</p>`
      return html
    }).join('')
  }
  
  return {
    id: campaign.id,
    subject: campaign.subject,
    sender: campaign.sender || 'Matěj Mauler <matej@mail.ziju.life>',
    body: bodyContent,
    scheduledAt: campaign.scheduled_at ? new Date(campaign.scheduled_at) : null,
    sentAt: campaign.sent_at ? new Date(campaign.sent_at) : null,
    status: campaign.status,
    showOnBlog: campaign.show_on_blog || false,
    createdAt: new Date(campaign.created_at),
    updatedAt: new Date(campaign.updated_at),
  }
}

export async function getNewsletterCampaigns(): Promise<NewsletterCampaign[]> {
  await ensureCampaignsTable()
  
  const campaigns = await sql`
    SELECT * FROM newsletter_campaigns
    ORDER BY created_at DESC
  `
  
  return campaigns.map((campaign) => {
    // Get body - prefer new body field, fallback to sections if body is empty
    let bodyContent = campaign.body || ''
    if (!bodyContent && campaign.sections) {
      // Migrate from sections to body
      const sectionsData = Array.isArray(campaign.sections) ? campaign.sections : JSON.parse(campaign.sections as any)
      bodyContent = sectionsData.map((section: any) => {
        let html = ''
        if (section.title) html += `<h2>${section.title}</h2>`
        if (section.description) html += `<p>${section.description}</p>`
        return html
      }).join('')
    }
    
    return {
      id: campaign.id,
      subject: campaign.subject,
      sender: campaign.sender || 'Matěj Mauler <matej@mail.ziju.life>',
      body: bodyContent,
      scheduledAt: campaign.scheduled_at ? new Date(campaign.scheduled_at) : null,
      sentAt: campaign.sent_at ? new Date(campaign.sent_at) : null,
      status: campaign.status,
      showOnBlog: campaign.show_on_blog || false,
      createdAt: new Date(campaign.created_at),
      updatedAt: new Date(campaign.updated_at),
    }
  })
}

export async function getNewsletterCampaign(id: string): Promise<NewsletterCampaign | null> {
  await ensureCampaignsTable()
  
  const campaigns = await sql`
    SELECT * FROM newsletter_campaigns WHERE id = ${id} LIMIT 1
  `
  
  if (campaigns.length === 0) {
    return null
  }
  
  const campaign = campaigns[0]
  
  // Get body - prefer new body field, fallback to sections if body is empty
  let bodyContent = campaign.body || ''
  if (!bodyContent && campaign.sections) {
    // Migrate from sections to body
    const sectionsData = Array.isArray(campaign.sections) ? campaign.sections : JSON.parse(campaign.sections as any)
    bodyContent = sectionsData.map((section: any) => {
      let html = ''
      if (section.title) html += `<h2>${section.title}</h2>`
      if (section.description) html += `<p>${section.description}</p>`
      return html
    }).join('')
  }
  
  return {
    id: campaign.id,
    subject: campaign.subject,
    sender: campaign.sender || 'Matěj Mauler <matej@mail.ziju.life>',
    body: bodyContent,
    scheduledAt: campaign.scheduled_at ? new Date(campaign.scheduled_at) : null,
    sentAt: campaign.sent_at ? new Date(campaign.sent_at) : null,
    status: campaign.status,
    showOnBlog: campaign.show_on_blog || false,
    createdAt: new Date(campaign.created_at),
    updatedAt: new Date(campaign.updated_at),
  }
}

export async function deleteNewsletterCampaign(id: string): Promise<boolean> {
  await ensureCampaignsTable()
  
  // Allow deleting sent campaigns
  const result = await sql`
    DELETE FROM newsletter_campaigns
    WHERE id = ${id}
    RETURNING id
  `
  
  return result.length > 0
}

export async function getScheduledCampaignsToSend(): Promise<NewsletterCampaign[]> {
  await ensureCampaignsTable()
  
  const now = new Date()
  
  const campaigns = await sql`
    SELECT * FROM newsletter_campaigns
    WHERE status = 'scheduled'
      AND scheduled_at IS NOT NULL
      AND scheduled_at <= ${now}
    ORDER BY scheduled_at ASC
  `
  
  return campaigns.map((campaign) => {
    // Get body - prefer new body field, fallback to sections if body is empty
    let bodyContent = campaign.body || ''
    if (!bodyContent && campaign.sections) {
      // Migrate from sections to body
      const sectionsData = Array.isArray(campaign.sections) ? campaign.sections : JSON.parse(campaign.sections as any)
      bodyContent = sectionsData.map((section: any) => {
        let html = ''
        if (section.title) html += `<h2>${section.title}</h2>`
        if (section.description) html += `<p>${section.description}</p>`
        return html
      }).join('')
    }
    
    return {
      id: campaign.id,
      subject: campaign.subject,
      sender: campaign.sender || 'Matěj Mauler <matej@mail.ziju.life>',
      body: bodyContent,
      scheduledAt: campaign.scheduled_at ? new Date(campaign.scheduled_at) : null,
      sentAt: campaign.sent_at ? new Date(campaign.sent_at) : null,
      status: campaign.status,
      showOnBlog: campaign.show_on_blog || false,
      createdAt: new Date(campaign.created_at),
      updatedAt: new Date(campaign.updated_at),
    }
  })
}

// Get newsletters for blog (only sent and showOnBlog = true)
export async function getNewslettersForBlog(): Promise<NewsletterCampaign[]> {
  await ensureCampaignsTable()
  
  const campaigns = await sql`
    SELECT * FROM newsletter_campaigns
    WHERE status = 'sent'
      AND show_on_blog = true
      AND sent_at IS NOT NULL
    ORDER BY sent_at DESC
  `
  
  return campaigns.map((campaign) => {
    // Get body - prefer new body field, fallback to sections if body is empty
    let bodyContent = campaign.body || ''
    if (!bodyContent && campaign.sections) {
      // Migrate from sections to body
      const sectionsData = Array.isArray(campaign.sections) ? campaign.sections : JSON.parse(campaign.sections as any)
      bodyContent = sectionsData.map((section: any) => {
        let html = ''
        if (section.title) html += `<h2>${section.title}</h2>`
        if (section.description) html += `<p>${section.description}</p>`
        return html
      }).join('')
    }
    
    return {
      id: campaign.id,
      subject: campaign.subject,
      sender: campaign.sender || 'Matěj Mauler <matej@mail.ziju.life>',
      body: bodyContent,
      scheduledAt: campaign.scheduled_at ? new Date(campaign.scheduled_at) : null,
      sentAt: campaign.sent_at ? new Date(campaign.sent_at) : null,
      status: campaign.status,
      showOnBlog: campaign.show_on_blog || false,
      createdAt: new Date(campaign.created_at),
      updatedAt: new Date(campaign.updated_at),
    }
  })
}

export async function markCampaignAsSent(id: string): Promise<void> {
  await ensureCampaignsTable()
  
  const now = new Date()
  
  await sql`
    UPDATE newsletter_campaigns
    SET status = 'sent',
        sent_at = ${now},
        updated_at = ${now}
    WHERE id = ${id}
  `
}
