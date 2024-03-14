#!/bin/bash
for dir in ../src/*; do
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
