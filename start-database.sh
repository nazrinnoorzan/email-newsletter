#!/usr/bin/env bash
# Use this script to start a docker container for a local development database

# TO RUN ON WINDOWS:
# 1. Install WSL (Windows Subsystem for Linux) - https://learn.microsoft.com/en-us/windows/wsl/install
# 2. Install Docker Desktop for Windows - https://docs.docker.com/docker-for-windows/install/
# 3. Open WSL - `wsl`
# 4. Run this script - `./start-database.sh`

# On Linux and macOS you can run this script directly - `./start-database.sh`

DB_CONTAINER_NAME="mysql"

if ! [ -x "$(command -v docker)" ]; then
  echo "Docker is not installed. Please install docker and try again.\nDocker install guide: https://docs.docker.com/engine/install/"
  exit 1
fi

if [ "$(docker ps -q -f name=$DB_CONTAINER_NAME)" ]; then
  docker start $DB_CONTAINER_NAME
  echo "Database container started"
  exit 0
fi

# import env variables from .env
set -a
source .env

docker run --name "mysql" -e MYSQL_ROOT_PASSWORD="0Y9dSj6NrX-EW-Rr" -e MYSQL_DATABASE=. -d -p 3306:3306 docker.io/mysql

echo "Database container was successfully created"
