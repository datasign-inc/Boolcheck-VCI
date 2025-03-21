#!/bin/bash

source /root/.bashrc
nvm use 20

cd /srv || exit
git clone https://github.com/OWND-Project/OWND-Project-VCI.git
cd ./OWND-Project-VCI || exit
git checkout main
yarn
yarn build
yarn link
cd /srv || exit
yarn link ownd-vci
yarn