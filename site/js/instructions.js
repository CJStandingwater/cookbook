import { INSTRUCTION_ACTIONS } from './constants.js';
import { cloneTemplate } from './dom.js';
import { optionalNumber, roundMeasurement } from './measurements.js';
import { formatLabel, normalizeWhitespace, splitLines } from './normalize.js';
import { buildImage, populateImage } from './images.js';

export function addInstruction(container) {
    const instruction = cloneTemplate('instruction-template');
    const actionSelect = instruction.querySelector('.instruction-action');

    for (const action of INSTRUCTION_ACTIONS) {
        const option = document.createElement('option');
        option.value = action;
        option.textContent = formatLabel(action);
        actionSelect.appendChild(option);
    }

    instruction
        .querySelector('.remove-instruction')
        .addEventListener('click', () => instruction.remove());

    container.appendChild(instruction);
}

export function addTiming(container) {
    const timing = cloneTemplate('timing-template');

    timing
        .querySelector('.remove-timing')
        .addEventListener('click', () => timing.remove());

    container.appendChild(timing);
}

export function buildInstructions(recipeId) {
    const container = document.getElementById('instructions');

    return [...container.querySelectorAll(':scope > .instruction')].map(
        (element, index) => {
            const instruction = {
                action: element.querySelector('.instruction-action').value,

                content: normalizeWhitespace(
                    element.querySelector('.instruction-content').value,
                ),
            };

            const notes = splitLines(
                element.querySelector('.instruction-notes').value,
            );

            if (notes.length) {
                instruction.notes = notes;
            }

            const image = buildImage(
                element.querySelector('.instruction-image'),
                element.querySelector('.instruction-image-alt'),
                recipeId,
                index + 1,
            )

            if (image) {
                instruction.image = image
            }

            return instruction;
        },
    );
}

export function buildTimings() {
    const container = document.getElementById('timings');

    return [...container.querySelectorAll(':scope > .timing')]
        .map((element) => {
            const title = normalizeWhitespace(
                element.querySelector('.timing-title').value,
            ).toLowerCase();

            const value = optionalNumber(element.querySelector('.timing-value'));

            if (!title || value === undefined) {
                return null;
            }

            const unit = element.querySelector('.timing-unit').value;

            return {
                title,
                minutes: roundMeasurement(unit === 'hour' ? value * 60 : value),
            };
        })
        .filter(Boolean);
}

export function populateInstructions(instructions) {
    const container = document.getElementById('instructions');

    container.replaceChildren();

    for (const data of instructions) {
        addInstruction(container);

        const instruction = container.lastElementChild;

        instruction.querySelector('.instruction-action').value = data.action;
        instruction.querySelector('.instruction-content').value = data.content;
        instruction.querySelector('.instruction-notes').value = (
            data.notes ?? []
        ).join('\n');
    }

    populateImage(
        data.image,
        instruction.querySelector('.instruction-image'),
        instruction.querySelector('.instruction-image-alt'),
    )
}

export function populateTimings(timings = []) {
    const container = document.getElementById('timings');

    container.replaceChildren();

    for (const data of timings) {
        addTiming(container);

        const timing = container.lastElementChild;

        timing.querySelector('.timing-title').value = data.title;
        timing.querySelector('.timing-value').value = data.minutes;
        timing.querySelector('.timing-unit').value = 'minute';
    }
}
