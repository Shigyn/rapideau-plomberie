// Remplace le contenu par défaut des zones balisées par le contenu stocké dans
// Supabase (table contenu_site), sans jamais toucher au HTML/JS déployé.
// À copier tel quel dans chaque nouveau site client — aucune modification nécessaire,
// seule window.LOCWEB_CONFIG (dans le HTML) change d'un client à l'autre.
(function () {
  const config = window.LOCWEB_CONFIG;
  if (!config || !config.supabaseUrl || !config.clientId) {
    console.warn('LOCWEB_CONFIG manquant — contenu par défaut conservé.');
    return;
  }

  const endpoint =
    `${config.supabaseUrl}/rest/v1/contenu_site` +
    `?client_id=eq.${encodeURIComponent(config.clientId)}&select=cle_bloc,valeur`;

  fetch(endpoint, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`
    }
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Supabase ${res.status}`);
      return res.json();
    })
    .then((rows) => {
      const valeurs = Object.fromEntries(rows.map((r) => [r.cle_bloc, r.valeur]));

      document.querySelectorAll('[data-editable-zone]').forEach((el) => {
        const cle = el.getAttribute('data-editable-zone');
        if (valeurs[cle] === undefined || valeurs[cle] === null || valeurs[cle] === '') return;

        if (el.tagName === 'IMG') {
          el.src = valeurs[cle];
        } else {
          el.textContent = valeurs[cle];
          // Si la zone de texte est elle-même un lien tel:/mailto:, on garde le href synchro
          // (ex: le numéro affiché en texte ET l'action "appeler" doivent rester cohérents).
          const href = el.getAttribute && el.getAttribute('href');
          if (href && href.startsWith('tel:')) {
            el.setAttribute('href', 'tel:' + valeurs[cle].replace(/[^\d+]/g, ''));
          } else if (href && href.startsWith('mailto:')) {
            el.setAttribute('href', 'mailto:' + valeurs[cle].trim());
          }
        }
      });

      // Liens dont le TEXTE visible ne doit pas changer (ex: bouton "Devis gratuit",
      // "📞 Appeler") mais dont le href doit rester synchronisé avec un numéro/email
      // édité ailleurs sur la page. Ne touche jamais au contenu de l'élément.
      document.querySelectorAll('[data-editable-tel]').forEach((el) => {
        const cle = el.getAttribute('data-editable-tel');
        if (valeurs[cle]) el.setAttribute('href', 'tel:' + valeurs[cle].replace(/[^\d+]/g, ''));
      });
      document.querySelectorAll('[data-editable-mailto]').forEach((el) => {
        const cle = el.getAttribute('data-editable-mailto');
        if (valeurs[cle]) el.setAttribute('href', 'mailto:' + valeurs[cle].trim());
      });
    })
    .catch((err) => {
      console.warn('Contenu Supabase indisponible, fallback statique conservé.', err);
    });
})();
