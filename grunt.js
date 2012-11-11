'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    browserify: {
      'dist/docs.js': {
        entries: [ 'web/app.js' ],
        aliases: [ 'jquery:jquery-browserify' ]
      },
      'test/lib/views.js': {
        entries: [ 'test/navigation.js', 'test/previews.js' ]
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
  grunt.registerTask('dev', 'concat browserify:dist/docs.js');
  grunt.registerTask('test', 'browserify:test/lib/tests.js buster');

  grunt.loadNpmTasks("grunt-contrib"); 
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-buster');
};
