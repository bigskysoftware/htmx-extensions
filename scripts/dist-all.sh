#!/bin/bash
# This script must be run from npm, via `npm run dist`, in order to access the `uglifyjs` command
set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Traverse all directories which contain a `src` folder
for dir in $SCRIPT_DIR/../src/*; do
    EXTENSION_NAME=$(basename "$dir")
    if [ -e "$dir/$EXTENSION_NAME.js" ]; then
        (
            cd "$dir"
            EXTENSION_SRC="$dir/$EXTENSION_NAME.js"

            # Prepare a clean dist directory
            mkdir -p dist
            rm -rf dist/*.js  dist/*.ts  dist/*.gz

            # Regular IIFE script
            cp $EXTENSION_SRC dist/$EXTENSION_NAME.js

            # Generate minified script
            uglifyjs -m eval -o dist/$EXTENSION_NAME.min.js dist/$EXTENSION_NAME.js

            # Generate gzipped script
            gzip -9 -k -f dist/$EXTENSION_NAME.min.js > dist/$EXTENSION_NAME.min.js.gz

            # Generate AMD script
            cat > dist/$EXTENSION_NAME.amd.js << EOF
require(['htmx'], htmx => {
$(cat $EXTENSION_SRC)
})
EOF


            # Generate CJS script
            cat > dist/htmx.cjs.js << EOF
const htmx = require('htmx.org');
$(cat $EXTENSION_SRC)
EOF

            # Generate ESM script
            cat > dist/htmx.esm.js << EOF
import htmx from 'htmx.org';
$(cat $EXTENSION_SRC)
EOF

            # Print success message and updated script tag with SRI hash
            echo
            echo "$EXTENSION_NAME distribution files generated"
            SRI_HASH=`openssl dgst -sha384 -binary $dir/dist/$EXTENSION_NAME.min.js | openssl base64 -A`
            VERSION=`node -p -e "require('$dir/package.json').version"`
            echo "<script src=\"https://unpkg.com/$EXTENSION_NAME@$VERSION\" integrity=\"sha384-$SRI_HASH\" crossorigin=\"anonymous\"></script>"
        )
        cd ../..
    else
        echo
        echo "Extension source file "$EXTENSION_NAME.js" doesn't exist"
    fi
done