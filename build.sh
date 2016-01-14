#!/bin/bash

BUILDDIR=dist
HTMLFILE=frame.html
JS_OUTPUT=mdsblocks-dist.js
CSS_OUTPUT=mdsblocks-dist.css

# if build directory doesn't exist, create it
if [ ! -d ${BUILDDIR} ]; then
    mkdir ${BUILDDIR}
fi

# clean build dir
rm ${BUILDDIR}/*


# take the js file paths from the html file
JS_SCRIPTS=($( sed -n -e 's/<script src="\(.*\)"><\/script>/\1/p' ${HTMLFILE} ) )

# install uglify-js if not present
#npm install uglify-js -g

# minify js files
echo "Compressing referenced .js files into ${JS_OUTPUT}"
echo ${JS_SCRIPTS[@]}
uglifyjs ${JS_SCRIPTS[@]} --output ${BUILDDIR}/${JS_OUTPUT}
# cat ${JS_SCRIPTS[@]} > ${BUILDDIR}/${JS_OUTPUT}

# copy html files into build dir
cp *.html ${BUILDDIR}/

# replace script tags in HTMLFILE in the BUILDDIR
sed -i.bak -n '/<!--\(.*\)-->/!p' ${BUILDDIR}/${HTMLFILE}
sed -i.bak -n '/<script src="\(.*\)"><\/script>/!p' ${BUILDDIR}/${HTMLFILE}

# add script tag for JS_OUTPUT
sed -i.bak -e $'s#<meta charset="utf-8">#<meta charset="utf-8">\\\n    <script src=\"'${JS_OUTPUT}'\"><\/script>#g' ${BUILDDIR}/${HTMLFILE}

# take the css file paths from the html file
CSS_FILES=($( sed -n -e 's/<link rel="stylesheet" href="\(.*\)">/\1/p' ${HTMLFILE} ) )

# install uglify-css if not present
#npm install uglifycss -g

# minify css files
echo "Compressing referenced .css files into ${CSS_OUTPUT}"
echo ${CSS_FILES[@]}
uglifycss ${CSS_FILES[@]} > ${BUILDDIR}/${CSS_OUTPUT}

# replace link css tags in HTMLFILE in the BUILDDIR
sed -i.bak -n '/<link rel="stylesheet" href="\(.*\)">/!p' ${BUILDDIR}/${HTMLFILE}

# add script tag for CSS_OUTPUT
sed -i.bak -e $'s#<meta charset="utf-8">#<meta charset="utf-8">\\\n    <link rel="stylesheet" href="'${CSS_OUTPUT}'\">#g' ${BUILDDIR}/${HTMLFILE}

# add ipy script tag
sed -i.bak -e $'s#<\/body>#  <script src="mdsblocks-ipy.js"><\/script>\\\n  <\/body>#g' ${BUILDDIR}/${HTMLFILE}

rm ${BUILDDIR}/*.bak
