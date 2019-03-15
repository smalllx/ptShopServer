var express = require('express')
var router = express.Router();
var mongoose = require('mongoose')
var url = require('url')
//创建连接
var Baseurl = "mongodb://localhost:27017/ptShop";
mongoose.connect(Baseurl,{ useNewUrlParser: true })
//接听连接
mongoose.connection.once("open",function(){
	console.log("数据库连接成功~")
})
mongoose.connection.once("close",function(){
	console.log("数据库断开连接~")
})

//创建用户表
var Schema = mongoose.Schema;
var userSchema = new Schema({
	name:String,
	pwd:String,
	goods:[{goodsId:String,num:Number}],
	buy:Array,
	address:[{name:String,tel:String,add:String,select:{type:Boolean,default:false}}]
})
var UserModel = mongoose.model('user',userSchema);

//创建商品列表
var goodsListSchema = new Schema({
	introduct:String,
	price:{type:Number},
	url:String,
	goodsid:String
})
var GoodsListModel = mongoose.model('goodsList',goodsListSchema);

//创建商品详情列表
var goodsDetailSchema = new Schema({
	introduct:String,
	price:Number,
	url:String,
	borned:String,
	attr:Array,
	comments:Array,
	sale:{type:Number,default:0},
	addTime:String,
	total:Number,
	goodsid:String
})
var GoodsDetailModel = mongoose.model('goodsDetail',goodsDetailSchema);
//创建商品订单列表
var orderListSchema = new Schema({
	user:String,
	name:String,
	goodsid:String,
	goodsname:String,
	orderid:String,
	num:{type:Number},
	address:String,
	tel:String,
	img:String,
})
var OrderListModel = mongoose.model('orderList',orderListSchema);
//请求响应
//获取商品列表
router.get('/', function(req, res) {
	GoodsListModel.find({},function(err,docs){
		if(!err){
			res.send(docs)
		}
	})
})
//根据商品id 获取商品详情
router.post('/goodsdetail', function(req, res) {
	GoodsDetailModel.find({goodsid:req.body.goodsid},function(err,docs){
		if(!err){
			res.send(docs[0])
		}
	})
})
//根据商品id 进行评论
router.post('/goodscom', function(req, res) {
	GoodsDetailModel.updateOne({goodsid:req.body.goods},{$push:{"comments":[{"user":req.body.user,"say":req.body.say,"sayTime":req.body.date}]}},function(err){
		if(!err){
			res.send({msg:'ok'})
		}
	})
})
//根据账号密码判断用户登录
router.post('/user', function(req, res) {
	UserModel.findOne({name:req.body.user,pwd:req.body.pwd},function(err,doc){
		if(!err){
			if(doc){
				res.send({msg:'ok'})
			}else{
				res.send({msg:'none'})
			}
		}
	})
})
//根据账号密码注册用户
router.post('/reguser', function(req, res) {
	UserModel.findOne({name:req.body.user},function(err,doc){
		if(!err){
			if(doc){
				res.send({msg:'fail'})
			}else{
				UserModel.create({name:req.body.user,pwd:req.body.pwd},function(err){
					if(!err){
						res.send({msg:'ok'})
					}
				})
			}
		}
	})
})
//添加或追加购物车
router.post('/addgoods', function(req, res) {
	var user = req.body.user;
	var goodsid = req.body.goodsid;
	var number = req.body.num;
	UserModel.findOne({name:req.body.user},function(err,doc){
		if(!err){
			var incart = false; //是否存在购物车标记
			if(doc.goods){
				doc.get('goods').forEach(item => {
					if(item.goodsId == goodsid){
						incart = true;
						item.num += number;
						doc.save( err => {
							if(!err){
								res.send({msg:"ok"})
							}
						})
					}
				})
				if(!incart){
					UserModel.updateOne({name:req.body.user},{$push:{goods:{goodsId:req.body.goodsid,num:req.body.num}}},function(err){
						if(!err){
							res.send({msg:"ok"})
						}
					})				
				}
			}else{
				UserModel.updateOne({name:req.body.user},{$push:{goods:{goodsId:req.body.goodsid,num:req.body.num}}},function(err){
					if(!err){
						res.send({msg:"ok"})
					}
				})		
			}
		}
	})
})
//查看购物车商品
router.post('/goodscar', function(req, res) {
	UserModel.findOne({name:req.body.user},function(err,doc){
		if(!err){
			var gsum = [];
			var gnum = [];
			if(doc.goods){
				doc.goods.forEach((item,index) => {
					GoodsDetailModel.findOne({goodsid:item.goodsId},function(err,goods){
						if(!err){
							if(goods){
								gsum.push(goods)
								gnum.push(item.num)
							}
							else{
								// console.log("f")
								gsum.push({goodsid:item.goodsId,price:0,introduct:"该商品已下架！",url:'../static/img/notIn.png'})
								gnum.push(item.num)
							}
							if(doc.goods.length == (index+1)){
								res.send({msg:"ok",goods:gsum,goodsnum:gnum})
							}
						}
					})
				})
			}else{
				res.send({msg:"ok",goods:gsum,goodsnum:gnum})
			}
		}
	})
})
//根据id删除购物车商品
router.post('/deletegoods', function(req, res) {
	UserModel.updateOne({name:req.body.user},{$pull:{goods:{goodsId:req.body.goodsid}}},function(err){
		if(!err){
			res.send({msg:"ok"})
		}
	})
})
//获取用户购物车商品总数
router.post('/goodstotal', function(req, res) {
	UserModel.findOne({name:req.body.user},function(err,doc){
		if(!err){
			var sum = 0;
			if(doc.goods){
				doc.goods.forEach(item => {
					sum += item.num;
				})
			}
			res.send({msg:"ok",total:sum})
		}
	})
})
//切换收货地址
router.post('/configadd', function(req, res) {
	UserModel.findOne({name:req.body.user},function(err,doc){
		if(!err){
			doc.address.forEach(item => {
				if(item.add == req.body.add){
					item.select = true;
				}else{
					item.select = false;
				}
			})
			doc.save(function(err){
				if(!err){
					res.send({msg:"ok"})
				}
			});
		}
	})
})
//新增收货地址
router.post('/newadd', function(req, res) {
	var name = req.body.name;
	var tel = req.body.tel;
	var add = req.body.add;
	UserModel.updateOne({name:req.body.user},{$push:{address:[{name:name,tel:tel,add:add}]}},function(err){
		if(!err){
			res.send({msg:"ok"})
		}
	})
})
//删除收货地址
router.post('/adddlt', function(req, res) {
	UserModel.updateOne({name:req.body.user},{$pull:{address:{_id:req.body.addid}}},function(err){
		if(!err){
			res.send({msg:"ok"})
		}
	})
})
//购买商品
router.post('/buygoods', function(req, res) {
	var goods = req.body.buy;
	var name = req.body.user;
	var nums = req.body.nums;
	goods.forEach((item,index) => {
		UserModel.updateOne({name:name},{$addToSet:{"buy":item},$pull:{goods:{goodsId:item}}},function(err){
			if(!err){
				GoodsDetailModel.updateOne({goodsid:item},{$inc:{sale:nums[index]}},function(err){
					if(!err){
						if(nums.length-1 == index){
							res.send({msg:'ok'})
						}
					}
				})
			}
		})
	})
})
//创建订单列表
router.post('/order', function(req, res) {
	var user = req.body.user;
	var address = req.body.address;
	var buy = req.body.buy;
	var num = req.body.nums;
	var imgs = req.body.imgs;
	var goodsname = req.body.goodsname;
	buy.forEach((item,index) => {
		OrderListModel.create({
			user:user,
			name:address.name,
			tel:address.tel,
			address:address.add,
			orderid:req.body.orderid,
			goodsid:item,
			num:num[index],
			goodsname: goodsname[index],
			img:imgs[index]
		},function(err){
			if(!err){
				if(buy.length == (index+1)){
					res.send({msg:"ok"})
				}
			}
		})
	})
})
//根据搜索关键词进行模糊查询
router.post('/searchgoods', function(req, res) {
	GoodsListModel.find({introduct:{'$regex': req.body.key, $options: '$i'}},function(err,docs){
		if(!err){
			var titleSum = [];
			docs.forEach((item,index) => {
				titleSum.push(item)
				if(docs.length == (index+1)){
					res.send({msg:"ok",goodslist:titleSum})
				}
			})
		}
	})
})
//admin 操作
//查询
router.post('/admin', function(req, res) {
	GoodsDetailModel.find({},function(err,docs){
		if(!err){
			res.send(docs)
		}
	})
})
//新增商品
router.post('/adminadd', function(req, res) {
	var attr = req.body.attr.split(',');
	var goodsid = new Date().getTime();
	GoodsDetailModel.create({"goodsid":goodsid,
							"url":req.body.url,
							"attr":attr,
							"total":req.body.total,
							"borned":req.body.borned,
							"price":req.body.price,
							"addTime":req.body.addTime,
							"sale":0,
							"introduct":req.body.introduct},function(err){
		if(!err){
			GoodsListModel.create({ "goodsid":goodsid,
									"introduct":req.body.introduct,
									"url":req.body.url,
									"price":req.body.price},function(err2){
				if(!err2){
					res.send({msg:"ok"})
				}else{
					res.send({msg:"failed"})
				}
			})
		}else{
			res.send({msg:"failed"})
		}
	})
})
//根据id删除商品
router.post('/admindelete', function(req, res) {
	GoodsDetailModel.deleteOne({goodsid:req.body.goodsid},function(err){
		if(!err){
			GoodsListModel.deleteOne({goodsid:req.body.goodsid},function(err){
				if(!err){
					res.send({msg:"ok"})
				}
			})
		}
	})
})
//根据id修改商品信息
router.post('/adminedit', function(req, res) {
	var attr = req.body.attr.split(',');
	// console.log(attr);
	// console.log(req.body.attr)
	GoodsDetailModel.updateOne({goodsid:req.body.goodsid},{$set:{
		attr:attr,
		price:req.body.price,
		borned:req.body.borned,
		url:req.body.url,
		total:req.body.total
	}},function(err){
		if(!err){
			GoodsListModel.updateOne({goodsid:req.body.goodsid},{$set:{
			price:req.body.price,
			url:req.body.url,}},function(err){
				if(!err){
					res.send({"msg":"ok"})
				}
			})
		}
	})
})
// admin 获取top5
router.post('/chartdata', function(req, res) {
	var xdata = [];
	var seriesD = [];
	GoodsDetailModel.find({},{sale:1,introduct:1},{sort:{sale:-1},limit:5},function(err,docs){
		if(!err){
			docs.forEach(item => {
				xdata.push(item.introduct);
				seriesD.push(item.sale)
			})
			res.send({xdata:xdata,seriesD:seriesD})
		}
	})
})
//获取订单列表
router.post('/adminorderlist', function(req, res) {
	OrderListModel.find({},function(err,docs){
		if(!err){
			res.send({varList:docs,msg:"ok"})
		}
	})
})
//用户获取个人订单列表
router.post('/userorderlist', function(req, res) {
	OrderListModel.find({user:req.body.user},function(err,docs){
		if(!err){
			res.send({varList:docs,msg:"ok"})
		}
	})
})
//根据用户名、goodsid、orderid确认订单
router.post('/admindeleteorder', function(req, res) {
	var user = req.body.user;
    var goodsid = req.body.goodsid;
    var orderid = req.body.orderid;
	OrderListModel.deleteOne({user:user,goodsid:goodsid,orderid:orderid},function(err){
		if(!err){
			res.send({msg:"ok"})
		}
	})
})
//根据用户名获取收货地址
router.post('/getadd', function(req, res) {
	UserModel.findOne({name:req.body.user},function(err,doc){
		if(!err){
			res.send({varList:doc.address})
		}
	})
})
//获取用户列表
router.post('/getuser', function(req, res) {
	UserModel.find({},function(err,docs){
		if(!err){
			res.send({varList:docs,msg:"ok"})
		}
	})
})
//根据用户名注销用户
router.post('/admindeleteuser', function(req, res) {
	UserModel.deleteOne({name:req.body.name},function(err){
		if(!err){
			res.send({msg:"ok"})
		}
	})
})
module.exports = router;