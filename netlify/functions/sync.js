const { getStore } = require('@netlify/blobs');

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  try {
    const params = event.queryStringParameters || {};
    const code = params.code;
    const action = params.action;

    if (!code || !/^[A-Za-z0-9]{4,20}$/.test(code)) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: '同步码无效 (需 4-20 位字母或数字)' }) };
    }

    const store = getStore('travelos-sync');

    if (action === 'pull' && event.httpMethod === 'GET') {
      const data = await store.get(code, { type: 'json' });
      return { statusCode: 200, headers: CORS, body: JSON.stringify(data || {}) };
    }

    if (action === 'push' && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const payload = {
        orders: Array.isArray(body.orders) ? body.orders : [],
        messages: Array.isArray(body.messages) ? body.messages : [],
        balance: typeof body.balance === 'number' ? body.balance : 5000,
        cards: Array.isArray(body.cards) ? body.cards : [],
        passengers: Array.isArray(body.passengers) ? body.passengers : [],
        profile: body.profile || { nickname: '旅行者', phone: '13800138000' },
        updatedAt: Date.now()
      };
      
      await store.setJSON(code, payload);
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: '未知操作' }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};