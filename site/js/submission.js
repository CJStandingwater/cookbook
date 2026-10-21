const SUBMISSION_ENDPOINT =
    'https://cookbook-submissions.cjstandingwater.workers.dev/submit';

export async function submitRecipe(recipe, images = []) {
    const formData = new FormData();

    formData.append('recipe', JSON.stringify(recipe));

    for (const image of images) {
        const recipeImage =
            image.position === 0
                ? recipe.image
                : recipe.instructions[image.position - 1]?.image;

        if (!recipeImage) {
            continue;
        }

        const filename = recipeImage.src.split('/').pop();

        formData.append(`image-${image.position}`, image.file, filename);
    }

    const response = await fetch(SUBMISSION_ENDPOINT, {
        method: 'POST',
        body: formData,
    });

    let result = {};

    try {
        result = await response.json();
    } catch { }

    if (!response.ok) {
        const error = new Error(result.message || 'Recipe submission failed.');

        error.status = response.status;

        error.retryAfter = response.headers.get('Retry-After');

        throw error;
    }

    return result;
}
