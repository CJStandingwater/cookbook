import { formatLabel } from '../normalize.js';

import { formatCount, formatVolume, formatWeight } from './measurements.js';

const substituteSelections = new WeakMap();

export function renderRecipe(recipe, target, system = 'imperial') {
    let state = substituteSelections.get(target);

    if (state === undefined || state.recipeId !== recipe.id) {
        state = {
            recipeId: recipe.id,
            selections: new Map(),
        };

        substituteSelections.set(target, state);
    }

    target.replaceChildren(
        buildHeader(recipe),
        buildIngredients(recipe.ingredients, system, state.selections),
        buildInstructions(recipe.instructions),
        buildSupplemental(recipe),
    );

    target.hidden = false;
}

function buildHeader(recipe) {
    const header = createElement('header', 'recipe-header');

    header.appendChild(createElement('h1', 'recipe-title', recipe.title));

    const byline = `By ${recipe.authors.join(', ')}`;

    header.appendChild(
        createElement(
            'p',
            'recipe-authors',
            recipe.source ? `${byline}; ${recipe.source}` : byline,
        ),
    );

    const metadata = buildMetadata(recipe);

    if (metadata.hasChildNodes()) {
        header.appendChild(metadata);
    }

    return header;
}

function buildMetadata(recipe) {
    const metadata = createElement('div', 'recipe-metadata');

    if (recipe.servings !== undefined) {
        metadata.appendChild(
            createElement('span', 'recipe-servings', `Servings: ${recipe.servings}`),
        );
    }

    if (recipe.difficulty) {
        metadata.appendChild(
            createElement(
                'span',
                'recipe-difficulty',
                `Difficulty: ${formatLabel(recipe.difficulty)}`,
            ),
        );
    }

    for (const timing of recipe.timings ?? []) {
        metadata.appendChild(
            createElement(
                'span',
                'recipe-timing',
                `${formatLabel(timing.title)}: ${timing.minutes} min`,
            ),
        );
    }

    return metadata;
}

function buildIngredients(groups, system, selections) {
    const section = createElement('section', 'recipe-ingredients');

    section.appendChild(createElement('h2', null, 'Ingredients'));

    const container = createElement('div', 'ingredient-groups');

    groups.forEach((group, groupIndex) => {
        container.appendChild(
            buildIngredientGroup(group, system, groupIndex, selections),
        );
    });

    section.appendChild(container);

    return section;
}

function buildIngredientGroup(group, system, groupIndex, selections) {
    const section = createElement('section', 'ingredient-group');

    if (group.section) {
        section.appendChild(
            createElement('h3', 'ingredient-section-title', group.section),
        );
    }

    const list = createElement('ul', 'ingredient-list');
    const notes = createElement('div', 'ingredient-notes');

    section.appendChild(list);
    section.appendChild(notes);

    group.items.forEach((ingredient, ingredientIndex) => {
        const key = `${groupIndex}:${ingredientIndex}`;

        list.appendChild(
            buildIngredientSlot(ingredient, system, key, selections, () =>
                refreshIngredientNotes(section, notes),
            ),
        );
    });

    refreshIngredientNotes(section, notes);

    return section;
}

function buildIngredientSlot(ingredient, system, key, selections, onChange) {
    const slot = createElement('li', 'ingredient');
    const display = createElement('div', 'ingredient-selection');
    const options = [[ingredient], ...(ingredient.substitutes ?? [])];

    let selectedIndex = selections.get(key) ?? 0;

    if (selectedIndex >= options.length) {
        selectedIndex = 0;
    }

    selections.set(key, selectedIndex);

    slot.appendChild(display);

    let controls = null;

    if (options.length > 1) {
        slot.classList.add('has-substitutes');

        controls = buildSubstituteControls(
            ingredient,
            options,
            selectedIndex,
            (index) => {
                selectedIndex = index;

                selections.set(key, selectedIndex);

                renderSelection();

                updateSubstituteControls(controls, selectedIndex);

                controls.hidden = true;

                onChange();
            },
        );

        controls.hidden = true;

        display.addEventListener('click', () => {
            controls.hidden = !controls.hidden;
        });

        slot.appendChild(controls);
    }

    function renderSelection() {
        const selected = options[selectedIndex];

        display.replaceChildren(
            ...selected.map((item) => buildIngredientLine(item, system)),
        );
    }

    renderSelection();

    return slot;
}

function buildSubstituteControls(ingredient, options, selectedIndex, onSelect) {
    const controls = createElement('div', 'substitute-options');

    controls.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    options.forEach((option, index) => {
        const button = document.createElement('button');

        button.type = 'button';
        button.className = 'substitute-option';

        button.textContent =
            index === 0
                ? `Original: ${ingredient.item}`
                : option.map((item) => item.item).join(' + ');

        button.setAttribute(
            'aria-pressed',
            index === selectedIndex ? 'true' : 'false',
        );

        button.addEventListener('click', (event) => {
            event.stopPropagation();
            onSelect(index);
        });

        controls.appendChild(button);
    });

    return controls;
}

function updateSubstituteControls(controls, selectedIndex) {
    [...controls.querySelectorAll('.substitute-option')].forEach(
        (button, index) => {
            button.setAttribute(
                'aria-pressed',
                index === selectedIndex ? 'true' : 'false',
            );
        },
    );
}

function buildIngredientLine(ingredient, system) {
    const line = createElement('div', 'ingredient-line');

    if (ingredient.note) {
        line.dataset.note = ingredient.note;
    }

    const measurement = formatIngredientMeasurement(ingredient, system);

    if (measurement) {
        line.appendChild(
            createElement('span', 'ingredient-measurement', measurement),
        );
    }

    const name = createElement('span', 'ingredient-name', ingredient.item);

    if (ingredient.note) {
        name.appendChild(createElement('sup', 'ingredient-note-marker'));
    }

    line.appendChild(name);

    if (ingredient.optional) {
        line.appendChild(createElement('span', 'ingredient-optional', 'Optional'));
    }

    return line;
}

function refreshIngredientNotes(section, container) {
    const notes = [];
    const lines = section.querySelectorAll('.ingredient-list .ingredient-line');

    for (const line of lines) {
        if (!line.dataset.note) {
            continue;
        }

        const marker = '*'.repeat(notes.length + 1);
        const markerElement = line.querySelector('.ingredient-note-marker');

        if (markerElement) {
            markerElement.textContent = marker;
        }

        notes.push({
            marker,
            text: line.dataset.note,
        });
    }

    container.replaceChildren();

    for (const note of notes) {
        const item = createElement('p', 'ingredient-note');

        item.appendChild(
            createElement('span', 'ingredient-note-marker', note.marker),
        );

        item.appendChild(document.createTextNode(note.text));

        container.appendChild(item);
    }

    container.hidden = notes.length === 0;
}

function formatIngredientMeasurement(ingredient, system) {
    const measurements = [];

    if (ingredient.volume_ml !== undefined) {
        measurements.push(formatVolume(ingredient.volume_ml, system));
    }

    if (ingredient.weight_g !== undefined) {
        measurements.push(formatWeight(ingredient.weight_g, system));
    }

    if (ingredient.count !== undefined) {
        measurements.push(formatCount(ingredient.count));
    }

    return measurements.filter(Boolean).join(' / ');
}

function buildInstructions(instructions) {
    const section = createElement('section', 'recipe-instructions');

    section.appendChild(createElement('h2', null, 'Instructions'));

    const list = createElement('ol', 'instruction-list');

    for (const instruction of instructions) {
        const item = createElement('li', 'instruction');

        item.appendChild(
            createElement(
                'strong',
                'instruction-action',
                formatLabel(instruction.action),
            ),
        );

        item.appendChild(
            createElement('p', 'instruction-content', instruction.content),
        );

        if (instruction.notes?.length) {
            item.appendChild(buildTextList(instruction.notes, 'instruction-notes'));
        }

        list.appendChild(item);
    }

    section.appendChild(list);

    return section;
}

function buildSupplemental(recipe) {
    const section = createElement('section', 'recipe-supplemental');

    if (recipe.notes?.length) {
        section.appendChild(
            buildSupplementalList('Notes', recipe.notes, 'recipe-notes'),
        );
    }

    if (recipe.nutrition) {
        section.appendChild(buildNutrition(recipe.nutrition));
    }

    if (recipe.tools?.length) {
        section.appendChild(buildInlineSupplemental('Tools', recipe.tools));
    }

    if (recipe.tags?.length) {
        section.appendChild(
            buildInlineSupplemental('Tags', recipe.tags.map(formatLabel)),
        );
    }

    return section;
}

function buildNutrition(nutrition) {
    const section = createElement('section', 'recipe-nutrition');

    section.appendChild(createElement('h2', null, 'Nutrition'));

    const list = createElement('dl', 'nutrition-list');

    for (const [key, value] of Object.entries(nutrition)) {
        list.appendChild(createElement('dt', null, formatLabel(key)));
        list.appendChild(createElement('dd', null, formatNutrition(key, value)));
    }

    section.appendChild(list);

    return section;
}

function formatNutrition(key, value) {
    return key === 'calories' ? String(value) : `${value} g`;
}

function buildInlineSupplemental(title, values) {
    const paragraph = createElement('p', 'recipe-inline-detail');

    paragraph.appendChild(createElement('strong', null, `${title}: `));
    paragraph.appendChild(document.createTextNode(values.join(', ')));

    return paragraph;
}

function buildSupplementalList(title, values, className) {
    const section = createElement('section', className);

    section.appendChild(createElement('h2', null, title));
    section.appendChild(buildTextList(values));

    return section;
}

function buildTextList(values, className = null) {
    const list = createElement('ul', className);

    for (const value of values) {
        list.appendChild(createElement('li', null, value));
    }

    return list;
}

function createElement(tagName, className = null, text = null) {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== null) {
        element.textContent = text;
    }

    return element;
}
