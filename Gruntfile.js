
module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bower: {
            install: {
                options: {
                    install: true,
                    copy: false,
                    targetDir: './lib',
                    cleanTargetDir: true
                }
            }
        },
        jshint: {
            options: {
                esversion: 6
            },
            all: ['Gruntfile.js', 'src/*.js', 'src/**/*.js']
        },
        html2js: {
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
                src: ['src/**/*.js', 'tmp/*.js'],
                dest: 'dist/admin-panel.js'
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
                    'dist/admin-panel.min.js': ['dist/admin-panel.js']
                }
//                options: {
//                    mangle: false
//                }
            }
        },
        watch: {
            dev: {
                files: ['Gruntfile.js', 'src/**/*.js', '*.html'],
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
        }
    });
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-html2js');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-bower-task');
    
    grunt.registerTask('dev', ['bower', 'connect:server', 'watch:dev']);
    grunt.registerTask('test', ['bower', 'jshint']);
    grunt.registerTask('minified', ['bower', 'watch:min']);
    grunt.registerTask('package', ['bower', 'jshint', 'html2js:dist', 'concat:dist', 'uglify:dist',
        'clean:temp']);
};
