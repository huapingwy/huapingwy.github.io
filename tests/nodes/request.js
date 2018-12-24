const http = require('http')
const querystring = require('querystring')
const opts = {
  "hostname": "login.gzyfyy.cn",
  "path": "http://login.gzyfyy.cn/userCenterLogin.jsp?jsoncallback=jQuery17203667751603385123_1545637877905&userName=huaping&password=1DBB46BD624DB53616D8C0979FAC226F&captcha=&autoLogin=false&ptype=md5&forceSafe=true&act=login&_=1545638110081",
  "method": "get",
  "headers": {
    "Content-Type": "text/javascript;charset=utf-8",
    "Accept": "text/html, application/xhtml+xml, */*",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7",
    "Connection": "keep-alive",
    "Cookie": "_clientId=59999c6a41c8481faceb2c2c35cbb107",
    "Host": "login.gzyfyy.cn",
    "Referer": "http://b2b.gzyfyy.cn/_account/login.shtml?target=http%3A%2F%2Fb2b.gzyfyy.cn%2F_shop%2Fdefault%2Findex.shtml",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36"
  },
}


const req = http.request(opts, function (res) {
  res.setEncoding("utf8")
  console.log(`状态码: ${res.statusCode}`);
  res.on('data', (data) => {
    console.log(data)
  })
  req.on('error', (e) => {
    console.error(`请求遇到问题`);
  });
})
req.end()
