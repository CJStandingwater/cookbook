const fs = require("fs");
const path = require("path");

const tagSourcePath = path.join(__dirname, "../schema/tags.enum.json");
const tagOutputPath = path.join(__dirname, "../schema/tags.flattened.json");

function generateTags()
{
    const groupedTags = JSON.parse(fs.readFileSync(tagSourcePath, "utf8"));
    const flattenedTags = Object.values(groupedTags).flat();

    const tagSchema =
    {
        $id: "tags.flattened.json",
        type: "string",
        enum: flattenedTags
    };

    fs.writeFileSync(tagOutputPath, JSON.stringify(tagSchema, null, 2) + "\n");

    console.log(`Generated ${flattenedTags.length} tags in schema/tags.flattened.json`);
}

generateTags();