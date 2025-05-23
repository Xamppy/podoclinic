# frontend/Dockerfile

# ---- Etapa 1: Build de la aplicación React ----
FROM node:16-alpine as builder

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente del frontend
COPY . .

# Construir la aplicación para producción
RUN npm run build

# ---- Etapa 2: Servir la aplicación con Nginx ----
FROM nginx:1.21-alpine

# Remover configuración por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/

# Copiar los archivos del build de React desde la etapa 'builder'
COPY --from=builder /app/build /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Comando para iniciar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"] 