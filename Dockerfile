# By using this Dockerfile or a container that runs BrowserBox you are agreeing to the terms in the BrowserBox License.
# base image;

# current base
FROM debian:latest
LABEL org.opencontainers.image.title="BrowserBox" \
  org.opencontainers.image.description="Embeddable remote browser isolation with vettable source https://dosaygo.com" \
  org.opencontainers.image.version="10.4.0" \
  org.opencontainers.image.authors="DOSAYGO BrowserBox Team <browserbox@dosaygo.com>" \
  org.opencontainers.image.source="https://github.com/BrowserBox/BrowserBox"

SHELL ["/bin/bash", "-c"]

ARG IS_DOCKER_BUILD=true
ENV IS_DOCKER_BUILD=$IS_DOCKER_BUILD
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Los_Angeles

# install dependencies
RUN apt-get update
RUN apt-get update && \
  apt-get install -y tzdata && \
  ln -fs /usr/share/zoneinfo/$TZ /etc/localtime && \
  dpkg-reconfigure --frontend noninteractive tzdata && \
  apt-get clean
RUN apt-get install -y \
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
  curl \
  jq \
  vim 


# Create a non-root user 'bbpro' and give it sudo permissions
RUN useradd -ms /bin/bash bbpro && \
  apt-get update && \
  apt-get install -y sudo && \
  echo "bbpro ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

RUN groupadd browsers && groupadd renice && usermod -a -G browsers bbpro && usermod -a -G renice bbpro

# install Node.js
# RUN apt-get install -y nodejs
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | sudo -E bash -
RUN . ~/.nvm/nvm.sh ; nvm install v22 ; npm i -g npm@latest ; npm i -g pm2@latest ; nvm use v22 ; nvm alias default v22

# Define HOME and WORKDIR
ENV HOME=/home/bbpro
WORKDIR $HOME/bbpro/

# Copy application to docker as root to preserve permissions
USER root
COPY . $HOME/bbpro/

# Change ownership of the workdir to the 'bbpro' user
RUN chown -R bbpro:bbpro $HOME/bbpro/

# Switch back to 'bbpro' user
USER bbpro

# install application
RUN yes | ./deploy-scripts/global_install.sh localhost

# Change ownership of the sslcerts to the 'bbpro' user (no need as we mount external dir as certs so need to change this on run not now)
# RUN chown -R bbpro:bbpro $HOME/sslcerts/

# run the application
CMD ["./deploy-scripts/run.sh"]

