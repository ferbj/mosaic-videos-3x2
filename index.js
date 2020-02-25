const fs = require('fs');
const path = require('path');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

let command = ffmpeg()

// Change this to the desired output resolution  

let x=960, y=720;

let videoInfo = [];

let savepath = 'D:/mosaic-videos/uploadvideos';
const folderpath = path.join(savepath);

fs.readdir(folderpath, (err, files) => {
    if(!files || files.length === 0) {
        console.log(`provided folder '${folderpath}' is empty or does not exist.`);
        console.log('Make sure your project was compiled!');
        return;
    }
    
    files.forEach(function(file , idx) {
        
      const filePath = path.join(folderpath,file);
           // ignore if directory
           if (fs.lstatSync(filePath).isDirectory()) {
            next;
        }
        fs.readFile(filePath, (error, fileContent) => {
                // if unable to read file contents, throw exception
                if (error) { throw error; }
                let filename = file;
                console.log(idx + ': Input File ... ' + filename);
                videoInfo.push({			
                    filename: filePath
                });
                
                command = command.addInput(filePath);
                
            });

        cords(x,y,idx,files);              
    });
    process(x,y,videoInfo);

});

function cords(x,y,idx){
    switch(idx){
        case 0:
        videoInfo[0] = { coord : { x: 0, y: y/6 } }
        break;
        case 1:
        videoInfo[1] = { coord : { x:  x/3, y: y/6} }
        break;
        case 2: 
        videoInfo[2] = { coord : { x: x/1.5, y: y/6 }}
        break;
        case 3: 
        videoInfo[3] = { coord: { x: 0, y: y/2 }}
        break;
        case 4: 
        videoInfo[4] = { coord: { x: x/3, y: y/2 }}
        break;
        case 5:
        videoInfo[5] =  { coord: { x: x /1.5, y: y/2 }}
        break;
        
    }
    return videoInfo;
}

function process(x,y,index,array){
    console.log('videoInfo', videoInfo)
    var complexFilter = [];
    complexFilter.push('nullsrc=size=' + x + 'x' + y + ' [base0]');

// Scale each video
videoInfo.forEach(function (val, index, array) {
    complexFilter.push({
        filter: 'setpts=PTS-STARTPTS, scale', options: [x/3, y/3],
        inputs: index+':v', outputs: 'block'+index
    });
    
});

// Build Mosaic, block by block
videoInfo.forEach(function (val, index, array) {
 complexFilter.push({
    filter: 'overlay', options: {  x: val.coord.x, y: val.coord.y },
    inputs: ['base'+index, 'block'+index], outputs: 'base'+(index+1)
});
});
console.log('complexFilter',complexFilter)
let outFile = 'Fileout.mp4';
//duration of video and building of mosaic video

command
.duration(20)
.videoCodec('libx264')
.audioCodec('libmp3lame')
.format('mp4')
.complexFilter(complexFilter, 'base6')
.save(outFile)
.on('error', function(err) {
    console.log('An error occurred: ' + err.message);
})	
.on('progress', function(progress) { 
    console.log('... frames: ' + progress.frames);
})
.on('end', function() { 
    console.log('Finished processing'); 
});

//waiting 45 seconds of first processing from mp4 to webm
setTimeout(() => {
ffmpeg({source: 'Fileout.mp4'})
  .withVideoCodec('libvpx')
  .addOptions(['-qmin 0', '-qmax 50', '-crf 5'])
  .withVideoBitrate(1024)
  .withAudioCodec('libvorbis')
  .saveToFile('output.webm');

},45000);
}