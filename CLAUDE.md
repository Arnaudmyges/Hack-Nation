# Instructions pour Claude - Projet "Generative City Wallet"

## Contexte du Projet
Il s'agit du projet "Generative City Wallet" (Challenge DSV-Gruppe). L'application génère des offres hyper-personnalisées en temps réel basées sur le contexte (Météo, Géolocalisation, Trafic/Signaux Payone, Événements locaux).
Le but n'est pas d'afficher des coupons génériques, mais des offres générées par IA (GenUI) qui ressemblent à des pass/cartes de type "Apple Wallet" ou "Google Wallet", avec un compte à rebours et un QR code dynamique.

## Règles strictes (NE PAS MODIFIER)
Tu as interdiction absolue de lire, modifier ou altérer les fichiers ou dossiers suivants :
- `.env`, `.envrc`
- `flake*`, `.direnv`, `.venv`
- `node_modules`
- `package.json`, `package-lock.json` (sauf demande explicite pour ajouter une dépendance indispensable)
- si tu a des doutes/questions fais une pause et pose moi la question

## Objectif 1 : Refonte UI/UX Premium & Mobile Responsive
L'interface actuelle doit être améliorée pour correspondre aux standards d'une application financière/wallet premium.
- **Design System** : Utilise NativeWind (Tailwind pour React Native) pour rendre le design propre, moderne et responsive sur tous les écrans mobiles.
- **Expérience Utilisateur (Client)** : L'écran d'accueil doit ressembler à un "Context Panel" (affichant discrètement la météo, le niveau de trafic) et les offres générées doivent s'animer (slide up/fade in) comme de vraies cartes de paiement.
- **Expérience Utilisateur (Commerçant)** : Le tableau de bord du commerçant doit être clair, orienté statistiques (taux de conversion, trafic) avec des formulaires propres pour la création de templates/règles.

## Objectif 2 : Séparation des rôles (Front Client vs Front Commerçant)
La logique de login actuelle est incomplète. Il faut :
- Finaliser le flux d'authentification (`LoginScreen.tsx`).
- Dès la connexion réussie, vérifier le rôle de l'utilisateur (via Supabase).
- **Si Client** : Rediriger vers l'interface Wallet/Home (carte, offres, historique cashback). L'utilisateur ne doit JAMAIS voir les écrans du marchand.
- **Si Commerçant** : Rediriger vers le `MerchantDashboard` (statistiques, règles de déclenchement, scanner QR). Le marchand ne doit JAMAIS voir l'interface client classique.
- Séparer proprement ces deux flux dans le système de navigation pour éviter toute faille ou écran parasite.

## Objectif 3 : Notifications Push avec effet "Pop-up" réel
Les notifications actuelles sont trop basiques. 
- Lorsqu'une offre hyper-personnalisée est générée (ex: "Il pleut, un café à -15% à 50 mètres"), l'utilisateur doit recevoir une alerte impactante.
- Si l'app est en arrière-plan : Notification push native avec un titre accrocheur.
- Si l'app est au premier plan (ouverte) : Déclencher un composant Modal ou un BottomSheet très visuel (GenUI) qui apparaît par-dessus l'interface actuelle pour présenter l'offre immédiatement.

## Objectif 4 (Nice to Have) : Widget Lock-Screen
Étudier et préparer l'implémentation d'un "Live Activity" (iOS) ou d'un Widget Lock-Screen.
- **Cas d'usage** : Lorsqu'une offre est acceptée, elle n'est valable que 15 minutes. Afficher ce compte à rebours (timer) directement sur l'écran de verrouillage du téléphone.
- *Note technique* : Proposer l'architecture ou le code natif/expo-plugin nécessaire pour réaliser cela via Expo.

---
**Note pour Claude** : Si tu as besoin de clarifier la structure de données Supabase, la configuration du routeur ou des dépendances, pose des questions avant de tout réécrire. Travaille fichier par fichier de manière itérative.