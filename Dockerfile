FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY public ./public
COPY data ./data

ENV PORT=8080
ENV ADMIN_TOKEN="${ADMIN_TOKEN}"
ENV ADMIN_PAGE_USER="${ADMIN_PAGE_USER}"
ENV ADMIN_PAGE_PASSWORD="${ADMIN_PAGE_PASSWORD}"
EXPOSE 8080

CMD ["npm", "start"]

