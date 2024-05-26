#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

for dir in $SCRIPT_DIR/../src/*; do
    if [ -f "$dir/package.json" ]; then
        (
            cd "$dir"
            npm i -D
            npm update
            cd ../..
        )
    else
        echo "$(basename "$dir") doesn't have a package.json, skipping"
    fi
done
