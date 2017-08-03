var MusicPlayer=(function () {
   function Player(ct) {
      this.ct=ct;
      this.init();
      this.bind();
   }
   Player.prototype={
       //初始化
      init: function () {
          this.playBtn = $(this.ct).querySelector(".music .play");  //播放按钮
          this.playNext = $(this.ct).querySelector(".music .next");  //下一首
          this.playPre=$(this.ct).querySelector(".music .prev"); //上一首
          this.volumeNode = $(this.ct).querySelector(".player-box .voice"); //音量图标
          this.volumeBar=$(this.ct).querySelector(".player-box .volume-now"); //音量条
          this.musicTitle=$(this.ct).querySelector(".music-play-control .title");  //歌曲名
          this.musicSinger=$(this.ct).querySelector(".music-play-control .singer"); //歌手
          this.musicBg=$(this.ct).querySelector(".music-img");//大背景
          this.musicInfoBox=$(this.ct).querySelector(".music-bg"); //背景
          this.progressBarNode=$(this.ct).querySelector(".progress .bar"); //进度条
          this.progressBar=$(this.ct).querySelector(".progress .progress-now"); //进度条
          this.timeNodeNow=$(this.ct).querySelector(".progress .time-now"); //当前音乐播放时间
          this.timeNodeTotal=$(this.ct).querySelector(".progress .time-total"); //音乐时间长度
          this.listBtn=$(this.ct).querySelector(".list"); //列表按钮
          this.backBtn=$(this.ct).querySelector(".back"); //返回按钮
          this.playList=$(this.ct).querySelector(".albumList"); //专辑列表
          this.controlBtn=$(this.ct).querySelector(".play-control"); //循环列表
          this.lrcBox=$(this.ct).querySelector(".music-lrc>div"); //歌词

          this.music=new Audio();
          this.music.autoPlay=true;
          this.musicIndex=0;
          this.musicList=this.musiclrc=[];
          this.playModes=[1,"icon-circulation","icon-randomPlay","icon-singleCycle"]; //1代表当前播放模式，取值范围为1（循环）2（随机）3（单曲）
          this.timer;

          this.getAlbum();
          this.initMusic();
      },
      bind:function () {
          var _this=this;
          drag(_this.volumeNode,_this.volumeBar,_this.setVolume.bind(_this)); //拖动音量条
          _this.listBtn.addEventListener("click",function () {
              $(".music-box>div").style.display="none";
              $(".playList").style.display="block";
          });
          _this.backBtn.addEventListener("click",_this.backPlay);
          //点击播放
          _this.playBtn.addEventListener("click",function (e) {
              e.preventDefault();
              var child = this.querySelector(".fa");
              if (child.classList.contains("icon-play")) {
                  _this.music.play(); //开始播放
                  _this.musicInfoBox.style.animationPlayState="running";
              } else {
                  _this.music.pause(); //暂停播放
                  _this.musicInfoBox.style.animationPlayState="paused";
              }
              child.classList.toggle("icon-play");
              child.classList.toggle("icon-stop");
          });
          //点击播放下一首
          _this.playNext.addEventListener("click",function () {
              _this.loadNextMusic(_this.playModes[_this.playModes[0]]);
          });
          //点击播放上一首
          _this.playPre.addEventListener("click",function(){
             _this.loadLastMusic(_this.playModes[_this.playModes[0]]);
          });
          //音乐播放时
          _this.music.addEventListener("playing",function () {
              _this.timer=setInterval(function () {
                  _this.updateProgress();
              });
          });
          //音乐暂停时
          _this.music.addEventListener("pause",function () {
              clearInterval(_this.timer);
          });
         //音乐播放结束时
          _this.music.addEventListener("ended",function () {
              console.log("ended");
              if(_this.playModes[0]===3){
                 _this.renderMusic(_this.musicList[_this.musicIndex]);
              }else{
                  _this.loadNextMusic(_this.playModes[_this.playModes[0]]);
              }
          });
          //改变进度
          _this.progressBarNode.addEventListener("click",function (e) {
              var percent = e.offsetX/parseInt(getCss(this,"width"));
              _this.music.currentTime = percent * _this.music.duration;
              _this.progressBar.style.width = percent*100+"%"
          });
          //点击列表播放
          _this.playList.addEventListener("click",function (e) {
              if(e.target.tagName.toLowerCase() !== 'li')
                  return;
              var channelId = e.target.getAttribute('data-channel-id');
              _this.musicIndex=_this.musicList.length-1;
              _this.getMusic(channelId);
              setTimeout(function () {
                  _this.renderMusic(_this.musicList[_this.musicIndex]);
                  _this.backPlay();
              },300);
          });
          //切换循环方式
          _this.controlBtn.addEventListener("click",function (e) {
              if(e.target.tagName.toLowerCase()!=="i")
                  return;
              toggleClass(e.target,_this.playModes[_this.playModes[0]++]);
              if(_this.playModes[0]>3)
                  _this.playModes[0]=1;
              toggleClass(e.target,_this.playModes[_this.playModes[0]]);
          });
          //歌词切换
          _this.music.addEventListener("timeupdate",function () {
              _this.updateLrc();
          })

      },
      //返回播放
       backPlay:function () {
           $(".music-box>div").style.display="block";
           $(".playList").style.display="none";
       },
      //播放下一首
      loadNextMusic:function (playMode) {
          if(playMode===this.playModes[1] || playMode === this.playModes[3]){
              this.musicIndex++;
              this.musicIndex=this.musicIndex % this.musicList.length; //播放到最后一首时跳转到第一首
          }else{
              this.musicIndex= Math.floor(Math.random() * this.musicList.length)
          }
          this.renderMusic(this.musicList[this.musicIndex]);
      },
       //播放上一首
      loadLastMusic:function (playMode) {
          if(playMode===this.playModes[1] || playMode === this.playModes[3]){
              this.musicIndex--;
              this.musicIndex=(this.musicIndex+this.musicList.length) % this.musicList.length; //播放到第一首时回到最后一首
          }else{
              this.musicIndex=Math.floor(Math.random() * _this.musicList.length)
          }
          this.renderMusic(this.musicList[this.musicIndex]);
      },

       //获取数据
       get:function (url,data,callback,dataType) {
           url +="?"+ Object.keys(data).map(function (key) {
               return key + "=" +data[key]
           }).join("&");
           var xhr=new XMLHttpRequest();
           xhr.responseType= dataType ||'json';
           xhr.onreadystatechange=function () {
               if(xhr.readyState===4){
                   if(xhr.status===200 || xhr.status===304)
                       callback(xhr.response)
               }
           };
           xhr.open("get",url,true);
           xhr.send();
       },
       //获取专辑信息
       getAlbum:function () {
          var _this=this;
           _this.get("http://api.jirengu.com/fm/getChannels.php",{},function (res) {
               _this.renderCate(res.channels);
           });
       },
       //获取音乐
       getMusic: function (channel) {
          var _this=this;
           _this.get("http://api.jirengu.com/fm/getSong.php",{channel:channel},function (res) {
                  if(res.song[0].artist===null) return;
                  _this.musicList.push(res.song[0]);
           });
       },
       //获取歌词
       getLrc:function (sid) {
           var _this=this;
           _this.get("http://jirenguapi.applinzi.com/fm/getLyric.php",{sid:sid},function (res) {
               var lrcObj=JSON.parse(res);
               _this.musiclrc=[];
               _this.renderLrc(_this.handleLrc(lrcObj.lyric));
           },'text')
       },
       //初始加载音乐
       initMusic: function () {
          var _this=this;
          var init=function () {
              setTimeout(function () {
                  _this.renderMusic(_this.musicList[_this.musicIndex]);
              },1000);
          };
          setTimeout(function () {
              if(_this.musicList.length!==0){
                  init();
              }else{
                  setTimeout(init,1000);
              }
          },1000);
          for(var i=0;i<10;i++){
              _this.getMusic();
          }
          console.log(_this.musicList);
       },
       //处理歌词
       handleLrc: function (lrc) {
          var lrcArr=lrc.split("\n");
          var timeStampPattern = /\[\d{2}:\d{2}.\d{2}\]/g;
          var timeT;
          var text;
          var tmps;
          var time;
          var objArr=[];
          for(var i=0;i<lrcArr.length;i++){
              var matchContent=lrcArr[i].match(timeStampPattern);
              //console.log(matchContent);
              if(matchContent){
                  timeT=lrcArr[i].split(/\[.+\]/g);
                  text=timeT[timeT.length-1] || "";
                  //console.log(timeT);
                  //console.log(text);
                  for(var j=0;j<matchContent.length;j++){
                      tmps=matchContent[j].substring(1,matchContent[j].length - 1).split(":");
                      //console.log(tmps);
                      time=(+tmps[0])*60 +(+tmps[1]);
                      objArr.push({
                          time:time,
                          text:text
                      })
                  }
              }
          }
          objArr.sort(function (a,b) {
              //console.log("ab");
              //console.log(a,b);
              return a.time-b.time;
          });
           this.musiclrc=objArr;
           return objArr;
       },
       //渲染歌词
       renderLrc: function (lyc) {
          var item="";
          for(var i=0;i<lyc.length;i++){
               item +="<p id='line"+i+"'>"+lyc[i].text+"</p>";
          }
          this.lrcBox.innerHTML = item;
       },
       updateLrc: function () {
           if(!this.musiclrc)
               return;
           for(var i=0;i<this.musiclrc.length;i++){
               if(this.music.currentTime> this.musiclrc[i].time){
                   var currentLine = document.querySelector('#line' + i),
                       prevLine = document.querySelector('#line' + (i > 0 ? i - 1 : i));
                   currentLine.classList.add('cur');
                   prevLine.classList.remove('cur');
                   this.lrcBox.style.top= "-"+currentLine.offsetTop+"px";
               }
           }
       },
       //加载音乐
       renderMusic: function (song) {
          if(song===undefined) return;
          // console.log("song");
          // console.log(song);
           this.music.src= song.url;
           this.musicTitle.innerText=song.title;
           this.musicSinger.innerText=song.artist;
           this.musicInfoBox.style.backgroundImage="url("+song.picture+")";
           this.musicBg.setAttribute("src",song.picture);
           this.music.volume=0.5;
           this.music.play();

           this.musicInfoBox.style.animationPlayState="running";

           //获取歌词
           this.getLrc(song.sid);
       },
       //渲染列表
       renderCate:function (channels) {
           var html=channels.map(function (channel) {
               return '<li data-channel-id="'+channel.channel_id +'">'+channel.name+'</li>'
           }).join("");
           this.playList.innerHTML=html;
       },
       //播放进度更新
       updateProgress:function () {
           this.progressBar.style.width= (this.music.currentTime/this.music.duration)*100 +'%';
           var totalMinutes=parseInt(this.music.duration/60),
               totalSeconds=parseInt(this.music.duration%60)+"",
               currentMinutes=parseInt(this.music.currentTime/60),
               currentSeconds=parseInt(this.music.currentTime%60)+"";
           totalSeconds= totalSeconds.length===2 ? totalSeconds : "0"+totalSeconds;
           currentSeconds= currentSeconds.length===2 ? currentSeconds : "0"+currentSeconds;
           this.timeNodeTotal.innerText=totalMinutes+ ":" +totalSeconds;
           this.timeNodeNow.innerText=currentMinutes+ ":" +currentSeconds;
       },
       //设置音量
       setVolume: function () {
          var curWidth=getCss(this.volumeBar,"width");
          var totalWidth=getCss($(".volume-total"),"width");
           this.music.volume= parseInt(curWidth)/parseInt(totalWidth);
       }
    };
   return {
       init: function (ct) {
           new Player(ct);
       }
   }
})();
MusicPlayer.init("#music-box");

//选取元素
function $(obj) {
   return document.querySelector(obj);
}
function $$(obj) {
    return document.querySelectorAll(obj);
}
//切换样式
function toggleClass(ElemObj,className) {
    for(var i=1;i<arguments.length;i++){
        if(typeof arguments[i]==="string"){
            arguments[0].classList.toggle(arguments[i]);
        }
    }
}
//获取实时样式
function getCss(obj,key) {
    return obj.currentStyle ? obj.currentStyle(key): window.getComputedStyle(obj,null)[key];
}
//拖拽
function drag(target,bar,callback) {
    //移动对象参数
    var params = {
        left: 0,
        currentX: 0,
        isClickDown: false
    };
    //获取元素初始的位置
    params.left = getCss(target, "left");
    target.onmousedown = function (e) {
        e.preventDefault();
        params.isClickDown = true;
        //获取鼠标的位置
        params.currentX = e.clientX;
        document.onmousemove = function (e) {
            if (params.isClickDown) {
                //获取鼠标当前的位置
                var curX = e.clientX;
                //计算鼠标移动的距离
                var disX = curX - params.currentX;
                //更新元素的位置
                target.style.left = parseInt(params.left) + disX + "px";

                //设置边界
                var parentWidth = parseInt(getCss(target.parentElement, "width")) - 10;
                var nodeLeft = parseInt(getCss(target, "left"));
                if (nodeLeft > parentWidth) {
                    target.style.left = parentWidth + "px";
                    params.isClickDown = false;
                } else if (nodeLeft <= 0) {
                    target.style.left = 0;
                }
                bar.style.width = parseInt(params.left) + disX + 'px'; //设置声音条
            }
        };
        document.onmouseup = function (e) {
            params.isClickDown = false;
            params.left = getCss(target, "left");
            callback();
            document.onmousemove = null;
        }
    };
}