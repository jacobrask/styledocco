'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    lint: {
      files: [ 'grunt.js', 'styledocco.js', 'cli.js', 'bin/*', 'web/*.js',
               'test/**/*.js' ]
    },
    min: {
      dist: {
        src: [ 'dist/docs.js' ],
        dest: 'dist/docs.js'
      }
    },
    browserify: {
      "dist/docs.js": {
        entries: [ 'web/app.js' ]
      },
      "test/browser/lib/ui.js": {
        entries: [ 'test/browser/navigation.js' ]
      }
    },
    mincss: {
      dist: {
        files: {
          'dist/docs.css': [ 'web/app.css', 'web/navbar/navbar.css' ]
        }
      }
    },
    jade: {
      html: {
        src: [ 'web/index.jade' ],
        dest: 'dist/index.html',
        options: {
          client: false,
          pretty: true
        }
      }
    },
    watch: {
      files: [ '<config:lint.files>', 'web/**' ],
      tasks: 'jade browserify mincss'
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
  grunt.registerTask('default', 'jade browserify min mincss');
  grunt.registerTask('dev', 'jade browserify mincss');
  grunt.loadNpmTasks("grunt-contrib"); 
  grunt.loadNpmTasks('grunt-browserify');
};
