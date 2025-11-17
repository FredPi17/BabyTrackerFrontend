# Étape 1 : Build du frontend
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json .
COPY package-lock.json .
RUN npm install
COPY . .
RUN npm install --save-exact react@18.3.1 react-dom@18.3.1
RUN npm run build

# Étape 2 : Serveur Nginx pour les fichiers statiques
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Configuration Nginx (optionnel : éviter les 404 en SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
