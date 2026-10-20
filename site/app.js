import { addIngredientGroup } from './js/ingredients.js';
import { addInstruction, addTiming } from './js/instructions.js';
import { buildRecipe } from './js/recipe.js';
import { loadTags } from './js/tags.js';
import { validateDynamicFields } from './js/validation.js';
import { submitRecipe } from './js/submission.js';
import { initializeRecipePreview } from './js/view/preview.js';
import { importRecipeFile } from './js/import.js';
import { populateRecipeForm } from './js/populate.js';

const ingredientGroupsContainer = document.getElementById('ingredient-groups');
const instructionsContainer = document.getElementById('instructions');
const timingsContainer = document.getElementById('timings');
const tagContainer = document.getElementById('tag-container');
const tagError = document.getElementById('tag-error');
const formError = document.getElementById('form-error');
const jsonOutput = document.getElementById('json-output');
const submitRecipeButton = document.getElementById('submit-recipe');
const submissionStatus = document.getElementById('submission-status');
const recipeForm = document.getElementById('recipe-form');
const importFile = document.getElementById('recipe-import-file');
const importRecipeButton = document.getElementById('import-recipe');
const importStatus = document.getElementById('import-status');

document
    .getElementById('add-ingredient-group')
    .addEventListener('click', () =>
        addIngredientGroup(ingredientGroupsContainer),
    );

document
    .getElementById('add-instruction')
    .addEventListener('click', () => addInstruction(instructionsContainer));

document
    .getElementById('add-timing')
    .addEventListener('click', () => addTiming(timingsContainer));

document.getElementById('recipe-form').addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validateDynamicFields(formError)) {
        return;
    }

    jsonOutput.value = JSON.stringify(buildRecipe(), null, 2);
});

submitRecipeButton.addEventListener('click', async () => {
    submissionStatus.textContent = '';

    if (!recipeForm.reportValidity()) {
        return;
    }

    if (!validateDynamicFields(formError)) {
        return;
    }

    const recipe = buildRecipe();

    submitRecipeButton.disabled = true;
    submissionStatus.textContent = 'Submitting recipe...';

    try {
        const result = await submitRecipe(recipe);

        submissionStatus.textContent =
            result.message || 'Recipe submitted successfully.';
    } catch (error) {
        submissionStatus.textContent = error.message || 'Recipe submission failed.';
    } finally {
        submitRecipeButton.disabled = false;
    }
});

importRecipeButton.addEventListener('click', async () => {
    const file = importFile.files[0];

    importStatus.textContent = '';
    importStatus.classList.remove('error');

    if (!file) {
        importStatus.textContent = 'Select a recipe file to import.';

        importStatus.classList.add('error');
        return;
    }

    importRecipeButton.disabled = true;
    importStatus.textContent = 'Importing recipe...';

    try {
        const recipe = await importRecipeFile(file);

        await tagsReady;

        populateRecipeForm(recipe);

        formError.textContent = '';

        jsonOutput.value = JSON.stringify(buildRecipe(), null, 2);

        importStatus.textContent =
            'Recipe imported successfully. Review the form before submitting.';
    } catch (error) {
        importStatus.textContent = error.message || 'Recipe import failed.';

        importStatus.classList.add('error');
    } finally {
        importRecipeButton.disabled = false;
    }
});

initializeRecipePreview();

addIngredientGroup(ingredientGroupsContainer);
addInstruction(instructionsContainer);
const tagsReady = loadTags(tagContainer, tagError);
