FROM openjdk:17-slim
WORKDIR /app

# Copy executor server code (Java files will be copied by users at runtime)
COPY ./src/ /app/

# Expose port for executor server
EXPOSE 5001

# Command just keeps the container running (adjust for your executor)
CMD ["java", "-version"]
