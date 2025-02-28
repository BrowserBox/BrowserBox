#!/usr/bin/env bash

echo "Cleaning up any existing users..."
users=$(ls -1 /home | grep ^user)

for user in $users; do
  sudo killuser.sh $user
done

echo "Done!"

npm test
