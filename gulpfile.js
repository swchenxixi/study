var gulp = require('gulp');
var sass = require('gulp-sass');
var stylus = require('gulp-stylus');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var autoprefixer = require('gulp-autoprefixer');
var pxtorem = require('gulp-pxtorem');
var crypto = require('crypto');
var fs = require('fs');
var getPixels = require("get-pixels") //获取图片的宽高
var sourcemaps  = require('gulp-sourcemaps');
const { exec } = require('child_process');
const iconv = require('iconv-lite');
var base64 = require('gulp-base64');


// 配置
const config={
    img:["img","images"]
}

gulp.task('serve', function() {
	browserSync.init({
		server: "./"
	});
});


gulp.task('watch', function() {
    gulp.watch("./css/*.scss",['sass']);
    gulp.watch("./css/*.styl",['stylus']);
    gulp.watch("./*.html").on('change', reload);
    gulp.watch("./js/*.js").on('change', reload);
    gulp.watch("./css/*.css").on('change', reload);
})

gulp.task('sass', function(){
  return gulp.src('./css/*.scss')
    .pipe(sass({outputStyle:'compact'}).on('error', sass.logError))
    .pipe(gulp.dest('./css'))
});

gulp.task('stylus', function () {
    return gulp.src(['./css/*.styl'])
    .pipe(sourcemaps.init())
    .pipe(stylus({compress: true}))

    .on('error', swallowError)

    .pipe(autoprefixer({
        browsers: ['last 20 versions'],
        cascade: true, //是否美化属性值 默认：true
        remove: false, //是否去掉不必要的前缀 默认：true
    }))
    
    .on('error', swallowError)

    .pipe(base64({
            baseDir: '',
            extensions: ['svg', 'png', /\.jpg#datauri$/i],
            exclude: [/\.server\.(com|net)\/dynamic\//, '--live.jpg'],
            maxImageSize: 50 * 1024, // bytes 
            debug: true
        }))
    .on('error', swallowError)

    
    //--------------------------------------------------
    
    // .pipe(pxtorem({
    //     rootValue: 100,
    //     unitPrecision: 5,
    //     propList: ['*'],
    //     selectorBlackList: [],
    //     replace: true,
    //     mediaQuery: false,
    //     minPixelValue: 2
    //   },
    //   {
    //     map: false
    //   }
    // ))
    
    //--------------------------------------------------
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./css'))
});


// 启动任务
gulp.task('default', ['serve','watch']);


var ImgPath='' // 设置图片目录
var fileTwo='';

var img=config.img;

img.forEach(function(v){
    var path=__dirname+"\\"+v+"\\"
    fs.exists(path,function(exists){
        if(exists){
            // console.log(path+'存在')
            ImgPath=path
            watch()
            return
        }else{
            console.log(path+'不存在')
        }
    })
})

function swallowError(error) {
    console.error(error.toString())
    this.emit('end')
}

function watch(){
    fs.watch(ImgPath,function(event, filename){
        if(event=='change'){
            if (filename.indexOf('_tmp')==-1 && filename.indexOf('crdownload')==-1) {
                // console.log("事件:"+event,'名称:'+filename)
                if (fileTwo==''){
                    fileTwo=filename
                    var rs = fs.createReadStream(ImgPath+filename);
                    var hash = crypto.createHash('md5');
                    rs.on('data', hash.update.bind(hash));
                    rs.on('end', function() {
                        newFilename=hash.digest('hex').slice(0,16); //获取文件哈希值
                        getImgInfo(ImgPath+filename,newFilename);
                    });
                }
            }
        }
    })
}

function rename(filename,newFilename){
    var patt=new RegExp(/\w{36,}/);
    var result=patt.test(filename)
    if(!result){
        fs.rename(filename,newFilename,function(err){
            if(err){
                console.log(filename+" => 文件重命名失败");
                return
            }
            var source=filename.match(/(?:[^\\]+)(?:\.[^\(]+)/i);
            console.log('\nSourceName => '+source[0]);
            console.log('NewName => '+newFilename.match(/\w{16,}\.(?:jpg|png)$/i));
            GetSize(newFilename);
        })
    }
}

function getImgInfo(filename,newName){  //获取图片宽高
    getPixels(filename, function(err, pixels) {
        if(err) {
            console.log(filename+" => 不是图片文件!");
            return
        }
        info = "_"+pixels.shape[0]+'x'+pixels.shape[1]

        var newName1=filename.replace(/([^\\]+)(\.[^\(]+)/i,newName)+info+filename.match(/\.\w+$/)

        rename(filename,newName1);
        //+filename.match(/\.\w+$/) // 后缀名
        exec('clip').stdin.end(iconv.encode(newName+info+filename.match(/\.\w+$/), 'gbk'));
    })
    
}

function GetSize(filename){ // 获取文件大小
    fs.stat(filename,function(err,state){
        if(err){
            console.log(err.message)
            return
        }
        var size=state.size/1024
        console.log('FileSize => '+size.toFixed(1)+' KB')
        fileTwo=''
    })
}



// 嵌套输出方式 nested
// 展开输出方式 expanded 
// 紧凑输出方式 compact 
// 压缩输出方式 compressed