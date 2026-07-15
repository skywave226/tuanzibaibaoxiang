export default {
  name: 'JWT 调试',
  path: '/jwt-debugger',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4h2M7 4l-3 3m13 9v8h-2m2 0l3-3"/></svg>',
  description: '解码 JWT Token，查看 Header/Payload/Signature，检查过期时间与 alg:none 风险',
  category: 'API 测试',
  keywords: ['jwt', 'token', 'json web token', '调试'],
}
