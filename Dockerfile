# Utiliser l'image Node.js officielle
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Installer ffmpeg (nécessaire pour la conversion audio)
RUN apk add --no-cache ffmpeg

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Exposer le port
EXPOSE 3001

# Commande pour démarrer l'application
CMD ["npm", "run", "start:prod"] 