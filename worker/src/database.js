export async function upsertRecipeIndex(recipe, env) {
    const db = env.COOKBOOK_DB;

    const statements = [
        db
            .prepare(
                `
            INSERT INTO recipes (
                id,
                title,
                total_minutes,
                difficulty,
                source
            )
            VALUES (?1, ?2, ?3, ?4, ?5)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                total_minutes = excluded.total_minutes,
                difficulty = excluded.difficulty,
                source = excluded.source
        `,
            )
            .bind(
                recipe.id,
                recipe.title,
                getTotalMinutes(recipe.timings),
                recipe.difficulty ?? null,
                recipe.source ?? null,
            ),

        db
            .prepare('DELETE FROM recipe_authors WHERE recipe_id = ?1')
            .bind(recipe.id),

        db.prepare('DELETE FROM recipe_tags WHERE recipe_id = ?1').bind(recipe.id),

        db.prepare('DELETE FROM recipe_tools WHERE recipe_id = ?1').bind(recipe.id),

        db
            .prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?1')
            .bind(recipe.id),
    ];

    addAuthors(statements, db, recipe.id, recipe.authors ?? []);

    addRelations(
        statements,
        db,
        recipe.id,
        'tags',
        'recipe_tags',
        'tag_id',
        recipe.tags ?? [],
    );

    addRelations(
        statements,
        db,
        recipe.id,
        'tools',
        'recipe_tools',
        'tool_id',
        recipe.tools ?? [],
    );

    addRelations(
        statements,
        db,
        recipe.id,
        'ingredients',
        'recipe_ingredients',
        'ingredient_id',
        getIngredientNames(recipe),
    );

    await db.batch(statements);
}

function addAuthors(statements, db, recipeId, authors) {
    uniqueNames(authors).forEach((name, position) => {
        statements.push(
            db
                .prepare(
                    `
                    INSERT OR IGNORE INTO authors (name)
                    VALUES (?1)
                `,
                )
                .bind(name),

            db
                .prepare(
                    `
                    INSERT INTO recipe_authors (
                        recipe_id,
                        author_id,
                        position
                    )
                    SELECT ?1, id, ?2
                    FROM authors
                    WHERE name = ?3
                `,
                )
                .bind(recipeId, position, name),
        );
    });
}

function addRelations(
    statements,
    db,
    recipeId,
    table,
    relationTable,
    foreignKey,
    values,
) {
    for (const name of uniqueNames(values)) {
        statements.push(
            db
                .prepare(
                    `
                INSERT OR IGNORE INTO ${table} (name)
                VALUES (?1)
            `,
                )
                .bind(name),

            db
                .prepare(
                    `
                INSERT INTO ${relationTable} (
                    recipe_id,
                    ${foreignKey}
                )
                SELECT ?1, id
                FROM ${table}
                WHERE name = ?2
            `,
                )
                .bind(recipeId, name),
        );
    }
}

function getIngredientNames(recipe) {
    return (recipe.ingredients ?? [])
        .flatMap((section) => section.items ?? [])
        .map((ingredient) => ingredient.item);
}

function getTotalMinutes(timings = []) {
    const total = timings.find(
        (timing) => timing.title.toLowerCase() === 'total',
    );

    if (total) {
        return total.minutes;
    }

    if (!timings.length) {
        return null;
    }

    return timings.reduce((sum, timing) => sum + timing.minutes, 0);
}

function uniqueNames(values) {
    const names = new Map();

    for (const value of values) {
        const name = value?.trim();

        if (name) {
            names.set(name.toLowerCase(), name);
        }
    }

    return [...names.values()];
}

export async function deleteRecipeIndex(recipeId, env) {
    await env.COOKBOOK_DB.prepare('DELETE FROM recipes WHERE id = ?1')
        .bind(recipeId)
        .run()
}

export async function getRecipeCards(env, options = {}) {
    const title = options.title?.trim() ?? '';
    const rules = options.rules ?? [];
    const limit = Math.min(Math.max(options.limit ?? 24, 1), 100);
    const offset = Math.max(options.offset ?? 0, 0);

    const filters = [];
    const bindings = [];

    if (title) {
        bindings.push(title);

        filters.push(`
            LOWER(r.title) LIKE
                '%' || LOWER(?${bindings.length}) || '%'
        `);
    }

    for (const rule of rules) {
        filters.push(compileSearchExpression(rule,bindings));
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    bindings.push(limit + 1);
    const limitParameter = `?${bindings.length}`;

    bindings.push(offset);
    const offsetParameter = `?${bindings.length}`;

    const { results } = await env.COOKBOOK_DB.prepare(
        `
            SELECT
                r.id,
                r.title,
                r.total_minutes,
                r.difficulty,
                r.source,

                (
                    SELECT GROUP_CONCAT(
                        name,
                        char(31)
                    )
                    FROM (
                        SELECT a.name
                        FROM recipe_authors ra
                        JOIN authors a
                            ON a.id =
                                ra.author_id
                        WHERE ra.recipe_id =
                            r.id
                        ORDER BY ra.position
                    )
                ) AS authors,

                (
                    SELECT GROUP_CONCAT(
                        name,
                        char(31)
                    )
                    FROM (
                        SELECT t.name
                        FROM recipe_tags rt
                        JOIN tags t
                            ON t.id =
                                rt.tag_id
                        WHERE rt.recipe_id =
                            r.id
                        ORDER BY
                            t.name COLLATE NOCASE
                    )
                ) AS tags

            FROM recipes r
            ${whereClause}
            ORDER BY r.title COLLATE NOCASE
            LIMIT ${limitParameter}
            OFFSET ${offsetParameter}
            `,
    )
        .bind(...bindings)
        .all();

    const hasMore = results.length > limit;

    if (hasMore) {
        results.pop();
    }

    return {
        recipes: results.map((recipe) => ({
            ...recipe,
            authors: splitNames(recipe.authors),
            tags: splitNames(recipe.tags),
        })),
        hasMore,
    };
}

const RELATION_SEARCHES = {
    authors: {
        relationTable: 'recipe_authors',
        valueTable: 'authors',
        foreignKey: 'author_id',
    },
    tags: {
        relationTable: 'recipe_tags',
        valueTable: 'tags',
        foreignKey: 'tag_id',
    },
    tools: {
        relationTable: 'recipe_tools',
        valueTable: 'tools',
        foreignKey: 'tool_id',
    },
    ingredients: {
        relationTable: 'recipe_ingredients',
        valueTable: 'ingredients',
        foreignKey: 'ingredient_id',
    },
};

function compileSearchExpression(rule, bindings) {
    const expression = compileExpression(rule.expression, bindings, (value) =>
        compileSearchValue(rule, value, bindings),
    );

    if (rule.context === 'excludes') {
        return `NOT (${expression})`;
    }

    return expression;
}

function compileExpression(expression, bindings, compileValue) {
    if (expression.type === 'value') {
        return compileValue(expression.value);
    }

    const left = compileExpression(expression.left, bindings, compileValue);
    const right = compileExpression(expression.right, bindings, compileValue);
    const operator = expression.type === 'and' ? 'AND' : 'OR';

    return `
        (
            ${left}
            ${operator}
            ${right}
        )
    `;
}

function compileSearchValue(rule, value, bindings) {
    bindings.push(rule.dataPoint === 'total_minutes' ? Number(value) : value);

    const parameter = `?${bindings.length}`;

    if (RELATION_SEARCHES[rule.dataPoint]) {
        return compileRelationSearch(rule.dataPoint, parameter);
    }

    switch (rule.dataPoint) {
        case 'title':
            return `
                LOWER(r.title) LIKE
                    '%' || LOWER(${parameter}) || '%'
            `;

        case 'source':
            return `
                LOWER(COALESCE(r.source, '')) LIKE
                    '%' || LOWER(${parameter}) || '%'
            `;

        case 'difficulty':
            return `
                r.difficulty =
                    ${parameter}
                    COLLATE NOCASE
            `;

        case 'total_minutes':
            return compileMinutesSearch(rule.context, parameter);

        default:
            throw new Error(`Unsupported search data point: ${rule.dataPoint}`);
    }
}

function compileRelationSearch(dataPoint, parameter) {
    const relation = RELATION_SEARCHES[dataPoint];

    return `
        EXISTS (
            SELECT 1
            FROM ${relation.relationTable} relation
            JOIN ${relation.valueTable} value
                ON value.id =
                    relation.${relation.foreignKey}
            WHERE relation.recipe_id = r.id
                AND value.name =
                    ${parameter}
                    COLLATE NOCASE
        )
    `;
}

function compileMinutesSearch(context, parameter) {
    switch (context) {
        case 'equals':
            return `
                r.total_minutes = ${parameter}
            `;

        case 'under':
            return `
                r.total_minutes < ${parameter}
            `;

        case 'over':
            return `
                r.total_minutes > ${parameter}
            `;

        default:
            throw new Error(`Unsupported total_minutes context: ${context}`);
    }
}

function splitNames(value) {
    return value ? value.split('\u001f') : [];
}
