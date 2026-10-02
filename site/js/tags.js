import { TAG_SOURCES } from "./constants.js";
import { formatLabel } from "./normalize.js";

async function fetchTags() {
    for (const source of TAG_SOURCES) {
        try {
            const response = await fetch(source);

            if (response.ok) {
                return await response.json();
            }
        } catch {
        }
    }

    throw new Error("Unable to load approved tags.");
}

export async function loadTags(container, errorElement) {
    errorElement.textContent = "";

    try {
        const categories = await fetchTags();
        container.replaceChildren();

        for (const [category, tags] of Object.entries(categories)) {
            const section = document.createElement("section");
            section.className = "tag-category";

            const heading = document.createElement("strong");
            heading.textContent = formatLabel(category);

            const list = document.createElement("div");
            list.className = "tag-list";

            for (const tag of tags) {
                const label = document.createElement("label");
                label.className = "tag-option";

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className = "recipe-tag";
                checkbox.value = tag;

                const text = document.createElement("span");
                text.textContent = tag;

                label.append(checkbox, text);
                list.appendChild(label);
            }

            section.append(heading, list);
            container.appendChild(section);
        }
    } catch {
        container.textContent = "";
        errorElement.textContent =
            "Approved tags could not be loaded from the cookbook repository.";
    }
}

export function getSelectedTags() {
    return [...document.querySelectorAll(".recipe-tag:checked")]
        .map(input => input.value);
}
