#!/bin/sh


. "${INSTALL_DIR}/chai/scripts/config.sh"

# delete all view pages and images older than 3 days
PID_DIR="$CHAI_PATH"
cd "${STATIC_DIR}/uploads"

# old one
  # remove all files older than 3 days
  # find ./ -name 'file*' -type f -mmin +4319 -delete
  # remove all files older than 3 days
  # except the 3 'perm' files (my contact info and the example tesla view page)
  # find ./ -name 'file*' -type f ! -name 'filegr9k.56knk8r.jpg*' ! -name 'fileazjw.l7tq7e9.jpg*' ! -name 'filecp9z.ohbtt6u.pdf*' -mmin +4319 -delete

find ./ -name 'file*' -type f -mmin +4319 -delete


# delete all original documents older than 3 days

cd "$pdfs"

# old one
  # remove all files older than 3 days
  # find ./ -name 'file*' -type f -mmin +4319 -delete
  # remove all files older than 3 days
  # except the 3 'perm' files (my contact info and the example tesla view page)
  # find ./ -name 'file*' -type f ! -name 'filegr9k.56knk8r.jpg*' ! -name 'fileazjw.l7tq7e9.jpg*' ! -name 'filecp9z.ohbtt6u.pdf*' -mmin +4319 -delete

find ./ -name 'file*' -type f -mmin +4319 -delete


# rebuild the hashes of the files that are left
"${INSTALL_DIR}/chai/src/rebuild_hashes.js"

# notify the process that the hashes have been rebuilt
kill -s ALRM $(cat "${PID_DIR}/chai-pid.txt") > /dev/null 2>&1 || echo "Could not notify process of restart. Perhaps it is not running?"
