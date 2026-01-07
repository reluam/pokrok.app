import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { isUserAdmin } from '@/lib/cesta-db'
import { randomUUID } from 'crypto'

const sql = neon(process.env.DATABASE_URL || '')

/**
 * Endpoint to seed onboarding tips into the database
 * Admin only - can be called to populate initial onboarding tips
 * 
 * POST /api/setup/seed-onboarding-tips
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    // Check if user is admin
    const isAdmin = await isUserAdmin(dbUser.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Ensure assistant_tips table exists
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS assistant_tips (
          id VARCHAR(255) PRIMARY KEY,
          title JSONB NOT NULL,
          description JSONB NOT NULL,
          category VARCHAR(50) NOT NULL CHECK (category IN ('motivation', 'organization', 'productivity', 'feature', 'onboarding')),
          priority INTEGER DEFAULT 0,
          context_page VARCHAR(50),
          context_section VARCHAR(50),
          is_active BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    } catch (tableError: any) {
      if (!tableError?.message?.includes('already exists')) {
        console.error('Error creating assistant_tips table:', tableError)
      }
    }

    // Check if onboarding tips already exist
    const existingTips = await sql`
      SELECT COUNT(*) as count FROM assistant_tips WHERE category = 'onboarding'
    `
    
    if (parseInt(existingTips[0]?.count || '0') > 0) {
      return NextResponse.json({
        success: true,
        message: 'Onboarding tips already exist in database',
        alreadyExists: true,
        count: parseInt(existingTips[0]?.count || '0')
      })
    }

    // Hardcoded onboarding tips (matching the fallback in /api/assistant/tips/route.ts)
    // IMPORTANT: All onboarding tips must have category = 'onboarding' to be shown to new users
    const onboardingTips = [
      {
        id: 'onboarding-intro',
        title: { cs: 'Vítejte v Pokroku!', en: 'Welcome to Pokrok!' },
        description: {
          cs: 'Pokrok je aplikace navržená pro sledování pokroku v životních snech a cílech. Aplikace jako taková je v podstatě podpůrná berle a motivace pro setrvání.',
          en: 'Pokrok is an application designed for tracking progress in life dreams and goals. The application itself is essentially a support crutch and motivation for persistence.'
        },
        category: 'onboarding',
        priority: 10
      },
      {
        id: 'onboarding-assistant',
        title: { cs: 'Funkce asistenta', en: 'This assistant' },
        description: {
          cs: 'Asistent slouží k tomu, abyste mohli rychle cokoliv dohledat a k tomu, aby vám pomáhal různými tipy založenými na tom, jak aplikaci používáte. Ze začátku bude asistent poskytovat hlavně obecné tipy, ale postupem času vám bude pomáhat konkrétněji a praktičtěji. Asistenta můžete kdykoliv vypnout v Nastavení.',
          en: 'This assistant serves to help you quickly find anything and to help you with various tips based on how you use the application. Initially, this assistant will provide mainly general tips, but over time it will help you more specifically and practically. This assistant can be turned off at any time in Settings.'
        },
        category: 'onboarding',
        priority: 9
      },
      {
        id: 'onboarding-setup',
        title: { cs: 'Nastavení aplikace', en: 'Application setup' },
        description: {
          cs: 'Pro správné fungování aplikace byste měli nastavit své cíle, ideálně i oblasti a na základě toho potom i jednotlivé kroky a návyky.',
          en: 'For the application to work properly, you must set up your goals, ideally also areas, and based on that, then individual steps and habits.'
        },
        category: 'onboarding',
        priority: 8
      },
      {
        id: 'onboarding-goals',
        title: { cs: 'Cíle', en: 'Goals' },
        description: {
          cs: '**Kde najít cíle**\n\nCíle najdete v levém navigačním menu. Můžete kliknout na konkrétní cíl v **Oblasti**, nebo na stránku **Cíle**, kde jsou všechny cíle seřazeny. Cíle se tvoří kliknutím na tlačítko **Přidat** v levém navigačním menu úplně dole.\n\n**Vytvoření cíle podle SMART**\n\nPři vytváření cíle můžete použít metodu SMART k vytvoření Specifického (konkrétní cíl), Měřitelného (jak ho budete měřit), Ambiciózního, Realistického a Časově vymezeného cíle.\n\nPro měřitelnost můžete v aplikaci použít metriky, které nastavíte po vytvoření cíle.',
          en: '**Where to find goals**\n\nYou can find goals in the left navigation menu. You can click on a specific goal in an **Area**, or on the **Goals** page where all goals are listed. Goals are created by clicking the **Add** button at the bottom of the left navigation menu.\n\n**Creating a goal using SMART method**\n\nWhen creating a goal, you can use the SMART method to create a Specific (specific goal), Measurable (how are you going to measure it), Ambitious, Realistic, Time-bound goal.\n\nFor measurable you can use metrics when creating the goal, which will help you track the progress more easily.'
        },
        category: 'onboarding',
        priority: 7
      },
      {
        id: 'onboarding-areas',
        title: { cs: 'Oblasti', en: 'Areas' },
        description: {
          cs: 'Oblast můžete přidat v hlavním panelu kliknutím na **Přidat** a poté výběrem **Oblast**. Do oblasti můžete přiřadit kolik chcete cílů. Oblasti vlastně akorát seskupují jednotlivé cíle do logických celků pro přehled a filtrování.\n\nOblasti můžou být životní oblasti, vize nebo velké projekty.',
          en: 'You can add an area in the main panel by clicking **Add**, and then selecting **Area**. You can assign as many goals as you want to an area. Areas essentially group individual goals into logical units for overview and filtering.\n\nAreas can be life areas, visions, or large projects.'
        },
        category: 'onboarding',
        priority: 5
      },
      {
        id: 'onboarding-steps',
        title: { cs: 'Kroky', en: 'Steps' },
        description: {
          cs: '**Co jsou kroky**\n\nKroky jsou to-do úkoly zamýšlené jako kroky pro cíle. Kroky jsou spolu s návyky ta každodenní práce, kterou musíte udělat, abyste se posunuli k tomu životu, který chcete.\n\n**Kde nastavit kroky**\n\nKroky můžete přidat v navigačním panelu dole přes tlačítko **Přidat**, ale také nahoře vpravo v sekci **Nadcházející**, nebo přímo u konkrétního cíle.\n\n**Checklisty u kroků**\n\nKe krokům se dají přidat checklisty v detailu kroku - což jsou položky, které je třeba splnit pro krok a umožňují mít větší kontrolu nad tím, co se děje.\n\n**Opakující se kroky**\n\nOpakující se kroky jsou kroky, které se budou automaticky opakovat s určitou periodou (nastavíte vy) a vždy se zobrazí pouze jeden nejbližší výskyt toho kroku. Dokud není splněný, nezobrazí se další.',
          en: '**What are steps**\n\nSteps are to-do tasks intended as steps for goals. These are, together with habits, the daily work you will do to actually move towards the life you want.\n\n**Where to set up steps**\n\nYou can add steps in the bottom navigation panel on the **Add** button, but also at the top in **Upcoming** or in a goal in the steps section.\n\n**Checklists for steps**\n\nChecklists can be added to steps in the step detail - these are items that need to be completed for a step and allow for better control over what is happening.\n\n**Recurring steps**\n\nRecurring steps are steps that will automatically repeat with a certain period (you set it) and only one nearest occurrence of that step will be displayed. Until it is completed, the next one will not be displayed.'
        },
        category: 'onboarding',
        priority: 4
      },
      {
        id: 'onboarding-habits',
        title: { cs: 'Návyky', en: 'Habits' },
        description: {
          cs: 'Návyky slouží k vybudování zdravých, případně odstranění škodlivých návyků. Nastavení najdete v **Návycích** a samotné návyky se poté podle frekvence budou zobrazovat v sekci **Nadcházející**.',
          en: 'Habits serve to build healthy habits, or remove harmful ones. Settings can be found in **Habits** and the habits themselves will then be displayed according to frequency in the **Upcoming** view.'
        },
        category: 'onboarding',
        priority: 0
      },
      {
        id: 'onboarding-contact',
        title: { cs: 'Potřebujete pomoc?', en: 'Need help?' },
        description: {
          cs: 'V případě potřeby je možné napsat tvůrci aplikace - Matějovi, přes kontaktní formulář v Nápovědě. Můžete napsat s jakýmkoliv tématem co vás zajímá nebo trápí.',
          en: 'If needed, you can write to the app creator - Matěj, through the contact form in Help. You can write about any topic that interests or concerns you.'
        },
        category: 'onboarding',
        priority: -1
      }
    ]

    // Insert all onboarding tips
    const insertedTips = []
    for (const tip of onboardingTips) {
      try {
        const result = await sql`
          INSERT INTO assistant_tips (id, title, description, category, priority, context_page, context_section, is_active, created_by, created_at, updated_at)
          VALUES (
            ${tip.id},
            ${JSON.stringify(tip.title)}::jsonb,
            ${JSON.stringify(tip.description)}::jsonb,
            ${tip.category},
            ${tip.priority},
            NULL,
            NULL,
            true,
            ${dbUser.id},
            NOW(),
            NOW()
          )
          RETURNING id
        `
        insertedTips.push(result[0]?.id)
      } catch (insertError: any) {
        // If tip already exists, skip it
        if (insertError?.message?.includes('duplicate key') || insertError?.message?.includes('already exists')) {
          console.log(`Tip ${tip.id} already exists, skipping...`)
          continue
        }
        console.error(`Error inserting tip ${tip.id}:`, insertError)
      }
    }

    console.log(`✓ Seeded ${insertedTips.length} onboarding tips`)

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedTips.length} onboarding tips`,
      insertedCount: insertedTips.length,
      totalTips: onboardingTips.length
    })
  } catch (error: any) {
    console.error('Error seeding onboarding tips:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed onboarding tips',
        message: error?.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Also allow GET for easy browser access
export async function GET(request: NextRequest) {
  return POST(request)
}

