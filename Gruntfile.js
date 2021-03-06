// Generated on 2015-11-19 using generator-chromeapp 0.2.19
'use strict';

module.exports = function(grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Configurable paths
  var config = {
    app: 'app',
    dist: 'dist',
    tasks: grunt.cli.tasks
  };

  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    config: config,

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      bower: {
        files: ['bower.json'],
        tasks: ['wiredep']
      },
      js: {
        files: ['<%= config.app %>/scripts/{,*/}*.js', 'test/*/{,*/}*.js'],
        tasks: ['jshint', 'karma:unit:run'],
        options: {
          livereload: true
        }
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      styles: {
        files: ['<%= config.app %>/styles/{,*/}*.css'],
        tasks: [],
        options: {
          livereload: true
        }
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '.tmp/styles/{,*/}*.css',
          '<%= config.app %>/*.html',
          '<%= config.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= config.app %>/manifest.json',
          '<%= config.app %>/_locales/{,*/}*.json'
        ]
      }
    },

    // Grunt server and debug server settings
    connect: {
      options: {
        port: 9000,
        livereload: 35729,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost',
        open: true,
      },
      server: {
        options: {
          open: false,
          middleware: function(connect) {
            return [
              connect.static('.tmp'),
              connect().use('/bower_components', connect.static('./bower_components')),
              connect.static(config.app)
            ];
          }
        }
      },
      chrome: {
        options: {
          open: false,
          base: [
            '<%= config.app %>'
          ]
        }
      },
      prism: {
        options: {
          port: 9001,
          open: false,
          middleware: function() {
            return [
              require('grunt-connect-prism/middleware')
            ];
          }
        }
      },
    },

    // Prism mock
    prism: {
      options: {
        mode: 'mock',
        host: 'localhost',
        port: 80,
        context: '/mock',
        mocksPath: 'test/prism'
      }
    },

    // Empties folders to start fresh
    clean: {
      server: '.tmp',
      chrome: '.tmp',
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= config.dist %>/*',
            '!<%= config.dist %>/.git*'
          ]
        }]
      }
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        '<%= config.app %>/scripts/{,*/}*.js',
        '!<%= config.app %>/scripts/vendor/*',
        'test/*/{,*/}*.js'
      ]
    },

    // Mocha testing framework configuration options
    karma: {
      // Option for use with grunt watch
      unit: {
        configFile: 'karma.conf.js',
        autoWatch: false,
        background: true,
        singleRun: false
      },
      // Option for use as a build process
      once: {
        configFile: 'karma.conf.js',
        singleRun: true,
        reporters: ['dots', 'junit', 'coverage'],
        junitReporter: {
          outputDir: '../temp/test'
        }
      }
    },

    // Protractor E2E tests
    protractor: {
      options: {
        configFile: 'protractor.conf.js',
        keepAlive: true,
        noColor: false,
      },
      e2e: {},
    },

    // Automatically inject Bower components into the HTML file
    wiredep: {
      task: {
        src: ['<%= config.app %>/index.html', 'karma.conf.js'],

        options: {
          ignorePath: '<%= config.app %>/',
          exclude: ['bower_components/bootstrap', 'bower_components/jquery']
        }
      }
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      options: {
        dest: '<%= config.dist %>'
      },
      html: [
        '<%= config.app %>/index.html'
      ]
    },

    // Performs rewrites based on rev and the useminPrepare configuration
    usemin: {
      options: {
        assetsDirs: ['<%= config.dist %>', '<%= config.dist %>/images']
      },
      html: ['<%= config.dist %>/{,*/}*.html'],
      css: ['<%= config.dist %>/styles/{,*/}*.css']
    },

    // The following *-min tasks produce minified files in the dist folder
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>/images',
          src: '{,*/}*.{gif,jpeg,jpg,png}',
          dest: '<%= config.dist %>/images'
        }]
      }
    },

    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>/images',
          src: '{,*/}*.svg',
          dest: '<%= config.dist %>/images'
        }]
      }
    },

    htmlmin: {
      dist: {
        options: {
          customAttrAssign: [/\?=/],
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeCommentsFromCDATA: true,
          removeEmptyAttributes: true,
          removeOptionalTags: true,
          removeRedundantAttributes: true,
          useShortDoctype: true
        },
        files: [{
          expand: true,
          cwd: '<%= config.dist %>',
          src: '{,*/}*.html',
          dest: '<%= config.dist %>'
        }]
      }
    },

    // Preserve license comments
    uglify: {
      options: {
        preserveComments: require('uglify-save-license')
      }
    },

    // By default, your `index.html`'s <!-- Usemin block --> will take care of
    // minification. These next options are pre-configured if you do not wish
    // to use the Usemin blocks.
    // cssmin: {
    //   dist: {
    //     files: {
    //       '<%= config.dist %>/styles/main.css': [
    //         '.tmp/styles/{,*/}*.css',
    //         '<%= config.app %>/styles/{,*/}*.css'
    //       ]
    //     }
    //   }
    // },
    // uglify: {
    //   dist: {
    //     files: {
    //       '<%= config.dist %>/scripts/scripts.js': [
    //         '<%= config.dist %>/scripts/scripts.js'
    //       ]
    //     }
    //   }
    // },
    // concat: {
    //   dist: {}
    // },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= config.app %>',
          dest: '<%= config.dist %>',
          src: [
            '*.{ico,png,txt}',
            'images/{,*/}*.{webp,gif}',
            '{,*/}*.html',
            'styles/fonts/{,*/}*.*',
            '_locales/{,*/}*.json',
          ]
        }]
      },
      styles: {
        expand: true,
        dot: true,
        cwd: '<%= config.app %>/styles',
        dest: '.tmp/styles/',
        src: '{,*/}*.css'
      },
      fonts: {
        expand: true,
        dot: true,
        cwd: '<%= config.app %>/bower_components/bootstrap/dist',
        dest: '<%= config.dist %>',
        src: 'fonts/*.woff2'
      }
    },

    // Run some tasks in parallel to speed up build process
    concurrent: {
      server: [
        'copy:styles'
      ],
      chrome: [
        'copy:styles'
      ],
      dist: [
        'copy:styles',
        'imagemin',
        'svgmin'
      ],
      test: [
        'copy:styles'
      ],
    },

    // Merge event page, update build number, exclude the debug script
    chromeManifest: {
      dist: {
        options: {
          buildnumber: false,
          background: {
            target: 'scripts/background.js',
            exclude: [
              'scripts/chromereload.js'
            ]
          }
        },
        src: '<%= config.app %>',
        dest: '<%= config.dist %>'
      }
    },

    // Compress files in dist to make Chrome Apps package
    compress: {
      dist: {
        options: {
          archive: function() {
            var manifest = grunt.file.readJSON('app/manifest.json');
            return 'package/autotempo-chrome-' + manifest.version + '.zip';
          }
        },
        files: [{
          expand: true,
          cwd: 'dist/',
          src: ['**'],
          dest: ''
        }]
      }
    }
  });

  grunt.registerTask('debug', function(platform) {
    var watch = grunt.config('watch');
    platform = platform || 'chrome';


    // Configure style task for debug:server task
    if (platform === 'server') {
      watch.styles.tasks = ['newer:copy:styles'];
      watch.styles.options.livereload = false;
    }

    // Configure updated watch task
    grunt.config('watch', watch);

    grunt.task.run([
      'clean:' + platform,
      'concurrent:' + platform,
      'connect:' + platform,
      'karma:unit:start',
      'watch'
    ]);
  });

  grunt.registerTask('test', [
    'karma:once'
  ]);

  grunt.registerTask('e2e-test', [
    'prism',
    'connect:prism',
    'protractor:e2e'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'chromeManifest:dist',
    'useminPrepare',
    'concurrent:dist',
    'concat',
    'cssmin',
    'uglify',
    'copy',
    'usemin',
    'htmlmin',
    'compress'
  ]);

  grunt.registerTask('default', [
    'newer:jshint',
    'test',
    'e2e-test',
    'build'
  ]);
};
