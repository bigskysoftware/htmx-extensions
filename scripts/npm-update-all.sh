#!/bin/bash
for dir in ../src/*; do
    if [ -f "$dir/package.json" ]; then
        (
            cd "$dir"
            npm i -D
            cd ../..
        )
    else
        echo "$(basename "$dir") doesn't have a package.json, skipping"
    fi
done
