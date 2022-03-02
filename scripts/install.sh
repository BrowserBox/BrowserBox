sudo apt update && sudo apt -y upgrade
sudo apt install -y git wget
sudo apt -y install curl dirmngr apt-transport-https lsb-release ca-certificates
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt install -y nodejs npm
sudo apt -y  install gcc g++ make
git clone https://github.com/crisdosyago/BrowserBox.git
cd BrowserBox
./scripts/setup_machine.sh
