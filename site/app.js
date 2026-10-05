import { addIngredientGroup } from "./js/ingredients.js";
import {
    addInstruction,
    addTiming
} from "./js/instructions.js";
import { buildRecipe } from "./js/recipe.js";
import { loadTags } from "./js/tags.js";
import { validateDynamicFields } from "./js/validation.js";
import { submitRecipe } from "./js/submission.js";

const ingredientGroupsContainer =
    document.getElementById("ingredient-groups");
const instructionsContainer =
    document.getElementById("instructions");
const timingsContainer =
    document.getElementById("timings");
const tagContainer =
    document.getElementById("tag-container");
const tagError =
    document.getElementById("tag-error");
const formError =
    document.getElementById("form-error");
const jsonOutput =
    document.getElementById("json-output");
const submitRecipeButton =
    document.getElementById("submit-recipe");
const submissionStatus =
    document.getElementById("submission-status");
const recipeForm =
    document.getElementById("recipe-form");

document
    .getElementById("add-ingredient-group")
    .addEventListener(
        "click",
        () => addIngredientGroup(ingredientGroupsContainer)
    );

document
    .getElementById("add-instruction")
    .addEventListener(
        "click",
        () => addInstruction(instructionsContainer)
    );

document
    .getElementById("add-timing")
    .addEventListener(
        "click",
        () => addTiming(timingsContainer)
    );

document
    .getElementById("recipe-form")
    .addEventListener("submit", event => {
        event.preventDefault();

        if (!validateDynamicFields(formError)) {
            return;
        }

        jsonOutput.value = JSON.stringify(
            buildRecipe(),
            null,
            2
        );
    });

submitRecipeButton.addEventListener(
    "click",
    async () => {
        submissionStatus.textContent = "";

        if (!recipeForm.reportValidity()) {
            return;
        }

        if (!validateDynamicFields(formError)) {
            return;
        }

        const recipe = buildRecipe();

        submitRecipeButton.disabled = true;
        submissionStatus.textContent =
            "Submitting recipe...";

        try {
            const result = await submitRecipe(recipe);

            submissionStatus.textContent =
                result.message ||
                "Recipe submitted successfully.";
        } catch (error) {
            submissionStatus.textContent =
                error.message ||
                "Recipe submission failed.";
        } finally {
            submitRecipeButton.disabled = false;
        }
    }
);

addIngredientGroup(ingredientGroupsContainer);
addInstruction(instructionsContainer);
loadTags(tagContainer, tagError);
