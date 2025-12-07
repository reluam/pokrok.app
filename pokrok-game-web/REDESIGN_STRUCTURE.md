# Redesign Structure - Playful Animated Style

## 🎨 Design System

### Color Palette

#### Primary Colors (Pastel)
```css
--color-pink-light: #FFE5E5;      /* Light pink background */
--color-pink: #FFB3BA;             /* Pink accent */
--color-pink-dark: #FF9AA2;        /* Pink hover */

--color-yellow-green-light: #E5FFE5;  /* Light yellow-green */
--color-yellow-green: #B3FFB3;        /* Yellow-green accent */
--color-yellow-green-dark: #9AFF9A;   /* Yellow-green hover */

--color-purple-light: #E5E5FF;    /* Light purple background */
--color-purple: #B3B3FF;           /* Purple accent */
--color-purple-dark: #9A9AFF;      /* Purple hover */

--color-yellow-light: #FFF9E5;     /* Light yellow (sun/moon) */
--color-yellow: #FFE5B3;           /* Yellow accent */
```

#### Outline & Text Colors
```css
--color-outline: #5D4037;          /* Dark brown outline (thick borders) */
--color-text-primary: #5D4037;     /* Dark brown text */
--color-text-secondary: #8D6E63;    /* Lighter brown text */
--color-text-light: #A1887F;       /* Light brown text */
```

#### Background Patterns
```css
--pattern-stripes-pink-yellow: repeating-linear-gradient(
  45deg,
  var(--color-pink-light),
  var(--color-pink-light) 10px,
  var(--color-yellow-light) 10px,
  var(--color-yellow-light) 20px
);

--pattern-dots: radial-gradient(circle, var(--color-outline) 1px, transparent 1px);
```

### Typography

```css
/* Playful, rounded font */
font-family: 'Comic Neue', 'Nunito', 'Inter', sans-serif;
font-weight: 400-700;
letter-spacing: 0.01em;
```

### Border Style
- **Thickness**: 3-4px for main elements, 2px for smaller elements
- **Color**: Dark brown (#5D4037)
- **Style**: Solid, rounded corners (8-12px border-radius)
- **Shadow**: Subtle drop shadow for depth

### Spacing System
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

---

## 🎭 Component Library Structure

### Core Design Components

```
components/design-system/
├── Button/
│   ├── PlayfulButton.tsx          # Main button component
│   ├── IconButton.tsx             # Icon-only button
│   └── Button.stories.tsx
├── Card/
│   ├── PlayfulCard.tsx            # Card with thick border
│   ├── AnimatedCard.tsx           # Card with hover animations
│   └── Card.stories.tsx
├── Input/
│   ├── PlayfulInput.tsx           # Text input with thick border
│   ├── PlayfulTextarea.tsx        # Textarea
│   └── Input.stories.tsx
├── Checkbox/
│   ├── PlayfulCheckbox.tsx        # Custom checkbox
│   └── Checkbox.stories.tsx
├── Badge/
│   ├── PlayfulBadge.tsx           # Status badges
│   └── Badge.stories.tsx
├── Panel/
│   ├── PlayfulPanel.tsx           # Section panels
│   └── Panel.stories.tsx
├── Icon/
│   ├── PlayfulIcon.tsx            # Icon wrapper with animations
│   └── Icon.stories.tsx
└── Animations/
    ├── Bounce.tsx                 # Bounce animation
    ├── Wiggle.tsx                 # Wiggle animation
    ├── Pulse.tsx                  # Pulse animation
    └── SlideIn.tsx                # Slide in animation
```

### Layout Components

```
components/layout/
├── PlayfulSidebar/
│   ├── PlayfulSidebar.tsx         # Redesigned sidebar
│   └── PlayfulSidebarItem.tsx
├── PlayfulHeader/
│   ├── PlayfulHeader.tsx           # Redesigned header
│   └── PlayfulHeaderButton.tsx
├── PlayfulContainer/
│   └── PlayfulContainer.tsx       # Main container with pattern
└── PlayfulGrid/
    └── PlayfulGrid.tsx            # Grid layout
```

### Game-Specific Components

```
components/game/
├── GoalCard/
│   ├── PlayfulGoalCard.tsx        # Goal display card
│   └── GoalCardAnimations.tsx
├── StepCard/
│   ├── PlayfulStepCard.tsx        # Step display card
│   └── StepCardAnimations.tsx
├── HabitCard/
│   ├── PlayfulHabitCard.tsx       # Habit display card
│   └── HabitCardAnimations.tsx
├── Calendar/
│   ├── PlayfulCalendar.tsx        # Calendar view
│   └── CalendarDay.tsx
└── Progress/
    ├── PlayfulProgressBar.tsx     # Progress indicators
    └── PlayfulProgressCircle.tsx
```

---

## 🎬 Animation System

### Animation Types

#### 1. **Bounce** (for buttons, cards on click)
```css
@keyframes playfulBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.05); }
}
```

#### 2. **Wiggle** (for attention/errors)
```css
@keyframes playfulWiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}
```

#### 3. **Pulse** (for active states)
```css
@keyframes playfulPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.9; }
}
```

#### 4. **Slide In** (for modals, panels)
```css
@keyframes playfulSlideIn {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

#### 5. **Float** (for decorative elements)
```css
@keyframes playfulFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

### Animation Utilities

```typescript
// lib/animations.ts
export const animations = {
  bounce: 'animate-playful-bounce',
  wiggle: 'animate-playful-wiggle',
  pulse: 'animate-playful-pulse',
  slideIn: 'animate-playful-slide-in',
  float: 'animate-playful-float',
}

export const animationDurations = {
  fast: 'duration-200',
  normal: 'duration-300',
  slow: 'duration-500',
}
```

---

## 📁 File Structure

### New Directories

```
pokrok-game-web/
├── components/
│   ├── design-system/          # NEW: Core design components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   ├── Checkbox/
│   │   ├── Badge/
│   │   ├── Panel/
│   │   ├── Icon/
│   │   └── Animations/
│   │
│   └── game/                   # NEW: Game-specific redesigned components
│       ├── GoalCard/
│       ├── StepCard/
│       ├── HabitCard/
│       ├── Calendar/
│       └── Progress/
│
├── styles/
│   ├── design-system.css      # NEW: Design system styles
│   ├── animations.css         # NEW: Animation keyframes
│   └── patterns.css           # NEW: Background patterns
│
└── lib/
    ├── design-tokens.ts       # NEW: Design tokens (colors, spacing)
    └── animations.ts           # NEW: Animation utilities
```

### Updated Files

```
app/globals.css                 # Update with new design system
tailwind.config.js              # Add new color palette and animations
```

---

## 🎯 Implementation Plan

### Phase 1: Design System Foundation
1. ✅ Create design tokens file (`lib/design-tokens.ts`)
2. ✅ Update `tailwind.config.js` with new colors
3. ✅ Create animation CSS file (`styles/animations.css`)
4. ✅ Create pattern CSS file (`styles/patterns.css`)
5. ✅ Update `app/globals.css` with new base styles

### Phase 2: Core Components
1. ✅ Create `PlayfulButton` component
2. ✅ Create `PlayfulCard` component
3. ✅ Create `PlayfulInput` component
4. ✅ Create `PlayfulCheckbox` component
5. ✅ Create `PlayfulBadge` component
6. ✅ Create `PlayfulPanel` component

### Phase 3: Layout Components
1. ✅ Redesign `SidebarNavigation` → `PlayfulSidebar`
2. ✅ Redesign header → `PlayfulHeader`
3. ✅ Create `PlayfulContainer` for main content

### Phase 4: Game Components
1. ✅ Redesign `TodayFocusSection` → `PlayfulFocusSection`
2. ✅ Redesign goal cards → `PlayfulGoalCard`
3. ✅ Redesign step cards → `PlayfulStepCard`
4. ✅ Redesign habit cards → `PlayfulHabitCard`
5. ✅ Redesign calendar views → `PlayfulCalendar`

### Phase 5: Views & Pages
1. ✅ Update `JourneyGameView` with new design
2. ✅ Update `WeekView` with new design
3. ✅ Update `MonthView` with new design
4. ✅ Update `DayView` with new design
5. ✅ Update all modals with new design

### Phase 6: Polish & Animations
1. ✅ Add micro-interactions
2. ✅ Add page transitions
3. ✅ Add loading animations
4. ✅ Add success/error animations
5. ✅ Performance optimization

---

## 🎨 Component Examples

### PlayfulButton
```tsx
interface PlayfulButtonProps {
  variant?: 'pink' | 'yellow-green' | 'purple' | 'yellow'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  children: React.ReactNode
  animated?: boolean
}

// Features:
// - Thick dark brown border (3-4px)
// - Pastel background color
// - Bounce animation on click
// - Rounded corners (12px)
// - Subtle shadow
// - Fully responsive:
//   - Full width on mobile (< 640px)
//   - Auto width on desktop (≥ 640px)
//   - Responsive padding and font sizes
//   - Touch-friendly sizes (min 44x44px)
//   - Smooth transitions
```

### PlayfulCard
```tsx
interface PlayfulCardProps {
  variant?: 'pink' | 'yellow-green' | 'purple' | 'pattern'
  children: React.ReactNode
  onClick?: () => void
  animated?: boolean
}

// Features:
// - Thick dark brown border (3-4px)
// - Pastel background or pattern
// - Hover lift animation
// - Rounded corners (16px)
```

### PlayfulCheckbox
```tsx
interface PlayfulCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  color?: 'pink' | 'yellow-green' | 'purple'
}

// Features:
// - Square with thick border
// - Checkmark animation on check
// - Color-coded states
// - Bounce on toggle
```

---

## 🎭 Design Principles

1. **Thick Outlines**: All interactive elements have 3-4px dark brown borders
2. **Pastel Colors**: Use soft, muted pastel colors for backgrounds
3. **Rounded Corners**: Generous border-radius (8-16px) for friendly feel
4. **Playful Animations**: Subtle bounce, wiggle, pulse animations
5. **Flat Design**: No gradients (except patterns), flat colors
6. **Consistent Spacing**: Use spacing system consistently
7. **Dark Brown Text**: All text in dark brown (#5D4037) for consistency
8. **Pattern Backgrounds**: Use diagonal stripes or dots for variety
9. **Button Design Rules**:
   - **All buttons must have shadow** (`box-playful-highlight` class with offset shadow effect)
   - **All buttons must have click animation** (scale down effect on click)
   - **Navigation/Menu buttons**: When active/selected, they stay "pressed" (no shadow, `box-playful-pressed` class)
   - **Regular buttons**: Click animation plays, then returns to shadow state
   - **Click animation**: Brief scale-down (0.95) with shadow reduction, then returns to normal
   - **Loading States**: When a button triggers an operation that may take time:
     - Show loading indicator (spinner/loader icon) or text ("Načítání", "Ukládání", etc.)
     - Disable the button during loading
     - Show spinner in place of icon if space is limited
     - Show text + spinner if there's enough space
     - Use appropriate loading text based on operation type (Loading/Saving/Processing)
10. **Responsive Design**: All components must be fully responsive
   - Mobile-first approach
   - Touch-friendly sizes (min 44x44px for touch targets)
   - Flexible layouts (flexbox/grid)
   - Responsive typography (sm, base, lg breakpoints)
   - Full-width on mobile, auto-width on desktop where appropriate

---

## 📝 Migration Strategy

### Step-by-Step Migration

1. **Start with Design System**
   - Create all design tokens
   - Build core components
   - Test in isolation

2. **Update Layout First**
   - Sidebar
   - Header
   - Main container

3. **Update Components Gradually**
   - Start with most visible components
   - Keep old components until new ones are ready
   - Use feature flags if needed

4. **Test & Iterate**
   - Test on all screen sizes
   - Ensure accessibility
   - Performance testing

---

## 🚀 Next Steps

1. Review and approve this structure
2. Start with Phase 1 (Design System Foundation)
3. Create first component (PlayfulButton) as proof of concept
4. Iterate based on feedback
5. Continue with remaining phases

---

## 📚 Resources

- Design inspiration: Provided image (playful, cartoon-like interface)
- Color palette: Pastel pink, yellow-green, purple with dark brown outlines
- Animation library: CSS animations + Framer Motion (optional)
- Typography: Comic Neue or Nunito for playful feel

