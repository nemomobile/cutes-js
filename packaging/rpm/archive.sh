#!/bin/bash

if [ $# -ne 3 ]; then
    echo "Usage: ${0} <head> <tag> <dst-path>"
    exit 1
fi

HEAD=$1
TAG=$2
DST=`realpath $3`
MAIN=`realpath ${DST}/the-vault-${TAG}.tar`
JSON=`realpath ${DST}/the-vault-${TAG}-json.tar`
echo "Main"
git archive --prefix=the-vault-${TAG}/ --format=tar -o ${MAIN} ${HEAD}
cd json
echo "Json"
git archive --prefix=the-vault-${TAG}/json/ --format=tar -o ${JSON} HEAD
echo "Merge"
tar -Af ${MAIN} ${JSON}
rm -f ${MAIN}.bz2
bzip2 ${MAIN}
#rm ${JSON}
