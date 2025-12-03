# JourneyGameView.tsx Refactoring Plan

## Current Status
- **Current file size**: 12,163 lines
- **Target file size**: < 2,000 lines
- **Lines to extract**: ~10,000+ lines

## Completed Extractions
1. ✅ DroppableColumn → `./journey/DroppableColumn.tsx` (~15 lines saved)

## Components to Extract (Priority Order)

### High Priority (Largest Components)
1. **StepModal** (~500 lines) - Lines ~10795-11336
   - Large modal component for creating/editing steps
   - Includes checklist management
   - Dependencies: stepModalData, setStepModalData, handleSaveStepModal, etc.

2. **HabitModal** (~600+ lines) - Lines ~11339-12100+
   - Large modal component for creating/editing habits
   - Complex frequency selection logic
   - Dependencies: habitModalData, editingHabitName, etc.

3. **GoalDetailPage** (~1000+ lines) - Lines ~8038-9000+
   - Entire goal detail view
   - Step management within goal
   - Dependencies: goals, stepsCacheRef, etc.

4. **HabitDetailPage** (~800+ lines) - Lines ~8014-8034
   - Habit detail view with calendar
   - Statistics and settings tabs
   - Dependencies: habits, handleHabitCalendarToggle, etc.

5. **CreateGoalForm** (~600+ lines) - Lines ~5540-6200+
   - Form for creating new goals
   - Step creation within goal
   - Dependencies: newGoal, setNewGoal, etc.

6. **renderDetailContent** (~600+ lines) - Lines ~1928-2819
   - Step/Habit/Goal detail views
   - Multiple switch cases
   - Dependencies: selectedItem, selectedItemType, etc.

### Medium Priority
7. **DraggableStep** (~310 lines) - Lines ~5214-5522
   - Draggable step component
   - Inline editing
   - Dependencies: step, handleStepToggle, etc.

8. **renderChillContent** (~1000+ lines) - Lines ~2959-4000+
   - Chill/relaxation view
   - Multiple scene components
   - Dependencies: player, stats, etc.

9. **renderActionButtons** (~140 lines) - Lines ~2821-2957
   - Action buttons for different item types
   - Dependencies: selectedItem, selectedItemType, etc.

10. **renderGoalsContent** (~600+ lines) - Lines ~5540-6200+
    - Goals overview and creation
    - Dependencies: goals, showCreateGoal, etc.

## Extraction Strategy

For each component:
1. Create new file in appropriate directory (e.g., `./journey/` for journey-specific components)
2. Extract component with all necessary props
3. Import required dependencies (hooks, utilities, icons)
4. Update JourneyGameView.tsx to import and use the extracted component
5. Remove original component code from JourneyGameView.tsx

## Notes
- Many components share state and handlers - these should be passed as props
- Some components use hooks that need to remain in the parent (e.g., useTranslations, useLocale)
- Cache refs and complex state management may need to be passed down
- Consider creating shared types/interfaces file for common prop types

## Estimated Impact
- StepModal: ~500 lines
- HabitModal: ~600 lines
- GoalDetailPage: ~1000 lines
- HabitDetailPage: ~800 lines
- CreateGoalForm: ~600 lines
- renderDetailContent: ~600 lines
- DraggableStep: ~310 lines
- renderChillContent: ~1000 lines
- renderActionButtons: ~140 lines
- renderGoalsContent: ~600 lines

**Total estimated extraction**: ~6,150 lines
**Remaining after extraction**: ~6,000 lines (still needs more work)

Additional extractions needed:
- Handler functions (can be moved to separate hooks or utility files)
- State management (can be extracted to custom hooks)
- Utility functions and helpers
- Large render functions for different views

