

# Fix: Profile Page Crash — "Cannot read properties of undefined (reading 'color')"

## Root Cause

**File**: `src/components/HabitBadges.tsx`, **line 33**

```ts
const study = studyConfig[habits.studyHabit];
```

When a new account is created, `habits.studyHabit` can be `undefined` (not yet set in the database). This makes `study` equal to `undefined`, and line 43 then crashes accessing `study.color`.

Secondary issue: `Profile.tsx` renders the full UI immediately without waiting for the profile data to load, so `HabitBadges` receives incomplete/default habits before Supabase responds.

## Changes

### 1. `src/components/HabitBadges.tsx` — Guard against undefined study habit

- Add a fallback: `const study = studyConfig[habits.studyHabit] ?? studyConfig.moderado;`
- Also guard against undefined `habits` prop entirely at the top of the component with an early return

### 2. `src/pages/Profile.tsx` — Add loading skeleton

- Import `Skeleton` from `@/components/ui/skeleton`
- Read `loading` from `useProfile()` (it's already returned by the hook)
- When `loading` is `true`, render a skeleton layout instead of the full form
- This prevents rendering `HabitBadges` or any field before data is available

### Files

| File | Change |
|------|--------|
| `src/components/HabitBadges.tsx` | Fallback for undefined `studyHabit`, guard for undefined `habits` |
| `src/pages/Profile.tsx` | Add loading state with Skeleton UI |

