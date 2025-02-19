FROM node:12
WORKDIR /home/docker

COPY package*.json ./
COPY . .

USER docker
RUN ./scripts/nix_install_deps.sh
EXPOSE 8080

CMD ["npm", "start", "8080"]
