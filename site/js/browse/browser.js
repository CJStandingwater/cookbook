const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

const BROWSE_ENDPOINT = LOCAL_HOSTS.has(window.location.hostname)
    ? 'http://localhost:8787/browse'
    : 'https://cookbook-submissions.cjstandingwater.workers.dev/browse';

const PAGE_SIZE = 24;

const browser = document.getElementById('recipe-browser');
const status = document.getElementById('browser-status');
const recipeSearch = document.querySelector('input[name="recipe-search"]');

let searchTimer = null;

async function loadRecipes() {
    setStatus('Loading results...');
    browser.hidden = true;

    const url = new URL(BROWSE_ENDPOINT);

    if (recipeSearch.value.trim()) {
        url.searchParams.set(
            'search',
            recipeSearch.value.trim(),
        );
    }

    url.searchParams.set('limit', PAGE_SIZE);

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Unable to load recipes.');
        }

        renderRecipes(result.recipes);
    } catch (error) {
        showError(error.message || 'Unable to load recipes.');
    }
}

function renderRecipes(recipes) {
    browser.replaceChildren();

    if (!recipes.length) {
        setStatus('No recipes found.');
        return;
    }

    for (const recipe of recipes) {
        browser.append(createRecipeCard(recipe));
    }

    clearStatus();
    browser.hidden = false;
}

function createRecipeCard(recipe) {
    const link = document.createElement('a');
    link.className = 'recipe-card';
    link.href = `viewer.html?id=${encodeURIComponent(recipe.id)}`;

    const title = document.createElement('h2');
    title.textContent = recipe.title;
    link.append(title);

    if (recipe.authors.length) {
        link.append(createDetail('By', recipe.authors.join(', ')));
    }

    if (recipe.total_minutes !== null) {
        link.append(
            createDetail('Total Time', formatMinutes(recipe.total_minutes)),
        );
    }

    if (recipe.difficulty) {
        link.append(createDetail('Difficulty', recipe.difficulty));
    }

    if (recipe.source) {
        link.append(createDetail('Source', recipe.source));
    }

    if (recipe.tags.length) {
        const tags = document.createElement('p');
        tags.className = 'recipe-card-tags';
        tags.textContent = recipe.tags.join(' · ');
        link.append(tags);
    }

    return link;
}

function createDetail(label, value) {
    const detail = document.createElement('p');

    const heading = document.createElement('strong');
    heading.textContent = `${label}: `;

    detail.append(heading, document.createTextNode(value));

    return detail;
}

function formatMinutes(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (!hours) {
        return `${minutes} min`;
    }

    if (!remainingMinutes) {
        return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
}

function setStatus(message) {
    status.textContent = message;
    status.classList.remove('error');
}

function clearStatus() {
    status.textContent = '';
}

function showError(message) {
    browser.hidden = true;
    status.textContent = message;
    status.classList.add('error');
}

recipeSearch.addEventListener('input', () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(loadRecipes, 250);
});

loadRecipes();
