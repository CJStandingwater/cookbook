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
const commonSchemaPath = path.join(
    __dirname,
    "../schema/common.json"
);
const actionsSchemaPath = path.join(
    __dirname,
    "../schema/actions.enum.json"
);
const toolsSchemaPath = path.join(
    __dirname,
    "../schema/tools.enum.json"
);
const difficultySchemaPath = path.join(
    __dirname,
    "../schema/difficulty.enum.json"
);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readJson(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
}

function formatError(error) {
    const location = error.instancePath || "/";
    return `  ${location}: ${error.message}`;
}

function validateRecipeId(fileName, recipe, seenIds) {
    const errors = [];

    if (typeof recipe.id !== "string" || !UUID_REGEX.test(recipe.id)) {
        errors.push(`Invalid or missing 'id' field in ${fileName}`);
        return errors;
    }

    const expectedFileName = `${recipe.id}.json`;

    if (fileName !== expectedFileName) {
        errors.push("File name does not match recipe ID.");
        return errors;
    }

    if (seenIds.has(recipe.id)) {
        errors.push("Duplicate recipe ID found.");
        return errors;
    } else {
        seenIds.set(recipe.id, fileName);
    }

    return errors;
}

function validateRecipes() {
    let recipeSchema;
    let tagSchema;
    let commonSchema;
    let actionsSchema;
    let toolsSchema;
    let difficultySchema;

    try {
        recipeSchema = readJson(recipeSchemaPath);
        tagSchema = readJson(tagSchemaPath);
        commonSchema = readJson(commonSchemaPath);
        actionsSchema = readJson(actionsSchemaPath);
        toolsSchema = readJson(toolsSchemaPath);
        difficultySchema = readJson(difficultySchemaPath);
    } catch (error) {
        console.error("Failed to load schema files.");
        console.error(error.message);
        process.exit(1);
    }

    const ajv = new Ajv2020({
        allErrors: true
    });

    ajv.addSchema(tagSchema);
    ajv.addSchema(commonSchema);
    ajv.addSchema(actionsSchema);
    ajv.addSchema(toolsSchema);
    ajv.addSchema(difficultySchema);

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

    const seenIds = new Map();

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

        const isSchemaValid = validate(recipe);
        const identityErrors = validateRecipeId(fileName, recipe, seenIds);

        if (isSchemaValid && identityErrors.length === 0) {
            console.log(`PASS  ${fileName}`);
            continue;
        }

        console.error(`\nFAIL  ${fileName}`);

        if (!isSchemaValid) {
            console.error("  Schema validation errors:");
        }

        if (validate.errors) {
            for (const error of validate.errors) {
                console.error(formatError(error));
            }
        }

        for (const error of identityErrors) {
            console.error(error);
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