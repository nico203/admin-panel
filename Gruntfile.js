
module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
//        bower: {
//            install: {
//                options: {
//                    install: true,
//                    copy: false,
//                    targetDir: './lib',
//                    cleanTargetDir: true
//                }
//            }
//        },
        jshint: {
            all: ['Gruntfile.js', 'src/*.js', 'src/**/*.js']
        },
        html2js: {
            options: {
                module: 'adminPanel',
                htmlmin: {
                    collapseBooleanAttributes: true,
                    collapseInlineTagWhitespace: true,
                    collapseWhitespace: true,
                    customAttrCollapse: /ng-class/,
                    minifyCSS: true,
                    minifyJS: true,
                    removeAttributeQuotes: true,
                    removeComments: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true
                },
                singleModule: true,
                existingModule: true
            },
            dist: {
                src: ['src/**/*.html'],
                dest: 'tmp/templates.js'
            }
        },
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['src/*.js', 'src/**/*.module.js', 'src/**/*.js', 'tmp/*.js'],
                dest: 'dist/js/<%= pkg.name %>.js'
            }
        },
        clean: {
            temp: {
                src: ['tmp']
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'dist/<%= pkg.name %>.min.js'
            },
            dist: {
                files: {
                    'dist/js/<%= pkg.name %>.min.js': ['dist/js/<%= pkg.name %>.js']
                }
            }
        },
        watch: {
            dev: {
                files: ['Gruntfile.js', 'src/**/*.js', 'src/**/*.html'],
                tasks: ['jshint', 'html2js:dist', 'concat:dist', 'clean:temp'],
                options: {
                    atBegin: true
                }
            },
            min: {
                files: ['Gruntfile.js', 'src/**/*.js', '*.html'],
                tasks: ['jshint', 'html2js:dist', 'concat:dist', 'clean:temp', 'uglify:dist'],
                options: {
                    atBegin: true
                }
            }
        },  
       sass: {
            dist: {
                options: {
                    style: 'expanded'
                },
               files: {
                   'dist/css/<%= pkg.name %>.css': 'scss/admin-panel.scss'
                }
            }
        },
        cssmin: {
            dist: {
                files: {
                    'dist/css/<%= pkg.name %>.min.css': 'dist/css/<%= pkg.name %>.css'
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-html2js');
    grunt.loadNpmTasks('grunt-contrib-watch');
//    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    
    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('minified', ['watch:min']);
    grunt.registerTask('package', ['jshint', 'html2js:dist', 'concat:dist', 'uglify:dist', 'clean:temp']);
};
