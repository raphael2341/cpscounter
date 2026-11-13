// Aperçu en un seul fichier : chaque page de la boutique est un écran <div data-view="…">.
// Le #nom de l'adresse choisit l'écran affiché (le premier par défaut). Un nom suivi de « --section »
// ouvre l'écran puis descend à cette section : #fr-idees-cadeaux--budget-2.
(() => {
  const ecrans = new Map([...document.querySelectorAll('[data-view]')].map((el) => [el.dataset.view, el]));
  const depart = ecrans.keys().next().value;
  const douceur = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  let actuel = null;

  function lire(hash) {
    const [nom, section] = decodeURIComponent(hash.replace(/^#/, '')).split('--');
    return { nom, section };
  }

  function allerSection(ecran, section, doux) {
    const cible = section ? ecran.querySelector(`[id="${section.replace(/"/g, '')}"]`) : null;
    if (cible) cible.scrollIntoView({ behavior: doux ? douceur() : 'auto', block: 'start' });
    return Boolean(cible);
  }

  function afficher() {
    const { nom, section } = lire(location.hash);
    const suivant = ecrans.get(nom) ?? ecrans.get(depart);
    const change = suivant !== actuel;
    if (change) {
      if (actuel) actuel.hidden = true;
      suivant.hidden = false;
      actuel = suivant;
      document.title = suivant.dataset.title;
      document.documentElement.lang = suivant.lang;
      document.dispatchEvent(new Event('boutique:ecran'));
    }
    if (!allerSection(suivant, section, !change) && change) window.scrollTo(0, 0);
  }

  document.addEventListener('click', (event) => {
    const lien = event.target.closest('a[href^="#"]');
    if (!lien || !actuel) return;
    const { nom, section } = lire(lien.getAttribute('href'));
    if (ecrans.has(nom)) {
      // Même écran, autre section : l'adresse peut ne pas changer, on fait défiler nous-mêmes.
      if (ecrans.get(nom) === actuel && section) allerSection(actuel, section, true);
      return;
    }
    // Lien vers une section de l'écran affiché (ex. « Nos coups de cœur ») : on défile sans changer d'écran.
    if (allerSection(actuel, nom, true)) event.preventDefault();
  });

  window.addEventListener('hashchange', afficher);
  afficher();
})();
