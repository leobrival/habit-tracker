# Forms Architecture: TanStack Form + Zod

**Feature**: 001-habit-tracker
**Date**: 2025-11-15
**Approach**: Modular TanStack Form with Zod validation (inspired by Nowts UI)

## Overview

This document defines the form architecture for the Habit Tracking Application using **TanStack Form** with a modular, type-safe approach inspired by [Nowts UI](https://ui.nowts.app/docs/components/tanstack-form).

### Why TanStack Form over React Hook Form?

| Feature                  | TanStack Form                                 | React Hook Form                         |
| ------------------------ | --------------------------------------------- | --------------------------------------- |
| **Type Safety**          | Full TypeScript inference from Zod schema     | Manual type annotations required        |
| **Modularity**           | Composable field components with render props | Centralized Controller/register pattern |
| **Performance**          | Granular reactivity with selectors            | Global re-renders on form state change  |
| **Developer Experience** | Dot/bracket notation for nested fields        | Manual `watch()` for nested paths       |
| **Bundle Size**          | ~15KB minified                                | ~25KB minified                          |
| **Validation**           | Native Zod integration with schema inference  | Requires resolver adapter               |

---

## Core Architecture

### 1. Form Hook Pattern

Every form starts with the `useForm()` hook:

```typescript
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";

// Define Zod schema
const boardSchema = z.object({
  name: z
    .string()
    .min(1, "Board name is required")
    .max(50, "Max 50 characters"),
  emoji: z.string().emoji("Must be a valid emoji").optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .optional(),
  unitType: z.enum([
    "boolean",
    "time",
    "distance",
    "volume",
    "mass",
    "calories",
    "money",
    "percentage",
    "custom",
  ]),
  unit: z.string().optional(),
  targetAmount: z.number().positive("Target must be positive").optional(),
});

// Create form instance
const form = useForm({
  defaultValues: {
    name: "",
    emoji: undefined,
    color: "#3B82F6",
    unitType: "boolean" as const,
    unit: undefined,
    targetAmount: undefined,
  },
  validatorAdapter: zodValidator(),
  validators: {
    onChange: boardSchema,
  },
  onSubmit: async ({ value }) => {
    // Type-safe submission (value is inferred from schema)
    await createBoard(value);
  },
});
```

### 2. Modular Field Components

TanStack Form uses a **composable render props pattern** for maximum flexibility:

```typescript
<form.AppField name="name">
  {(field) => (
    <field.Field>
      <field.Label>Board Name</field.Label>
      <field.Content>
        <field.Input
          placeholder="Morning Workout"
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
        />
        <field.Message /> {/* Auto-displays Zod errors */}
      </field.Content>
      <field.Description>
        Choose a descriptive name for your habit
      </field.Description>
    </field.Field>
  )}
</form.AppField>
```

#### Component Hierarchy

```
form.AppField (type-safe field connector)
└── field.Field (error state container)
    ├── field.Label (auto-linked to input via htmlFor)
    ├── field.Content (wrapper for input + message)
    │   ├── field.Input | field.Textarea | field.Select | field.Checkbox | field.Switch
    │   └── field.Message (error display - auto-shows Zod errors)
    └── field.Description (helper text)
```

### 3. Field Types & Components

#### Text Input

```typescript
<form.AppField name="name">
  {(field) => (
    <field.Field>
      <field.Label>Name</field.Label>
      <field.Content>
        <field.Input
          type="text"
          placeholder="Enter name"
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
        />
        <field.Message />
      </field.Content>
    </field.Field>
  )}
</form.AppField>
```

#### Select Dropdown

```typescript
<form.AppField name="unitType">
  {(field) => (
    <field.Field>
      <field.Label>Unit Type</field.Label>
      <field.Content>
        <field.Select
          onValueChange={field.handleChange}
          value={field.state.value}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select unit type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="boolean">Yes/No</SelectItem>
            <SelectItem value="time">Time</SelectItem>
            <SelectItem value="distance">Distance</SelectItem>
          </SelectContent>
        </field.Select>
        <field.Message />
      </field.Content>
    </field.Field>
  )}
</form.AppField>
```

#### Number Input

```typescript
<form.AppField name="targetAmount">
  {(field) => (
    <field.Field>
      <field.Label>Daily Target</field.Label>
      <field.Content>
        <field.Input
          type="number"
          min={0}
          step={1}
          placeholder="Enter target"
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(Number(e.target.value))}
        />
        <field.Message />
      </field.Content>
    </field.Field>
  )}
</form.AppField>
```

#### Checkbox/Switch

```typescript
<form.AppField name="isArchived">
  {(field) => (
    <field.Field>
      <field.Label>Archive Board</field.Label>
      <field.Content>
        <field.Switch
          checked={field.state.value}
          onCheckedChange={field.handleChange}
        />
        <field.Message />
      </field.Content>
      <field.Description>
        Archived boards are hidden from dashboard
      </field.Description>
    </field.Field>
  )}
</form.AppField>
```

---

## Advanced Patterns

### 1. Nested Objects (Dot Notation)

```typescript
// Schema
const userSchema = z.object({
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }),
  settings: z.object({
    timezone: z.string(),
    theme: z.enum(["light", "dark", "system"]),
  }),
});

// Usage
<form.AppField name="profile.firstName">
  {(field) => (
    <field.Field>
      <field.Label>First Name</field.Label>
      <field.Content>
        <field.Input
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
        />
        <field.Message />
      </field.Content>
    </field.Field>
  )}
</form.AppField>
```

### 2. Array Fields (Dynamic Lists)

```typescript
// Schema
const formSchema = z.object({
  tags: z.array(z.string()).min(1, "At least one tag required"),
});

// Usage
<form.AppField name="tags" mode="array">
  {(field) => (
    <field.Field>
      <field.Label>Tags</field.Label>
      <field.Content>
        {field.state.value.map((_, index) => (
          <div key={index} className="flex gap-2">
            <form.AppField name={`tags[${index}]`}>
              {(subField) => (
                <field.Input
                  value={subField.state.value}
                  onChange={(e) => subField.handleChange(e.target.value)}
                />
              )}
            </form.AppField>
            <Button
              type="button"
              onClick={() => field.removeValue(index)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          onClick={() => field.pushValue("")}
        >
          Add Tag
        </Button>
        <field.Message />
      </field.Content>
    </field.Field>
  )}
</form.AppField>
```

### 3. Conditional Fields

```typescript
// Show custom unit input only if unitType is "custom"
<form.Subscribe selector={(state) => state.values.unitType}>
  {(unitType) => (
    unitType === "custom" && (
      <form.AppField name="unit">
        {(field) => (
          <field.Field>
            <field.Label>Custom Unit Label</field.Label>
            <field.Content>
              <field.Input
                placeholder="e.g., 'reps', 'sessions'"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <field.Message />
            </field.Content>
          </field.Field>
        )}
      </form.AppField>
    )
  )}
</form.Subscribe>
```

### 4. Form State Subscription

```typescript
<form.Subscribe
  selector={(state) => ({
    isSubmitting: state.isSubmitting,
    canSubmit: state.canSubmit,
    isDirty: state.isDirty,
    errors: state.errors,
  })}
>
  {({ isSubmitting, canSubmit, isDirty, errors }) => (
    <>
      <Button
        type="submit"
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? "Creating..." : "Create Board"}
      </Button>

      {isDirty && (
        <p className="text-sm text-muted-foreground">
          You have unsaved changes
        </p>
      )}

      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          Please fix the errors above
        </Alert>
      )}
    </>
  )}
</form.Subscribe>
```

---

## Validation Modes

TanStack Form supports three validation strategies:

### 1. `onChange` (Real-time)

```typescript
const form = useForm({
  validators: {
    onChange: boardSchema, // Validates on every keystroke
  },
});
```

**Use case**: Immediate feedback for critical fields (passwords, emails)
**Trade-off**: Can feel aggressive for long forms

### 2. `onBlur` (Lazy)

```typescript
const form = useForm({
  validators: {
    onBlur: boardSchema, // Validates when field loses focus
  },
});
```

**Use case**: Better UX for most forms - validates after user finishes typing
**Trade-off**: Delayed feedback

### 3. `onSubmit` (Deferred)

```typescript
const form = useForm({
  validators: {
    onSubmit: boardSchema, // Validates only on form submission
  },
});
```

**Use case**: Simple forms with few fields
**Trade-off**: Errors shown only after submission attempt

### Hybrid Approach (Recommended)

```typescript
const form = useForm({
  validators: {
    onBlur: boardSchema, // Validate on blur for UX
    onSubmit: boardSchema, // Re-validate on submit for safety
  },
});
```

---

## Integration with shadcn/ui

TanStack Form works seamlessly with shadcn/ui components:

```typescript
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

<form.AppField name="name">
  {(field) => (
    <div className="space-y-2">
      <Label htmlFor={field.name}>Board Name</Label>
      <Input
        id={field.name}
        placeholder="Morning Workout"
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}
      />
      {field.state.meta.errors.length > 0 && (
        <p className="text-sm text-destructive">
          {field.state.meta.errors[0]}
        </p>
      )}
    </div>
  )}
</form.AppField>
```

---

## Complete Form Example: Board Creation

```typescript
// components/boards/board-form.tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Zod Schema
const boardSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Max 50 characters"),
  emoji: z.string().emoji("Must be a valid emoji").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
  unitType: z.enum(["boolean", "time", "distance", "volume", "mass", "calories", "money", "percentage", "custom"]),
  unit: z.string().optional(),
  targetAmount: z.number().positive("Must be positive").optional(),
}).refine(
  (data) => data.unitType !== "custom" || data.unit,
  {
    message: "Custom unit label is required when using custom unit type",
    path: ["unit"],
  }
);

export function BoardForm() {
  const createBoard = useMutation(api.boards.create);

  const form = useForm({
    defaultValues: {
      name: "",
      emoji: undefined,
      color: "#3B82F6",
      unitType: "boolean" as const,
      unit: undefined,
      targetAmount: undefined,
    },
    validatorAdapter: zodValidator(),
    validators: {
      onBlur: boardSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await createBoard(value);
        // Reset form and close dialog
        form.reset();
      } catch (error) {
        console.error("Failed to create board:", error);
      }
    },
  });

  return (
    <form.AppForm className="space-y-4">
      {/* Board Name */}
      <form.AppField name="name">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Board Name</Label>
            <Input
              id={field.name}
              placeholder="Morning Workout"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.AppField>

      {/* Unit Type */}
      <form.AppField name="unitType">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Unit Type</Label>
            <Select
              value={field.state.value}
              onValueChange={field.handleChange}
            >
              <SelectTrigger id={field.name}>
                <SelectValue placeholder="Select unit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boolean">Yes/No</SelectItem>
                <SelectItem value="time">Time (minutes/hours)</SelectItem>
                <SelectItem value="distance">Distance (km/miles)</SelectItem>
                <SelectItem value="volume">Volume (liters/ml)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.AppField>

      {/* Conditional Custom Unit */}
      <form.Subscribe selector={(state) => state.values.unitType}>
        {(unitType) => (
          unitType === "custom" && (
            <form.AppField name="unit">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Custom Unit Label</Label>
                  <Input
                    id={field.name}
                    placeholder="e.g., 'reps', 'sessions'"
                    value={field.state.value || ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.AppField>
          )
        )}
      </form.Subscribe>

      {/* Target Amount (optional) */}
      <form.AppField name="targetAmount">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Daily Target (optional)</Label>
            <Input
              id={field.name}
              type="number"
              min={0}
              step={1}
              placeholder="e.g., 30 (minutes)"
              value={field.state.value || ""}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : undefined)}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.AppField>

      {/* Submit Button */}
      <form.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          canSubmit: state.canSubmit,
        })}
      >
        {({ isSubmitting, canSubmit }) => (
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Creating..." : "Create Board"}
          </Button>
        )}
      </form.Subscribe>
    </form.AppForm>
  );
}
```

---

## File Organization

```
components/
├── forms/
│   ├── board-form.tsx           # Board creation/edit form
│   ├── check-in-form.tsx        # Quick check-in form
│   ├── profile-form.tsx         # User profile settings
│   └── notification-form.tsx    # Reminder settings
└── ui/
    └── form/                     # Reusable form primitives (if needed)
        ├── form-field.tsx
        ├── form-label.tsx
        └── form-message.tsx
```

---

## Best Practices

### 1. ✅ Always Use Zod Schemas

```typescript
// ❌ BAD: Manual validation
const form = useForm({
  validators: {
    onChange: (value) => {
      if (!value.name) return { fields: { name: "Required" } };
      if (value.name.length > 50) return { fields: { name: "Too long" } };
    },
  },
});

// ✅ GOOD: Zod schema
const schema = z.object({
  name: z.string().min(1, "Required").max(50, "Too long"),
});

const form = useForm({
  validatorAdapter: zodValidator(),
  validators: { onChange: schema },
});
```

### 2. ✅ Leverage Type Inference

```typescript
// TypeScript automatically infers field types from schema
const schema = z.object({
  targetAmount: z.number().optional(),
});

// field.state.value is typed as `number | undefined`
<form.AppField name="targetAmount">
  {(field) => {
    // TypeScript knows field.state.value is number | undefined
    const value = field.state.value; // Type: number | undefined
  }}
</form.AppField>
```

### 3. ✅ Use Granular Subscriptions

```typescript
// ❌ BAD: Subscribe to entire form state
<form.Subscribe>
  {(state) => (
    <Button disabled={state.isSubmitting}>Submit</Button>
  )}
</form.Subscribe>

// ✅ GOOD: Subscribe only to needed fields
<form.Subscribe selector={(state) => state.isSubmitting}>
  {(isSubmitting) => (
    <Button disabled={isSubmitting}>Submit</Button>
  )}
</form.Subscribe>
```

### 4. ✅ Validate Conditionally

```typescript
// Schema with conditional validation
const schema = z
  .object({
    unitType: z.enum(["boolean", "custom"]),
    unit: z.string().optional(),
  })
  .refine((data) => data.unitType !== "custom" || data.unit, {
    message: "Custom unit required",
    path: ["unit"],
  });
```

### 5. ✅ Extract Reusable Field Components

```typescript
// components/forms/fields/emoji-picker-field.tsx
export function EmojiPickerField({ name }: { name: string }) {
  return (
    <form.AppField name={name}>
      {(field) => (
        <div className="space-y-2">
          <Label htmlFor={field.name}>Emoji</Label>
          <EmojiPicker
            value={field.state.value}
            onChange={field.handleChange}
          />
          {field.state.meta.errors.length > 0 && (
            <p className="text-sm text-destructive">
              {field.state.meta.errors[0]}
            </p>
          )}
        </div>
      )}
    </form.AppField>
  );
}

// Usage
<EmojiPickerField name="emoji" />
```

---

## Migration Path from React Hook Form

If any existing code uses React Hook Form, follow this migration:

| React Hook Form           | TanStack Form Equivalent                               |
| ------------------------- | ------------------------------------------------------ |
| `useForm()`               | `useForm({ validatorAdapter: zodValidator() })`        |
| `register("name")`        | `<form.AppField name="name">{(field) => ...}`          |
| `watch("unitType")`       | `<form.Subscribe selector={(s) => s.values.unitType}>` |
| `formState.errors.name`   | `field.state.meta.errors`                              |
| `setValue("name", value)` | `field.handleChange(value)`                            |
| `reset()`                 | `form.reset()`                                         |
| `handleSubmit(onSubmit)`  | `onSubmit` in `useForm()` config                       |

---

## Summary

**TanStack Form Architecture**:

- ✅ **Type-safe** via Zod schema inference
- ✅ **Modular** with composable field components
- ✅ **Performant** with granular reactivity
- ✅ **Flexible** with render props pattern
- ✅ **Developer-friendly** with dot/bracket notation for nested fields

**Next Steps**:

1. Install dependencies: `bun add @tanstack/react-form @tanstack/zod-form-adapter`
2. Create form schemas in `lib/validations/`
3. Build reusable field components in `components/forms/`
4. Implement forms following patterns in this guide

**Status**: ✅ Architecture defined, ready for implementation
