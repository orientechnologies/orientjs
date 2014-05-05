#!/bin/bash

PARENT_DIR=$(dirname $(cd "$(dirname "$0")"; pwd))
CI_DIR="$PARENT_DIR/ci/environment"

ODB_VERSION=${1:-"1.7-rc2"}
ODB_DIR="${CI_DIR}/orientdb-community-${ODB_VERSION}"
ODB_LAUNCHER="${ODB_DIR}/bin/server.sh"

echo "=== Initializing CI environment ==="

cd "$PARENT_DIR"

. "$PARENT_DIR/ci/odb-shared.sh"

if [ ! -d "$ODB_DIR" ]; then
  # Download and extract OrientDB server
  echo "--- Downloading OrientDB v${ODB_VERSION} ---"
  odb_download_server $ODB_VERSION $CI_DIR

  # Ensure that launcher script is executable and copy configurations file
  echo "--- Setting up OrientDB ---"
  chmod +x $ODB_LAUNCHER
  chmod -R +rw "${ODB_DIR}/config/"
  cp $PARENT_DIR/ci/orientdb-server-config.xml "${ODB_DIR}/config/"
  cp $PARENT_DIR/ci/orientdb-server-log.properties "${ODB_DIR}/config/"
else
  echo "!!! Found OrientDB v${ODB_VERSION} in ${ODB_DIR} !!!"
fi

# Start OrientDB in background.
echo "--- Starting an instance of OrientDB ---"
sh -c $ODB_LAUNCHER </dev/null &>/dev/null &

# Wait a bit for OrientDB to finish the initialization phase.
sleep 5
printf "\n=== The CI environment has been initialized ===\n"
