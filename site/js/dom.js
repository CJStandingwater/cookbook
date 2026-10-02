export function cloneTemplate(id) {
    return document
        .getElementById(id)
        .content
        .firstElementChild
        .cloneNode(true);
}
