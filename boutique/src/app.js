// Script du site : message du bouton panier, compte à rebours de Noël et neige de l'ouverture.
(() => {
  // --- Panier : aperçu seulement, le paiement n'est pas branché. --------------------------------
  const toast = document.querySelector('.toast');
  let minuterie;
  document.addEventListener('click', (event) => {
    const bouton = event.target.closest('[data-add-to-cart]');
    if (!bouton || !toast) return;
    toast.textContent = bouton.dataset.message;
    toast.classList.add('is-visible');
    clearTimeout(minuterie);
    minuterie = setTimeout(() => toast.classList.remove('is-visible'), 3200);
  });

  // --- « Noël dans N jours », calculé à la date du visiteur. Rien ne s'affiche après le 24. -----
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const jours = Math.round((new Date(aujourdhui.getFullYear(), 11, 25) - aujourdhui) / 864e5);
  if (jours > 0) {
    for (const el of document.querySelectorAll('[data-noel]')) {
      el.textContent = jours === 1 ? el.getAttribute('data-noel-1') : el.getAttribute('data-noel').replace('{n}', jours);
    }
  }

  // --- Neige : quelques flocons sur l'ouverture de la page d'accueil. ----------------------------
  const calme = matchMedia('(prefers-reduced-motion: reduce)');

  function neige(canvas) {
    const ctx = canvas.getContext('2d');
    let flocons = [];
    let largeur = 0;
    let hauteur = 0;
    let boucle = null;

    const flocon = (partout) => ({
      x: Math.random() * largeur,
      y: partout ? Math.random() * hauteur : -6,
      rayon: 0.8 + Math.random() * 2.2,
      vitesse: 0.25 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      opacite: 0.35 + Math.random() * 0.55,
    });

    function mesurer() {
      const boite = canvas.getBoundingClientRect();
      const densite = Math.min(window.devicePixelRatio || 1, 2);
      largeur = boite.width;
      hauteur = boite.height;
      canvas.width = Math.round(largeur * densite);
      canvas.height = Math.round(hauteur * densite);
      ctx.setTransform(densite, 0, 0, densite, 0, 0);
      ctx.fillStyle = '#fff';
      const nombre = Math.round(Math.min(90, (largeur * hauteur) / 13000));
      flocons = Array.from({ length: nombre }, () => flocon(true));
    }

    function dessiner() {
      ctx.clearRect(0, 0, largeur, hauteur);
      for (const f of flocons) {
        ctx.globalAlpha = f.opacite;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.rayon, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function avancer() {
      if (canvas.offsetParent === null) {
        boucle = null; // écran masqué : on s'arrête, « lancer » reprendra au retour
        return;
      }
      for (const f of flocons) {
        f.y += f.vitesse;
        f.phase += 0.01;
        f.x += Math.sin(f.phase) * 0.3;
        if (f.y > hauteur + 6) Object.assign(f, flocon(false));
      }
      dessiner();
      boucle = requestAnimationFrame(avancer);
    }

    return function lancer() {
      if (canvas.offsetParent === null) return;
      cancelAnimationFrame(boucle);
      boucle = null;
      mesurer();
      dessiner();
      if (!calme.matches) boucle = requestAnimationFrame(avancer);
    };
  }

  const lanceurs = [...document.querySelectorAll('canvas.snow')].map(neige);
  const lancerTout = () => lanceurs.forEach((lancer) => lancer());
  let attente;
  window.addEventListener('resize', () => {
    clearTimeout(attente);
    attente = setTimeout(lancerTout, 150);
  });
  document.addEventListener('boutique:ecran', lancerTout);
  lancerTout();
})();
