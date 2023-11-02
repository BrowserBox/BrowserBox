sudo $APT update && sudo $APT -y upgrade
sudo $APT install -y git wget
sudo $APT -y install curl dirmngr apt-transport-https lsb-release ca-certificates
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo $APT install -y nodejs npm
sudo $APT -y  install gcc g++ make
git clone https://github.com/dosycorp/browsergap.ce.git
cd browsergap.ce
./setup_machine.sh
npm i -g sloc
