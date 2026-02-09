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
export async function createResendContact(email: string, firstName?: string, lastName?: string): Promise<void> {
  if (!USE_RESEND_CONTACTS || !resend) {
    return
  }

  try {
    await resend.contacts.create({
      email: email.toLowerCase().trim(),
      firstName: firstName,
      lastName: lastName,
    })
  } catch (error: any) {
    // Contact might already exist, that's okay
    if (error?.message?.includes('already exists') || error?.statusCode === 409) {
      // Try to update instead
      try {
        await resend.contacts.update({
          email: email.toLowerCase().trim(),
          firstName: firstName,
          lastName: lastName,
          unsubscribed: false, // Ensure they're subscribed
        })
      } catch (updateError) {
        console.error('Error updating Resend contact:', updateError)
      }
    } else {
      console.error('Error creating Resend contact:', error)
    }
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
export async function syncContactsToResend(): Promise<void> {
  if (!USE_RESEND_CONTACTS || !resend) {
    return
  }

  try {
    const localSubscribers = await getNewsletterSubscribers()
    
    // Create contacts in Resend for all local subscribers
    for (const subscriber of localSubscribers) {
      await createResendContact(subscriber.email)
    }
    
    console.log(`Synced ${localSubscribers.length} contacts to Resend`)
  } catch (error) {
    console.error('Error syncing contacts to Resend:', error)
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
