import json
import os
import hashlib
import secrets
from typing import Dict, Any
import psycopg2

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Handles user registration and login with email/password
    Args: event with httpMethod, body, path
    Returns: HTTP response with auth token or error
    '''
    method: str = event.get('httpMethod', 'GET')
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
        'Access-Control-Max-Age': '86400'
    }
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action', '')
    
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            if action == 'register' and method == 'POST':
                email = body_data.get('email', '').lower().strip()
                name = body_data.get('name', '').strip()
                password = body_data.get('password', '')
                
                if not email or not name or not password:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'All fields required'})
                    }
                
                if len(password) < 6:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Password must be at least 6 characters'})
                    }
                
                cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cur.fetchone():
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Email already registered'})
                    }
                
                password_hash = hash_password(password)
                verification_token = generate_token()
                
                cur.execute(
                    "INSERT INTO users (email, name, password_hash, verification_token) VALUES (%s, %s, %s, %s) RETURNING id",
                    (email, name, password_hash, verification_token)
                )
                
                user_id = cur.fetchone()[0]
                
                email_service_key = os.environ.get('EMAIL_SERVICE_KEY')
                if email_service_key:
                    pass
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'message': 'Registration successful. Check your email for verification.'
                    })
                }
            
            elif action == 'login' and method == 'POST':
                email = body_data.get('email', '').lower().strip()
                password = body_data.get('password', '')
                
                if not email or not password:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Email and password required'})
                    }
                
                password_hash = hash_password(password)
                
                cur.execute(
                    "SELECT id, name, role, banned FROM users WHERE email = %s AND password_hash = %s",
                    (email, password_hash)
                )
                
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': headers,
                        'body': json.dumps({'error': 'Invalid email or password'})
                    }
                
                user_id, name, role, banned = user
                
                if banned:
                    return {
                        'statusCode': 403,
                        'headers': headers,
                        'body': json.dumps({'error': 'Account is banned'})
                    }
                
                token = generate_token()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'token': token,
                        'name': name,
                        'email': email,
                        'role': role
                    })
                }
            
            elif action == 'verify':
                verification_token = body_data.get('token', '')
                
                if not verification_token:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Verification token required'})
                    }
                
                cur.execute(
                    "UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = %s RETURNING id",
                    (verification_token,)
                )
                
                if cur.fetchone():
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True, 'message': 'Email verified successfully'})
                    }
                else:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Invalid or expired token'})
                    }
    finally:
        conn.close()
    
    return {
        'statusCode': 404,
        'headers': headers,
        'body': json.dumps({'error': 'Endpoint not found'})
    }