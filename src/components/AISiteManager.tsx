import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: string[];
};

type AISiteManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSiteUpdate: (updates: any) => void;
};

const AISiteManager = ({ open, onOpenChange, onSiteUpdate }: AISiteManagerProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Привет! 🚀 Я AI-помощник для управления вашим сайтом. 

Я могу помочь вам:
• Добавить новые разделы и функции
• Изменить дизайн и цвета
• Убрать ненужные элементы
• Настроить товары и категории
• Изменить тексты и изображения

Просто опишите, что хотите изменить!`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/site-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          userRequest: input
        })
      });

      const data = await response.json();

      if (response.ok) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          actions: data.actions
        };
        setMessages(prev => [...prev, aiMessage]);

        if (data.updates) {
          onSiteUpdate(data.updates);
        }
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось обработать запрос',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Проблема с подключением к AI',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const quickCommands = [
    '💡 Добавь раздел "О нас"',
    '🎨 Измени цвета на синие',
    '➕ Добавь новую категорию товаров',
    '🗑️ Убери лишние кнопки',
    '📝 Измени главный заголовок',
    '🖼️ Добавь галерею изображений'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[700px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="relative">
              <Icon name="Sparkles" size={24} className="text-primary" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            AI Управление Сайтом
            <Badge variant="secondary" className="ml-2">
              <Icon name="Zap" size={12} className="mr-1" />
              Готов к работе
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Опишите, что хотите добавить или изменить на сайте
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground px-4 py-3'
                      : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name="Sparkles" size={16} className="text-primary" />
                          <span className="text-sm font-medium">AI Ассистент</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Выполненные действия:</p>
                            <div className="space-y-1">
                              {message.actions.map((action, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <Icon name="CheckCircle2" size={12} className="text-green-500" />
                                  <span>{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  {message.role === 'user' && (
                    <>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Icon name="Loader2" size={16} className="animate-spin text-primary" />
                      <span className="text-sm">AI анализирует запрос и вносит изменения...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {messages.length === 1 && (
          <div className="px-6 py-3 border-t border-b bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Примеры команд:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickCommands.map((cmd) => (
                <Button
                  key={cmd}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(cmd.split(' ').slice(1).join(' '))}
                  className="justify-start text-left h-auto py-2"
                >
                  <span className="text-xs">{cmd}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t">
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Например: Добавь раздел с отзывами клиентов..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={loading}
              rows={2}
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                <Icon name="Info" size={12} className="inline mr-1" />
                Shift + Enter для новой строки
              </p>
              <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  <>
                    <Icon name="Sparkles" size={18} className="mr-2" />
                    Выполнить
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AISiteManager;
