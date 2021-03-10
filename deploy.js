#!/usr/bin/env node

/**
 * @author jiangtao
 * @description 定时生成readme
 */

const request = require('request')
const fs = require('fs')
const path = require('path')
const execSync = require('child_process').execSync


function fetch(opts) {
  return new Promise(function (resolve,reject) {
    request(opts,function (err,res,body) {
      if (err) {
        reject(err)
        return
      }

      const data = JSON.parse(body)
      if (data.message === 'Not Found') {
        reject(new Error(`${api} is not found`))
      } else {
        resolve(data)
      }
    })
  })
}

function writeFile(path, content) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(path, content, function(err) {
      if(err) {
        reject(err)
        return
      }

      resolve()
    })
  })
}

function generateReadme(list) {

  let content = ''

  if(list.length) {
    content = [
      '## 群里的招聘信息',
      ''
    ].concat(list.map(function(item, index) {
      return `${index + 1}. [${item.title}](${item.html_url})`
    })).join('\n')
  }

  const input = `# 内推那点事
-----
## 声明

本repo创建，为了方便 【内推那点事】群里朋友招人。请创建issue自觉遵守格式，方便定时同步到 neitui-sth 公众号。如招聘结束，请关闭issue

由于放到 github 上，如果 邮箱，姓名等信息比较私密，请使用 专用招聘邮箱，昵称等。

${content}

## 微信群

内推那点事，加群请扫下列二维码

![内推那点事](./img/wechat.png)

为证明您是互联网从业者，请出示 github，个人博客，公众号 等。


## 公众号

微信搜索 neitui-sth ，点击关注。希望您招人/找工作 更简单，高效。
  `

  return writeFile(path.resolve(process.cwd(), './README.md'), input).then(function() {
    console.log('generate successfully')
  })
}


fetch({
  url: 'https://api.github.com/repos/neitui/jobs/issues',
  method: 'GET',
  headers: {
    'User-Agent': 'neitui/jobs'
  }
}).then(function (data) {
  const list = data.filter(function(item){ return item.state === 'open' })
  return generateReadme(list.filter(issue => !issue.pull_request && issue.user.type !== 'Bot'))
}).then(function() {
  const diff = execSync('git diff').toString()
  if(diff){
    execSync('git add .')
    execSync('git commit -m "docs: update jobs"')
    execSync('git push -u origin master')
  }
}).catch(function(err){
  if(err) {
    console.log(err)
  }
})
