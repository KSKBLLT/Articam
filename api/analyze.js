// Vercel Serverless Function для анализа артефактов через Claude API
export default async function handler(req, res) {
  // CORS headers - обязательны для работы с фронтендом
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS request для CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Только POST разрешен
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    const { imageData, mediaType } = req.body;

    // Валидация входных данных
    if (!imageData || !mediaType) {
      return res.status(400).json({
        error: 'Missing data',
        message: 'imageData and mediaType are required'
      });
    }

    // Отправка запроса к Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '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',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageData
              }
            },
            {
              type: 'text',
              text: `Ты археолог-эксперт. Проанализируй этот артефакт детально. Ответь ТОЛЬКО в JSON формате без дополнительного текста:

{
  "name": "Название артефакта",
  "period": "Исторический период",
  "culture": "Культура",
  "material": "Материал",
  "age": "Возраст",
  "type": "Тип",
  "condition": "Состояние",
  "temperature": "Температура хранения",
  "humidity": "Влажность",
  "light": "Световой режим",
  "handling": "Обращение",
  "notes": "Примечания"
}`
            }
          ]
        }]
      })
    });

    // Проверка ответа Claude API
    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      return res.status(claudeResponse.status).json({
        error: 'Claude API error',
        message: errorText,
        status: claudeResponse.status
      });
    }

    // Парсинг ответа
    const data = await claudeResponse.json();
    
    // Возврат данных клиенту
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
