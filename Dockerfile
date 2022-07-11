FROM viewfinder-regular:base

EXPOSE 8000 8002

WORKDIR /usr/src/app
CMD ["npm", "run", "docker_start"]
