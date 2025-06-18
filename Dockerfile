FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer le dossier uploads avec les bonnes permissions
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

# Exposer le port
EXPOSE 3001

# Commande de démarrage
CMD ["npm", "run", "start:prod"] 