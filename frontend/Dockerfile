# Use Node.js LTS
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run Vite dev server and make it accessible outside the container
CMD ["npm", "run", "dev", "--", "--host"]
