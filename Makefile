all:
	@make -C styledocco
	@cp styledocco/resources/docs.js docs.js
	@cp styledocco/resources/docs.css docs.css
