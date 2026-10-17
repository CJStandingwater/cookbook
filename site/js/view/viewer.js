import { loadRecipe, loadRecipeFromUrl } from "./source.js";
import { renderRecipe } from "./renderer.js";

const viewer = document.getElementById("recipe-viewer");
const status = document.getElementById("viewer-status");
const measurementControls = document.querySelectorAll(
    'input[name="measurement-system"], input[name="recipe-multiplier"]',
);

let recipe = null;

async function initializeViewer() {
    setStatus("Loading recipe...");

    try {
        recipe = await loadRecipeFromUrl();

        renderRecipe(recipe, viewer, getMeasurementSystem());

        clearStatus();
    } catch (error) {
        showError(error.message || "Unable to load recipe.");
    }
}

function getMeasurementSystem() {
    return (
        document.querySelector('input[name="measurement-system"]:checked')?.value ??
        "imperial"
    );
}

function reloadRecipe() {
    if (recipe === null) {
        return;
    }

    renderRecipe(recipe, viewer, getMeasurementSystem());
}

function setStatus(message) {
    status.textContent = message;
    status.classList.remove("error");
}

function clearStatus() {
    status.textContent = "";
}

function showError(message) {
    viewer.hidden = true;
    status.textContent = message;
    status.classList.add("error");
}

for (const control of measurementControls) {
    control.addEventListener("change", reloadRecipe);
}

initializeViewer();
