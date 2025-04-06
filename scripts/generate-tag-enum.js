const fs = require("fs");
const path = require("path");

const source = path.join(__dirname, "../schema/tags.enum.json");
const output = path.join(__dirname, "../schema/tags.flattened.json");

const grouped = JSON.parse(fs.readFileSync(source, "utf-8"));
const flattened = Object.values(grouped).flat();

const schemaWrapper = {
  $id: "tags.flattened.json",
  type: "array",
  items: {
    type: "string",
    enum: flattened
  }
};

fs.writeFileSync(output, JSON.stringify(schemaWrapper, null, 2));
console.log("tags.flattened.json updated from tags.enum.json");
