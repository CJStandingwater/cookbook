CREATE TABLE recipes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    total_minutes INTEGER,
    difficulty TEXT,
    source TEXT
);

CREATE TABLE authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE recipe_authors (
    recipe_id TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    position INTEGER NOT NULL,

    PRIMARY KEY (recipe_id, author_id),

    FOREIGN KEY (recipe_id)
        REFERENCES recipes(id)
        ON DELETE CASCADE,

    FOREIGN KEY (author_id)
        REFERENCES authors(id)
        ON DELETE CASCADE
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE recipe_tags (
    recipe_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,

    PRIMARY KEY (recipe_id, tag_id),

    FOREIGN KEY (recipe_id)
        REFERENCES recipes(id)
        ON DELETE CASCADE,

    FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
);

CREATE TABLE tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE recipe_tools (
    recipe_id TEXT NOT NULL,
    tool_id INTEGER NOT NULL,

    PRIMARY KEY (recipe_id, tool_id),

    FOREIGN KEY (recipe_id)
        REFERENCES recipes(id)
        ON DELETE CASCADE,

    FOREIGN KEY (tool_id)
        REFERENCES tools(id)
        ON DELETE CASCADE
);

CREATE TABLE ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE recipe_ingredients (
    recipe_id TEXT NOT NULL,
    ingredient_id INTEGER NOT NULL,

    PRIMARY KEY (recipe_id, ingredient_id),

    FOREIGN KEY (recipe_id)
        REFERENCES recipes(id)
        ON DELETE CASCADE,

    FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_recipes_title
    ON recipes(title);

CREATE INDEX idx_recipes_total_minutes
    ON recipes(total_minutes);

CREATE INDEX idx_recipes_difficulty
    ON recipes(difficulty);

CREATE INDEX idx_recipe_authors_author
    ON recipe_authors(author_id);

CREATE INDEX idx_recipe_tags_tag
    ON recipe_tags(tag_id);

CREATE INDEX idx_recipe_tools_tool
    ON recipe_tools(tool_id);

CREATE INDEX idx_recipe_ingredients_ingredient
    ON recipe_ingredients(ingredient_id);