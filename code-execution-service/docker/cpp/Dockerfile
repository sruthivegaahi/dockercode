FROM node:18-bullseye

WORKDIR /app

# Copy package.json first to leverage cache
COPY ./src/package*.json ./

RUN npm install

# Copy rest of the source code
COPY ./src/ ./

EXPOSE 5001

CMD ["node", "app.js"]
