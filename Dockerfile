# -----------------------------------
# Stage 1 - Build Angular Application
# -----------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build Angular production
RUN npm run build -- --configuration production


# -----------------------------------
# Stage 2 - Serve with Nginx
# -----------------------------------
FROM nginx:alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# 🔥 IMPORTANT: Your project name is "client"
# So we copy from dist/client/browser
COPY --from=build /app/dist/client/browser/ /usr/share/nginx/html/

# Copy custom nginx config (for Angular routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]