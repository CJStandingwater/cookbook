const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");

const recipeDirectory = path.join(__dirname, "../recipes");
const recipeSchemaPath = path.join(
    __dirname,
    "../schema/recipe.schema.json"
);
const tagSchemaPath = path.join(
    __dirname,
    "../schema/tags.flattened.json"
);

function readJson(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
}

function formatError(error) {
    const location = error.instancePath || "/";
    return `  ${location}: ${error.message}`;
}

function validateRecipes() {
    let recipeSchema;
    let tagSchema;

    try {
        recipeSchema = readJson(recipeSchemaPath);
        tagSchema = readJson(tagSchemaPath);
    } catch (error) {
        console.error("Failed to load schema files.");
        console.error(error.message);
        process.exit(1);
    }

    const ajv = new Ajv2020({
        allErrors: true
    });

    ajv.addSchema(tagSchema);

    let validate;

    try {
        validate = ajv.compile(recipeSchema);
    } catch (error) {
        console.error("Recipe schema is invalid.");
        console.error(error.message);
        process.exit(1);
    }

    const recipeFiles = fs
        .readdirSync(recipeDirectory)
        .filter(file => file.endsWith(".json"))
        .sort();

    if (recipeFiles.length === 0) {
        console.log("No recipe files found.");
        return;
    }

    let invalidRecipes = 0;

    for (const fileName of recipeFiles) {
        const filePath = path.join(recipeDirectory, fileName);

        let recipe;

        try {
            recipe = readJson(filePath);
        } catch (error) {
            console.error(`\n${fileName}`);
            console.error(`  Invalid JSON: ${error.message}`);
            invalidRecipes++;
            continue;
        }

        const isValid = validate(recipe);

        if (isValid) {
            console.log(`PASS  ${fileName}`);
            continue;
        }

        console.error(`\nFAIL  ${fileName}`);

        for (const error of validate.errors) {
            console.error(formatError(error));
        }

        invalidRecipes++;
    }

    console.log("");

    if (invalidRecipes > 0) {
        console.error(
            `${invalidRecipes} recipe(s) failed validation.`
        );
        process.exit(1);
    }

    console.log(
        `All ${recipeFiles.length} recipe(s) passed validation.`
    );
}

validateRecipes();