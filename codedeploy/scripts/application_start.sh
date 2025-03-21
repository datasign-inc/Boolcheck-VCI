#!/bin/bash
source /root/.bashrc

# workaround: Since the above process does not load the file properly, explicitly execute the loading process.
source /etc/profile.d/app_config.sh

nvm use 20

cd /srv || exit
pm2 start "yarn start" --name vci -o /var/log/pm2/out.log  -e /var/log/pm2/error.log
pm2 startup
pm2 save