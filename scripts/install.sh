#!/bin/sh
if [ -n "`hash pygmentize 2>&1`" ]; then 
	echo "Need to install Pygments (requires sudo)..."
	sudo easy_install Pygments
fi
