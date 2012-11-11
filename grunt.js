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
    jade: {
      html: {
        src: [ 'web/index.jade' ],
        dest: 'dist/index.html',
        options: { client: false, pretty: true }
      }
    },
    concat: {
      dist: {
        src: [ 'web/*.css', 'web/views/*.css' ],
        dest: 'dist/docs.css'
      }
    },
    min: {
      dist: {
        src: [ 'dist/docs.js' ],
        dest: 'dist/docs.js'
      }
    },
    mincss: {
      dist: {
        files: { 'dist/docs.css': [ '<config:concat.dist.src>' ]
        }
      }
    },
    watch: {
      files: [ 'web/**', 'grunt.js' ],
      tasks: 'browserify concat'
    },
    jshint: {
      options: {
        strict: true,
        browser: true,
        node: true,
        eqnull: true,
        globalstrict: true
      },
      globals: {
        styledocco: true
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'jade browserify:dist/docs.js min mincss');
  grunt.registerTask('dev', 'concat browserify:dist/docs.js');

  grunt.loadNpmTasks("grunt-contrib"); 
  grunt.loadNpmTasks('grunt-browserify');
};
