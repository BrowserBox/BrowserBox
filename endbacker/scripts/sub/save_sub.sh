subid="$1"
email="$2"
plan="$3"
date="$(date)"

sudo -u submanager mkdir -p /home/submanager/subs/$subid/
sudo -u submanager echo '{"email":"'$email'","plan":"'$plan'","charged_at":"'$date'"}' | sudo -u submanager tee /home/submanager/subs/$subid/info.json


