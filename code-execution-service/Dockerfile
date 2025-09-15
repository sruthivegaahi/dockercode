# Use Node.js base image
FROM node:18-slim

# Install Docker CLI
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY src ./src

# Expose port
EXPOSE 5002

# Start service
CMD ["node", "src/app.js"]
