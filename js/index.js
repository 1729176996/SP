var vm = new Vue({
	el: "#main",
	data() {
	  return {
		url:'',
		apikey:'',
		list:[]
	  };
	},
	methods: {
		init(){
			this.url = 'http://t.yushu.im';
			this.apikey = '0df993c66c0c636e29ecbb5344252a4a';
			this.getData('正在上映');
		},
		getData(type) {
			var _this = this;
			var params = {
				apikey:_this.apikey
			};
			var url = '';
			if(type=='正在上映'){
				url = _this.url + "/v2/movie/in_theaters";
			}else if(type=='即将上映'){
				url = _this.url + "/v2/movie/coming_soon";
			}else if(type=='Top250'){
				url = _this.url + "/v2/movie/top250";
			}else if(type=='口碑榜'){
				url = _this.url + "/v2/movie/weekly";
			}else if(type=='北美票房榜'){
				url = _this.url + "/v2/movie/us_box";
			}else if(type=='新片榜'){
				url = _this.url + "/v2/movie/new_movies";
			}else{
				return;
			}
			try{
				plus.nativeUI.showWaiting("正在加载...");
			}catch(e){
				console.log(e.message);
			}
			_this.list = [];
			axios.get(url,{params}).then(function (data) {
				try{
					plus.nativeUI.closeWaiting();
				}catch(e){
					console.log(e.message);
				}
				if(data&&data.data){
					if(data.data.subjects&&data.data.subjects.length>0){
						_this.list = data.data.subjects;
					}else{
						_this.list = [];
					}
				}else{
					mui.toast('查询失败');
				}
		
		    
			});
		}
	},
	beforeCreate() {
	  document.addEventListener("plusready", function(){
		  
	  }, false);
	},
	created() {
		
	},
	mounted() {
	  this.init();
	}
})