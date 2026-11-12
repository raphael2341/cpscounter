// Aperçu : le bouton « Ajouter au panier » affiche un message, le paiement n'est pas branché.
(() => {
  const toast = document.querySelector('.toast');
  if (!toast) return;
  let timer;
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add-to-cart]');
    if (!button) return;
    toast.textContent = button.dataset.message;
    toast.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
  });
})();
