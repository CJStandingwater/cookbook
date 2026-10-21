import Ajv2020 from 'ajv/dist/2020.js';

import recipeSchema from '../../schema/recipe.schema.json';
import commonSchema from '../../schema/common.json';
import actionsSchema from '../../schema/actions.enum.json';
import tagsSchema from '../../schema/tags.flattened.json';
import difficultySchema from '../../schema/difficulty.enum.json';
import formsSchema from '../../schema/forms.enum.json';

import { getKnownIngredientNames } from './database.js';

const MODEL = 'gpt-6-sol';
const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

const IMPORT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: [
        'title',
        'authors',
        "image",
        'ingredients',
        'instructions',
        'timings',
        'servings',
        'tags',
        'notes',
        'nutrition',
        'source',
        'tools',
        'difficulty',
    ],
    properties: {
        title: {
            type: 'string',
        },

        authors: {
            type: 'array',
            items: {
                type: 'string',
            },
        },

        image: {
            anyOf: [
                {
                    $ref: '#/$defs/image',
                },
                {
                    type: 'null',
                },
            ],
        },

        ingredients: {
            type: 'array',
            items: {
                $ref: '#/$defs/ingredientGroup',
            },
        },

        instructions: {
            type: 'array',
            items: {
                $ref: '#/$defs/instruction',
            },
        },

        timings: {
            type: 'array',
            items: {
                $ref: '#/$defs/timing',
            },
        },

        servings: {
            type: [
                'number',
                'null',
            ],
        },

        tags: {
            type: 'array',
            items: {
                type: 'string',
                enum: tagsSchema.enum,
            },
        },

        notes: {
            type: 'array',
            items: {
                type: 'string',
            },
        },

        nutrition: {
            $ref: '#/$defs/nutrition',
        },

        source: {
            type: [
                'string',
                'null',
            ],
        },

        tools: {
            type: 'array',
            items: {
                type: 'string',
            },
        },

        difficulty: {
            type: [
                'string',
                'null',
            ],
            enum: [
                ...difficultySchema.enum,
                null,
            ],
        },
    },

    $defs: {
        image: {
            type: 'object',
            additionalProperties: false,
            required: [
                'src',
                'alt',
            ],
            properties: {
                src: {
                    type: 'string',
                },

                alt: {
                    type: 'string',
                },
            },
        },

        ingredientGroup: {
            type: 'object',
            additionalProperties: false,
            required: [
                'section',
                'items',
            ],
            properties: {
                section: {
                    type: [
                        'string',
                        'null',
                    ],
                },
                items: {
                    type: 'array',
                    items: {
                        $ref: '#/$defs/ingredient',
                    },
                },
            },
        },

        ingredient: {
            type: 'object',
            additionalProperties: false,
            required: [
                'ingredient',
                'form',
                'volume_ml',
                'weight_g',
                'count',
                'preferred_measurement',
                'optional',
                'note',
                'substitutes',
            ],
            properties: {
                ingredient: {
                    type: 'string',
                    description: 'Canonical ingredient identity. Include descriptors that distinguish the ingredient itself as a different food or product, such as "Granulated Sugar", "Brown Sugar", "Bread Flour", "All Purpose Flour", or "Extra Virgin Olive Oil". Do not include preparation, size, or physical-state modifiers that belong in form.',
                },

                form: {
                    type: 'array',
                    description: 'Approved preparation, physical-state, condition, or size modifiers. Prefer this field over note whenever the source information can be represented exactly by an approved form value. Do not duplicate form values in note.',
                    items: {
                        type: 'string',
                        enum: formsSchema.enum,
                    },
                },

                volume_ml: {
                    type: [
                        'number',
                        'null',
                    ],
                },

                weight_g: {
                    type: [
                        'number',
                        'null',
                    ],
                },

                count: {
                    type: [
                        'number',
                        'null',
                    ],
                },

                preferred_measurement: {
                    anyOf: [
                        {
                            type: 'object',
                            additionalProperties: false,
                            required: [
                                'metric',
                                'imperial',
                            ],
                            properties: {
                                metric: {
                                    type: 'string',
                                    enum: [
                                        'volume',
                                        'weight',
                                    ],
                                },
                                imperial: {
                                    type: 'string',
                                    enum: [
                                        'volume',
                                        'weight',
                                    ],
                                },
                            },
                        },
                        {
                            type: 'null',
                        },
                    ],
                },

                optional: {
                    type: 'boolean',
                },

                note: {
                    type: [
                        'string',
                        'null',
                    ],
                    description: 'Ingredient-specific information that cannot be represented by the ingredient identity or approved form values. Do not repeat information already represented by form.',
                },

                substitutes: {
                    type: 'array',
                    items: {
                        type: 'array',
                        items: {
                            $ref: '#/$defs/ingredient',
                        },
                    },
                },
            },
        },

        instruction: {
            type: 'object',
            additionalProperties: false,
            required: [
                'action',
                'content',
                'image',
                'notes',
            ],
            properties: {
                action: {
                    type: 'string',
                    enum: actionsSchema.enum,
                },

                content: {
                    type: 'string',
                },

                image: {
                    anyOf: [
                        {
                            $ref: '#/$defs/image',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },

                notes: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                },
            },
        },

        timing: {
            type: 'object',
            additionalProperties: false,
            required: [
                'title',
                'minutes',
            ],
            properties: {
                title: {
                    type: 'string',
                },

                minutes: {
                    type: 'number',
                },
            },
        },

        nutrition: {
            type: 'object',
            additionalProperties: false,
            required: [
                'calories',
                'protein',
                'fat',
                'carbohydrates',
                'fiber',
            ],
            properties: {
                calories: {
                    type: [
                        'number',
                        'null',
                    ],
                },

                protein: {
                    type: [
                        'number',
                        'null',
                    ],
                },

                fat: {
                    type: [
                        'number',
                        'null',
                    ],
                },

                carbohydrates: {
                    type: [
                        'number',
                        'null',
                    ],
                },

                fiber: {
                    type: [
                        'number',
                        'null',
                    ],
                },
            },
        },
    },
};

const IMAGE_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
]);

const IMAGE_EXTENSIONS = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
};

const ajv = new Ajv2020({ allErrors: true });

ajv.addSchema(commonSchema);
ajv.addSchema(actionsSchema);
ajv.addSchema(tagsSchema);
ajv.addSchema(difficultySchema, 'difficulty.enum.json');
ajv.addSchema(formsSchema);

const validateRecipe = ajv.compile(recipeSchema);

export async function importRecipe(file, env) {
    const fileError = validateFile(file);

    if (fileError) {
        return {
            ok: false,
            status: 400,
            message: fileError,
        };
    }

    let knownIngredients = [];

    try {
        knownIngredients = await getKnownIngredientNames(env);
    } catch (error) {
        console.warn('Could not load known ingredients:', error);
    }

    const data = await file.arrayBuffer();
    const base64 = toBase64(data);
    const content = [
        {
            type: 'input_text',
            text: 'Extract the recipe from this file.',
        },
        createFileInput(file, base64),
    ];

    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
            store: false,
            reasoning: {
                effort: 'low',
            },
            instructions: buildPrompt(knownIngredients),
            input: [
                {
                    role: 'user',
                    content,
                },
            ],
            text: {
                format: {
                    type: 'json_schema',
                    name: 'recipe_import',
                    strict: true,
                    schema: IMPORT_SCHEMA,
                },
            },
            max_output_tokens: 12000,
        }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
        console.error('OpenAI import failed:', result);

        return {
            ok: false,
            status: 502,
            message: 'The selected file could not be processed.',
        };
    }

    const output = getOutputText(result);

    if (!output) {
        return {
            ok: false,
            status: 502,
            message: 'Recipe import returned no usable data.',
        };
    }

    let recipe;

    try {
        recipe = JSON.parse(output);
        normalizeImportedRecipe(recipe);
    } catch {
        return {
            ok: false,
            status: 502,
            message: 'Recipe import returned invalid JSON.',
        };
    }

    delete recipe.id;

    const recipeForValidation = {
        ...recipe,
        id: crypto.randomUUID(),
    };

    if (!validateRecipe(recipeForValidation)) {
        console.error('Imported recipe failed validation:', validateRecipe.errors);

        return {
            ok: false,
            status: 422,
            message: 'Imported recipe did not pass recipe validation.',
            errors: validateRecipe.errors,
        };
    }

    return {
        ok: true,
        status: 200,
        recipe,
    };
}

function validateFile(file) {
    if (!(file instanceof File)) {
        return 'Select a recipe file to import.';
    }

    if (!file.size) {
        return 'The selected file is empty.';
    }

    if (file.size > MAX_IMPORT_BYTES) {
        return 'Recipe files must be 20 MB or smaller.';
    }

    return null;
}

function createFileInput(file, base64) {
    const imageType = getImageType(file);

    if (imageType) {
        return {
            type: 'input_image',
            image_url: `data:${imageType};base64,${base64}`,
            detail: 'high',
        };
    }

    return {
        type: 'input_file',
        filename: file.name,
        file_data: `data:${file.type || 'application/octet-stream'};base64,${base64}`,
    };
}

function getImageType(file) {
    if (IMAGE_TYPES.has(file.type)) {
        return file.type;
    }

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    return IMAGE_EXTENSIONS[extension] ?? null;
}

function toBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';

    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(
            ...bytes.subarray(offset, offset + chunkSize),
        );
    }

    return btoa(binary);
}

function getOutputText(response) {
    for (const item of response.output ?? []) {
        if (item.type !== 'message') {
            continue;
        }

        for (const content of item.content ?? []) {
            if (content.type === 'output_text') {
                return content.text;
            }
        }
    }

    return null;
}

function normalizeImportedRecipe(recipe) {
    for (const group of recipe.ingredients) {
        removeNull(group, 'section');

        for (const ingredient of group.items) {
            normalizeIngredient(ingredient);
        }
    }

    for (const instruction of recipe.instructions) {
        removeEmptyArray(instruction, 'notes')

        removeNull(instruction, 'image')
    }

    removeEmptyArray(recipe, 'timings');
    removeEmptyArray(recipe, 'notes');

    removeNull(recipe, 'image');
    removeNull(recipe, 'servings');
    removeNull(recipe, 'source');
    removeNull(recipe, 'difficulty');

    for (const key of Object.keys(recipe.nutrition)) {
        removeNull(recipe.nutrition, key);
    }

    if (Object.keys(recipe.nutrition).length === 0) {
        delete recipe.nutrition;
    }
}

function normalizeIngredient(ingredient) {
    ingredient.ingredient = normalizeIngredientName(ingredient.ingredient);
    promoteFormNote(ingredient);

    for (const field of [
        'volume_ml',
        'weight_g',
        'count',
        'preferred_measurement',
        'note',
    ]) {
        removeNull(ingredient, field);
    }

    removeEmptyArray(ingredient, 'form');

    if (!ingredient.optional) {
        delete ingredient.optional;
    }

    for (const set of ingredient.substitutes) {
        for (const substitute of set) {
            normalizeIngredient(substitute);
        }
    }

    removeEmptyArray(ingredient, 'substitutes');
}

function normalizeIngredientName(value) {
    return value
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .replace(
            /(^|[\s-])([a-z])/g,
            (_, prefix, letter) => prefix + letter.toUpperCase(),
        )
}

function promoteFormNote(ingredient) {
    if (typeof ingredient.note !== 'string') {
        return;
    }

    const note = ingredient.note.trim().replace(/[.!]$/, '').toLowerCase();

    if (!formsSchema.enum.includes(note)) {
        return;
    }

    ingredient.form = [...new Set([...(ingredient.form ?? []), note])];

    ingredient.note = null;
}

function removeNull(object, property) {
    if (object[property] === null) {
        delete object[property];
    }
}

function removeEmptyArray(object, property) {
    if (Array.isArray(object[property]) && object[property].length === 0) {
        delete object[property];
    }
}

function buildPrompt(knownIngredients) {
    return `
Extract the recipe from the supplied file and return one JSON object.

The JSON must conform to the cookbook recipe format.

Ingredient rules:
- "ingredient" identifies the food item itself.
- Ingredient names use title-style capitalization, such as "All Purpose Flour" or "Extra Virgin Olive Oil".
- Prefer an existing ingredient name when it represents the same ingredient.
- New ingredient names are allowed when the recipe genuinely introduces a different ingredient.
- Do not collapse distinct ingredients merely because they are related or interchangeable.
- For example, "Olive Oil" and "Extra Virgin Olive Oil" are different ingredients.
- "All Purpose Flour", "Bread Flour", and "Pastry Flour" are different ingredients.
- Singular ingredient identities are preferred where reasonable, such as "Egg", "Apple", and "Banana".
- Preparation, physical state, and size belong in "form", not in the ingredient name.
- Examples include "sifted", "chopped", "canned", "large", "boneless", and "skinless".
- Descriptions such as "divided", "to taste", "thinly", "finely", and "plus more for serving" belong in "note".
- Only use approved form values.
- Do not invent a form that is not supported by the source.
- Every ingredient must contain at least one positive volume_ml, weight_g, or count.
- Convert stated volume measurements to milliliters.
- Convert stated weight measurements to grams.
- Use count only for discrete counted quantities.
- Do not convert between volume and weight using estimated density.
- If both volume and weight are explicitly available, preserve both.
- preferred_measurement may only refer to a measurement that actually exists.
- Use preferred_measurement only when both volume and weight are available and a sensible display preference can be determined.
- Otherwise set preferred_measurement to null.
- substitutes use the same ingredient structure as primary ingredients.

Ingredient form rules:
- "form" takes precedence over "note" for any descriptor that can be represented exactly by an approved form value.
- Never use "note" solely to store an approved form value.
- Examples:
  - "sifted flour" → ingredient: "Flour", form: ["sifted"], no note
  - "beaten egg" → ingredient: "Egg", form: ["beaten"], no note
  - "large egg" → ingredient: "Egg", form: ["large"], no note
- Preserve information in "note" only when it adds meaning that cannot be represented by the ingredient name or approved forms.
- Do not convert conditional instructions into forms.
  - "sift if lumpy" remains a note unless the source otherwise indicates the flour should be sifted.
- If a descriptor is not an approved form value, preserve it in the ingredient identity or note as appropriate.

Note Rules
- Conditional preparation language may be normalized into "form" when the
  condition only determines whether an action is necessary to reach the same
  intended ingredient state.
- In those cases, store the resulting state in "form" and omit the conditional
  note.
- Example: "sift if lumpy" → form: ["sifted"].
- Example: "drain if necessary" → form: ["drained"].
- Preserve conditional language when the possible branches materially change
  the ingredient, quantity, composition, or recipe outcome.
- Example: "add milk if thick" must remain a note or instruction.
- Example: "add more sugar if tart" must remain a note or instruction.
- When a note references a different quantity of an ingredient already listed, express the change relatively and in plain English when the relationship is simple and clear.
- Example: If the recipe calls for 1 cup of sugar but says to use 1/2 cup for less-sweet brownies, use a note such as "Use half the sugar for less-sweet brownies."
- Prefer simple relationships such as half, double, or one-third when they are obvious from the source quantities.
- Do not calculate or introduce awkward relative quantities solely to avoid repeating a measurement.
- When a relative description would be unclear, imprecise, or unnatural, preserve the original measurement wording in the note.
- Use "note" only when it provides meaningful information about how, when, why, or under what condition an ingredient is used that cannot be represented by the ingredient identity, form, or measurement fields.
- Omit notes that merely restate the ingredient, form, measurement, or an obvious preparation detail.
- Notes may describe conditional use, preference-based adjustments, allocation, serving use, or other information that materially affects how the ingredient is handled.
- Preserve concise notes such as "Divided", "To taste", "As needed", or "Plus more for serving" when they meaningfully affect the recipe.

Image Rules
- Preserve recipe or instruction image metadata only when the source explicitly provides a usable image path or URL.
- Never invent an image path, filename, URL, or alt text for an image that cannot actually be referenced.
- Do not treat photographs or illustrations embedded in an uploaded document as extracted recipe images.
- When an explicit usable image reference exists, preserve it in "image.src" and preserve or concisely describe its meaningful content in "image.alt".
- Set image to null when no usable image reference is explicitly available.

Existing ingredient names:
${JSON.stringify(knownIngredients)}

General rules:
- Do not return Markdown or explanatory text.
- Do not invent recipe facts that are absent from the source.
- The recipe ID will be generated by the application.
- title must be a non-empty string.
- authors must contain at least one value. If no author is identified, use "Unknown".
- ingredients must contain at least one section with at least one ingredient.
- instructions must contain action and content.
- instruction action must be one of:
${JSON.stringify(actionsSchema.enum)}
- tags may only contain values from:
${JSON.stringify(tagsSchema.enum)}
- difficulty, when present, must be one of:
${JSON.stringify(difficultySchema.enum)}
- timings use minutes.
- Preserve recipe notes when useful.
- Return JSON only.
`.trim()
}
