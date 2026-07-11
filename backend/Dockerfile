# Build and Run Stage
FROM node:20-alpine

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install packages
RUN npm ci

# Copy server sources
COPY . .

# Compile TS code
RUN npm run build

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "start"]
