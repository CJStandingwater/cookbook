# Recipe Schema Reference

This document describes the structure and validation rules for recipe JSON files in this project. All recipes must conform to `/schema/recipe.schema.json`.

## Required Fields

### `id` (string)

A UUID v4 identifier for the recipe.

The value must be 36 characters (32 hexadecimal characters plus 4 hyphens) long and match the UUID v4 format.

### `title` (string)

The name of the recipe.

The value must contain at least one character.

### `authors` (array of strings)

The names or aliases of the recipe contributors.

Requirements:

- At least one author is required.
- Each author must be a non-empty string.
- Duplicate authors are not allowed.

Example:

```json
"authors": [
  "John Doe",
  "Jane Doe"
]
```

### `ingredients` (array of ingredient groups)

A recipe must contain at least one ingredient group.

Each ingredient group contains:

- `section` (string, optional): A label describing the group.
- `items` (array, required): The ingredients belonging to the group.

Each group must contain at least one ingredient.

Example:

```json
"ingredients": [
  {
    "section": "Filling",
    "items": [
      {
        "item": "Red Bell Pepper",
        "volume_ml": 59.147,
        "note": "Diced"
      }
    ]
  }
]
```

## Ingredient Fields

Each ingredient requires:

- `item` (string): The normalized ingredient name.

Each ingredient must also include at least one quantity field:

- `volume_ml` (number): Volume expressed in milliliters.
- `weight_g` (number): Weight expressed in grams.
- `count` (number): Number of discrete items.

More than one quantity type may be included when useful.

All quantity values must be greater than zero.

Example using volume:

```json
{
  "item": "Milk",
  "volume_ml": 240
}
```

Example using weight:

```json
{
  "item": "Flour",
  "weight_g": 250
}
```

Example using count:

```json
{
  "item": "Eggs",
  "count": 3,
  "note": "Large"
}
```

Example containing both volume and weight:

```json
{
  "item": "Flour",
  "volume_ml": 473.176,
  "weight_g": 250
}
```

### `optional` (boolean, optional)

Indicates that an ingredient is not required to prepare the recipe.

The form normally includes this field only when its value is `true`.

Example:

```json
{
  "item": "Fresh Parsley",
  "count": 1,
  "optional": true,
  "note": "Small bunch"
}
```

### `note` (string, optional)

Provides additional information about an ingredient, such as preparation, size, or usage.

Example:

```json
{
  "item": "Yellow Onion",
  "volume_ml": 59.147,
  "note": "Diced"
}
```

### `substitutes` (array, optional)

Contains one or more substitution sets.

Each substitution set represents one complete alternative to the original ingredient. A substitution set may contain one ingredient or several ingredients that are intended to be used together.

Substitute ingredients use the same quantity fields as normal ingredients:

- `volume_ml`
- `weight_g`
- `count`
- `optional`
- `note`

Substitute ingredients can contain additional nested substitute sets.

Example with a single-item substitute:

```json
"substitutes": [
  [
    {
      "item": "Almond Butter",
      "weight_g": 32
    }
  ]
]
```

Example with a compound substitute:

```json
"substitutes": [
  [
    {
      "item": "Peanuts",
      "weight_g": 28
    },
    {
      "item": "Peanut Oil",
      "volume_ml": 5
    }
  ]
]
```

Example with a nested compound substitute (the compound substitute has variations):

```json
"substitutes": [
  [
    {
      "item": "Whole Milk",
      "volume_ml": 240
    },
    {
      "item": "Lemon Juice",
      "volume_ml": 15,
      "substitutes": [
        [
          {
            "item": "Vinegar",
            "volume_ml": 15
          }
        ]
      ]
    }
  ]
]
```

Example with a nested compound substitute and a single item substitute:

```json
"substitutes": [
  [
    {
      "item": "Whole Milk",
      "volume_ml": 240
    },
    {
      "item": "Lemon Juice",
      "volume_ml": 15,
      "substitutes": [
        [
          {
            "item": "Vinegar",
            "volume_ml": 15
          }
        ]
      ]
    }
  ],
  [
    {
      "item": "Greek Yogurt",
      "volume_ml": 240
    }
  ]
]
```

## `instructions` (array of steps)

A recipe must contain at least one instruction step.

Each step requires:

- `action` (string): The primary action performed during the step.
- `content` (string): The full instructions for performing the step.

A step may also include:

- `notes` (array of strings): Additional tips, clarifications, warnings, or contextual information.

Example:

```json
{
  "action": "whisk",
  "content": "Whisk together the eggs and salt until evenly combined."
}
```

Example with notes:

```json
{
  "action": "serve",
  "content": "Serve the omelet immediately.",
  "notes": [
    "Cover briefly before removing from the heat if the center needs additional cooking."
  ]
}
```

### Allowed Instruction Actions

The `action` values must come from the approved vocabulary in:

`/schema/actions.enum.json`

The action identifies the primary operation of the step. More detailed actions and context belong in the `content` field.

# Optional Fields

## `timings` (array)

Contains one or more recipe timing entries.

Each timing entry requires:

- `title` (string): The type of timing, such as `prep`, `cook`, or `total`.
- `minutes` (number): Duration in minutes.

Timing minutes must be greater than zero.

Example:

```json
"timings": [
  {
    "title": "prep",
    "minutes": 15
  },
  {
    "title": "cook",
    "minutes": 90
  }
]
```

## `servings` (number)

The number of servings produced by the recipe.

The value must be greater than zero.

Example:

```json
"servings": 4
```

## `tags` (array of strings)

Used to categorize recipes.

Tag values must come from the approved vocabulary in:

`/schema/tags.enum.json`

Duplicate tags are not allowed.

Example:

```json
"tags": [
  "breakfast",
  "high-protein",
  "quick"
]
```

## `notes` (array of strings)

General notes or tips applying to the recipe as a whole.

Each note must be a non-empty string.

Example:

```json
"notes": [
  "Prepare the filling before beginning the eggs.",
  "Serve immediately for the best texture."
]
```

## `nutrition` (object)

Contains optional nutrition information.

Supported fields are:

- `calories`
- `protein`
- `fat`
- `carbohydrates`
- `fiber`

All values are numbers greater than or equal to zero.

By project convention, nutrition values represent amounts per serving.

Example:

```json
"nutrition": {
  "calories": 320,
  "protein": 18,
  "fat": 22,
  "carbohydrates": 8,
  "fiber": 2
}
```

## `source` (string)

Identifies the original source, publication, contributor, or inspiration for the recipe.

The value must be a non-empty string when present.

Example:

```json
"source": "Pantry Potpourri"
```

## `tools` (array of strings)

Lists recommended equipment or tools.

Tool values must come from the approved vocabulary in:

`/schema/tools.enum.json`

Example:

```json
"tools": [
    "measuring spoons",
    "mixer",
    "oven"
]
```

## `difficulty` (string)

Indicates the general difficulty of the recipe.

Allowed values are:

- `"easy"`
- `"moderate"`
- `"hard"`

Example:

```json
"difficulty": "easy"
```

---

# Normalization

Recipe input may be converted into normalized values before being stored.

### Ingredient measurements

Volume is stored in:

```text
milliliters → volume_ml
```

Weight is stored in:

```text
grams → weight_g
```

Discrete ingredients are stored using:

```text
count
```

For example:

```text
2 tablespoons → 29.574 mL
```

becomes:

```json
"volume_ml": 29.574
```

and:

```text
3 large eggs
```

becomes:

```json
{
  "item": "Eggs",
  "count": 3,
  "note": "Large"
}
```

### Text

Ingredient names and similar labels should use consistent capitalization and whitespace.

For example:

```text
peanut buTter
```

is normalized to:

```text
Peanut Butter
```

### Timing

Timing input may originally be provided in minutes or hours, but stored recipe data always uses minutes.

For example:

```text
1.5 hours
```

becomes:

```json
{
  "value": 90,
  "unit": "minute"
}
```

---

# Validation

All recipe files must validate against:

`/schema/recipe.schema.json`

The complete local validation suite can be run from the project root with:

```bash
npm run check
```

This command:

1. Generates the flattened approved tag schema.
2. Validates all recipe JSON files against the recipe schema.
3. Checks the recipe collection for possible duplicates.