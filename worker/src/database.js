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
