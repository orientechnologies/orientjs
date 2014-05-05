#!/bin/bash

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
  if [[ $1 == *SNAPSHOT ]]; then
    odb_download_via_mvn $1 $2;
  else
    odb_download_via_website $1 $2;
  fi;

}

odb_download_via_website () {
  COMMIT_HASH=$(git rev-parse HEAD)
  DOWN_USER=oriento+travis${COMMIT_HASH}@codemix.com
  ODB_VERSION=$1
  CI_DIR=$2

  ODB_PACKAGE="orientdb-community-${ODB_VERSION}"

  # We need to resort to tricks to automate our CI environment as much as
  # possible since the OrientDB guys keep changing the compressed archive
  # format and moving the downloadable packages URLs. Luckily for us, we
  # are smart enough to cope with that... at least until the next change.

  ODB_PACKAGE_EXT="tar.gz"
  ODB_PACKAGE_URL="http://www.orientdb.org/portal/function/portal/download/${DOWN_USER}/%20/%20/%20/%20/unknown/${ODB_PACKAGE}.${ODB_PACKAGE_EXT}/false/false"
  ODB_C_PACKAGE=${ODB_PACKAGE}.${ODB_PACKAGE_EXT}

  odb_download $ODB_PACKAGE_URL $CI_DIR
  ODB_PACKAGE_PATH="${CI_DIR}/${ODB_PACKAGE}.${ODB_PACKAGE_EXT}"

  if [ $ODB_PACKAGE_EXT = "zip" ]; then
    unzip -q $ODB_PACKAGE_PATH -d ${CI_DIR}
  elif [ $ODB_PACKAGE_EXT = "tar.gz" ]; then
    tar xf $ODB_PACKAGE_PATH -C $CI_DIR
  fi
}

odb_download_via_mvn () {
  ODB_VERSION=$1
  CI_DIR=$2

  ODB_PACKAGE="orientdb-community-${ODB_VERSION}"


  ODB_PACKAGE_EXT="tar.gz"
  ODB_C_PACKAGE=${ODB_PACKAGE}.${ODB_PACKAGE_EXT}

  OUTPUT_DIR="${2:-$(pwd)}"

  if [ ! -d "$OUTPUT_DIR" ]; then
    mkdir "$OUTPUT_DIR"
  fi
  if odb_command_exists "mvn" ; then
    mvn org.apache.maven.plugins:maven-dependency-plugin:2.8:get -Dartifact=com.orientechnologies:orientdb-community:"${ODB_VERSION}":"${ODB_PACKAGE_EXT}":distribution -DremoteRepositories=https://oss.sonatype.org/content/repositories/snapshots/ -Ddest="$OUTPUT_DIR/$ODB_C_PACKAGE"
  else
    echo "Cannot download $1 [maven is not installed]"
    exit 1
  fi

  ODB_PACKAGE_PATH="${CI_DIR}/${ODB_PACKAGE}.${ODB_PACKAGE_EXT}"

  if [ $ODB_PACKAGE_EXT = "zip" ]; then
    unzip -q $ODB_PACKAGE_PATH -d ${CI_DIR}
  elif [ $ODB_PACKAGE_EXT = "tar.gz" ]; then
    tar xf $ODB_PACKAGE_PATH -C $CI_DIR
  fi;
}
