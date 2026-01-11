import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('admin-auth')
  return authCookie?.value === 'authenticated'
}

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Žádný soubor nebyl nahrán' },
        { status: 400 }
      )
    }

    // Kontrola typu souboru
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nepodporovaný typ souboru. Povolené typy: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }

    // Kontrola velikosti (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Soubor je příliš velký. Maximální velikost je 5MB' },
        { status: 400 }
      )
    }

    // Vytvořit složku, pokud neexistuje
    const uploadDir = join(process.cwd(), 'public', 'articles')
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true })
    }

    // Generovat unikátní název souboru
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${originalName}`
    const filePath = join(uploadDir, fileName)

    // Uložit soubor
    await writeFile(filePath, buffer)

    // Vrátit URL k souboru
    const fileUrl = `/articles/${fileName}`

    return NextResponse.json({ 
      url: fileUrl,
      fileName: fileName 
    }, { status: 200 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Chyba při nahrávání souboru' },
      { status: 500 }
    )
  }
}
