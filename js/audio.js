var recorder = null;
var player = null;
var second = 0;
var ly_timer = null;
var auth = false;//录音权限。第一次录音时会去判断
var phone_type = null;
var _this = {};

/**
 * 初始化                    语音转文字时需要mui的ajax，在初始化的时候传入mui对象
 * @param {Object} _mui     mui对象
 */
function init(_mui){
  _this.mui = _mui;

  try{
    document.addEventListener("plusready", function(){
		onPlusReady();
	});
  }catch(e){
    console.log(e.message);
  }

  // 扩展API加载完毕，现在可以正常调用扩展API

  function onPlusReady() {
      recorder = plus.audio.getRecorder();
      plus.android.requestPermissions(
          ["android.permission.RECORD_AUDIO"],
          function (e) {
              if (e.deniedAlways.length > 0) {
                  //权限被永久拒绝
                  // 弹出提示框解释为何需要定位权限，引导用户打开设置页面开启
                  alert("权限被拒绝 " + e.deniedAlways.toString());
                  auth = false;
              }
              if (e.deniedPresent.length > 0) {
                  //权限被临时拒绝
                  // 弹出提示框解释为何需要定位权限，可再次调用plus.android.requestPermissions申请权限
                  alert("权限临时拒绝 " + e.deniedPresent.toString());
                  auth = false;
              }
              if (e.granted.length > 0) {
                  //权限被允许调用依赖获取定位权限的代码
                  auth = true;
              }
          }
      );
  }
}
//判断当前设备
function isAndroidOrIOS() {
    var u = navigator.userAgent, app = navigator.appVersion;
    var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1; //Android终端
    var ua = navigator.userAgent.toLowerCase();
    var isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); // ios终端
    if (isAndroid) {
        // 这个是安卓操作系统
        return 1
    }
    if (isIOS) {
        // 这个是ios操作系统
        return 0
    }
    if (/ipad/i.test(ua)) {
        return 0
    }
}

/**
 * 录音
 * @param {Object} sucFunc  成功回调函数，参数为录音的路径
 * @param {Object} falFunc  失败回调函数，参数为错误信息
 */
function record(sucFunc,falFunc){
  try{
    phone_type = isAndroidOrIOS(); //判断当前设备 安卓1 ios 0
    if (phone_type == 0) {
        //如果是苹果系统直接执行
        recordStart(sucFunc,falFunc);
    } else {
        //安卓系统先判断权限开启与否
        if (auth) {
            recordStart(sucFunc,falFunc);
        } else {
            plus.android.requestPermissions(
                ["android.permission.RECORD_AUDIO"],
                function (e) {
                    if (e.deniedAlways.length > 0) {
                        //权限被永久拒绝
                        // 弹出提示框解释为何需要定位权限，引导用户打开设置页面开启
                        auth = false;
                        falFunc("权限被拒绝 " + e.deniedAlways.toString());
                    }
                    if (e.deniedPresent.length > 0) {
                        //权限被临时拒绝
                        // 弹出提示框解释为何需要定位权限，可再次调用plus.android.requestPermissions申请权限
                        auth = false;
                        falFunc("权限临时拒绝 " + e.deniedPresent.toString());
                    }
                    if (e.granted.length > 0) {
                        //权限被允许调用依赖获取定位权限的代码
                        auth = true;
                        falFunc("申请权限成功，请重新尝试录音");
                    }
                }
            );
        }
    }
  }catch(e){
    falFunc(e.message);
  }
}
//开始录音
function recordStart(sucFunc,falFunc){
  second = 0;
  if (recorder == null) {
      falFunc("录音错误");
      return;
  }
  if(player){
    player.stop(); //停止播放录音
  }
  ly_timer = setInterval(() => {
      second += 100;
  }, 100);
  recorder.record(
      {
          filename: "_doc/audio/",
          samplerate: "16000",
          // format: "amr"
          format: phone_type == 1 ? 'amr' : 'wav'
      },
      function (recordFile) {
          var arr = {
            duration:second,
            url:recordFile
          };
          sucFunc(arr);
          second = 0;
          clearInterval(ly_timer);
      },
      function (e) {
          second = 0;
          falFunc("录音失败: " + e.message);
          clearInterval(ly_timer);
      }
  );
}

/**
 * 语音转文字
 * @param {Object} path 语音的路径
 * @param {Object} sucFunc  成功回调函数，参数为转换出的文字
 * @param {Object} falFunc  失败回调函数，参数为错误信息
 */
function zhuan(path,sucFunc,falFunc){
  try{
    console.log(path);
    _this.mui.ajax("https://openapi.baidu.com/oauth/2.0/token", {
        data: {
            grant_type: "client_credentials",
            client_id: "S71kqg1XPyD4jGqQ7AtAsTf3", //此处为申请语音账户时的 API key
            client_secret: "iOqIE1AHQqeWx2AhsEpgpid1bA9KkVwl" //此处为申请语音账户似的 Secret Key
        },
        dataType: "json", //服务器返回json格式数据
        type: "post", //HTTP请求类型
        timeout: 10000, //超时时间设置为10秒；
        success: function (data) {
            //服务器返回响应，根据响应结果，分析是否登录成功；
            console.log("获取token success----");
            //data.access_token  该值 为可用的 access_token 的值
            Audio2dataURL(path, data.access_token,sucFunc,falFunc);
        },
        error: function (xhr, type, errorThrown) {
            falFunc(errorThrown);
        }
    });
  }catch(e){
    falFunc(e.message);
  }
}
// 录音语音文件转base64字符串
function Audio2dataURL(path, token_val,sucFunc,falFunc) {
    var urlArr;
    console.log(path);
    plus.io.resolveLocalFileSystemURL(path, function (entry) {
        entry.file(
            function (file) {
                var reader = new plus.io.FileReader();
                //urlSize 为 文件的字节 大小
                var urlSize = file.size;
                reader.onloadend = function (e) {
                    //urlStr 的值，为返回转换的base64数据
                    var urlStr = e.target.result;
                    urlArr = urlStr.split(",")[1];

                    //此处调用，发送给百度语引识别的 函数
                    console.log("调用百度");
                    sendBaseUrl(urlArr, urlSize, token_val,sucFunc,falFunc);
                };
                reader.readAsDataURL(file);
            },
            function (e) {
                falFunc("读写出现异常: " + +e.message);
            }
        );
    });
}
// 调用百度语音接口
function sendBaseUrl(speechUrl, urlSize, token_val,sucFunc,falFunc) {
    var loadIndex = "";
    plus.nativeUI.showWaiting("正在加载");
    // var cuid = plus.device.uuid;
    var cuid = guid();
    _this.mui.ajax("https://vop.baidu.com/pro_api", {
        //注意，data内部为json格式，所以，必须是字符串
        data: {
            format: phone_type == 1 ? 'amr' : 'wav', //格式支持pcm（不压缩）、wav（不压缩，pcm编码）、amr（压缩格式）采样率
            rate: "16000", //前方有坑，请绕行：此处文档参数16000，达不到这种高保真音频，故 使用8000
            dev_pid: 80001, //普通话
            channel: 1, //固定写法（声道）
            cuid: cuid, //设备的唯一id
            speech: speechUrl, //base64的音频文件
            len: urlSize, //文件的大小，字节数
            token: token_val //获取到的token值
        },
        headers: {
            "Content-Type": "application/json"
        },
        dataType: "json", //服务器返回json格式数据
        type: "post", //HTTP请求类型
        timeout: 10000, //超时时间设置为10秒；
        success: function (data) {
            //服务器返回响应，根据响应结果，分析是否登录成功；
            console.log("识别ing------");
            console.log(JSON.stringify(data));
            if (data.err_no > 0) {
                if (data.err_no == 3001) {
                    falFunc("音频质量过差: " + data.err_no);
                } else {
                    falFunc("无法识别，请重新录入");
                }
            } else {
                //识别成功 将文字添加到文本框
                console.log('主意转文字')
                sucFunc(data.result[0]);
            }
            plus.nativeUI.closeWaiting();
        },
        error: function (xhr, type, errorThrown) {
            plus.nativeUI.closeWaiting();
            falFunc(errorThrown);
        }
    });
}
//用于生成uuid
function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
function guid() {
    return (
        S4() +
        S4() +
        "-" +
        S4() +
        "-" +
        S4() +
        "-" +
        S4() +
        "-" +
        S4() +
        S4() +
        S4()
    );
}

/**
 * 播放语音
 * @param {Object} path     语音的路径
 * @param {Object} sucFunc  成功回调函数，没有参数
 * @param {Object} falFunc  失败回调函数，参数为错误信息
 */
function play(path,sucFunc,falFunc){
  try{
    if(player){
      player.stop(); //停止播放录音
    }
    player = plus.audio.createPlayer(path);//创建播放的录音
    player.play(
        () => {
            //播放完毕
            sucFunc();
        },
        function (e) {
            falFunc("Audio play error: " + e.message);
        }
    );
  }catch(e){
    falFunc(e.message);
  }
}

/**
 * 停止录音或停止播放录音
 */
function stop(){
  if(recorder){
    recorder.stop();//停止录音
  }
  if(player){
    player.stop(); //停止播放录音
  }
}
var audio = {
  init,
  record,
  zhuan,
  play,
  stop
}
