import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { neon } from '@neondatabase/serverless'
import { isUserAdmin } from '@/lib/cesta-db'
import { randomUUID } from 'crypto'

const sql = neon(process.env.DATABASE_URL || '')

/**
 * Endpoint to seed help sections into the database based on existing HelpView content
 * Admin only - can be called to populate help sections from hardcoded content
 * 
 * POST /api/setup/seed-help-sections
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

    // Ensure tables exist
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS help_categories (
          id VARCHAR(255) PRIMARY KEY,
          title JSONB NOT NULL,
          description JSONB,
          slug VARCHAR(100) UNIQUE,
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS help_sections (
          id VARCHAR(255) PRIMARY KEY,
          category_id VARCHAR(255) REFERENCES help_categories(id) ON DELETE CASCADE,
          title JSONB NOT NULL,
          content JSONB,
          component_key VARCHAR(100),
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    } catch (tableError: any) {
      if (!tableError?.message?.includes('already exists')) {
        console.error('Error creating tables:', tableError)
      }
    }

    // Get all categories by slug
    const categoriesResult = await sql`
      SELECT id, slug FROM help_categories
    `
    const categoriesBySlug = Object.fromEntries(
      categoriesResult.map((cat: any) => [cat.slug, cat.id])
    )

    // Check if help sections already exist
    const existingSections = await sql`
      SELECT COUNT(*) as count FROM help_sections
    `
    
    if (parseInt(existingSections[0]?.count || '0') > 0) {
      return NextResponse.json({
        success: true,
        message: 'Help sections already exist in database',
        alreadyExists: true,
        count: parseInt(existingSections[0]?.count || '0')
      })
    }

    // Define help sections based on HelpView.tsx content structure
    // Content is extracted from the component and stored as structured text
    const helpSections = [
      // Getting Started category
      {
        categorySlug: 'getting-started',
        title: { cs: 'Úvod', en: 'Introduction' },
        content: {
          cs: 'Pokrok je aplikace navržená pro sledování pokroku v životních snech a cílech. Rozdělte velké cíle na malé kroky, budujte návyky a sledujte svůj pokrok.',
          en: 'Pokrok is an app designed to track progress in life dreams and goals. Break down big goals into small steps, build habits, and track your progress.'
        },
        component_key: 'intro',
        sort_order: 0
      },
      {
        categorySlug: 'getting-started',
        title: { cs: '4 kroky k úspěchu', en: '4 Steps to Success' },
        content: {
          cs: 'Začněte s praktickými kroky. Vytvořte si oblasti, přidejte cíle, rozdělte je na kroky a budujte návyky. Pokrok vám ukáže, na co se soustředit dnes.',
          en: 'Start with practical steps. Create areas, add goals, break them down into steps, and build habits. Pokrok will show you what to focus on today.'
        },
        component_key: 'steps-to-success',
        sort_order: 1
      },
      {
        categorySlug: 'getting-started',
        title: { cs: 'Krok 0: Oblasti', en: 'Step 0: Areas' },
        content: {
          cs: 'Oblasti jsou logické skupiny pro vaše cíle, kroky a návyky. Ideálně by měly představovat větší životní oblasti nebo projekty. Vytvářejte oblasti pro větší životní oblasti (Zdraví, Kariéra, Vztahy) nebo pro větší projekty.',
          en: 'Areas are logical groups for your goals, steps, and habits. Ideally, they should represent larger life areas or projects. Create areas for larger life areas (Health, Career, Relationships) or for larger projects.'
        },
        component_key: 'step-0-areas',
        sort_order: 2
      },
      {
        categorySlug: 'getting-started',
        title: { cs: 'Krok 1: Cíle', en: 'Step 1: Goals' },
        content: {
          cs: 'Cíle jsou dlouhodobé výsledky, které chcete dosáhnout. Měly by být měřitelné, s termínem a konkrétní. Použijte princip SMART (Specifický, Měřitelný, Dosažitelný, Relevantní, Časově vymezený).',
          en: 'Goals are long-term results you want to achieve. They should be measurable, with a deadline, and specific. Use the SMART principle (Specific, Measurable, Achievable, Relevant, Time-bound).'
        },
        component_key: 'step-1-goals',
        sort_order: 3
      },
      {
        categorySlug: 'getting-started',
        title: { cs: 'Krok 2: Kroky', en: 'Step 2: Steps' },
        content: {
          cs: 'Kroky jsou konkrétní akce směřující k cíli. To jsou spolu s návyky ty denodenní detaily, na kterých budete pracovat. Kroky mohou být naplánované na konkrétní datum a čas.',
          en: 'Steps are concrete actions toward a goal. These are, together with habits, the day-to-day details you will work on. Steps can be scheduled for a specific date and time.'
        },
        component_key: 'step-2-steps',
        sort_order: 4
      },
      {
        categorySlug: 'getting-started',
        title: { cs: 'Krok 3: Návyky', en: 'Step 3: Habits' },
        content: {
          cs: 'Návyky slouží k vybudování zdravých nebo odstranění škodlivých návyků. Můžete nastavit frekvenci (denně, týdně) a čas připomenutí. Návyky se zobrazují v Upcoming view a pro lepší přehled i v Návycích.',
          en: 'Habits serve to build healthy or eliminate harmful habits. You can set frequency (daily, weekly) and reminder time. Habits are displayed in Upcoming view and also in Habits for a better overview.'
        },
        component_key: 'step-3-habits',
        sort_order: 5
      },
      {
        categorySlug: 'getting-started',
        title: { cs: 'Co dál?', en: 'What\'s Next?' },
        content: {
          cs: '• Denní přehled\n• Dokončujte kroky\n• Zaměřte se na důležité\n• Sledujte pokrok',
          en: '• Daily overview\n• Complete steps\n• Focus on important\n• Track progress'
        },
        component_key: 'whats-next',
        sort_order: 6
      },
      
      // Overview/Views category
      {
        categorySlug: 'overview',
        title: { cs: '1. Upcoming (Nadcházející)', en: '1. Upcoming' },
        content: {
          cs: 'Zobrazuje všechny nadcházející kroky a návyky. Ideální pro přehled toho, co vás čeká. Můžete přepínat mezi zobrazením Feed (kroky seřazené podle data) a Oblasti (kroky skupované podle oblastí a cílů).',
          en: 'Displays all upcoming steps and habits. Ideal for an overview of what\'s ahead. You can switch between Feed view (steps sorted by date) and Areas view (steps grouped by areas and goals).'
        },
        component_key: 'upcoming-view',
        sort_order: 0
      },
      {
        categorySlug: 'overview',
        title: { cs: '2. Overview (Přehled)', en: '2. Overview' },
        content: {
          cs: 'Měsíční kalendářní přehled všech kroků a návyků. Slouží pro větší přehled a plánování dopředu. Kliknutím na den zobrazíte detailní přehled kroků a návyků pro daný den.',
          en: 'Monthly calendar overview of all steps and habits. Serves for a larger overview and planning ahead. Click on a day to view detailed overview of steps and habits for that day.'
        },
        component_key: 'overview-view',
        sort_order: 1
      },
      {
        categorySlug: 'overview',
        title: { cs: '3. Statistics (Statistiky)', en: '3. Statistics' },
        content: {
          cs: 'Roční přehled pokroku v jednotlivých cílech. Zobrazuje časovou osu s progress bary pro všechny cíle. Zobrazuje pokrok v jednotlivých cílech s vizualizací dokončených kroků.',
          en: 'Yearly overview of progress in individual goals. Displays a timeline with progress bars for all goals. Shows progress in individual goals with visualization of completed steps.'
        },
        component_key: 'statistics-view',
        sort_order: 2
      },
      {
        categorySlug: 'overview',
        title: { cs: '4. Areas (Oblasti)', en: '4. Areas' },
        content: {
          cs: 'Zobrazuje všechny kroky a cíle, které jsou přiřazené k dané oblasti. Každá oblast má vlastní sekci s cíli a jejich kroky. Kliknutím na oblast v levém menu zobrazíte její obsah.',
          en: 'Displays all steps and goals that are assigned to a given area. Each area has its own section with goals and their steps. Click on an area in the left menu to view its content.'
        },
        component_key: 'areas-view',
        sort_order: 3
      },
      
      // Navigation category
      {
        categorySlug: 'navigation',
        title: { cs: 'Horní menu', en: 'Top Menu' },
        content: {
          cs: 'Horní menu poskytuje rychlý přístup k hlavním sekcím aplikace. Vždy je viditelné v horní části obrazovky. Obsahuje: Hlavní panel, Cíle, Návyky, Kroky, Nápověda, Nastavení.',
          en: 'The top menu provides quick access to main app sections. It\'s always visible at the top of the screen. Contains: Main Panel, Goals, Habits, Steps, Help, Settings.'
        },
        component_key: 'top-menu',
        sort_order: 0
      },
      {
        categorySlug: 'navigation',
        title: { cs: 'Levé navigační menu', en: 'Left Navigation Menu' },
        content: {
          cs: 'Levé menu se mění podle kontextu stránky. Na hlavním panelu obsahuje hlavní zobrazení (Upcoming, Overview, Statistics, Areas) a seznam oblastí. Pod hlavními zobrazeními najdete seznam oblastí. Kliknutím na oblast se rozbalí a uvidíte cíle v této oblasti.',
          en: 'The left menu changes based on page context. On the main panel, it contains main views (Upcoming, Overview, Statistics, Areas) and a list of areas. Below the main views, you\'ll find a list of areas. Click on an area to expand it and see goals in that area.'
        },
        component_key: 'left-menu',
        sort_order: 1
      },
      {
        categorySlug: 'navigation',
        title: { cs: 'Tlačítko Přidat', en: 'Add Button' },
        content: {
          cs: 'V dolní části levého menu je tlačítko s ikonou plus. Kliknutím na něj můžete přidat novou oblast, cíl, krok nebo návyk.',
          en: 'At the bottom of the left menu is a button with a plus icon. Clicking it allows you to add a new area, goal, step, or habit.'
        },
        component_key: 'add-button',
        sort_order: 2
      },
      
      // Areas category
      {
        categorySlug: 'areas',
        title: { cs: 'Co jsou oblasti?', en: 'What are areas?' },
        content: {
          cs: 'Oblasti jsou způsob, jak organizovat své cíle, kroky a návyky do logických skupin. Ideálně by měly představovat větší životní oblasti nebo projekty. Příklady: Zdraví, Kariéra, Vztahy, Osobní růst.',
          en: 'Areas are a way to organize your goals, steps, and habits into logical groups. Ideally, they should represent larger life areas or projects. Examples: Health, Career, Relationships, Personal Growth.'
        },
        component_key: 'what-are-areas',
        sort_order: 0
      },
      {
        categorySlug: 'areas',
        title: { cs: 'Jak vytvořit oblast?', en: 'How to create an area?' },
        content: {
          cs: '1. Přejděte do Nastavení (ikona ozubeného kola v horním menu)\n2. Vyberte záložku "Životní oblasti"\n3. Klikněte na tlačítko "Přidat oblast"\n4. Vyplňte název oblasti (např. "Zdraví", "Kariéra")\n5. Volitelně přidejte popis, barvu a ikonu\n6. Klikněte na "Uložit"\n\nTip: Oblasti můžete také vytvořit pomocí tlačítka Přidat v levém navigačním menu na hlavním panelu.',
          en: '1. Go to Settings (gear icon in the top menu)\n2. Select the "Life Areas" tab\n3. Click the "Add Area" button\n4. Fill in the area name (e.g., "Health", "Career")\n5. Optionally add description, color, and icon\n6. Click "Save"\n\nTip: You can also create areas using the Add button in the left navigation menu on the main panel.'
        },
        component_key: 'how-to-create-area',
        sort_order: 1
      },
      {
        categorySlug: 'areas',
        title: { cs: 'Jak pracovat s oblastmi?', en: 'How to work with areas?' },
        content: {
          cs: 'Přiřazení k oblasti: Při vytváření nebo úpravě cíle, kroku nebo návyku můžete vybrat oblast, ke které patří.\n\nZobrazení podle oblastí: V levém navigačním menu můžete kliknout na oblast a zobrazit všechny cíle, kroky a návyky v této oblasti.\n\nÚprava a mazání oblastí: Oblasti můžete upravit nebo smazat v Nastavení → Životní oblasti. Při mazání oblasti se cíle, kroky a návyky v této oblasti nezmazou.',
          en: 'Assigning to an area: When creating or editing a goal, step, or habit, you can select the area it belongs to.\n\nViewing by areas: In the left navigation menu, you can click on an area to view all goals, steps, and habits in that area.\n\nEditing and deleting areas: You can edit or delete areas in Settings → Life Areas. When deleting an area, goals, steps, and habits in that area are not deleted.'
        },
        component_key: 'working-with-areas',
        sort_order: 2
      },
      {
        categorySlug: 'areas',
        title: { cs: 'Tipy', en: 'Tips' },
        content: {
          cs: '• Vytvářejte oblasti pro větší životní oblasti (Zdraví, Kariéra, Vztahy) nebo pro větší projekty\n• Není nutné přiřazovat vše k oblasti - cíle, kroky a návyky mohou existovat i bez oblasti\n• Používejte barvy a ikony pro lepší vizuální rozlišení oblastí\n• Oblasti pomáhají s filtrováním a organizací, zejména když máte mnoho cílů a kroků',
          en: '• Create areas for larger life areas (Health, Career, Relationships) or for larger projects\n• You don\'t have to assign everything to an area - goals, steps, and habits can exist without an area\n• Use colors and icons for better visual distinction of areas\n• Areas help with filtering and organization, especially when you have many goals and steps'
        },
        component_key: 'areas-tips',
        sort_order: 3
      },
      
      // Goals category
      {
        categorySlug: 'goals',
        title: { cs: 'Co jsou cíle?', en: 'What are goals?' },
        content: {
          cs: 'Cíle jsou dlouhodobé výsledky, které chcete dosáhnout. Měly by být měřitelné, s termínem a konkrétní. Použijte princip SMART (Specifický, Měřitelný, Dosažitelný, Relevantní, Časově vymezený). Cíle mohou být aktivní, odložené nebo dokončené.',
          en: 'Goals are long-term results you want to achieve. They should be measurable, with a deadline, and specific. Use the SMART principle (Specific, Measurable, Achievable, Relevant, Time-bound). Goals can be active, postponed, or completed.'
        },
        component_key: 'what-are-goals',
        sort_order: 0
      },
      {
        categorySlug: 'goals',
        title: { cs: 'Jak vytvořit cíl?', en: 'How to create a goal?' },
        content: {
          cs: '1. Přejděte do sekce Cíle\n2. Klikněte na tlačítko "Přidat cíl"\n3. Vyplňte název cíle\n4. Volitelně přidejte popis, termín, kategorii a oblast\n5. Klikněte na "Uložit"',
          en: '1. Go to the Goals section\n2. Click the "Add Goal" button\n3. Fill in the goal name\n4. Optionally add description, deadline, category, and area\n5. Click "Save"'
        },
        component_key: 'how-to-create-goal',
        sort_order: 1
      },
      {
        categorySlug: 'goals',
        title: { cs: 'Tipy pro cíle', en: 'Goal Tips' },
        content: {
          cs: '• Používejte SMART princip pro nastavení cílů\n• Rozdělte velké cíle na menší kroky\n• Nastavte realistické termíny\n• Pravidelně kontrolujte pokrok',
          en: '• Use SMART principle for setting goals\n• Break down big goals into smaller steps\n• Set realistic deadlines\n• Regularly check progress'
        },
        component_key: 'goals-tips',
        sort_order: 2
      },
      
      // Steps category
      {
        categorySlug: 'steps',
        title: { cs: 'Co jsou kroky?', en: 'What are steps?' },
        content: {
          cs: 'Kroky jsou konkrétní akce směřující k cíli. To jsou spolu s návyky ty denodenní detaily, na kterých budete pracovat. Kroky mohou být naplánované na konkrétní datum a čas, mohou mít časový odhad a mohou být označené jako důležité. Kroky mohou být také opakující se (denně, týdně, měsíčně).',
          en: 'Steps are concrete actions toward a goal. These are, together with habits, the day-to-day details you will work on. Steps can be scheduled for a specific date and time, can have a time estimate, and can be marked as important. Steps can also be recurring (daily, weekly, monthly).'
        },
        component_key: 'what-are-steps',
        sort_order: 0
      },
      {
        categorySlug: 'steps',
        title: { cs: 'Jak vytvořit krok?', en: 'How to create a step?' },
        content: {
          cs: '1. Přejděte do sekce Kroky nebo klikněte na tlačítko "Přidat" v levém menu\n2. Vyplňte název kroku\n3. Volitelně nastavte datum, čas, odhad času, cíl a označte jako důležité\n4. Pro opakující se krok nastavte frekvenci\n5. Klikněte na "Uložit"',
          en: '1. Go to the Steps section or click the "Add" button in the left menu\n2. Fill in the step name\n3. Optionally set date, time, time estimate, goal, and mark as important\n4. For recurring step, set frequency\n5. Click "Save"'
        },
        component_key: 'how-to-create-step',
        sort_order: 1
      },
      {
        categorySlug: 'steps',
        title: { cs: 'Tipy pro kroky', en: 'Step Tips' },
        content: {
          cs: '• Rozdělte velké úkoly na menší kroky\n• Nastavte realistické časové odhady\n• Označte důležité kroky pro lepší prioritu\n• Používejte opakující se kroky pro rutinní úkoly',
          en: '• Break down large tasks into smaller steps\n• Set realistic time estimates\n• Mark important steps for better priority\n• Use recurring steps for routine tasks'
        },
        component_key: 'steps-tips',
        sort_order: 2
      },
      
      // Habits category
      {
        categorySlug: 'habits',
        title: { cs: 'Co jsou návyky?', en: 'What are habits?' },
        content: {
          cs: 'Návyky slouží k vybudování zdravých nebo odstranění škodlivých návyků. Můžete nastavit frekvenci (denně, týdně) a čas připomenutí. Návyky se zobrazují v Upcoming view a pro lepší přehled i v Návycích. Sleduje se streak (řada) splněných dní a statistiky.',
          en: 'Habits serve to build healthy or eliminate harmful habits. You can set frequency (daily, weekly) and reminder time. Habits are displayed in Upcoming view and also in Habits for a better overview. Streak (consecutive days) and statistics are tracked.'
        },
        component_key: 'what-are-habits',
        sort_order: 0
      },
      {
        categorySlug: 'habits',
        title: { cs: 'Jak vytvořit návyk?', en: 'How to create a habit?' },
        content: {
          cs: '1. Přejděte do sekce Návyky\n2. Klikněte na tlačítko "Přidat návyk"\n3. Vyplňte název návyku\n4. Nastavte frekvenci (denně, týdně) a vyberte dny v týdnu\n5. Volitelně nastavte čas připomenutí\n6. Klikněte na "Uložit"',
          en: '1. Go to the Habits section\n2. Click the "Add Habit" button\n3. Fill in the habit name\n4. Set frequency (daily, weekly) and select days of the week\n5. Optionally set reminder time\n6. Click "Save"'
        },
        component_key: 'how-to-create-habit',
        sort_order: 1
      },
      {
        categorySlug: 'habits',
        title: { cs: 'Tipy pro návyky', en: 'Habit Tips' },
        content: {
          cs: '• Začněte s malými návyky\n• Buďte konzistentní - každý den je důležitý\n• Sledujte svůj streak pro motivaci\n• Nebuďte příliš přísní - občasné vynechání je normální',
          en: '• Start with small habits\n• Be consistent - every day matters\n• Track your streak for motivation\n• Don\'t be too strict - occasional skipping is normal'
        },
        component_key: 'habits-tips',
        sort_order: 2
      },
    ]

    // Insert all help sections
    const insertedSections = []
    for (const section of helpSections) {
      const categoryId = categoriesBySlug[section.categorySlug]
      if (!categoryId) {
        console.warn(`Category not found for slug: ${section.categorySlug}, skipping section...`)
        continue
      }

      try {
        const result = await sql`
          INSERT INTO help_sections (id, category_id, title, content, component_key, sort_order, is_active, created_by, created_at, updated_at)
          VALUES (
            ${randomUUID()},
            ${categoryId},
            ${JSON.stringify(section.title)}::jsonb,
            ${JSON.stringify(section.content)}::jsonb,
            ${section.component_key || null},
            ${section.sort_order},
            TRUE,
            ${dbUser.id},
            NOW(),
            NOW()
          )
          RETURNING id
        `
        insertedSections.push(result[0]?.id)
      } catch (insertError: any) {
        if (insertError?.message?.includes('duplicate key') || insertError?.message?.includes('already exists')) {
          console.log(`Section ${section.component_key} already exists, skipping...`)
          continue
        }
        console.error(`Error inserting section ${section.component_key}:`, insertError)
      }
    }

    console.log(`✓ Seeded ${insertedSections.length} help sections`)

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedSections.length} help sections`,
      insertedCount: insertedSections.length,
      totalSections: helpSections.length
    })
  } catch (error: any) {
    console.error('Error seeding help sections:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed help sections',
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

