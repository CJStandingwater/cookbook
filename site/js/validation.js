import { hasMeasurement } from './measurements.js';
import { normalizeWhitespace } from './normalize.js';

export function validateDynamicFields(errorElement) {
    errorElement.textContent = '';

    const ingredientGroups = document.getElementById('ingredient-groups');
    const instructions = document.getElementById('instructions');
    const groups = [
        ...ingredientGroups.querySelectorAll(':scope > .ingredient-group'),
    ];

    if (!groups.length) {
        errorElement.textContent = 'At least one ingredient section is required.';

        return false;
    }

    for (const group of groups) {
        const items = [
            ...group.querySelectorAll(
                ':scope > .ingredient-items > .ingredient-item',
            ),
        ];

        if (!items.length) {
            errorElement.textContent =
                'Each ingredient section must contain at least one ingredient.';

            return false;
        }
    }

    const measuredItems = [
        ...ingredientGroups.querySelectorAll('.ingredient-item, .substitute-item'),
    ];

    for (const item of measuredItems) {
        if (hasMeasurement(item)) {
            continue;
        }

        const nameInput =
            item.querySelector('.ingredient-name') ||
            item.querySelector('.substitute-name');
        const name = normalizeWhitespace(nameInput.value) || 'Unnamed ingredient';

        errorElement.textContent = `${name} must have a volume, weight, or count.`;

        item.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });

        return false;
    }

    for (const set of ingredientGroups.querySelectorAll('.substitute-set')) {
        const items = set.querySelectorAll(
            ':scope > .substitute-items > .substitute-item',
        );

        if (!items.length) {
            errorElement.textContent =
                'Each substitute set must contain at least one ingredient.';

            return false;
        }
    }

    if (!instructions.querySelectorAll(':scope > .instruction').length) {
        errorElement.textContent = 'At least one instruction is required.';

        return false;
    }

    return true;
}
