import { INSTRUCTION_ACTIONS } from "./constants.js";
import { cloneTemplate } from "./dom.js";
import { optionalNumber, roundMeasurement } from "./measurements.js";
import {
    formatLabel,
    normalizeWhitespace,
    splitLines
} from "./normalize.js";

export function addInstruction(container) {
    const instruction = cloneTemplate("instruction-template");
    const actionSelect = instruction.querySelector(".instruction-action");

    for (const action of INSTRUCTION_ACTIONS) {
        const option = document.createElement("option");
        option.value = action;
        option.textContent = formatLabel(action);
        actionSelect.appendChild(option);
    }

    instruction
        .querySelector(".remove-instruction")
        .addEventListener("click", () => instruction.remove());

    container.appendChild(instruction);
}

export function addTiming(container) {
    const timing = cloneTemplate("timing-template");

    timing
        .querySelector(".remove-timing")
        .addEventListener("click", () => timing.remove());

    container.appendChild(timing);
}

export function buildInstructions() {
    return [...document.querySelectorAll(".instruction")].map(element => {
        const instruction = {
            action: element.querySelector(".instruction-action").value,
            content: normalizeWhitespace(
                element.querySelector(".instruction-content").value
            )
        };

        const notes = splitLines(
            element.querySelector(".instruction-notes").value
        );

        if (notes.length) {
            instruction.notes = notes;
        }

        return instruction;
    });
}

export function buildTimings() {
    return [...document.querySelectorAll(".timing")]
        .map(element => {
            const title = normalizeWhitespace(
                element.querySelector(".timing-title").value
            ).toLowerCase();

            const value = optionalNumber(
                element.querySelector(".timing-value")
            );

            if (!title || value === undefined) {
                return null;
            }

            const unit = element.querySelector(".timing-unit").value;

            return {
                title,
                value: roundMeasurement(
                    unit === "hour" ? value * 60 : value
                ),
                unit: "minute"
            };
        })
        .filter(Boolean);
}
