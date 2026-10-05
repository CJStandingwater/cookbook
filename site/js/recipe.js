import { buildIngredients } from "./ingredients.js";
import {
    buildInstructions,
    buildTimings
} from "./instructions.js";
import { optionalNumber } from "./measurements.js";
import {
    normalizeName,
    normalizeWhitespace,
    splitCommaSeparated,
    splitLines
} from "./normalize.js";
import { getSelectedTags } from "./tags.js";

function buildNutrition() {
    const nutrition = {};

    for (const field of [
        "calories",
        "protein",
        "fat",
        "carbohydrates",
        "fiber"
    ]) {
        const value = optionalNumber(document.getElementById(field));

        if (value !== undefined) {
            nutrition[field] = value;
        }
    }

    return nutrition;
}

const recipeId = crypto.randomUUID();

export function buildRecipe() {
    const recipe = {
        id: recipeId,
        title: normalizeWhitespace(document.getElementById("title").value),
        authors: splitCommaSeparated(document.getElementById("authors").value),
        ingredients: buildIngredients(),
        instructions: buildInstructions()
    };

    const timings = buildTimings();
    const servings = optionalNumber(document.getElementById("servings"));
    const tags = getSelectedTags();
    const notes = splitLines(document.getElementById("notes").value);
    const nutrition = buildNutrition();
    const source = normalizeWhitespace(document.getElementById("source").value);
    const tools = splitCommaSeparated(document.getElementById("tools").value)
        .map(normalizeName);
    const difficulty = document.getElementById("difficulty").value;

    if (timings.length) {
        recipe.timings = timings;
    }

    if (servings !== undefined) {
        recipe.servings = servings;
    }

    if (tags.length) {
        recipe.tags = tags;
    }

    if (notes.length) {
        recipe.notes = notes;
    }

    if (Object.keys(nutrition).length) {
        recipe.nutrition = nutrition;
    }

    if (source) {
        recipe.source = source;
    }

    if (tools.length) {
        recipe.tools = tools;
    }

    if (difficulty) {
        recipe.difficulty = difficulty;
    }

    return recipe;
}
