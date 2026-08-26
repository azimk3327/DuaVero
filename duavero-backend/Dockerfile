# =========================================================================
# Stage 1: Build stage with Maven and OpenJDK 17
# =========================================================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# 1. Copy pom.xml first to leverage Docker layer caching for Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 2. Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# =========================================================================
# Stage 2: Lightweight Production Runtime stage with OpenJDK 17 JRE
# =========================================================================
FROM eclipse-temurin:17-jre-alpine AS runner

# Create a non-root group and user for container security
RUN addgroup -S duavero && adduser -S appuser -G duavero

WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /build/target/*.jar app.jar

# Set ownership of the app directory
RUN chown -R appuser:duavero /app

USER appuser

# Expose Spring Boot default port
EXPOSE 8080

# Production optimized JVM container flags
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar \"$@\"", "--"]
