const http = require("http")
const url = require('url')
const fs = require('fs')

http.createServer((req, res) =>{
  console.log(req.url)
  res.writeHead(200, {
    "Content-Type": "text/html;charset=UTF-8"
  })

  const fileData = fs.readFileSync('./index.html')
  console.log(fileData)
  res.write(fileData)
  res.end()
}).listen(5000)
