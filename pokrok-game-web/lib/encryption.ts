import * as crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const KEY_LENGTH = 32
const PBKDF2_ITERATIONS = 100000
const PBKDF2_DIGEST = 'sha256'

/**
 * Derives encryption key for a specific user
 * Uses PBKDF2 with master key + user ID as salt
 */
function getEncryptionKey(userId: string): Buffer {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY
  
  if (!masterKey) {
    throw new Error('ENCRYPTION_MASTER_KEY environment variable is not set')
  }
  
  if (masterKey.length < 32) {
    throw new Error('ENCRYPTION_MASTER_KEY must be at least 32 characters long')
  }
  
  // Derive key using PBKDF2: master key as password, userId as salt
  return crypto.pbkdf2Sync(
    masterKey,
    userId,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    PBKDF2_DIGEST
  )
}

/**
 * Encrypts a text string for a specific user
 * Returns Base64 encoded string: {iv}:{authTag}:{encryptedData}
 */
export function encrypt(text: string | null | undefined, userId: string): string | null {
  // Handle null/undefined/empty strings
  if (!text || text.trim() === '') {
    return null
  }
  
  try {
    const key = getEncryptionKey(userId)
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    
    const tag = cipher.getAuthTag()
    
    // Format: iv:tag:encrypted (all Base64)
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypts an encrypted string for a specific user
 * Expects format: {iv}:{authTag}:{encryptedData} (all Base64)
 * 
 * Migration mode: If decryption fails (e.g., plain text), returns original string
 */
export function decrypt(encryptedText: string | null | undefined, userId: string): string | null {
  // Handle null/undefined/empty strings
  if (!encryptedText || encryptedText.trim() === '') {
    return null
  }
  
  try {
    const key = getEncryptionKey(userId)
    const parts = encryptedText.split(':')
    
    if (parts.length !== 3) {
      // Try to decrypt as plain text (for migration period)
      // This allows gradual migration without breaking existing data
      console.warn('Invalid encrypted format, treating as plain text:', encryptedText.substring(0, 50))
      return encryptedText
    }
    
    const [ivStr, tagStr, encryptedData] = parts
    
    const iv = Buffer.from(ivStr, 'base64')
    const tag = Buffer.from(tagStr, 'base64')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Decryption error details:', error.message)
      console.error('Encrypted text length:', encryptedText?.length)
      console.error('Encrypted text preview:', encryptedText?.substring(0, 50))
    }
    // During migration, if decryption fails, return original (might be plain text)
    console.warn('Decryption failed, returning original text (migration mode)')
    return encryptedText
  }
}

/**
 * Checks if a string is encrypted (has the expected format)
 */
export function isEncrypted(text: string | null | undefined): boolean {
  if (!text) return false
  const parts = text.split(':')
  if (parts.length !== 3) return false
  
  try {
    // All parts should be valid Base64
    return parts.every(part => {
      try {
        Buffer.from(part, 'base64')
        return true
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

/**
 * Encrypts an object's specified fields
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  userId: string,
  fieldsToEncrypt: (keyof T)[]
): T {
  const encrypted = { ...obj }
  
  for (const field of fieldsToEncrypt) {
    if (field in encrypted && encrypted[field] != null) {
      encrypted[field] = encrypt(encrypted[field], userId) as any
    }
  }
  
  return encrypted
}

/**
 * Decrypts an object's specified fields
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  userId: string,
  fieldsToDecrypt: (keyof T)[]
): T {
  const decrypted = { ...obj }
  
  for (const field of fieldsToDecrypt) {
    if (field in decrypted && decrypted[field] != null) {
      decrypted[field] = decrypt(decrypted[field], userId) as any
    }
  }
  
  return decrypted
}

/**
 * Encrypts JSONB checklist field
 * Checklist is an array of objects with a 'text' property
 */
export function encryptChecklist(checklist: any[] | null | undefined, userId: string): any[] | null {
  if (!checklist || !Array.isArray(checklist)) {
    return null
  }
  
  return checklist.map(item => {
    if (typeof item === 'object' && item !== null && 'text' in item && item.text) {
      return {
        ...item,
        text: encrypt(item.text, userId)
      }
    }
    return item
  })
}

/**
 * Decrypts JSONB checklist field
 * Checklist is an array of objects with a 'text' property
 */
export function decryptChecklist(checklist: any[] | null | undefined, userId: string): any[] | null {
  if (!checklist || !Array.isArray(checklist)) {
    return null
  }
  
  return checklist.map(item => {
    if (typeof item === 'object' && item !== null && 'text' in item && item.text) {
      return {
        ...item,
        text: decrypt(item.text, userId)
      }
    }
    return item
  })
}

