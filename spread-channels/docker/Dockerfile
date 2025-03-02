# By using this Dockerfile or a container that runs BrowserBox, you agree to the terms in the BrowserBox License.

FROM debian:latest

LABEL org.opencontainers.image.title="BrowserBox" \
      org.opencontainers.image.description="Embeddable remote browser isolation with vettable source - https://dosaygo.com" \
      org.opencontainers.image.version="10.0.1" \
      org.opencontainers.image.authors="DOSAYGO BrowserBox Team <browserbox@dosaygo.com>" \
      org.opencontainers.image.source="https://github.com/BrowserBox/BrowserBox"

SHELL ["/bin/bash", "-c"]

# Build Args & Env
ARG IS_DOCKER_BUILD=true
ENV IS_DOCKER_BUILD=$IS_DOCKER_BUILD \
    DEBIAN_FRONTEND=noninteractive \
    TZ=America/Los_Angeles \
    HOME=/home/bbpro

# Install Base Dependencies
RUN apt-get update && apt-get install -y \
    tzdata \
    && ln -fs /usr/share/zoneinfo/$TZ /etc/localtime \
    && dpkg-reconfigure --frontend noninteractive tzdata \
    && apt-get install -y \
        curl \
        jq \
        sudo \
        vim \
        libx11-xcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libnss3 \
        libnspr4 \
        libasound2 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libxrandr2 \
        libpangocairo-1.0-0 \
        libgtk-3-0 \
    && apt-get clean

# Setup Non-Root User
RUN useradd -ms /bin/bash bbpro \
    && echo "bbpro ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    && groupadd browsers && groupadd renice \
    && usermod -aG browsers,renice bbpro

# Install Node.js via NVM
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash \
    && . "$HOME/.nvm/nvm.sh" \
    && nvm install v22 \
    && nvm use v22 \
    && nvm alias default v22 \
    && npm i -g npm@latest pm2@latest

# Copy App & Set Ownership
WORKDIR $HOME/bbpro
COPY --chown=bbpro:bbpro . .

# Install Application
USER bbpro
RUN yes | ./deploy-scripts/global_install.sh localhost

# Ensure Certs Dir is Owned by bbpro (Fix Mount Access)
RUN mkdir -p $HOME/sslcerts && chown -R bbpro:bbpro $HOME/sslcerts

# Run Application
CMD ["bash", "-c", "source ~/.nvm/nvm.sh && echo $(setup_bbpro --port ${PORT:-8080}) > login_link.txt && export LICENSE_KEY=${LICENSE_KEY} && bbcertify && export LICENSE_KEY='' && (bbpro || true) && tail -f /dev/null"]
