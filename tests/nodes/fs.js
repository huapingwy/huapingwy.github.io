const fs = require('fs');

var obj = {
  a: 1,
  b: 2,
  c: 3
}

fs.writeFile('path.json', JSON.stringify(obj, undefined, 2), function (err) {
  if (err) new Error;
  console.log('保存成功')
});
