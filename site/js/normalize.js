export function normalizeWhitespace(value) {
    return value.trim().replace(/\s+/g, " ");
}

export function normalizeName(value) {
    return normalizeWhitespace(value)
        .toLowerCase()
        .replace(
            /(^|[\s-])([a-z])/g,
            (_, prefix, letter) => prefix + letter.toUpperCase()
        );
}

export function formatLabel(value) {
    return normalizeName(value.replace(/-/g, " "));
}

export function splitCommaSeparated(value) {
    return value
        .split(",")
        .map(normalizeWhitespace)
        .filter(Boolean);
}

export function splitLines(value) {
    return value
        .split("\n")
        .map(normalizeWhitespace)
        .filter(Boolean);
}
