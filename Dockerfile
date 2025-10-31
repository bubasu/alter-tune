# Stage 1: Build the Angular app
FROM node:20-alpine AS build

WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
# Optional: set CI to avoid interactive prompts
ENV CI=true
# Build production artifacts (outputs to dist/<app-name>/browser by default)
RUN npm run build -- --configuration=production

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine AS runtime

# Copy built files
# If your dist folder structure differs, adjust the path below.
COPY --from=build /app/dist/alter-tune/browser /usr/share/nginx/html

# Replace default Nginx config to support Angular routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
