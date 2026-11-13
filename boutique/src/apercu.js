// Aperçu en un seul fichier : chaque page de la boutique est un écran <div data-view="…">.
// Le #nom de l'adresse choisit l'écran affiché (#fr par défaut), et les liens #… changent d'écran.
(() => {
  const ecrans = new Map([...document.querySelectorAll('[data-view]')].map((el) => [el.dataset.view, el]));
  const depart = ecrans.keys().next().value;
  const douceur = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  let actuel = null;

  function afficher() {
    const nom = decodeURIComponent(location.hash.slice(1));
    const suivant = ecrans.get(nom) ?? ecrans.get(depart);
    if (suivant === actuel) return;
    if (actuel) actuel.hidden = true;
    suivant.hidden = false;
    actuel = suivant;
    document.title = suivant.dataset.title;
    document.documentElement.lang = suivant.lang;
    window.scrollTo(0, 0);
  }

  // Un lien vers une section de l'écran affiché (ex. « Voir nos coups de cœur ») fait défiler la page
  // sans changer d'écran.
  document.addEventListener('click', (event) => {
    const lien = event.target.closest('a[href^="#"]');
    if (!lien || !actuel) return;
    const nom = decodeURIComponent(lien.getAttribute('href').slice(1));
    if (ecrans.has(nom)) return;
    const cible = actuel.querySelector(`[id="${nom.replace(/"/g, '')}"]`);
    if (cible) {
      event.preventDefault();
      cible.scrollIntoView({ behavior: douceur(), block: 'start' });
    }
  });

  window.addEventListener('hashchange', afficher);
  afficher();
})();
