rm google-chrome-stable_current_amd64.deb || :
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install
sudo dpkg -i google-chrome-stable_current_amd64.deb 
rm google-chrome-stable_current_amd64.deb || :
