#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

for dir in $SCRIPT_DIR/../src/*; do
    if [ -d "$dir/test" ]; then
        (
            cd "$dir"
            npm i -D && npm t || { echo "ERRORS in $(basename "$dir")"; exit $?; }
            cd ../..
        )
    else
        echo "$(basename "$dir") doesn't have any test, skipping"
    fi
done
