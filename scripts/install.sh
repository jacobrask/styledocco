#!/bin/sh
if [ -n "`hash pygmentize 2>&1`" ]; then 
	echo "Need to install Pygments (requires sudo)..."
	sudo easy_install Pygments
fi

if [ -n "`hash perl 2>&1`" ]; then 
	echo "Perl is required for cloc but not installed!"
fi
