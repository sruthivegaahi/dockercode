FROM openjdk:17-slim

WORKDIR /app

COPY ./src ./src

# Example: compile Java source (adjust Main.java / classname)
# RUN javac ./src/Main.java

EXPOSE 5001
CMD ["java", "-cp", "src", "Main"]
