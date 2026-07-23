const q = encodeURIComponent('二维码生成器')
const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${q}`
try {
  const res = await fetch(url)
  const data = await res.json()
  console.log(data[0][0][0])
} catch (e) {
  console.error(e.message)
}
