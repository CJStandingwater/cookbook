# Recipe Schema Reference

This document describes the structure and rules for all recipe JSON files in this project. Recipes must follow this schema to be valid.

## Required Fields

### `title` (string)
The name of the recipe.

### `authors` (array of strings)
The names or aliases of the recipe contributors. At least one author is required.

### `ingredients` (array of ingredient groups)
Each group contains an optional `section` label and an array of `items`.

#### Ingredient item fields:
- `item` (string): Name of the ingredient.
- `amount` (number): Quantity in decimal form (e.g., 1.5 for "1 1/2").
- `unit` (string, optional): Measurement unit (e.g., "cups", "tbsp").
- `alt_amount` (number, optional): Alternate measurement value.
- `alt_unit` (string, optional): Unit for the alternate amount.
- `note` (string, optional): A note about this ingredient.
- `substitutes` (optional): An array of **substitution sets**, where each set is a list of ingredients that together replace the original ingredient.

### `instructions` (array of steps)
Each step has:
- `title` (string): A short label for the step (e.g., "Blend", "Bake").
- `content` (string): Full instructions for the step.
- `notes` (optional array of strings): One or more context-specific tips, clarifications, or substitution instructions.

## Optional Fields

### `timings` (array)
Each timing entry is an object with:
- `title` (string): e.g., "prep", "cook", "ferment".
- `value` (number): Time value.
- `unit` (string, optional): One of `"minutes"`, `"minute"`, `"hours"`, or `"hour"`.

### `servings` (number)
Total number of servings the recipe makes.

### `tags` (array of strings)
Used for categorization. Values are restricted to the approved tag list defined in `schema/tags.enum.json`.

### `notes` (array of strings)
General notes about the recipe.

### `nutrition` (object, optional)
Can include any of:
- `calories`
- `protein`
- `fat`
- `carbohydrates`
- `fiber`

All values are numbers. By project convention, nutrition values represent amounts per serving.

### `variations` (array of strings)
Optional version ideas, swaps, or creative adjustments.

### `source` (string)
Text or URL crediting the original source or inspiration for the recipe.

### `tools` (array of strings)
Recommended tools or equipment for the recipe.

### `difficulty` (string)
One of `"easy"`, `"moderate"`, or `"hard"`.

---

## Validation

All recipe files must be valid against `/schema/recipe.schema.json`.

Before submitting a recipe, run the project's local validation:

`npm run check`

For help, see `docs/how_to_contribute.md`.