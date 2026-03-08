########################
# Dependencies stage
########################
FROM node:24-alpine AS deps

WORKDIR /opt/lyxa-auth-service

COPY package*.json ./

RUN npm ci

########################
# Build stage
########################
FROM node:24-alpine AS build

WORKDIR /opt/lyxa-auth-service

COPY --from=deps /opt/lyxa-auth-service/node_modules ./node_modules
COPY . .

RUN npm run build

########################
# Production dependencies
########################
FROM node:24-alpine AS prod-deps

WORKDIR /opt/lyxa-auth-service

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

########################
# Runtime stage
########################
FROM node:24-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /opt/lyxa-auth-service

USER node

COPY --chown=node:node --from=prod-deps /opt/lyxa-auth-service/node_modules ./node_modules
COPY --chown=node:node --from=build /opt/lyxa-auth-service/dist ./dist
COPY --chown=node:node --from=build /opt/lyxa-auth-service/proto ./proto

EXPOSE 5001

CMD ["node", "dist/main.js"]
