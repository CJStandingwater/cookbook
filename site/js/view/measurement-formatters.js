import { greatestCommonDivisor } from './measurement-candidates.js';

export function formatFraction(divisionCount, division) {
    const whole = Math.floor(divisionCount / division);
    const remainder = divisionCount % division;

    if (remainder === 0) {
        return String(whole);
    }

    const factor = greatestCommonDivisor(remainder, division);
    const numerator = remainder / factor;
    const denominator = division / factor;
    const fraction = `${numerator}/${denominator}`;

    return whole > 0 ? `${whole} ${fraction}` : fraction;
}

export function formatCandidate(candidate) {
    if (candidate === null) {
        return null;
    }

    const amount = formatFraction(candidate.divisionCount, candidate.division);

    return `${amount} ` + `${candidate.unit.label}`;
}

export function formatCompoundCandidate(candidate) {
    if (candidate === null) {
        return null;
    }

    return [
        formatCandidate(candidate.primary),
        formatCandidate(candidate.secondary),
    ].join(' + ');
}

export function formatDecimal(value, precision = 2) {
    return Number(value.toFixed(precision)).toString();
}

export function formatDecimalCandidate(candidate) {
    if (candidate === null) {
        return null;
    }

    const precision = candidate.unit.precision ?? 2;
    const amount = formatDecimal(candidate.amount, precision);

    return `${amount} ` + `${candidate.unit.label}`;
}

export function formatMetricCandidate(candidate) {
    if (candidate === null) {
        return null;
    }

    const amount = formatDecimal(candidate.amount, candidate.unit.precision);

    return `${amount} ` + `${candidate.unit.label}`;
}
