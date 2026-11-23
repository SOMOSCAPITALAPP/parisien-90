const nice = { name: "PSG.fr - Nice 2-3 PSG", url: "https://www.psg.fr/matchs/football-masculin/20262027/nice-vs-paris-2026-11-21", note: "Feuille de match officielle : score, buteurs et chronologie." };
const doueMedical = { name: "PSG.fr - communique medical Desire Doue", url: "https://www.psg.fr/content/communique-medical-concernant-desire-doue-psg-2026-2027", note: "Communique medical officiel du club." };
const week = { name: "PSG.fr - programme de la semaine", url: "https://www.psg.fr/content/cp-programme-media-de-lequipe-premiere-du-23-au-29-novembre-2026", note: "Programmation officielle de PSG-Roma et PSG-Lorient." };
const uefa = { name: "UEFA - Paris-Roma, faits et statistiques", url: "https://fr.uefa.com/uefachampionsleague/news/02ab-221ddc90f374-0c3e265f84c9-1000--ucl-2027-paris-roma-match-facts/", note: "Contexte officiel de la 5e journee de Ligue des champions." };

export const editorialArticles20261123 = [
  {
    id: "desire-doue-rupture-ligament-croise-psg-novembre-2026",
    title: "Desire Doue : le PSG confirme une rupture du ligament croise anterieur",
    description: "Le PSG a communique sur la blessure de Desire Doue, victime d'une rupture du ligament croise anterieur du genou droit a Nice. Une operation est prevue avant la fin du mois.",
    deck: "Le club a precise le diagnostic. Paris devra accompagner Doue avec patience, sans fixer de date de retour avant les prochaines etapes medicales.",
    category: "Joueurs PSG", angle: "Le point medical", date: "2026-11-23", dateLabel: "23 novembre 2026", time: "13:10", author: "Redaction Parisien 90", readingTime: "5 min", keywords: ["Desire Doue blessure", "Doue ligament croise PSG", "point medical PSG"],
    sections: [
      { heading: "Le fait confirme", paragraphs: ["Le PSG a annonce que Desire Doue souffre d'une rupture du ligament croise anterieur du genou droit, survenue lors du match de Ligue 1 a Nice. Le club indique qu'une intervention chirurgicale aura lieu d'ici la fin du mois.", "Le diagnostic officiel remplace les projections qui ont accompagne la sortie du joueur samedi. Il ne donne pas de calendrier de retour : celui-ci dependra du suivi medical et de la reeducation."] },
      { heading: "Ce que cela change immediatement", paragraphs: ["Doue avait marque le deuxieme but parisien a Nice, avant de quitter le terrain. Son absence retire une option offensive et polyvalente a un groupe qui entre dans une semaine marquee par la reception de la Roma.", "Le PSG dispose de plusieurs profils pour redistribuer les responsabilites. A ce stade, annoncer une solution unique ou une composition serait prematuré : le groupe pour la Ligue des champions apportera les premiers reperes concrets."] },
      { heading: "Notre lecture", paragraphs: ["La premiere priorite n'est pas tactique mais humaine et medicale. Une blessure de cette nature impose du temps, de la methode et une communication precise.", "Pour l'equipe, le defi sera de conserver ses principes collectifs sans demander a un seul joueur de reproduire le role de Doue. La reponse devra etre partagee."] }
    ],
    faq: [{ question: "Quelle est la blessure de Desire Doue ?", answer: "Le PSG confirme une rupture du ligament croise anterieur du genou droit." }, { question: "Quand Desire Doue sera-t-il opere ?", answer: "Le club indique une intervention d'ici la fin du mois de novembre." }],
    sources: [doueMedical, nice], internalLinks: [{ label: "Fiche Desire Doue", url: "/joueurs-psg/desire-doue/" }, { label: "Joueurs PSG", url: "/joueurs-psg/" }, { label: "Actualite PSG", url: "/actualite-psg/" }]
  },
  {
    id: "psg-roma-prochain-match-25-novembre-2026",
    title: "PSG-Roma : le prochain match de Paris arrive mercredi au Parc des Princes",
    description: "Le PSG recoit la Roma mercredi 25 novembre a 21h pour la 5e journee de Ligue des champions. Le calendrier de la semaine est deja trace.",
    deck: "Apres Nice, Paris revient au Campus avant d'accueillir la Roma. Rendez-vous, programme et enjeux d'une bascule europeenne tres courte.",
    category: "Match", angle: "Le prochain match", date: "2026-11-23", dateLabel: "23 novembre 2026", time: "13:20", author: "Redaction Parisien 90", readingTime: "5 min", keywords: ["PSG Roma 25 novembre", "prochain match PSG", "PSG Roma heure"],
    sections: [
      { heading: "Le rendez-vous", paragraphs: ["Le PSG recoit l'AS Roma mercredi 25 novembre a 21h au Parc des Princes, pour la 5e journee de la phase de ligue de la Ligue des champions.", "Le programme officiel prevoit un entrainement parisien ouvert aux medias sur ses quinze premieres minutes et une conference de presse mardi. La Roma tiendra egalement sa conference au Parc la veille du match."] },
      { heading: "La semaine se resserre", paragraphs: ["Paris sort d'une victoire 3-2 a Nice et doit deja preparer une affiche europeenne. La priorite est de recuperer, d'actualiser le groupe puis de travailler sur le plan de jeu reellement disponible.", "Le calendrier enchaine ensuite avec la reception de Lorient samedi. La gestion de cette sequence ne consiste pas a choisir une competition : elle demande de traiter chaque rendez-vous avec des ressources adaptees."] },
      { heading: "Notre lecture", paragraphs: ["Le Parc des Princes peut donner de l'energie, mais l'affiche ne se gagnera pas avec le seul elan du public. Le PSG devra commencer avec des reperes simples et un rythme maitrise.", "La conference de presse de mardi sera le prochain point officiel utile pour connaitre l'etat du groupe et les intentions du staff."] }
    ],
    faq: [{ question: "Quand se joue PSG-Roma ?", answer: "Mercredi 25 novembre 2026 a 21h." }, { question: "Ou se joue PSG-Roma ?", answer: "Au Parc des Princes." }],
    sources: [week, uefa], internalLinks: [{ label: "Calendrier PSG", url: "/calendrier-psg/" }, { label: "Ligue des champions PSG", url: "/dossiers-psg/" }, { label: "Fil actualite PSG", url: "/actualite-psg/" }]
  },
  {
    id: "nice-psg-2-3-dernier-match-ferran-torres-novembre-2026",
    title: "Nice-PSG (2-3) : le dernier match de Paris, entre reaction et avertissement",
    description: "Le PSG a gagne 3-2 a Nice apres avoir ete mene. Mayulu, Doue et Ferran Torres ont marque dans une victoire precieuse mais restee tendue jusqu'au bout.",
    deck: "Paris a renverse le score, puis a conserve son avantage dans un final nerveux. Retour sur le dernier rendez-vous officiel avant la Roma.",
    category: "Match", angle: "Le dernier match", date: "2026-11-23", dateLabel: "23 novembre 2026", time: "13:30", author: "Redaction Parisien 90", readingTime: "5 min", keywords: ["Nice PSG 2-3", "dernier match PSG", "Ferran Torres PSG Nice"],
    sections: [
      { heading: "Le scenario", paragraphs: ["Le PSG s'est impose 3-2 a Nice lors de la 11e journee. Menes a la 8e minute, les Parisiens ont egalise par Senny Mayulu sur penalty a la 31e, avant que Desire Doue ne donne l'avantage une minute plus tard.", "Ferran Torres a inscrit le troisieme but parisien a la 85e minute. Nice a reduit l'ecart a la 90e+5, mais le score n'a plus bouge."] },
      { heading: "Les deux lectures du resultat", paragraphs: ["Le premier constat est positif : Paris a trouve trois reponses offensives dans un deplacement difficile. Le second est plus exigeant : l'equipe a du rester alerte jusqu'a la derniere action.", "Ces deux realites peuvent coexister. Une victoire a l'exterieur nourrit une dynamique, tandis que les details de fin de match donnent de la matiere pour la preparation suivante."] },
      { heading: "Notre lecture", paragraphs: ["Le PSG a montre qu'il pouvait modifier l'histoire d'un match sans paniquer. C'est une force utile avant la Roma.", "L'etape suivante est de mieux fermer les rencontres lorsque l'avantage est acquis. Non pas pour jouer plus bas par principe, mais pour choisir plus clairement les moments ou accelerer et ceux ou respirer."] }
    ],
    faq: [{ question: "Quel est le dernier resultat du PSG ?", answer: "Le PSG a battu Nice 3-2 le 21 novembre 2026." }, { question: "Qui a marque pour Paris ?", answer: "Senny Mayulu, Desire Doue et Ferran Torres." }],
    sources: [nice], internalLinks: [{ label: "Dossiers PSG", url: "/dossiers-psg/" }, { label: "Calendrier PSG", url: "/calendrier-psg/" }, { label: "Joueurs PSG", url: "/joueurs-psg/" }]
  },
  {
    id: "psg-ligue-1-leader-apres-nice-26-points-novembre-2026",
    title: "PSG en Ligue 1 : le leader defend son avance avant de retrouver Lorient",
    description: "La victoire a Nice permet au PSG de rester en tete de la Ligue 1 avec 26 points apres 11 journees. Lorient arrive samedi au Parc des Princes.",
    deck: "Le PSG a pris trois points a Nice et change maintenant de decor : la prochaine etape de Ligue 1 se jouera a domicile contre Lorient.",
    category: "Ligue 1", angle: "Le PSG dans le championnat", date: "2026-11-23", dateLabel: "23 novembre 2026", time: "13:40", author: "Redaction Parisien 90", readingTime: "5 min", keywords: ["PSG leader Ligue 1", "PSG 26 points", "PSG Lorient 28 novembre"],
    sections: [
      { heading: "Un leader qui avance", paragraphs: ["Apres le succes a Nice, le PSG est leader de Ligue 1 avec 26 points apres 11 journees. La serie de victoires en championnat atteint huit matches.", "Le chiffre raconte une dynamique, mais aussi une obligation : le PSG reste l'equipe que chaque adversaire veut ralentir. La regularite se mesure donc autant dans les matches serres que dans les soirees plus ouvertes."] },
      { heading: "Lorient apres l'Europe", paragraphs: ["Le prochain match de Ligue 1 est programme samedi 28 novembre a 20h45, au Parc des Princes, contre le FC Lorient. Il suivra directement PSG-Roma.", "Ce rendez-vous arrive dans une sequence courte. Le championnat ne sera pas une parenthese apres l'Europe : il sera la suite immediate de la semaine."] },
      { heading: "Notre lecture", paragraphs: ["Garder la tete du classement exige de traiter Lorient avec la meme concentration que les grandes affiches. Le danger d'une semaine a deux competitions est de perdre de la precision sur le match suivant.", "Paris peut convertir son avance en securite seulement en continuant a faire des resultats, sans se refugier derriere son statut."] }
    ],
    faq: [{ question: "Combien de points compte le PSG en Ligue 1 ?", answer: "Le PSG totalise 26 points apres 11 journees." }, { question: "Quand se joue PSG-Lorient ?", answer: "Samedi 28 novembre 2026 a 20h45." }],
    sources: [{ name: "Eurosport - classement Nice-PSG", url: "https://www.eurosport.fr/football/ligue-1/2026-2027/ogc-nice-paris-saint-germain_mtc21875611/live.shtml", note: "Classement affiche apres la 11e journee." }, week], internalLinks: [{ label: "Calendrier PSG", url: "/calendrier-psg/" }, { label: "Records PSG", url: "/records-psg/" }, { label: "Actualite PSG", url: "/actualite-psg/" }]
  },
  {
    id: "psg-roma-meilleure-attaque-ligue-champions-novembre-2026",
    title: "PSG-Roma : la meilleure attaque de Ligue des champions face a un test italien nouveau",
    description: "Le PSG vise une cinquieme victoire europeenne face a la Roma. L'UEFA presente Paris comme la meilleure attaque de cette edition avant la 5e journee.",
    deck: "Quatre victoires, vingt buts et la Roma au Parc : le PSG arrive fort, mais l'affiche ouvre un scenario que Paris n'a pas encore joue cette saison.",
    category: "Ligue des champions", angle: "Le PSG en Europe", date: "2026-11-23", dateLabel: "23 novembre 2026", time: "13:50", author: "Redaction Parisien 90", readingTime: "6 min", keywords: ["PSG Roma Ligue des champions", "meilleure attaque Ligue des champions", "PSG 20 buts Champions"],
    sections: [
      { heading: "Les chiffres avant le match", paragraphs: ["Le PSG a gagne ses quatre premiers matches de la phase de ligue et totalise 20 buts. L'UEFA le presente comme la meilleure attaque de la competition avant la reception de la Roma.", "Paris vise donc un cinquieme succes de suite en Europe. Ces donnees valorisent le depart de saison, sans reduire une rencontre a une addition de statistiques."] },
      { heading: "Un adversaire qui apporte un autre cadre", paragraphs: ["L'UEFA indique qu'il s'agit de la premiere confrontation entre le PSG et la Roma. Les deux equipes arrivent avec des parcours et des reperes differents dans cette phase de ligue.", "La Roma a notamment battu le Slovan Bratislava et perdu de peu a Manchester United. Le PSG devra s'appuyer sur sa propre qualite de jeu plutot que sur une comparaison simplifiee des resultats."] },
      { heading: "Notre lecture", paragraphs: ["La force offensive parisienne n'a de valeur que si l'equipe garde son equilibre au moment de perdre le ballon. C'est particulierement vrai contre une equipe italienne capable de punir les transitions.", "Le Parc peut porter la premiere vague. La maturite du PSG se verra ensuite dans sa capacite a alterner intensite et controle."] }
    ],
    faq: [{ question: "Combien de buts le PSG a-t-il marque en Ligue des champions ?", answer: "Le PSG totalise 20 buts apres quatre matches de phase de ligue." }, { question: "PSG-Roma est-il une premiere confrontation ?", answer: "Oui, selon les faits et statistiques publies par l'UEFA." }],
    sources: [uefa], internalLinks: [{ label: "Calendrier PSG", url: "/calendrier-psg/" }, { label: "Dossiers PSG", url: "/dossiers-psg/" }, { label: "Joueurs PSG", url: "/joueurs-psg/" }]
  },
  {
    id: "tactique-psg-roma-sans-doue-principes-collectifs-novembre-2026",
    title: "Tactique PSG : sans Desire Doue, Paris doit proteger ses principes avant de chercher un remplaçant",
    description: "L'absence de Desire Doue oblige le PSG a s'adapter, mais pas a renier son jeu. Trois principes collectifs a conserver avant la Roma.",
    deck: "Remplacer un profil ne signifie pas demander a un autre joueur de le copier. Face a la Roma, Paris devra d'abord organiser ses connexions collectives.",
    category: "Tactique PSG", angle: "Analyse tactique", date: "2026-11-23", dateLabel: "23 novembre 2026", time: "14:00", author: "Redaction Parisien 90", readingTime: "6 min", keywords: ["tactique PSG sans Doue", "PSG Roma tactique", "analyse PSG 2026"],
    sections: [
      { heading: "1. Ne pas chercher un clone", paragraphs: ["La blessure de Desire Doue est un fait medical majeur pour le PSG. Sur le terrain, sa polyvalence ne se remplace pas automatiquement par un seul nom ou un seul changement de systeme.", "Le premier enjeu est de repartir les taches : qui fixe large, qui attaque l'intervalle, qui assure la derniere passe et qui protege la perte. Ces reponses peuvent varier selon les profils retenus."] },
      { heading: "2. Garder des distances utiles", paragraphs: ["L'equilibre parisien depend de la distance entre les lignes lorsque l'equipe attaque. Sans elle, la moindre perte ouvre un espace pour la transition adverse.", "Face a la Roma, le PSG devra laisser des joueurs disponibles derriere le ballon tout en gardant assez de presences dans la surface. Le compromis est collectif, pas seulement individuel."] },
      { heading: "3. Faire vivre plusieurs circuits", paragraphs: ["Une equipe previsible offre des reperes faciles a son adversaire. Paris peut alterner les progressions par l'axe, les combinaisons sur les cotes et les appels derriere la ligne sans attendre une action miracle.", "Notre lecture : la meilleure reponse a l'absence de Doue sera une responsabilite distribuee. Le PSG sera plus difficile a lire s'il ne confie pas le desequilibre a un seul joueur."] }
    ],
    faq: [{ question: "Le PSG doit-il changer de systeme sans Doue ?", answer: "Aucune composition n'est officielle. L'enjeu est d'abord de redistribuer les taches collectives." }, { question: "Quel est le point tactique essentiel contre la Roma ?", answer: "Conserver des distances equilibrees pour attaquer sans offrir de transitions faciles." }],
    sources: [doueMedical, uefa], internalLinks: [{ label: "Fiche Desire Doue", url: "/joueurs-psg/desire-doue/" }, { label: "Dossiers PSG", url: "/dossiers-psg/" }, { label: "Calendrier PSG", url: "/calendrier-psg/" }]
  }
];
