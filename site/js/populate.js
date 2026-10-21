import { populateIngredients } from './ingredients.js';
import { populateInstructions, populateTimings } from './instructions.js';
import { setSelectedTags } from './tags.js';
import { populateImage } from './images.js';

export function populateRecipeForm(recipe) {
    document.getElementById('title').value = recipe.title;
    document.getElementById('authors').value = recipe.authors.join(', ');

    populateImage(
        recipe.image,
        document.getElementById('recipe-image'),
        document.getElementById('recipe-image-alt'),
    )

    populateIngredients(recipe.ingredients);
    populateInstructions(recipe.instructions);
    populateTimings(recipe.timings);

    document.getElementById('servings').value = recipe.servings ?? '';
    document.getElementById('notes').value = (recipe.notes ?? []).join('\n');
    document.getElementById('source').value = recipe.source ?? '';
    document.getElementById('tools').value = (recipe.tools ?? []).join(', ');
    document.getElementById('difficulty').value = recipe.difficulty ?? '';

    setSelectedTags(recipe.tags);

    populateNutrition(recipe.nutrition);
}

function populateNutrition(nutrition = {}) {
    for (const field of [
        'calories',
        'protein',
        'fat',
        'carbohydrates',
        'fiber',
    ]) {
        document.getElementById(field).value = nutrition[field] ?? '';
    }
}
