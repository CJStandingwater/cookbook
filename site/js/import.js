const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

const IMPORT_ENDPOINT = LOCAL_HOSTS.has(window.location.hostname)
    ? 'http://localhost:8787/import'
    : 'https://cookbook-submissions.cjstandingwater.workers.dev/import';

export async function importRecipeFile(file) {
    if (!(file instanceof File)) {
        throw new Error('Select a recipe file to import.');
    }

    const formData = new FormData();

    formData.append('file', file, file.name);

    const response = await fetch(IMPORT_ENDPOINT, {
        method: 'POST',
        body: formData,
    });

    let result = {};

    try {
        result = await response.json();
    } catch { }

    if (!response.ok) {
        throw new Error(result.message || 'Recipe import failed.');
    }

    if (!result.recipe || typeof result.recipe !== 'object') {
        throw new Error('Recipe import returned invalid data.');
    }

    return result.recipe;
}
