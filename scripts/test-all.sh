#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

for dir in $SCRIPT_DIR/../src/*; do
    if [ -d "$dir/test" ]; then
        (
            cd "$dir"
            npm i -D && npm t
        )
        # Check the exit status of the subshell
        if [ $? -ne 0 ]; then
           echo "ERRORS in $(basename "$dir")"
           exit 1
        fi
        cd ../..
    else
        echo "$(basename "$dir") doesn't have any test, skipping"
    fi
done
