if (which google-chrome-stable || sudo apt install google-chrome-stable); then
  sudo apt-get install -f
  sudo apt --fix-broken -y install
else 
  ./../../scripts/dpkg_dlchrome.sh
fi

