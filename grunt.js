'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    min: {
      dist: {
        src: [ 'dist/docs.js' ],
        dest: 'dist/docs.js'
      }
    },
    browserify: {
      'test/lib/views.js': {
        entries: [ 'test/navigation.js', 'test/previews.js' ]
      }
    },
    concat: {
      dist: {
        src: [ 'web/*.css', 'web/views/*.css' ],
        dest: 'dist/docs.css'
      }
    },
    mincss: {
      dist: {
        files: { 'dist/docs.css': [ '<config:concat.dist.src>' ]
        }
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
      tasks: 'jade concat'
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
    },
    buster: {
      test: { config: 'test/buster.js' }
    }
  });

  // Default task.
  grunt.registerTask('default', 'jade browserify:dist/docs.js min mincss');
  grunt.registerTask('dev', 'concat');
  grunt.registerTask('test', 'browserify:test/lib/tests.js buster');

  grunt.loadNpmTasks("grunt-contrib"); 
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-buster');
};
