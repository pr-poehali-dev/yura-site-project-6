import json
import os
from typing import Dict, Any, List
import psycopg2

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: AI chatbot support for customer questions
    Args: event with httpMethod, body containing user messages
    Returns: AI response with helpful answer
    '''
    method: str = event.get('httpMethod', 'GET')
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
        'Access-Control-Max-Age': '86400'
    }
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    user_message = body_data.get('userMessage', '')
    user_name = body_data.get('userName', 'Пользователь')
    messages: List[Dict] = body_data.get('messages', [])
    
    if not user_message:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'User message required'})
        }
    
    openai_key = os.environ.get('OPENAI_API_KEY')
    
    if not openai_key:
        default_responses = {
            'оформить заказ': f'Привет, {user_name}! Для оформления заказа:\n1. Добавьте товары в корзину\n2. Нажмите на иконку корзины\n3. Выберите способ оплаты\n4. Нажмите "Оплатить"',
            'оплат': 'Мы принимаем: банковские карты, СБП и PayPal. Все платежи защищены.',
            'возврат': 'Вы можете вернуть товар в течение 14 дней с момента покупки. Обратитесь в поддержку с номером заказа.',
            'доставк': 'Доставка осуществляется в течение 1-3 рабочих дней. Бесплатная доставка от 1000₽.'
        }
        
        user_message_lower = user_message.lower()
        response_text = 'Извините, я не могу ответить на этот вопрос. Обратитесь к администратору.'
        
        for keyword, response in default_responses.items():
            if keyword in user_message_lower:
                response_text = response
                break
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'response': response_text})
        }
    
    try:
        import openai
        
        client = openai.OpenAI(api_key=openai_key)
        
        system_prompt = f'''Ты - дружелюбный AI-ассистент поддержки интернет-магазина RillShop (игровая энергия).

Твои задачи:
- Отвечать на вопросы о товарах, оплате, доставке
- Помогать с оформлением заказов
- Решать проблемы клиентов
- Быть вежливым и полезным

Информация о магазине:
- Товары: игровая энергия (300-1300₽)
- Оплата: карты, СБП, PayPal
- Доставка: 1-3 дня, бесплатно от 1000₽
- Возврат: 14 дней

Отвечай кратко, по делу, на русском языке.'''
        
        chat_messages = [{'role': 'system', 'content': system_prompt}]
        chat_messages.extend(messages[-10:])
        chat_messages.append({'role': 'user', 'content': user_message})
        
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=chat_messages,
            max_tokens=500,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        dsn = os.environ.get('DATABASE_URL')
        if dsn:
            try:
                conn = psycopg2.connect(dsn)
                conn.autocommit = True
                cur = conn.cursor()
                cur.execute(
                    "INSERT INTO ai_chat_history (user_email, chat_type, message, role) VALUES (%s, %s, %s, %s)",
                    (user_name, 'support', user_message, 'user')
                )
                cur.execute(
                    "INSERT INTO ai_chat_history (user_email, chat_type, message, role) VALUES (%s, %s, %s, %s)",
                    (user_name, 'support', ai_response, 'assistant')
                )
                cur.close()
                conn.close()
            except:
                pass
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'response': ai_response})
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'AI service error: {str(e)}'})
        }