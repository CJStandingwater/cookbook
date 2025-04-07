const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Path to hash storage
const hashFilePath = path.join(__dirname, "../data/ingredient-hashes.json");

// Load existing hashes
let hashMap = {};
if (fs.existsSync(hashFilePath)) {
  try {
    hashMap = JSON.parse(fs.readFileSync(hashFilePath, "utf-8"));
  } catch (err) {
    console.error("Failed to parse existing ingredient-hashes.json", err);
    process.exit(1);
  }
}

// Helper: Normalize and hash ingredients
function hashIngredients(ingredients) {
  const ingredientList = ingredients
    .flatMap(section => section.items.map(item => item.item))
    .map(i => i.toLowerCase())
    .sort();
  const hash = crypto.createHash("sha256").update(ingredientList.join(",")).digest("hex");
  return hash;
}

// Get changed recipe files
const recipeDir = path.join(__dirname, "../recipes");
const changedFiles = process.env.CHANGED_FILES ? process.env.CHANGED_FILES.split("\n") : [];

let duplicatesFound = false;

for (const file of changedFiles) {
  const fullPath = path.join(recipeDir, file);
  if (!fs.existsSync(fullPath)) continue;

  const recipe = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  const hash = hashIngredients(recipe.ingredients);
  const recipeName = file.replace(/^recipes\//, "");

  // Check if this hash already exists and file isn't already linked
  const existing = hashMap[hash] || [];
  const isAlreadyIncluded = existing.includes(recipeName);

  if (!isAlreadyIncluded && existing.length > 0 && !recipeName.includes("#allow-dupe")) {
    console.warn(`Possible duplicate detected for ${recipeName}:`);
    console.warn(`Matches existing recipe(s): ${existing.join(", ")}`);
    duplicatesFound = true;
  }

  if (!isAlreadyIncluded && !duplicatesFound) {
    if (!hashMap[hash]) hashMap[hash] = [];
    hashMap[hash].push(recipeName);
  }
}

// Save updated hash map if no duplicates were found
if (duplicatesFound) {
  process.exit(1);
} else {
  fs.writeFileSync(hashFilePath, JSON.stringify(hashMap, null, 2));
  console.log("Ingredient hash map updated successfully.");
}
