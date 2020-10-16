/**
 * 录像
 * @param {Object} successCB  成功回调函数，参数为录像本地路径
 * @param {Object} errorCB    失败回调函数，参数为错误信息
 */
function record(successCB,errorCB){
	try{
		var c = plus.camera.getCamera();
		var res = c.supportedVideoResolutions[0];
		var fmt = c.supportedVideoFormats[0];
		c.startVideoCapture(function(e) {
			plus.io.resolveLocalFileSystemURL(e, function(entry) {
				successCB(entry.toLocalURL());
			}, function(e) {
				errorCB(e.message);
			});
		}, function(s) {
			errorCB(s);
		}, {
			filename: "_doc/" + new Date().getTime(),
			format: fmt,
			resolution: res,
			videoMaximumDuration: 10
		})
	}catch(e){
	  errorCB(e.message);
	}
}
/**
 * 拍照
 * @param {Object} successCB  成功回调函数，参数为图片本地路径
 * @param {Object} errorCB    失败回调函数，参数为错误信息
 */
function paizhao(successCB,errorCB){//拍照
  try{
    //调用相机 ,获取设备默认的摄像头对象
    var cmr = plus.camera.getCamera();
    //进行拍照操作 cmr.captureImage(successCB, errorCB, options);
    //successCB: ( CameraSuccessCallback ) 必选 拍照操作成功的回调函数
    //errorCB: ( CameraErrorCallback ) 可选 拍照操作失败的回调函数
    //options: ( CameraOptions ) 必选 摄像头拍照参数
    cmr.captureImage(
      function (p) {
        //成功调用的回调函数
        //通过URL参数获取目录对象或文件对象 plus.io.resolveLocalFileSystemURL( url, succesCB, errorCB );
        //url : ( DOMString ) 必选 要操作文件或目录的URL地址
        //succesCB: ( FileResolveSuccessCallback ) 必选 获取操作文件或目录对象成功的回调函数
        //errorCB: ( FileErrorCallback ) 可选 获取操作文件或目录对象失败的回调函数
        plus.io.resolveLocalFileSystemURL(
          p,
          function (entry) {
            successCB(entry.toLocalURL());
          },
          function (e) {
            errorCB(e.message);
          }
        );
      },
      function (e) {
        errorCB(e.message);
      },
      {
        filename: "_doc/camera/",
        index: 1
      }
    );
  }catch(e){
    errorCB(e.message);
  }
}
/**
 * 调用相册获取文件
 * @param {Object} type       可选择的文件类型  'image'图片 'video'视频 'none'所有文件
 * @param {Object} multiple   是否多选 true多个 false单个
 * @param {Object} successCB  成功回调函数，参数为图片本地路径(单选)或图片本地路径数组(多选)
 * @param {Object} errorCB    失败回调函数，参数为错误信息
 */
function xiangce(type,multiple,successCB,errorCB){
  try{
    plus.gallery.pick(
      function (p) {
        if(multiple){
          successCB(p.files);
        }else{
          plus.io.resolveLocalFileSystemURL(p, function (entry) {
            successCB(entry.toLocalURL());
          }, function (e) {
            errorCB(e.message);
          });
        }
      },
      function (e) {
        errorCB(e.message);
      },
      {
        filename: "_doc/camera/",
        filter: type,
        multiple: multiple
      }
    );
  }catch(e){
    errorCB(e.message);
  }
}
/**
 * 初始化，要使用上传组件必须调用本方法，不然plus会报错
 * @param {Object} func 初始化函数，可以不传或传null，初始化要额外执行的代码
 */
function init(func){
  document.addEventListener("plusready",function(){
    if(func){
      func();
    }
  });
}
/**
 * 上传图片
 * @param {Object} upload_url   上传接口
 * @param {Object} method       接口类型，'POST'或'GET'
 * @param {Object} params       其他参数，对象类型，比如{'name':'2222'}
 * @param {Object} img_src      图片路径
 * @param {Object} img_key      图片对应的参数名
 * @param {Object} successCB    成功回调函数，参数为接口返回信息
 * @param {Object} errorCB      失败回调函数，参数为失败信息
 */
function uploadImg(upload_url,method,params,img_src,img_key,successCB,errorCB){
  try{
    let width = 0;
    let height = 0;
    var task = plus.uploader.createUpload(
      upload_url,
      {
        method:method
      },
      function (t, status) {
        console.log('t',t);
        // 上传完成
        let res = null;
        try{
          console.log(JSON.parse(t.responseText));
          res = JSON.parse(t.responseText);
        }catch(e){
          errorCB(t.responseText);
          return;
        }
        if (status == 200) {
          successCB(res);
        }else{
          errorCB(t);
        }
      }
    );
    var images = new Image();
    images.onload = function () {
      let w = images.width;
      let h = images.height;
      if (w > 1600 && h < 1600) {
        width = 1600
        height = 1600 / w * h
      } else if (h > 1600 && w < 1600) {
        height = 1600
        width = 1600 / h * w
      } else if (h < 1600 && w < 1600) {
        width = w
        height = h
      } else if (h > 1600 && w > 1600) {
        if (w > h) {
          width = 1600
          height = 1600 / w * h
        } else {
          width = 1600 / h * w
          height = 1600
        }
      }
      plus.zip.compressImage({
        src: img_src,
        dst: 'compresspic/' + img_src,
        overwrite: true,
        quality: 70,
        width: width + 'px',
        height: height + 'px',
        //quality:取值范围为1-100，1表示使用最低的图片质量（转换后的图片文件最小）、100表示使用最高的图片质量（转换后的图片文件最大）； 默认值为50
      },
      function (event) {
        var param = {};
        task.addFile(event.target, {
          // "ly_file": ly_file
          key: img_key
        }); //上传的录音文件
        for(var key in params){
          task.addData(key+'', params[key]+'');
        }
        task.start();
      },
      function (error) {
        errorCB('图片压缩失败' + error);
      });
    }
    images.src = img_src;//放在前面ios 可能不支持
  }catch(e){
    errorCB(e.message);
  }
}
/**
 * 上传视频
 * @param {Object} upload_url   上传接口
 * @param {Object} method       接口类型，'POST'或'GET'
 * @param {Object} params       其他参数，对象类型，比如{'name':'2222'}
 * @param {Object} filepath     视频路径
 * @param {Object} file_key     视频对应的参数名
 * @param {Object} successCB    成功回调函数，参数为接口返回信息
 * @param {Object} errorCB      失败回调函数，参数为失败信息
 */
function uploadVideo(upload_url,method,params,filepath,file_key,successCB,errorCB) {
	try{
	  var task = plus.uploader.createUpload(upload_url, {
	  		method: method,
	  		blocksize: 52428800
	  	},
	  	function(t, status) {
        console.log(t);
	  		// 上传完成
	  		if (status == 200) {
	        successCB(t.responseText);
	  		} else {
	  			var errmsg = "";
	  			if (status == 413) {
	  				errmsg = "文件过大！";
	  			} else {
	  				errmsg = status;
	  			}
	        errorCB("网络异常");
	  		}
	  	}
	  );
	  //filepath上传的视频文件路径
	  task.addFile(filepath, {
	  	key: file_key
	  });
	  for(var key in params){
	    task.addData(key+'', params[key]+'');
	  }
	  task.start();
	}catch(e){
	  errorCB(e.message);
	}
}
var upload = {
  record,
  paizhao,
  xiangce,
  init,
  uploadImg,
  uploadVideo
}
