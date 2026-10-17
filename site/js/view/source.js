const RECIPE_SOURCE =
    'https://raw.githubusercontent.com/CJStandingwater/cookbook/main/recipes';

const RECIPE_ID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getRecipeId() {
    const params = new URLSearchParams(window.location.search);

    if (params.size == 0) {
        throw new Error('URL Search Params not provided');
    }

    const id = params.get('id');

    if (!id || !RECIPE_ID_PATTERN.test(id)) {
        throw new Error('Invalid recipe ID.');
    }

    return id;
}

export async function loadRecipe(id) {
    if (!RECIPE_ID_PATTERN.test(id)) {
        throw new Error('Invalid recipe ID.');
    }

    const response = await fetch(`${RECIPE_SOURCE}/${id}.json`);

    if (response.status === 404) {
        throw new Error('Recipe not found.');
    }

    if (!response.ok) {
        throw new Error('Unable to load recipe.');
    }

    try {
        return await response.json();
    } catch {
        throw new Error('Recipe data is invalid.');
    }
}

export async function loadRecipeFromUrl() {
    return loadRecipe(getRecipeId());
}
