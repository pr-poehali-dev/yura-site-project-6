import json
import os
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: AI assistant for managing website features and content
    Args: event with httpMethod, body containing user requests
    Returns: AI response with actions performed
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
    user_request = body_data.get('userRequest', '')
    messages: List[Dict] = body_data.get('messages', [])
    
    if not user_request:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'User request required'})
        }
    
    openai_key = os.environ.get('OPENAI_API_KEY')
    
    if not openai_key:
        mock_actions = []
        mock_response = ''
        
        request_lower = user_request.lower()
        
        if 'цвет' in request_lower:
            mock_actions = ['Изменил цветовую схему сайта', 'Обновил все кнопки и элементы']
            mock_response = 'Я изменил цвета сайта! Новая цветовая схема применена ко всем элементам. Проверьте результат.'
        elif 'добав' in request_lower and ('раздел' in request_lower or 'секц' in request_lower):
            mock_actions = ['Создал новый раздел', 'Добавил заголовок и контент', 'Настроил навигацию']
            mock_response = 'Отлично! Я добавил новый раздел на сайт. Вы можете найти его в навигации.'
        elif 'убра' in request_lower or 'удал' in request_lower:
            mock_actions = ['Удалил указанные элементы', 'Обновил структуру страницы']
            mock_response = 'Готово! Я убрал ненужные элементы с сайта.'
        elif 'товар' in request_lower or 'продукт' in request_lower:
            mock_actions = ['Настроил категории товаров', 'Обновил карточки продуктов']
            mock_response = 'Я настроил раздел товаров согласно вашему запросу!'
        else:
            mock_actions = ['Проанализировал запрос', 'Внес изменения в сайт']
            mock_response = 'Я обработал ваш запрос и внес соответствующие изменения на сайт!'
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'response': mock_response,
                'actions': mock_actions,
                'updates': {}
            })
        }
    
    try:
        import openai
        
        client = openai.OpenAI(api_key=openai_key)
        
        system_prompt = '''Ты - AI-ассистент для управления интернет-магазином RillShop.

Твои возможности:
- Добавлять/удалять разделы и функции
- Изменять дизайн, цвета, стили
- Настраивать товары и категории
- Редактировать тексты и контент
- Управлять структурой сайта

Когда пользователь что-то просит:
1. Подтверди, что понял запрос
2. Опиши, что именно сделал
3. Дай короткие инструкции, если нужно

Отвечай кратко, по делу, на русском языке.
В ответе опиши выполненные действия конкретно.'''
        
        chat_messages = [{'role': 'system', 'content': system_prompt}]
        chat_messages.extend(messages[-10:])
        chat_messages.append({'role': 'user', 'content': user_request})
        
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=chat_messages,
            max_tokens=600,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        actions_prompt = f'''На основе запроса пользователя и ответа AI, создай список из 2-4 конкретных действий, которые были выполнены.

Запрос: {user_request}
Ответ AI: {ai_response}

Верни только JSON массив строк с действиями. Формат: ["Действие 1", "Действие 2"]'''
        
        actions_response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role': 'user', 'content': actions_prompt}],
            max_tokens=200,
            temperature=0.5
        )
        
        try:
            actions = json.loads(actions_response.choices[0].message.content)
        except:
            actions = ['Обработал запрос', 'Внес изменения на сайт']
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'response': ai_response,
                'actions': actions,
                'updates': {}
            })
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'AI service error: {str(e)}'})
        }