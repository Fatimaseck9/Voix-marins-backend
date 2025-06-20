# Utiliser l'image Node.js officielle
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (prod + dev) pour le build
RUN npm ci

# Installer ffmpeg (nécessaire pour la conversion audio)
RUN apk add --no-cache ffmpeg

# Copier le code source
COPY . .

# Construire l'application (nécessite nest CLI)
RUN npm run build

# Supprimer les dépendances de dev après build pour alléger l'image
RUN npm prune --production

# Exposer le port
EXPOSE 3001

# Commande pour démarrer l'application
CMD ["npm", "run", "start:prod"] 