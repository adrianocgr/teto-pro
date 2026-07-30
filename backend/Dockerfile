# ---------- build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ---------- runtime ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S tetoproobra && adduser -S tetoproobra -G tetoproobra
COPY --from=build /build/target/tetopro-obra-api-*.jar ./app.jar
RUN chown tetoproobra:tetoproobra app.jar
USER tetoproobra

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
