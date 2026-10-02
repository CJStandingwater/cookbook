import { cloneTemplate } from "./dom.js";
import {
    addMeasurementFields,
    buildMeasurements
} from "./measurements.js";
import {
    normalizeName,
    normalizeWhitespace
} from "./normalize.js";

export function addIngredientGroup(container) {
    const group = cloneTemplate("ingredient-group-template");
    const items = group.querySelector(".ingredient-items");

    group
        .querySelector(".add-ingredient")
        .addEventListener("click", () => addIngredientItem(items));

    group
        .querySelector(".remove-section")
        .addEventListener("click", () => group.remove());

    container.appendChild(group);
    addIngredientItem(items);
}

function addIngredientItem(container) {
    const item = cloneTemplate("ingredient-template");
    const substituteSets = item.querySelector(".substitute-sets");

    addMeasurementFields(item);

    item
        .querySelector(".add-substitute-set")
        .addEventListener(
            "click",
            () => addSubstituteSet(substituteSets)
        );

    item
        .querySelector(".remove-ingredient")
        .addEventListener("click", () => item.remove());

    container.appendChild(item);
}

function addSubstituteSet(container) {
    const set = cloneTemplate("substitute-set-template");
    const items = set.querySelector(".substitute-items");

    set
        .querySelector(".add-substitute-item")
        .addEventListener("click", () => addSubstituteItem(items));

    set
        .querySelector(".remove-substitute-set")
        .addEventListener("click", () => set.remove());

    container.appendChild(set);
    addSubstituteItem(items);
}

function addSubstituteItem(container) {
    const item = cloneTemplate("substitute-item-template");

    addMeasurementFields(item);

    item
        .querySelector(".remove-substitute-item")
        .addEventListener("click", () => item.remove());

    container.appendChild(item);
}

function buildSubstituteItem(element) {
    const substitute = {
        item: normalizeName(element.querySelector(".substitute-name").value),
        ...buildMeasurements(element)
    };

    if (element.querySelector(".substitute-optional").checked) {
        substitute.optional = true;
    }

    const note = normalizeWhitespace(
        element.querySelector(".substitute-note").value
    );

    if (note) {
        substitute.note = note;
    }

    return substitute;
}

function buildSubstitutes(ingredientElement) {
    return [
        ...ingredientElement.querySelectorAll(
            ":scope > .substitute-sets > .substitute-set"
        )
    ].map(set => [
        ...set.querySelectorAll(
            ":scope > .substitute-items > .substitute-item"
        )
    ].map(buildSubstituteItem));
}

export function buildIngredients() {
    return [...document.querySelectorAll(".ingredient-group")].map(group => {
        const result = {};
        const section = normalizeName(
            group.querySelector(".section-name").value
        );

        if (section) {
            result.section = section;
        }

        result.items = [
            ...group.querySelectorAll(
                ":scope > .ingredient-items > .ingredient-item"
            )
        ].map(element => {
            const ingredient = {
                item: normalizeName(
                    element.querySelector(".ingredient-name").value
                ),
                ...buildMeasurements(element)
            };

            if (element.querySelector(".ingredient-optional").checked) {
                ingredient.optional = true;
            }

            const note = normalizeWhitespace(
                element.querySelector(".ingredient-note").value
            );

            if (note) {
                ingredient.note = note;
            }

            const substitutes = buildSubstitutes(element);

            if (substitutes.length) {
                ingredient.substitutes = substitutes;
            }

            return ingredient;
        });

        return result;
    });
}
