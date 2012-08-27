'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    lint: {
      files: [ 'grunt.js', 'styledocco.js', 'cli.js', 'bin/*', 'share/*.js',
               'test/**/*.js' ]
    },
    min: {
      docs: {
        src: [ 'node_modules/iterhate/iterhate.js', 'share/utils.js', 'share/docs*.js' ],
        dest: 'lib/docs.js'
      },
      previews: {
        src: [ 'node_modules/iterhate/iterhate.js', 'share/utils.js', 'share/previews*.js' ],
        dest: 'lib/previews.js'
      }
    },
    cssmin: {
      docs: {
        src: ['share/docs.css'],
        dest: 'lib/docs.css'
      }
    },
    copy: {
      dist: {
        files: {
          lib: 'share/**.jade'
        }
      }
    },
    watch: {
      files: [ '<config:lint.files>', 'share/*' ],
      tasks: 'lint min cssmin copy'
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
        styledocco: true,
        buster: true, assert: true, refute: true, test: true
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'min cssmin copy');
  grunt.loadNpmTasks("grunt-contrib"); 
  grunt.loadNpmTasks('grunt-css');

};
