# Étape 1 : build de l'application
FROM node:19-alpine AS build

WORKDIR /app

# Copie les fichiers package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./

# Installe toutes les dépendances (prod + dev)
RUN npm install

# Copie le reste des fichiers du projet
COPY . .

# Compile le projet TypeScript en JavaScript dans le dossier dist
RUN npm run build

# Étape 2 : image finale allégée pour la prod
FROM node:19-alpine

WORKDIR /app

# Copie uniquement package.json pour installer uniquement les dépendances de production
COPY package*.json ./

RUN npm install --production

# Copie les fichiers compilés depuis l’étape build
COPY --from=build /app/dist ./dist

# Expose le port sur lequel NestJS écoute 
EXPOSE 3001 

# Commande pour démarrer l’application
CMD ["node", "dist/main"]
