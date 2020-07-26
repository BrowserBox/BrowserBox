FROM node:12
WORKDIR /usr/src/app
COPY package*.json ./

COPY . .
RUN apt-get update && apt-get -y install sudo
RUN useradd -m docker && usermod -aG sudo docker
RUN echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
RUN sudo chmod -R 777 /usr/src/app
USER docker
RUN ./setup_machine.sh
EXPOSE 8002

CMD ["npm", "run", "docker_start"]
