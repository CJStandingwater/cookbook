export function findUnitCandidate(measure, unit) {
    if (!Number.isFinite(measure) || measure <= 0) {
        return null;
    }

    const ratio = measure / unit.value;

    if (ratio < unit.min || ratio > unit.max) {
        return null;
    }

    let best = null;

    for (const division of unit.divisions) {
        const divisionValue = unit.value / division;
        const divisionCount = Math.round(measure / divisionValue);

        if (divisionCount <= 0) {
            continue;
        }

        const candidateMeasure = divisionCount * divisionValue;
        const relativeError = Math.abs(measure - candidateMeasure) / measure;

        if (relativeError > unit.tolerance) {
            continue;
        }

        const candidate = {
            unit,
            division,
            divisionCount,
            amount: divisionCount / division,
            candidateMeasure,
            relativeError,
        };

        if (
            best === null ||
            candidate.relativeError < best.relativeError ||
            (candidate.relativeError === best.relativeError &&
                candidate.division < best.division)
        ) {
            best = candidate;
        }
    }

    return best;
}

export function findFriendlyMeasurement(measure, units) {
    for (const unit of units) {
        const candidate = findUnitCandidate(measure, unit);

        if (candidate !== null) {
            return candidate;
        }
    }

    return null;
}

export function findCompoundMeasurement(measure, units) {
    if (!Number.isFinite(measure) || measure <= 0) {
        return null;
    }

    let best = null;

    for (let primaryIndex = 0; primaryIndex < units.length - 1; primaryIndex++) {
        const primaryUnit = units[primaryIndex];
        const ratio = measure / primaryUnit.value;

        if (ratio < primaryUnit.min || ratio > primaryUnit.max) {
            continue;
        }

        for (const division of primaryUnit.divisions) {
            const divisionValue = primaryUnit.value / division;
            const minDivisionCount = Math.ceil(primaryUnit.min * division);
            const maxDivisionCount = Math.floor(primaryUnit.max * division);
            const availableDivisionCount = Math.floor(measure / divisionValue);
            const divisionCount = Math.min(availableDivisionCount, maxDivisionCount);

            if (divisionCount < minDivisionCount) {
                continue;
            }

            const primaryMeasure = divisionCount * divisionValue;
            const remainder = measure - primaryMeasure;

            if (remainder <= 0) {
                continue;
            }

            for (
                let secondaryIndex = primaryIndex + 1;
                secondaryIndex < units.length;
                secondaryIndex++
            ) {
                const secondaryCandidate = findUnitCandidate(
                    remainder,
                    units[secondaryIndex],
                );

                if (secondaryCandidate === null) {
                    continue;
                }

                const candidateMeasure =
                    primaryMeasure + secondaryCandidate.candidateMeasure;
                const relativeError = Math.abs(measure - candidateMeasure) / measure;
                const tolerance = Math.min(
                    primaryUnit.tolerance,
                    secondaryCandidate.unit.tolerance,
                );

                if (relativeError > tolerance) {
                    continue;
                }

                const primaryCandidate = {
                    unit: primaryUnit,
                    division,
                    divisionCount,
                    amount: divisionCount / division,
                    candidateMeasure: primaryMeasure,
                };

                const candidate = {
                    primary: primaryCandidate,
                    secondary: secondaryCandidate,
                    candidateMeasure,
                    relativeError,
                    complexity:
                        getFractionComplexity(primaryCandidate) +
                        getFractionComplexity(secondaryCandidate),
                    primaryIndex,
                    secondaryIndex,
                };

                if (
                    best === null ||
                    candidate.relativeError < best.relativeError ||
                    (candidate.relativeError === best.relativeError &&
                        candidate.complexity < best.complexity) ||
                    (candidate.relativeError === best.relativeError &&
                        candidate.complexity === best.complexity &&
                        candidate.primaryIndex < best.primaryIndex)
                ) {
                    best = candidate;
                }
            }
        }
    }

    return best;
}

export function findDecimalMeasurement(measure, units) {
    if (!Number.isFinite(measure) || measure <= 0) {
        return null;
    }

    for (const unit of units) {
        const amount = measure / unit.value;

        if (amount >= unit.min && amount <= unit.max) {
            return {
                unit,
                amount,
            };
        }
    }

    return null;
}

export function findMetricCandidate(measure, units) {
    if (!Number.isFinite(measure) || measure <= 0) {
        return null;
    }

    for (const unit of units) {
        const amount = measure / unit.value;

        if (amount < unit.min || amount > unit.max) {
            continue;
        }

        const snappedAmount = Math.round(amount / unit.increment) * unit.increment;
        const candidateMeasure = snappedAmount * unit.value;
        const relativeError = Math.abs(measure - candidateMeasure) / measure;
        const snapped = relativeError <= unit.tolerance;

        return {
            unit,
            amount: snapped ? snappedAmount : amount,
            candidateMeasure,
            relativeError,
            snapped,
        };
    }

    return null;
}

export function findCountCandidate(count, divisions, tolerance) {
    if (!Number.isFinite(count) || count <= 0) {
        return null;
    }

    let best = null;

    for (const division of divisions) {
        const divisionCount = Math.round(count * division);

        if (divisionCount <= 0) {
            continue;
        }

        const candidateAmount = divisionCount / division;
        const relativeError = Math.abs(count - candidateAmount) / count;

        if (relativeError > tolerance) {
            continue;
        }

        const candidate = {
            division,
            divisionCount,
            amount: candidateAmount,
            relativeError,
        };

        if (
            best === null ||
            candidate.relativeError < best.relativeError ||
            (candidate.relativeError === best.relativeError &&
                candidate.division < best.division)
        ) {
            best = candidate;
        }
    }

    return best;
}

export function greatestCommonDivisor(a, b) {
    while (b !== 0) {
        [a, b] = [b, a % b];
    }

    return a;
}

function getFractionComplexity(candidate) {
    const remainder = candidate.divisionCount % candidate.division;

    if (remainder === 0) {
        return 0;
    }

    const factor = greatestCommonDivisor(remainder, candidate.division);

    return candidate.division / factor;
}
