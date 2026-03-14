# Coop Couple 🎮

Un MVP de plateforme de jeux multijoueurs locaux (style Jackbox) conçu spécifiquement pour les couples. Le projet utilise un écran principal (ordinateur) comme hub visuel et les smartphones des joueurs comme manettes interactives.

## 🚀 Fonctionnalités

### 🧠 Intelligence Artificielle (GPT-4o)
Le jeu intègre OpenAI pour générer du contenu dynamique et personnalisé à chaque session :
- **Les Z'amours** : Génération de questions de couple personnalisées avec les prénoms des joueurs.
- **Jauge Télépathique** : Création de thèmes abstraits et originaux pour tester votre connexion.
- **Time's Up** : Génération de listes de mots et expressions variées.

### 🎮 Mini-Jeux Inclus
1. **Les Z'amours** : Répondez aux mêmes questions et comparez vos réponses pour voir si vous vous connaissez vraiment. Alternance automatique des rôles.
2. **Jauge Télépathique** : Un joueur donne un indice pour faire deviner une position précise sur une échelle de 0 à 100. Visualisation en temps réel sur l'écran principal.
3. **Time's Up** : Faites deviner un maximum de mots en 3 manches (Libre, Un mot, Mime). Mélange automatique du paquet et gestion de tour intelligente.
4. **Dessin à l'Aveugle** : Un guide décrit une image complexe en utilisant uniquement des termes géométriques pendant que l'autre dessine sur son écran (Canvas tactile avec option Annuler).

### 🛠 Technique
- **Backend** : FastAPI (Python) avec WebSockets natifs pour une synchronisation temps réel ultra-rapide.
- **Frontend** : Next.js (TypeScript) avec Tailwind CSS.
- **State Management** : Source unique de vérité côté serveur avec diffusion (broadcast) immédiate aux clients.
- **Persistence** : Sauvegarde locale du prénom et du rôle pour éviter les reconnexions manuelles.

## 📦 Installation

### Pré-requis
- [uv](https://github.com/astral-sh/uv) (gestionnaire de paquets Python ultra-rapide)
- Node.js & npm
- Une clé API OpenAI

### Configuration
1. Clonez le dépôt.
2. Définissez votre clé OpenAI :
   ```bash
   export OPENAI_API_KEY='votre_clé_ici'
   ```

### Lancement du Backend
```bash
uv run python main.py
```
Le serveur écoute sur le port `8000`.

### Lancement du Frontend
```bash
cd frontend
npm install
npm run dev
```
L'interface est accessible sur le port `3000`. Pour jouer sur mobile, connectez vos téléphones au même réseau Wi-Fi et accédez à l'IP locale de votre Mac (ex: `http://192.168.1.XX:3000`).

## 🛠 Structure du projet
- `main.py` : Serveur FastAPI, logique des jeux et gestion des WebSockets.
- `frontend/src/app/page.tsx` : Routeur dynamique et gestion de la session.
- `frontend/src/hooks/useGameSocket.ts` : Hook custom pour la communication WebSocket.
- `frontend/src/components/` : Composants spécifiques à chaque mini-jeu.

## 🚧 Points d'amélioration
- **Qualité des thèmes (Jauge)** : Les thèmes générés par l'IA sont parfois trop génériques ou peu inspirés. Le prompt doit être affiné pour encourager des concepts plus originaux, absurdes ou clivants.
- **Variété du vocabulaire (Time's Up)** : Malgré l'utilisation de GPT-4o, certains mots ont tendance à revenir d'une session à l'autre. Il faudrait intégrer un système de "température" plus élevé ou un historique des mots déjà utilisés pour forcer la diversité.
- **Design UI** : L'interface est fonctionnelle mais peut être enrichie avec plus d'animations et une identité visuelle propre à chaque jeu.
