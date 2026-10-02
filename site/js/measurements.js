import {
    VOLUME_CONVERSIONS,
    WEIGHT_CONVERSIONS
} from "./constants.js";
import { cloneTemplate } from "./dom.js";

export function optionalNumber(input) {
    if (input.value.trim() === "") {
        return undefined;
    }

    return Number(input.value);
}

export function roundMeasurement(value) {
    return Number(value.toFixed(3));
}

export function addMeasurementFields(element) {
    element
        .querySelector(".measurement-slot")
        .appendChild(cloneTemplate("measurement-template"));
}

export function buildMeasurements(element) {
    const result = {};
    const volume = optionalNumber(element.querySelector(".volume-amount"));
    const weight = optionalNumber(element.querySelector(".weight-amount"));
    const count = optionalNumber(element.querySelector(".count-amount"));

    if (volume !== undefined) {
        const unit = element.querySelector(".volume-unit").value;
        result.volume_ml = roundMeasurement(
            volume * VOLUME_CONVERSIONS[unit]
        );
    }

    if (weight !== undefined) {
        const unit = element.querySelector(".weight-unit").value;
        result.weight_g = roundMeasurement(
            weight * WEIGHT_CONVERSIONS[unit]
        );
    }

    if (count !== undefined) {
        result.count = count;
    }

    return result;
}

export function hasMeasurement(element) {
    return [
        ".volume-amount",
        ".weight-amount",
        ".count-amount"
    ].some(selector => element.querySelector(selector).value.trim() !== "");
}
