var AlipayConfig = {
    //↓↓↓↓↓↓↓↓↓↓请在这里配置您的基本信息↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
    // 合作身份者ID，以2088开头由16位纯数字组成的字符串
    partner:"2088121068390664",
// 交易安全检验码，由数字和字母组成的32位字符串
    key:"fin1baxgie1cj0zl3djvpmpo5ndwz8yb",
// 签约支付宝账号或卖家收款支付宝帐户
    seller_email:"zyeeda@gmail.com",
// 支付宝服务器通知的页面 要用 http://格式的完整路径，不允许加?id:123这类自定义参数
// 必须保证其地址能够在互联网中访问的到
    notify_url:"http://www.kingnoshop.com",
// 当前页面跳转后的页面 要用 http://格式的完整路径，不允许加?id:123这类自定义参数
// 域名不能写成http://localhost/create_direct_pay_by_user_jsp_utf8/return_url.jsp ，否则会导致return_url执行无效
    return_url:"http://www.kingnoshop.com",
//      支付宝通知验证地址
    ALIPAY_HOST: "mapi.alipay.com",
    HTTPS_VERIFY_PATH: "/gateway.do?service=notify_verify&",
    ALIPAY_PATH:"gateway.do?",
//↑↑↑↑↑↑↑↑↑↑请在这里配置您的基本信息↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
// 调试用，创建TXT日志路径
    log_path:"~/alipay_log_.txt",
// 字符编码格式 目前支持 gbk 或 utf-8
    input_charset:"UTF-8",
// 签名方式 不需修改
    sign_type:"MD5"
};

var AlipayNotify={
    verity:function(params,callback){
        var mysign=getMySign(params);
        var sign = params["sign"]?params["sign"]:"";
        if(mysign==sign){
            var responseTxt = "true";
            if(params["notify_id"]) {
                //获取远程服务器ATN结果，验证是否是支付宝服务器发来的请求
                var partner = AlipayConfig.partner;
                var veryfy_path = AlipayConfig.HTTPS_VERIFY_PATH + "partner=" + partner + "&notify_id=" + params["notify_id"];
                requestUrl(AlipayConfig.ALIPAY_HOST,veryfy_path,function(responseTxt){
                    if(responseTxt){
                        callback(true);
                    }else{
                        callback(false);
                    }
                });
            }
        } else{
            callback(false);
        }
        //写日志记录（若要调试，请取消下面两行注释）
        // String sWord = "responseTxt=" + responseTxt + "\n notify_url_log:sign=" + sign + "&mysign="
        //             + mysign + "\n 返回参数：" + AlipayCore.createLinkString(params);
        // AlipayCore.logResult(sWord);
        //验证
        //responsetTxt的结果不是true，与服务器设置问题、合作身份者ID、notify_id一分钟失效有关
        //mysign与sign不等，与安全校验码、请求时的参数格式（如：带自定义参数等）、编码格式有关
    }
};
//获取验证码
var getMySign = function (params) {
    var sPara=[];//转换为数组利于排序 除去空值和签名参数
    if(!params) return null;
    for(var key in params) {
        if((!params[key])|| key == "sign" || key == "sign_type"){
            console.log('null:'+key);
            continue;
        } ;
        sPara.push([key,params[key]]);
    }
    sPara.sort();
    //生成签名结果
    var prestr = "";
    //把数组所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
    for (var i2 = 0; i2 < sPara.length; i2++) {
        var obj = sPara[i2];
        if (i2 == sPara.length - 1) {
            prestr = prestr + obj[0] + "=" + obj[1];
        } else {
            prestr = prestr + obj[0] + "=" + obj[1] + "&";
        }
    }
    prestr = prestr + AlipayConfig.key;
    var crypto = require('crypto');
    return crypto.createHash('md5').update(prestr, AlipayConfig.input_charset).digest("hex");
};
var requestUrl=function(host,path,callback){
    var https = require('https');
    var options = {
        host: host,
        port: 443,
        path: path,
        method: 'GET'
    };
    var req = https.request(options, function(res) {
        console.log("statusCode: ", res.statusCode);
        console.log("headers: ", res.headers);
        res.on('data', function(d) {
            callback(d);
        });
    });
    req.end();
    req.on('error', function(e) {
        console.error(e);
    });
};
/*
 * GET home page.
 */
exports.index = function (req, res) {
    res.render('index', {layout:false,message:'验证' });
};
/**
 * 在应用中发送付款请求，替换掉构造form的应用
 * @param req
 * @param res
 */
exports.alipayto = function (req, res) {
    var payway = req.body.paymode;
    if (payway == 'alipay') {
    //必填参数//
    //请与贵网站订单系统中的唯一订单号匹配
    var out_trade_no = req.body.goods_id;
    //订单名称，显示在支付宝收银台里的“商品名称”里，显示在支付宝的交易管理的“商品名称”的列表里。
    var subject = req.body.subject;
    //订单描述、订单详细、订单备注，显示在支付宝收银台里的“商品描述”里
    var body = req.body.alibody;
    //订单总金额，显示在支付宝收银台里的“应付总额”里
    var total_fee = req.body.total_fee;
    //扩展功能参数——默认支付方式//
    //默认支付方式，取值见“即时到帐接口”技术文档中的请求参数列表
    var paymethod = "";
    //默认网银代号，代号列表见“即时到帐接口”技术文档“附录”→“银行列表”
    var defaultbank = "";
    //扩展功能参数——防钓鱼//
    //防钓鱼时间戳
    var anti_phishing_key = "";
    //获取客户端的IP地址，建议：编写获取客户端IP地址的程序
    var exter_invoke_ip = "";
    //注意：
    //1.请慎重选择是否开启防钓鱼功能
    //2.exter_invoke_ip、anti_phishing_key一旦被设置过，那么它们就会成为必填参数
    //3.开启防钓鱼功能后，服务器、本机电脑必须支持远程XML解析，请配置好该环境。
    //4.建议使用POST方式请求数据
    //示例：
    //anti_phishing_key = AlipayService.query_timestamp();	//获取防钓鱼时间戳函数
    //exter_invoke_ip = "202.1.1.1";
    //扩展功能参数——其他///
    //自定义参数，可存放任何内容（除=、&等特殊字符外），不会显示在页面上
    var extra_common_param = "";
    //默认买家支付宝账号
    var buyer_email = "";
    //商品展示地址，要用http:// 格式的完整路径，不允许加?id=123这类自定义参数
    var show_url = "http://www.kingnoshop.com";
    //扩展功能参数——分润(若要使用，请按照注释要求的格式赋值)//
    //提成类型，该值为固定值：10，不需要修改
    var royalty_type = "";
    //提成信息集
    var royalty_parameters = "";
    //注意：
    //与需要结合商户网站自身情况动态获取每笔交易的各分润收款账号、各分润金额、各分润说明。最多只能设置10条
    //各分润金额的总和须小于等于total_fee
    //提成信息集格式为：收款方Email_1^金额1^备注1|收款方Email_2^金额2^备注2
    //示例：
    //royalty_type = "10"
    //royalty_parameters	= "111@126.com^0.01^分润备注一|222@126.com^0.01^分润备注二"
    //把请求参数打包成数组
    var sParaTemp = [];
    sParaTemp.push(["payment_type", "1"]);
    sParaTemp.push(["out_trade_no", out_trade_no]);
    sParaTemp.push(["subject", subject]);
    sParaTemp.push(["body", body]);
    sParaTemp.push(["total_fee", total_fee]);
    sParaTemp.push(["show_url", show_url]);
    sParaTemp.push(["paymethod", paymethod]);
    sParaTemp.push(["defaultbank", defaultbank]);
    sParaTemp.push(["anti_phishing_key", anti_phishing_key]);
    sParaTemp.push(["exter_invoke_ip", exter_invoke_ip]);
    sParaTemp.push(["extra_common_param", extra_common_param]);
    sParaTemp.push(["buyer_email", buyer_email]);
    sParaTemp.push(["royalty_type", royalty_type]);
    sParaTemp.push(["royalty_parameters", royalty_parameters]);
    /**
     * 构造即时到帐接口
     * @param sParaTemp 请求参数集合
     * @return 表单提交HTML信息
     */
    var create_direct_pay_by_user = function (sParaTemp) {
        //增加基本配置
        sParaTemp.push(["service", "create_direct_pay_by_user"]);
        sParaTemp.push(["partner", AlipayConfig.partner]);
        sParaTemp.push(["return_url", AlipayConfig.return_url]);
        sParaTemp.push(["notify_url", AlipayConfig.notify_url]);
        sParaTemp.push(["seller_email", AlipayConfig.seller_email]);
        sParaTemp.push(["_input_charset", AlipayConfig.input_charset]);
        /**
         * 构造提交表单HTML数据
         * @param sParaTemp 请求参数数组
         * @param gateway 网关地址
         * @param strMethod 提交方式。两个值可选：post、get
         * @param strButtonName 确认按钮显示文字
         * @return 提交表单HTML文本
         */
        var buildURL= function (sParaTemp) {
            /**
             * 生成要请求给支付宝的参数数组
             * @param sParaTemp 请求前的参数数组
             * @return 要请求的参数数组
             */
            var buildRequestPara = function (sParaTemp) {
                var sPara = [];
                //除去数组中的空值和签名参数
                for (var i1 = 0; i1 < sParaTemp.length; i1++) {
                    var value = sParaTemp[i1];
                    if (value[1] == null || value[1] == "" || value[0] == "sign"
                        || value[0] == "sign_type") {
                        continue;
                    }
                    sPara.push(value);
                }
                sPara.sort();
                //生成签名结果
                var prestr = "";
                //把数组所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
                for (var i2 = 0; i2 < sPara.length; i2++) {
                    var obj = sPara[i2];
                    if (i2 == sPara.length - 1) {
                        prestr = prestr + obj[0] + "=" + obj[1];
                    } else {
                        prestr = prestr + obj[0] + "=" + obj[1] + "&";
                    }
                }
                prestr = prestr + AlipayConfig.key; //把拼接后的字符串再与安全校验码直接连接起来
                var crypto = require('crypto');//加密签名
                var mysign = crypto.createHash('md5').update(prestr, AlipayConfig.input_charset).digest("hex");
                //签名结果与签名方式加入请求提交参数组中
                sPara.push(["sign", mysign]);
                sPara.push(["sign_type", AlipayConfig.sign_type]);
                return sPara;
            };
            //待请求参数数组
            var sPara = buildRequestPara(sParaTemp);
            var path=AlipayConfig.ALIPAY_PATH;
            for (var i3 = 0; i3 < sPara.length; i3++) {
                var obj = sPara[i3];
                var name = obj[0];
                var value = encodeURIComponent(obj[1]);
                if(i3<(sPara.length-1)){
                    path=path+name+"="+value+"&";
                }else{
                    path=path+name+"="+value;
                }
            }
            return path.toString();
        };
        return buildURL(sParaTemp);
    };
    var sURL = create_direct_pay_by_user(sParaTemp);
    console.log(AlipayConfig.ALIPAY_HOST);
    console.log(sURL);
    console.log("https://"+AlipayConfig.ALIPAY_HOST+"/"+sURL);
    res.redirect("https://"+AlipayConfig.ALIPAY_HOST+"/"+sURL);
}
    //微信扫码支付
    else if(payway == 'weixinpay'){
        var parseString = require('xml2js').parseString;
        var qrCode = require('qrcode-npm')
        var request = require('request');

        var result_code = "";
        var code_url = "";
        var err_code_des = "";
        var url = "https://api.mch.weixin.qq.com/pay/unifiedorder";
        var appid = "wxf4e3d339e7d5fbab";
        var mch_id = "1315648201";
        var notify_url = "http://kingnoshop.com";
        var out_trade_no = req.body.goods_id;
        var total_fee = (req.body.total_fee)*100;
        var attach = "微信扫码支付测试";
        var body = "test";
        var nonce_str = "21we21ew21";
        var trade_type = "NATIVE";
        var formData = "<xml>";
        formData += "<appid>"+appid+"</appid>"; //appid
        formData += "<attach>"+attach+"</attach>"; //附加数据
        formData += "<body>"+body+"</body>"; //商品或支付单简要描述
        formData += "<mch_id>"+mch_id+"</mch_id>"; //商户号
        formData += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位
        formData += "<notify_url>"+notify_url+"</notify_url>"; //支付成功后微信服务器通过POST请求通知这个地址
        formData += "<out_trade_no>"+out_trade_no+"</out_trade_no>"; //订单号
        formData += "<total_fee>"+total_fee+"</total_fee>"; //金额
        formData += "<trade_type>"+trade_type+"</trade_type>"; //NATIVE会返回code_url ，JSAPI不会返回
        formData += "<sign>"+paysign(appid, body, attach, mch_id,nonce_str,notify_url, out_trade_no, total_fee,trade_type)+"</sign>";
        formData += "</xml>";
        console.log(formData);
        request(
        {
            url : url,
            method : 'POST',
            body : formData
        }, function (err, response, body)
        {
            if (!err && response.statusCode == 200){
                console.log(body);
                parseString(body, { explicitArray : false, ignoreAttrs : true }, function (err, result) {
                    err_code_des = result.xml.err_code_des;
                    result_code = result.xml.result_code;
                    code_url = result.xml.code_url;
                });
                if (result_code === 'SUCCESS') {
                    var qr = qrCode.qrcode(4, 'M');
                    qr.addData(code_url);
                    qr.make();
                    var qrcodeimg= qr.createImgTag(4);  // creates an <img> tag as text
                    var imgtext = getqrcodeimg(qrcodeimg);
                    res.render('qrcode', {layout: false, qrcodeimg: imgtext});
                } else {
                    res.render('successpay', {layout: false, err_code_des: err_code_des});
                }
            }
        }
        );
    }
};

exports.paynotify=function(req,res){
    //获取支付宝的通知返回参数，可参考技术文档中页面跳转同步通知参数列表(以下仅供参考)//
    var params=req.query;
    //console.log(req.query());
    var trade_no = req.query.trade_no;				//支付宝交易号
    var order_no = req.query.out_trade_no;	        //获取订单号
    var total_fee = req.query.total_fee;	        //获取总金额
    var subject = req.query.subject;//商品名称、订单名称
    var body = "";
    if(req.query.body != null){
        body = req.query.body;//商品描述、订单备注、描述
    }
    var buyer_email = req.query.buyer_email;		//买家支付宝账号
    var trade_status = req.query.trade_status;		//交易状态
    //获取支付宝的通知返回参数，可参考技术文档中页面跳转同步通知参数列表(以上仅供参考)//
    AlipayNotify.verity(params,function(result){
        if(result){
            //请在这里加上商户的业务逻辑程序代码
            //——请根据您的务逻辑来编写程序（以下代码仅作参考）——
            if(trade_status=="TRADE_FINISHED"){
                //判断该笔订单是否在商户网站中已经做过处理
                //如果没有做过处理，根据订单号（out_trade_no）在商户网站的订单系统中查到该笔订单的详细，并执行商户的业务程序
                //如果有做过处理，不执行商户的业务程序
                //注意：
                //该种交易状态只在两种情况下出现
                //1、开通了普通即时到账，买家付款成功后。
                //2、开通了高级即时到账，从该笔交易成功时间算起，过了签约时的可退款时限（如：三个月以内可退款、一年以内可退款等）后。
            } else if (trade_status=="TRADE_SUCCESS"){
                //判断该笔订单是否在商户网站中已经做过处理
                //如果没有做过处理，根据订单号（out_trade_no）在商户网站的订单系统中查到该笔订单的详细，并执行商户的业务程序
                //如果有做过处理，不执行商户的业务程序
                //注意：
                //该种交易状态只在一种情况下出现——开通了高级即时到账，买家付款成功后。
            }
            //——请根据您的业务逻辑来编写程序（以上代码仅作参考）——
            res.end("success");	//请不要修改或删除——
        } else{
            res.end("fail");
        }
    });
};

exports.payreturn=function(req,res){
    //获取支付宝的通知返回参数，可参考技术文档中页面跳转同步通知参数列表(以下仅供参考)//
    var params=req.query;
    var trade_no = req.query.trade_no;				//支付宝交易号
    var order_no = req.query.out_trade_no;	        //获取订单号
    var total_fee = req.query.total_fee;	        //获取总金额
    var subject = req.query.subject;//商品名称、订单名称
    var body = "";
    if(req.query.body != null){
        body = req.query.body;//商品描述、订单备注、描述
    }
    var buyer_email = req.query.buyer_email;		//买家支付宝账号
    var trade_status = req.query.trade_status;		//交易状态
    //获取支付宝的通知返回参数，可参考技术文档中页面跳转同步通知参数列表(以上仅供参考)//
    AlipayNotify.verity(params,function(result){
        //如果成功，插入表记录
        if(result){
            //请在这里加上商户的业务逻辑程序代码
            //——请根据您的业务逻辑来编写程序（以下代码仅作参考）——
            if(trade_status=="TRADE_FINISHED"){
                //判断该笔订单是否在商户网站中已经做过处理
                //如果没有做过处理，根据订单号（out_trade_no）在商户网站的订单系统中查到该笔订单的详细，并执行商户的业务程序
                //如果有做过处理，不执行商户的业务程序
                //注意：
                //该种交易状态只在两种情况下出现
                //1、开通了普通即时到账，买家付款成功后。
                //2、开通了高级即时到账，从该笔交易成功时间算起，过了签约时的可退款时限（如：三个月以内可退款、一年以内可退款等）后。
            } else if (trade_status=="TRADE_SUCCESS"){
                //判断该笔订单是否在商户网站中已经做过处理
                //如果没有做过处理，根据订单号（out_trade_no）在商户网站的订单系统中查到该笔订单的详细，并执行商户的业务程序
                //如果有做过处理，不执行商户的业务程序
                //注意：
                //该种交易状态只在一种情况下出现——开通了高级即时到账，买家付款成功后。
            }
            //——请根据您的业务逻辑来编写程序（以上代码仅作参考）——
            res.end("success");	//请不要修改或删除——
        } else{
            res.end("fail");
        }
    });
};

function getqrcodeimg(qrcodeimg){
    var stringtext =  qrcodeimg;
    var lengths = stringtext.length;
    var srctext = stringtext.substring(10,lengths-28)
    return srctext;
 };

function paysign(appid, body, attach, mch_id,nonce_str,notify_url, out_trade_no, total_fee,trade_type) {
    var sParaTemp = [];
    sParaTemp.push(["appid", appid]);
    sParaTemp.push(["body", body]);
    sParaTemp.push(["attach", attach]);
    sParaTemp.push(["mch_id", mch_id]);
    sParaTemp.push(["nonce_str", nonce_str]);
    sParaTemp.push(["notify_url", notify_url]);
    sParaTemp.push(["out_trade_no", out_trade_no]);
    sParaTemp.push(["total_fee", total_fee]);
    sParaTemp.push(["trade_type", trade_type]);
    var sPara = [];
        //除去数组中的空值和签名参数
        for (var i1 = 0; i1 < sParaTemp.length; i1++) {
            var value = sParaTemp[i1];
            if (value[1] == null || value[1] == "" || value[0] == "sign"
                || value[0] == "sign_type") {
                continue;
            }
            sPara.push(value);
        }
        sPara.sort();
        //生成签名结果
        var prestr = "";
        //把数组所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
        for (var i2 = 0; i2 < sPara.length; i2++) {
            var obj = sPara[i2];
            if (i2 == sPara.length - 1) {
                prestr = prestr + obj[0] + "=" + obj[1];
            } else {
                prestr = prestr + obj[0] + "=" + obj[1] + "&";
            }
        }
    var key = "loAI6aiB9YfW1oKzE8ahfPBa07XSEIOs";
    prestr = prestr + '&key='+key;
    var crypto = require('crypto');
    return crypto.createHash('md5').update(prestr,'utf8').digest('hex').toUpperCase();
};

