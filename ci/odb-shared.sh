#!/bin/sh

odb_compare_version () {
  # TODO: this function does not handle well versions with additional rank
  # indicators such as "-rc1" but I guess it suffices for now.
  GTVER=$(echo "$1\n$2" | sort -n --reverse | head -1)

  if [ $1 = $2 ]; then
    echo 0
  elif [ $1 = $GTVER ]; then
    echo 1
  else
    echo -1
  fi
}

odb_command_exists () {
  type "$1" >/dev/null 2>&1 ;
}

odb_download () {
  OUTPUT_DIR="${2:-$(pwd)}"

  if [ ! -d "$OUTPUT_DIR" ]; then
    mkdir "$OUTPUT_DIR"
  fi

  if odb_command_exists "wget" ; then
    wget -q -O "$OUTPUT_DIR/$ODB_C_PACKAGE" "$1"
  elif odb_command_exists "curl" ; then
    ( cd "$OUTPUT_DIR" > /dev/null ; curl --silent -O "$1" ; )
  else
    echo "Cannot download $1 [missing wget or curl]"
    exit 1
  fi
}

odb_download_server () {
  #http://www.orientdb.org/portal/function/portal/download/phpuser@unknown.com/%20/%20/%20/%20/unknown/orientdb-community-1.6.2.tar.gz/false/false

  DOWN_USER=robot-php@travi-ci.com
  ODB_VERSION=$1
  CI_DIR=$2

  ODB_PACKAGE="orientdb-community-${ODB_VERSION}"

  # We need to resort to tricks to automate our CI environment as much as
  # possible since the OrientDB guys keep changing the compressed archive
  # format and moving the downloadable packages URLs. Luckily for us, we
  # are smart enough to cope with that... at least until the next change.
  if [ $(odb_compare_version $ODB_VERSION 1.6.1) -ge 0 ]; then
    ODB_PACKAGE_EXT="tar.gz"
    ODB_PACKAGE_URL="http://www.orientdb.org/portal/function/portal/download/${DOWN_USER}/%20/%20/%20/%20/unknown/${ODB_PACKAGE}.${ODB_PACKAGE_EXT}/false/false"
    ODB_C_PACKAGE=${ODB_PACKAGE}.${ODB_PACKAGE_EXT}
  else
    ODB_PACKAGE_EXT="zip"
    ODB_PACKAGE_URL="https://orient.googlecode.com/files/${ODB_PACKAGE}.${ODB_PACKAGE_EXT}"
  fi

  echo ${ODB_PACKAGE_URL}

  odb_download $ODB_PACKAGE_URL $CI_DIR
  ODB_PACKAGE_PATH="${CI_DIR}/${ODB_PACKAGE}.${ODB_PACKAGE_EXT}"

  if [ $ODB_PACKAGE_EXT = "zip" ]; then
    unzip -q $ODB_PACKAGE_PATH -d ${CI_DIR}
  elif [ $ODB_PACKAGE_EXT = "tar.gz" ]; then
    tar xf $ODB_PACKAGE_PATH -C $CI_DIR
  fi
}
