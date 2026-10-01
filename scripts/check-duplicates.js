const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const recipeDirectory = path.join(__dirname, "../recipes");

function readJson(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
}

function normalizeIngredientName(name) {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function getIngredientNames(recipe) {
    return recipe.ingredients
        .flatMap(section => section.items)
        .map(ingredient => normalizeIngredientName(ingredient.item))
        .sort();
}

function createIngredientHash(recipe) {
    const ingredientNames = getIngredientNames(recipe);

    return crypto
        .createHash("sha256")
        .update(JSON.stringify(ingredientNames))
        .digest("hex");
}

function checkDuplicates() {
    const recipeFiles = fs
        .readdirSync(recipeDirectory)
        .filter(file => file.endsWith(".json"))
        .sort();

    if (recipeFiles.length === 0) {
        console.log("No recipe files found.");
        return;
    }

    const hashes = new Map();
    const duplicateGroups = [];

    for (const fileName of recipeFiles) {
        const filePath = path.join(recipeDirectory, fileName);

        let recipe;

        try {
            recipe = readJson(filePath);
        } catch (error) {
            console.error(`Failed to read ${fileName}: ${error.message}`);
            process.exit(1);
        }

        if (!Array.isArray(recipe.ingredients)) {
            console.error(
                `${fileName} does not contain a valid ingredients array.`
            );
            process.exit(1);
        }

        const hash = createIngredientHash(recipe);

        if (!hashes.has(hash)) {
            hashes.set(hash, []);
        }

        hashes.get(hash).push(fileName);
    }

    for (const files of hashes.values()) {
        if (files.length > 1) {
            duplicateGroups.push(files);
        }
    }

    if (duplicateGroups.length > 0) {
        console.error("Possible duplicate recipes found:");

        for (const files of duplicateGroups) {
            console.error("");
            for (const file of files) {
                console.error(`  ${file}`);
            }
        }

        process.exit(1);
    }

    console.log(
        `No duplicates found among ${recipeFiles.length} recipe(s).`
    );
}

checkDuplicates();

module.exports = {
    normalizeIngredientName,
    getIngredientNames,
    createIngredientHash
};