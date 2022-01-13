#!/bin/bash

npm i 
./scripts/make_bundle.sh
sudo docker image build -t viewfinder-regular:latest .
