FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY public ./public
COPY data ./data

ENV PORT=8080
# Empty default (override in Coolify). Do not bake secrets into the image.
ENV ADMIN_TOKEN="${ADMIN_TOKEN}"
EXPOSE 8080

CMD ["npm", "start"]

