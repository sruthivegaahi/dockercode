FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Copy executor service code **inside context**
COPY ./src/ /app/

# Install dependencies
RUN npm install

# Expose port
EXPOSE 5001

# Start the app
CMD ["node", "app.js"]
