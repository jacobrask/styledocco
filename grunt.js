'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    browserify: {
      'dist/docs.js': {
        entries: [ 'web/app.js' ],
        aliases: [ 'jquery:jquery-browserify' ]
      }
    },
    concat: {
      dist: {
        src: [ 'web/*.css', 'web/views/*.css' ],
        dest: 'dist/docs.css'
      }
    },
    jade: {
      html: {
        src: [ 'web/index.jade' ],
        dest: 'dist/index.html',
        options: { client: false, pretty: true }
      }
    },
    watch: {
      files: [ 'web/**', 'grunt.js' ],
      tasks: 'browserify concat jade'
    },
    lint: {
      files: [ 'web/app.js', 'web/models/*.js', 'web/views/*.js' ]
    },
    jshint: {
      options: {
        browser: true,
        node: true,
        camelcase: true,
        immed: true,
        newcap: true,
        undef: true,
        unused: true,
        strict: true,
        maxparams: 3,
        maxdepth: 3,
        maxstatements: 15,
        maxcomplexity: 6,
        maxlen: 80,
        boss: true,
        eqnull: true,
        es5: true,
        globalstrict: true,
        laxbreak: true,
        supernew: true
      },
      globals: {
        styledocco: true
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'browserify concat jade');

  grunt.loadNpmTasks("grunt-contrib"); 
  grunt.loadNpmTasks('grunt-browserify');
};
