import { buildRecipe } from "../recipe.js";
import { validateDynamicFields } from "../validation.js";
import { renderRecipe } from "./renderer.js";

export function initializeRecipePreview() {
    const recipeForm = document.getElementById("recipe-form");
    const formError = document.getElementById("form-error");
    const viewButton = document.getElementById("view-recipe");
    const previewSection = document.getElementById("recipe-preview-section");
    const preview = document.getElementById("recipe-preview");
    const measurementControls = document.querySelectorAll(
        'input[name="preview-measurement-system"]',
    );

    let recipe = null;

    viewButton.addEventListener("click", () => {
        if (!recipeForm.reportValidity()) {
            return;
        }

        if (!validateDynamicFields(formError)) {
            return;
        }

        recipe = buildRecipe();

        renderRecipe(recipe, preview, getMeasurementSystem());

        previewSection.hidden = false;
    });

    for (const control of measurementControls) {
        control.addEventListener("change", () => {
            if (recipe === null) {
                return;
            }

            renderRecipe(recipe, preview, getMeasurementSystem());
        });
    }

    function getMeasurementSystem() {
        return (
            document.querySelector('input[name="preview-measurement-system"]:checked')
                ?.value ?? "imperial"
        );
    }
}
