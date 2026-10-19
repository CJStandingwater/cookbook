const fs = require('fs');
const path = require('path');

const INDEX_ENDPOINT = process.env.INDEX_ENDPOINT;
const INDEX_API_KEY = process.env.INDEX_API_KEY;
const recipeDirectory = path.resolve(__dirname, '../recipes');
const recipePaths = process.argv.slice(2);

async function indexRecipe(filePath) {
    const resolvedPath = path.resolve(filePath);

    if (!resolvedPath.startsWith(`${recipeDirectory}${path.sep}`)) {
        throw new Error(`Recipe must be inside /recipes: ${filePath}`);
    }

    if (!resolvedPath.endsWith('.json')) {
        throw new Error(`Recipe must be a JSON file: ${filePath}`);
    }

    const recipe = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));

    const response = await fetch(INDEX_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${INDEX_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipe),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || `Failed to index ${filePath}`);
    }

    console.log(`INDEXED  ${filePath}`);
}

async function deleteRecipe(filePath) {
    const recipeId = path.basename(filePath, '.json');

    const response = await fetch(
        `${INDEX_ENDPOINT}?id=${encodeURIComponent(recipeId)}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${INDEX_API_KEY}`,
            },
        },
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || `Failed to remove ${filePath} from index`,
        );
    }

    console.log(`DELETED  ${filePath}`);
}


async function syncRecipeIndex() {
    if (!INDEX_ENDPOINT) {
        throw new Error('INDEX_ENDPOINT is required.');
    }

    if (!INDEX_API_KEY) {
        throw new Error('INDEX_API_KEY is required.');
    }

    if (!recipePaths.length) {
        throw new Error('At least one recipe path is required.');
    }

    for (const recipePath of recipePaths) {
        if (fs.existsSync(recipePath)) {
            await indexRecipe(recipePath)
        } else {
            await deleteRecipe(recipePath)
        }
    }
}

syncRecipeIndex().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
