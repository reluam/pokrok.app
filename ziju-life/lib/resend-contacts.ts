import { Resend } from 'resend'
import { getNewsletterSubscribers, addNewsletterSubscriber, deleteNewsletterSubscriberByEmail } from './newsletter-db'

const resend = new Resend(process.env.RESEND_API_KEY)

// Check if Resend Contacts should be used
const USE_RESEND_CONTACTS = process.env.USE_RESEND_CONTACTS === 'true'

export interface ResendContact {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  unsubscribed: boolean
  created_at: string
}

/**
 * Create or update a contact in Resend
 */
export async function createResendContact(email: string, firstName?: string, lastName?: string): Promise<{ success: boolean; error?: string }> {
  if (!USE_RESEND_CONTACTS) {
    return { success: false, error: 'Resend Contacts is not enabled (USE_RESEND_CONTACTS=false)' }
  }

  if (!resend) {
    return { success: false, error: 'Resend client is not initialized (RESEND_API_KEY missing?)' }
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    console.log(`[Resend] Creating contact: ${normalizedEmail}`)
    const result = await resend.contacts.create({
      email: normalizedEmail,
      firstName: firstName,
      lastName: lastName,
    })

    if (result.error) {
      console.error(`[Resend] Error creating contact ${normalizedEmail}:`, result.error)
      // Contact might already exist, try to update instead
      if (result.error.message?.includes('already exists') || result.error.statusCode === 409) {
        console.log(`[Resend] Contact exists, updating: ${normalizedEmail}`)
        const updateResult = await resend.contacts.update({
          email: normalizedEmail,
          firstName: firstName,
          lastName: lastName,
          unsubscribed: false, // Ensure they're subscribed
        })

        if (updateResult.error) {
          console.error(`[Resend] Error updating contact ${normalizedEmail}:`, updateResult.error)
          return { success: false, error: `Failed to update contact: ${updateResult.error.message || JSON.stringify(updateResult.error)}` }
        }
        console.log(`[Resend] Successfully updated contact: ${normalizedEmail}`)
        return { success: true }
      }
      return { success: false, error: `Failed to create contact: ${result.error.message || JSON.stringify(result.error)}` }
    }

    console.log(`[Resend] Successfully created contact: ${normalizedEmail}`)
    return { success: true }
  } catch (error: any) {
    // Handle thrown errors
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    console.error(`[Resend] Exception creating/updating contact ${normalizedEmail}:`, error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Remove a contact from Resend (or mark as unsubscribed)
 */
export async function removeResendContact(email: string): Promise<void> {
  if (!USE_RESEND_CONTACTS || !resend) {
    return
  }

  try {
    // Try to delete the contact
    await resend.contacts.remove({
      email: email.toLowerCase().trim(),
    })
  } catch (error: any) {
    // If deletion fails, try to mark as unsubscribed
    try {
      await resend.contacts.update({
        email: email.toLowerCase().trim(),
        unsubscribed: true,
      })
    } catch (updateError) {
      console.error('Error removing Resend contact:', updateError)
    }
  }
}

/**
 * Get all contacts from Resend
 */
export async function getResendContacts(): Promise<ResendContact[]> {
  if (!USE_RESEND_CONTACTS || !resend) {
    return []
  }

  try {
    const result = await resend.contacts.list()
    return result.data?.data || []
  } catch (error) {
    console.error('Error fetching Resend contacts:', error)
    return []
  }
}

/**
 * Sync local database contacts to Resend
 */
export async function syncContactsToResend(): Promise<{ success: boolean; synced: number; failed: number; errors: string[] }> {
  if (!USE_RESEND_CONTACTS) {
    return { success: false, synced: 0, failed: 0, errors: ['Resend Contacts is not enabled (USE_RESEND_CONTACTS=false)'] }
  }

  if (!resend) {
    return { success: false, synced: 0, failed: 0, errors: ['Resend client is not initialized (RESEND_API_KEY missing?)'] }
  }

  try {
    console.log('[Resend] Starting sync...')
    console.log(`[Resend] USE_RESEND_CONTACTS=${USE_RESEND_CONTACTS}`)
    console.log(`[Resend] RESEND_API_KEY=${process.env.RESEND_API_KEY ? 'SET' : 'NOT SET'}`)
    
    const localSubscribers = await getNewsletterSubscribers()
    console.log(`[Resend] Found ${localSubscribers.length} local subscribers`)
    
    let synced = 0
    let failed = 0
    const errors: string[] = []
    
    // Create contacts in Resend for all local subscribers
    for (const subscriber of localSubscribers) {
      const result = await createResendContact(subscriber.email)
      if (result.success) {
        synced++
      } else {
        failed++
        errors.push(`${subscriber.email}: ${result.error || 'Unknown error'}`)
        console.error(`[Resend] Failed to sync contact ${subscriber.email}:`, result.error)
      }
    }
    
    console.log(`[Resend] Sync complete: ${synced}/${localSubscribers.length} contacts synced (${failed} failed)`)
    
    return {
      success: failed === 0,
      synced,
      failed,
      errors: errors.slice(0, 10), // Limit to first 10 errors
    }
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    console.error('[Resend] Exception syncing contacts:', error)
    return { success: false, synced: 0, failed: 0, errors: [errorMessage] }
  }
}

/**
 * Get subscribers - either from Resend Contacts or local database
 */
export async function getSubscribers(): Promise<Array<{ email: string }>> {
  if (USE_RESEND_CONTACTS) {
    const resendContacts = await getResendContacts()
    // Filter out unsubscribed contacts
    return resendContacts
      .filter(contact => !contact.unsubscribed)
      .map(contact => ({ email: contact.email }))
  } else {
    // Use local database
    const localSubscribers = await getNewsletterSubscribers()
    return localSubscribers.map(sub => ({ email: sub.email }))
  }
}

/**
 * Send newsletter using Resend Broadcasts API (better for bulk sending)
 * Note: Broadcasts API requires an audienceId. If not provided, returns null to use individual emails.
 */
export async function sendNewsletterBroadcast(
  subject: string,
  htmlContent: string,
  textContent: string,
  audienceId?: string
): Promise<{ id: string } | null> {
  if (!USE_RESEND_CONTACTS || !resend || !audienceId) {
    // Broadcasts API requires audienceId - if not provided, return null to use individual emails
    return null
  }

  try {
    // Create a broadcast with content
    const createResult = await resend.broadcasts.create({
      audienceId: audienceId,
      from: 'Matěj Mauler <matej@mail.ziju.life>',
      subject: subject,
      html: htmlContent,
      text: textContent,
    })

    if (!createResult.data?.id) {
      throw new Error('Failed to create broadcast')
    }

    // Send the broadcast immediately
    const sendResult = await resend.broadcasts.send(createResult.data.id)

    if (sendResult.error) {
      throw new Error(sendResult.error.message || 'Failed to send broadcast')
    }

    return { id: createResult.data.id }
  } catch (error: any) {
    console.error('Error sending newsletter broadcast:', error)
    // Fallback: if broadcast fails, return null and caller can use individual emails
    return null
  }
}
