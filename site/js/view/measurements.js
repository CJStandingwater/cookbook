import {
    COUNT_FORMAT,
    IMPERIAL_VOLUME_UNITS,
    IMPERIAL_WEIGHT_UNITS,
    METRIC_VOLUME_UNITS,
    METRIC_WEIGHT_UNITS,
} from '../constants.js';

import {
    findFriendlyMeasurement,
    findCompoundMeasurement,
    findDecimalMeasurement,
    findMetricCandidate,
    findCountCandidate,
} from './measurement-candidates.js';

import {
    formatCandidate,
    formatCompoundCandidate,
    formatDecimal,
    formatDecimalCandidate,
    formatFraction,
    formatMetricCandidate,
} from './measurement-formatters.js';

export function formatVolume(ml, system = 'imperial') {
    return system === 'metric'
        ? formatMetricVolume(ml)
        : formatImperialVolume(ml);
}

export function formatWeight(g, system = 'imperial') {
    return system === 'metric' ? formatMetricWeight(g) : formatImperialWeight(g);
}

export function formatCount(count) {
    if (!Number.isFinite(count) || count <= 0) {
        return null;
    }

    if (Number.isInteger(count)) {
        return String(count);
    }

    const candidate = findCountCandidate(
        count,
        COUNT_FORMAT.divisions,
        COUNT_FORMAT.tolerance,
    );

    if (candidate !== null) {
        return formatFraction(candidate.divisionCount, candidate.division);
    }

    return formatDecimal(count, COUNT_FORMAT.precision);
}

function formatImperialVolume(ml) {
    return formatImperialMeasurement(ml, IMPERIAL_VOLUME_UNITS);
}

function formatImperialWeight(g) {
    return formatImperialMeasurement(g, IMPERIAL_WEIGHT_UNITS);
}

function formatImperialMeasurement(measure, units) {
    const single = findFriendlyMeasurement(measure, units);

    if (single !== null) {
        return formatCandidate(single);
    }

    const compound = findCompoundMeasurement(measure, units);

    if (compound !== null) {
        return formatCompoundCandidate(compound);
    }

    const decimal = findDecimalMeasurement(measure, units);

    return formatDecimalCandidate(decimal);
}

function formatMetricVolume(ml) {
    return formatMetricCandidate(findMetricCandidate(ml, METRIC_VOLUME_UNITS));
}

function formatMetricWeight(g) {
    return formatMetricCandidate(findMetricCandidate(g, METRIC_WEIGHT_UNITS));
}
