#!/usr/bin/env node

// CORS 测试脚本
// 用于测试 Socket.io 服务器的 CORS 配置是否正确

const http = require('http');

console.log('🔍 测试 Socket.io 服务器 CORS 配置...\n');

// 测试配置
const testConfigs = [
  {
    name: 'localhost:3000',
    origin: 'http://localhost:3000',
    url: 'http://localhost:3001/socket.io/?EIO=4&transport=polling'
  },
  {
    name: '127.0.0.1:3000',
    origin: 'http://127.0.0.1:3000',
    url: 'http://localhost:3001/socket.io/?EIO=4&transport=polling'
  },
  {
    name: '健康检查端点',
    origin: 'http://localhost:3000',
    url: 'http://localhost:3001/health'
  }
];

// 执行 HTTP 请求测试
function testRequest(config) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.url);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Origin': config.origin,
        'User-Agent': 'CORS-Test-Script/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const corsHeader = res.headers['access-control-allow-origin'];
        resolve({
          statusCode: res.statusCode,
          corsHeader: corsHeader,
