# Use Node.js base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install all dependencies (production only can be used if all required packages are in dependencies)
RUN npm install

# Copy the rest of the source code
COPY src ./src

# Expose the port your app listens on
EXPOSE 5002

# Start the service
CMD ["node", "src/app.js"]
