# Use Node.js LTS as base
FROM node:18

# Install Python, Java, and C++ compilers
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    openjdk-17-jdk \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and install deps
COPY package*.json ./
RUN npm install

# Copy backend source code
COPY . .

# Expose backend port
EXPOSE 8100

# Start server
CMD ["npm", "start"]
