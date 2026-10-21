import { FORM_SOURCES } from './constants.js';
import { formatLabel } from './normalize.js';

let approvedForms = [];

export async function initializeForms() {
    approvedForms = await fetchForms();
}

async function fetchForms() {
    for (const source of FORM_SOURCES) {
        try {
            const response = await fetch(source);

            if (response.ok) {
                const schema = await response.json();

                return schema.enum ?? [];
            }
        } catch { }
    }

    throw new Error('Unable to load approved ingredient forms.');
}

export function addFormFields(element) {
    const select = element.querySelector('.ingredient-form');

    for (const form of approvedForms) {
        const option = document.createElement('option');

        option.value = form;
        option.textContent = formatLabel(form);

        select.appendChild(option);
    }
}

export function getSelectedForms(element) {
    return [...element.querySelector('.ingredient-form').selectedOptions].map(
        (option) => option.value,
    );
}

export function populateForms(element, forms = []) {
    const selected = new Set(forms);

    for (const option of element.querySelector('.ingredient-form').options) {
        option.selected = selected.has(option.value);
    }
}
