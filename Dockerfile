FROM bitnami/node:16.13.1-prod
WORKDIR /usr/src/app
COPY package*.json ./

COPY . .
RUN apt-get update && apt-get -y install sudo
RUN useradd -m docker && usermod -aG sudo docker
RUN echo '%sudo ALL=(ALL:ALL) NOPASSWD:ALL' >> /etc/sudoers
RUN echo 'ALL ALL=(:browsers) NOPASSWD:ALL' >> /etc/sudoers
RUN sudo chmod -R 777 /usr/src/app
USER docker
RUN ./scripts/container_setup.sh
EXPOSE 8000 8002

WORKDIR /usr/src/app
CMD ["npm", "run", "docker_start"]
