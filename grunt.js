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
      dist: {
        src: [ 'lib/docs.js' ],
        dest: 'lib/docs.js'
      }
    },
    mincss: {
      dist: {
        files: {
          'lib/docs.css': 'share/docs.css'
        }
      }
    },
    copy: {
      dist: {
        files: {
          lib: 'share/**.jade'
        }
      }
    },
    browserify: {
      "lib/docs.js": {
        entries: [ 'share/docs.js']
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
  grunt.registerTask('default', 'browserify min mincss copy');
  grunt.loadNpmTasks("grunt-contrib"); 
  grunt.loadNpmTasks('grunt-browserify');
};
