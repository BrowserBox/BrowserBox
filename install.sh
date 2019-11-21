sudo apt update && sudo apt -y upgrade
sudo apt install -y curl git wget
git clone https://github.com/dosycorp/browsergap.ce.git
sudo apt install -y nodejs npm
sudo npm i -g npm
./setup_machine.sh
