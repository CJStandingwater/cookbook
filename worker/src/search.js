const SEGMENT_PATTERN = /\s*([a-z][a-z0-9_-]*)\.([a-z][a-z0-9_-]*)\s*\[/iy;

const SEARCH_CONTEXTS = {
    title: new Set([
        'contains',
        'excludes',
    ]),
    authors: new Set([
        'contains',
        'excludes',
    ]),
    tags: new Set([
        'contains',
        'excludes',
    ]),
    total_minutes: new Set([
        'equals',
        'under',
        'over',
    ]),
    tools: new Set([
        'contains',
        'excludes',
    ]),
    difficulty: new Set([
        'contains',
        'excludes',
    ]),
    source: new Set([
        'contains',
        'excludes',
    ]),
    ingredients: new Set([
        'contains',
        'excludes',
    ]),
};

export class SearchSyntaxError extends Error { }

export function parseSearch(search = '') {
    const text = search.trim();

    if (!text) {
        return [];
    }

    const segments = [];
    let position = 0;

    while (position < text.length) {
        SEGMENT_PATTERN.lastIndex = position;

        const match = SEGMENT_PATTERN.exec(text);

        if (!match) {
            throw new SearchSyntaxError(
                `Invalid search syntax near: ${text.slice(position)}`,
            );
        }

        const end = text.indexOf(']', SEGMENT_PATTERN.lastIndex);

        if (end === -1) {
            throw new SearchSyntaxError(
                'Search segment is missing a closing bracket.',
            );
        }

        const expressionText = text.slice(SEGMENT_PATTERN.lastIndex, end);

        segments.push({
            dataPoint: match[1].toLowerCase(),
            context: match[2].toLowerCase(),
            expression: parseExpression(expressionText),
        });

        position = end + 1;
    }

    return segments;
}

export function validateSearchRules(segments) {
    for (const segment of segments) {
        const contexts = SEARCH_CONTEXTS[segment.dataPoint];

        if (!contexts) {
            throw new SearchSyntaxError(
                `Unsupported search data point: ${segment.dataPoint}`,
            );
        }

        if (!contexts.has(segment.context)) {
            throw new SearchSyntaxError(
                `Unsupported search context: ${segment.dataPoint}.${segment.context}`,
            );
        }

        if (segment.dataPoint === 'total_minutes') {
            validateNumericExpression(segment.expression);
        }
    }

    return segments;
}

function validateNumericExpression(expression) {
    if (expression.type === 'value') {
        const value = Number(expression.value);

        if (!Number.isFinite(value) || value < 0) {
            throw new SearchSyntaxError(
                `Invalid total_minutes value: ${expression.value}`,
            );
        }

        return;
    }

    validateNumericExpression(expression.left);
    validateNumericExpression(expression.right);
}

function parseExpression(text) {
    const tokens = tokenizeExpression(text);

    if (!tokens.length) {
        throw new SearchSyntaxError('Search expression cannot be empty.');
    }

    let position = 0;

    function parseOr() {
        let expression = parseAnd();

        while (tokens[position] === '|') {
            position++;

            expression = {
                type: 'or',
                left: expression,
                right: parseAnd(),
            };
        }

        return expression;
    }

    function parseAnd() {
        let expression = parsePrimary();

        while (tokens[position] === '&' || tokens[position] === ',') {
            position++;

            expression = {
                type: 'and',
                left: expression,
                right: parsePrimary(),
            };
        }

        return expression;
    }

    function parsePrimary() {
        const token = tokens[position];

        if (!token) {
            throw new SearchSyntaxError('Expected a search value.');
        }

        if (token === '(') {
            position++;

            const expression = parseOr();

            if (tokens[position] !== ')') {
                throw new SearchSyntaxError(
                    'Search expression is missing a closing parenthesis.',
                );
            }

            position++;
            return expression;
        }

        if (token === ')' || token === '&' || token === '|' || token === ',') {
            throw new SearchSyntaxError(
                `Unexpected "${token}" in search expression.`,
            );
        }

        position++;

        return {
            type: 'value',
            value: token.toLowerCase(),
        };
    }

    const expression = parseOr();

    if (position !== tokens.length) {
        throw new SearchSyntaxError(
            `Unexpected "${tokens[position]}" in search expression.`,
        );
    }

    return expression;
}

function tokenizeExpression(text) {
    const tokens = [];
    let start = 0;

    for (let index = 0; index < text.length; index++) {
        const character = text[index];

        if (!'()&|,'.includes(character)) {
            continue;
        }

        addValueToken(tokens, text.slice(start, index));

        tokens.push(character);
        start = index + 1;
    }

    addValueToken(tokens, text.slice(start));

    return tokens;
}

function addValueToken(tokens, value) {
    const trimmed = value.trim();

    if (trimmed) {
        tokens.push(trimmed);
    }
}
