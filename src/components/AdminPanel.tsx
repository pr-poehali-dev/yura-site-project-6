import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type AdminPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onColorChange: (primary: string, secondary: string) => void;
  users: Array<{ name: string; email: string; role: string }>;
};

const AdminPanel = ({ open, onOpenChange, onColorChange, users }: AdminPanelProps) => {
  const [primaryColor, setPrimaryColor] = useState('#9b87f5');
  const [secondaryColor, setSecondaryColor] = useState('#7E69AB');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const handleApplyColors = () => {
    onColorChange(primaryColor, secondaryColor);
    toast({
      title: 'Цвета обновлены',
      description: 'Новая цветовая схема применена'
    });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presetColors = [
    { name: 'Фиолетовый', primary: '#9b87f5', secondary: '#7E69AB' },
    { name: 'Синий', primary: '#3b82f6', secondary: '#1e40af' },
    { name: 'Зелёный', primary: '#22c55e', secondary: '#15803d' },
    { name: 'Красный', primary: '#ef4444', secondary: '#b91c1c' },
    { name: 'Оранжевый', primary: '#f97316', secondary: '#c2410c' },
    { name: 'Розовый', primary: '#ec4899', secondary: '#be185d' },
    { name: 'Бирюзовый', primary: '#14b8a6', secondary: '#0d9488' },
    { name: 'Жёлтый', primary: '#eab308', secondary: '#a16207' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Settings" size={24} />
            Панель администратора
          </DialogTitle>
          <DialogDescription>
            Управление цветами и пользователями магазина
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="colors">
              <Icon name="Palette" size={16} className="mr-2" />
              Цвета сайта
            </TabsTrigger>
            <TabsTrigger value="users">
              <Icon name="Users" size={16} className="mr-2" />
              Пользователи
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary">Основной цвет</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-20"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#9b87f5"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary">Дополнительный цвет</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-20"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#7E69AB"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Готовые темы</Label>
                <div className="grid grid-cols-4 gap-2">
                  {presetColors.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      className="flex flex-col items-center gap-2 h-auto py-3"
                      onClick={() => {
                        setPrimaryColor(preset.primary);
                        setSecondaryColor(preset.secondary);
                      }}
                    >
                      <div className="flex gap-1">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: preset.secondary }}
                        />
                      </div>
                      <span className="text-xs">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleApplyColors} className="flex-1">
                  <Icon name="Check" size={16} className="mr-2" />
                  Применить цвета
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPrimaryColor('#9b87f5');
                    setSecondaryColor('#7E69AB');
                  }}
                >
                  <Icon name="RotateCcw" size={16} className="mr-2" />
                  Сбросить
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Предпросмотр</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button style={{ backgroundColor: primaryColor, color: 'white' }}>
                    Кнопка с основным цветом
                  </Button>
                  <Button variant="outline" style={{ borderColor: secondaryColor, color: secondaryColor }}>
                    Кнопка с дополнительным цветом
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Поиск по имени или email</Label>
              <div className="relative">
                <Icon name="Search" size={18} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Введите имя или email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Icon name="Users" size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Пользователи не найдены</p>
                  </CardContent>
                </Card>
              ) : (
                filteredUsers.map((user, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{user.name}</CardTitle>
                          <CardDescription>{user.email}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.role === 'super_admin' && (
                            <Icon name="Crown" size={20} className="text-yellow-500" />
                          )}
                          {user.role === 'admin' && (
                            <Icon name="Shield" size={20} className="text-primary" />
                          )}
                          {user.role === 'user' && (
                            <Icon name="User" size={20} className="text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPanel;
