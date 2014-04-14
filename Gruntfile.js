module.exports = function (grunt)
{

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: [
        'Gruntfile.js',
        'src/*.js'
      ],
      options: {
        multistr: true,
        node: true,
        curly: false,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true
      }
    },
    qunit: {
      all: ["test/*.html"]
    },
    uglify: {
      options: {
        mangle: false
      },
      lib: {
        files: {
          'dist/aspect.min.js': ['src/aspect.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('test', ['qunit']);
  grunt.registerTask('default', ['jshint', 'test', 'uglify:lib']);
};