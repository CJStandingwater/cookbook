import Ajv2020 from 'ajv/dist/2020.js';

import recipeSchema from '../../schema/recipe.schema.json';
import commonSchema from '../../schema/common.json';
import actionsSchema from '../../schema/actions.enum.json';
import tagsSchema from '../../schema/tags.flattened.json';
import difficultySchema from '../../schema/difficulty.enum.json';

const MODEL = 'gpt-6-sol';
const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

const IMPORT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: [
        'title',
        'authors',
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
                'item',
                'volume_ml',
                'weight_g',
                'count',
                'optional',
                'note',
                'substitutes',
            ],
            properties: {
                item: {
                    type: 'string',
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

                optional: {
                    type: 'boolean',
                },

                note: {
                    type: [
                        'string',
                        'null',
                    ],
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

const ajv = new Ajv2020({
    allErrors: true,
});

ajv.addSchema(commonSchema);
ajv.addSchema(actionsSchema);
ajv.addSchema(tagsSchema);
ajv.addSchema(difficultySchema, 'difficulty.enum.json');

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

    const data = await file.arrayBuffer();
    const base64 = toBase64(data);
    const content = [
        {
            type: 'input_text',
            text: buildPrompt(),
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
        removeEmptyArray(instruction, 'notes');
    }

    removeEmptyArray(recipe, 'timings');
    removeEmptyArray(recipe, 'notes');

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
    for (const field of ['volume_ml', 'weight_g', 'count', 'note']) {
        removeNull(ingredient, field);
    }

    for (const set of ingredient.substitutes) {
        for (const substitute of set) {
            normalizeIngredient(substitute);
        }
    }

    removeEmptyArray(ingredient, 'substitutes');
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

function buildPrompt() {
    return `
Extract the recipe from the supplied file and return one JSON object.

The JSON must conform to the cookbook recipe format.

Rules:
- Do not return Markdown or explanatory text.
- Do not invent recipe facts that are absent from the source.
- Omit optional properties when the source does not support them.
- The recipe ID will be generated by the application.
- title must be a non-empty string.
- authors must contain at least one value. If no author is identified, use "Unknown".
- ingredients must contain at least one section with at least one ingredient.
- Every ingredient must contain item and at least one positive volume_ml, weight_g, or count.
- Convert stated volume measurements to milliliters.
- Convert stated weight measurements to grams.
- Use count only for discrete counted quantities.
- Do not convert between volume and weight using an estimated density.
- Do not invent missing ingredient quantities.
- substitutes are arrays of substitute sets.
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
`.trim();
}
