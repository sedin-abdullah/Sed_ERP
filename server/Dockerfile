# Portable container image for the SedERP backend (Node + Express + Socket.IO
# + embedded aedes MQTT broker + simulator). Works on Koyeb, Fly.io, Railway,
# or any container host — anything except serverless (Cloudflare Workers).
FROM node:20-alpine

WORKDIR /app

# typescript + @types live in dependencies, so a plain install builds cleanly.
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
# The app listens on process.env.PORT (see src/config/env.ts). Koyeb injects
# PORT (default 8000); this EXPOSE is just documentation.
EXPOSE 8000

CMD ["npm", "start"]
