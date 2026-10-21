import { VOLUME_CONVERSIONS, WEIGHT_CONVERSIONS } from "./constants.js";
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

    const metric = element.querySelector('.preferred-metric').value;

    const imperial = element.querySelector('.preferred-imperial').value;

    if (metric || imperial) {
        result.preferred_measurement = {
            metric,
            imperial,
        };
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

export function populateMeasurements(element, measurement) {
    element.querySelector('.volume-amount').value = measurement.volume_ml ?? '';
    element.querySelector('.weight-amount').value = measurement.weight_g ?? '';
    element.querySelector('.count-amount').value = measurement.count ?? '';
    element.querySelector('.volume-unit').value = 'ml';
    element.querySelector('.weight-unit').value = 'g';
    element.querySelector('.preferred-metric').value = measurement.preferred_measurement?.metric ?? '';
    element.querySelector('.preferred-imperial').value = measurement.preferred_measurement?.imperial ?? '';
}

export function validateMeasurementPreference(element) {
    const metric = element.querySelector('.preferred-metric').value;

    const imperial = element.querySelector('.preferred-imperial').value;

    if (!metric && !imperial) {
        return null;
    }

    if (!metric || !imperial) {
        return 'Both metric and imperial measurement preferences must be selected.';
    }

    const hasVolume = element.querySelector('.volume-amount').value.trim() !== '';

    const hasWeight = element.querySelector('.weight-amount').value.trim() !== '';

    if ((metric === 'volume' || imperial === 'volume') && !hasVolume) {
        return 'Volume cannot be preferred without a volume measurement.';
    }

    if ((metric === 'weight' || imperial === 'weight') && !hasWeight) {
        return 'Weight cannot be preferred without a weight measurement.';
    }

    return null;
}
