FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
ARG VERSION
ARG REVISION

# Set default shell
SHELL ["/bin/bash", "-c"]

# Install Node.js
RUN apt-get update && \
  apt-get install -y gnupg && \
  mkdir -p /etc/apt/keyrings && \
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
  NODE_MAJOR=22 && \
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
  apt-get update && \
  apt-get install -y nodejs && \
  rm -rf /var/lib/apt/lists/*

# Restore dependencies and tools
COPY src/ModelRepoBrowser.csproj .
RUN dotnet restore "ModelRepoBrowser.csproj"

# Set environment variables
ENV PUBLISH_DIR=/app/publish
ENV GENERATE_SOURCEMAP=false

# Create optimized production build
COPY src/ .
RUN dotnet publish "ModelRepoBrowser.csproj" \
  -c Release \
  -p:VersionPrefix=${VERSION} \
  -p:SourceRevisionId=${REVISION} \
  -o ${PUBLISH_DIR}

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
ENV HOME=/app
ENV TZ=Europe/Zurich
ENV ASPNETCORE_ENVIRONMENT=Production
WORKDIR ${HOME}

# Install required packages
RUN \
  DEBIAN_FRONTEND=noninteractive && \
  mkdir -p /usr/share/man/man1 /usr/share/man/man2 && \
  apt-get update && \
  apt-get install -y curl && \
  rm -rf /var/lib/apt/lists/*

EXPOSE 8080

# Set default locale
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

COPY --from=build /app/publish $HOME

USER $APP_UID

HEALTHCHECK CMD curl --fail http://localhost:8080/ || exit 1

ENTRYPOINT ["dotnet", "ModelRepoBrowser.dll"]
