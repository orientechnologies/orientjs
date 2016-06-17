#!/bin/bash

CHANGE=(2 1 5)


isPostChange(){

	declare -a v=("${@}")

	array=(${v[2]//-/ })

	if [ ${v[0]} -ge ${CHANGE[0]} ]; then
		if  [ ${v[1]} -gt ${CHANGE[1]} ]; then
			return 0;
		elif [ ${v[1]} -ge ${CHANGE[1]} ] && [ ${array[0]} -ge ${CHANGE[2]} ]; then
			return 0;
		fi
		return 1;
	else
		return 1;
	fi

}
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
  ODB_VERSION=$1
  CI_DIR=$2

  ODB_PACKAGE="orientdb-community-${ODB_VERSION}"


  ODB_PACKAGE_EXT="tar.gz"
  ODB_C_PACKAGE=${ODB_PACKAGE}.${ODB_PACKAGE_EXT}

  OUTPUT_DIR="${2:-$(pwd)}"

  if [ ! -d "$OUTPUT_DIR" ]; then
    mkdir "$OUTPUT_DIR"
  fi


	if [[ ${ODB_VERSION} == *-SNAPSHOT* ]]; then
		ODB_URL="https://oss.sonatype.org/service/local/artifact/maven/content?r=snapshots&g=com.orientechnologies&a=orientdb-community&v=${ODB_VERSION}&e=tar.gz"
	else
		ODB_URL="https://oss.sonatype.org/service/local/artifact/maven/content?r=releases&g=com.orientechnologies&a=orientdb-community&v=${ODB_VERSION}&e=tar.gz"
	fi;



	wget -c ${ODB_URL} -O ${OUTPUT_DIR}/${ODB_C_PACKAGE}

#  if odb_command_exists "mvn" ; then
#		if isPostChange ${array[@]} ; then
#			mvn org.apache.maven.plugins:maven-dependency-plugin:2.8:get -Dartifact=com.orientechnologies:orientdb-community:$ODB_VERSION:$ODB_PACKAGE_EXT -DremoteRepositories="https://oss.sonatype.org/content/repositories/snapshots/,https://oss.sonatype.org/content/repositories/releases/" -Ddest=$OUTPUT_DIR/$ODB_C_PACKAGE
#		else
#			mvn org.apache.maven.plugins:maven-dependency-plugin:2.8:get -Dartifact=com.orientechnologies:orientdb-community:$ODB_VERSION:$ODB_PACKAGE_EXT:distribution -DremoteRepositories="https://oss.sonatype.org/content/repositories/snapshots/,https://oss.sonatype.org/content/repositories/releases/" -Ddest=$OUTPUT_DIR/$ODB_C_PACKAGE
#		fi
#  else
#    echo "Cannot download $1 [maven is not installed]"
#    exit 1
#  fi

  ODB_PACKAGE_PATH="${CI_DIR}/${ODB_PACKAGE}.${ODB_PACKAGE_EXT}"

  if [ $ODB_PACKAGE_EXT = "zip" ]; then
    unzip -q $ODB_PACKAGE_PATH -d ${CI_DIR}
  elif [ $ODB_PACKAGE_EXT = "tar.gz" ]; then
    tar xvzf ${ODB_PACKAGE_PATH} -C ${CI_DIR}
  fi;
}
