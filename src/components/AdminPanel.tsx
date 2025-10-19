import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type UserData = {
  name: string;
  email: string;
  role: 'super_admin' | 'junior_admin' | 'user';
  banned: boolean;
};

type AdminPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onColorChange: (primary: string, secondary: string) => void;
  users: UserData[];
  onUserRoleChange: (userName: string, newRole: 'junior_admin' | 'user') => void;
  onUserBan: (userName: string) => void;
  onUserUnban: (userName: string) => void;
  currentColors: { primary: string; secondary: string };
};

const AdminPanel = ({ 
  open, 
  onOpenChange, 
  onColorChange, 
  users, 
  onUserRoleChange, 
  onUserBan,
  onUserUnban,
  currentColors 
}: AdminPanelProps) => {
  const [primaryColor, setPrimaryColor] = useState(currentColors.primary);
  const [secondaryColor, setSecondaryColor] = useState(currentColors.secondary);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'promote' | 'demote' | 'ban' | 'unban' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPrimaryColor(currentColors.primary);
    setSecondaryColor(currentColors.secondary);
  }, [currentColors]);

  const handleApplyColors = () => {
    onColorChange(primaryColor, secondaryColor);
    localStorage.setItem('site_primary_color', primaryColor);
    localStorage.setItem('site_secondary_color', secondaryColor);
    toast({
      title: 'Цвета обновлены',
      description: 'Новая цветовая схема сохранена'
    });
  };

  const handleUserAction = () => {
    if (!selectedUser || !actionType) return;

    switch (actionType) {
      case 'promote':
        onUserRoleChange(selectedUser, 'junior_admin');
        toast({
          title: 'Роль изменена',
          description: `${selectedUser} назначен младшим администратором`
        });
        break;
      case 'demote':
        onUserRoleChange(selectedUser, 'user');
        toast({
          title: 'Роль изменена',
          description: `${selectedUser} понижен до пользователя`
        });
        break;
      case 'ban':
        onUserBan(selectedUser);
        toast({
          title: 'Пользователь заблокирован',
          description: `${selectedUser} больше не может заходить на сайт`,
          variant: 'destructive'
        });
        break;
      case 'unban':
        onUserUnban(selectedUser);
        toast({
          title: 'Пользователь разблокирован',
          description: `${selectedUser} снова может использовать сайт`
        });
        break;
    }

    setSelectedUser(null);
    setActionType(null);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const juniorAdminsCount = users.filter(u => u.role === 'junior_admin').length;

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

  const getRoleName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Суперадмин';
      case 'junior_admin': return 'Младший админ';
      default: return 'Пользователь';
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'super_admin': return '100% прав';
      case 'junior_admin': return '30% прав (добавление товаров)';
      default: return 'Только покупки';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Settings" size={24} />
              Панель суперадминистратора
            </DialogTitle>
            <DialogDescription>
              Управление цветами, пользователями и правами доступа
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors">
                <Icon name="Palette" size={16} className="mr-2" />
                Цвета
              </TabsTrigger>
              <TabsTrigger value="users">
                <Icon name="Users" size={16} className="mr-2" />
                Пользователи
              </TabsTrigger>
              <TabsTrigger value="stats">
                <Icon name="BarChart3" size={16} className="mr-2" />
                Статистика
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
                    Применить и сохранить
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
                    <Card key={index} className={user.banned ? 'border-destructive' : ''}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{user.name}</CardTitle>
                              {user.banned && (
                                <Badge variant="destructive" className="gap-1">
                                  <Icon name="Ban" size={12} />
                                  Заблокирован
                                </Badge>
                              )}
                            </div>
                            <CardDescription>{user.email}</CardDescription>
                            <p className="text-sm text-muted-foreground mt-1">
                              {getRolePermissions(user.role)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.role === 'super_admin' ? (
                              <Icon name="Crown" size={24} className="text-yellow-500" />
                            ) : user.role === 'junior_admin' ? (
                              <Icon name="Shield" size={24} className="text-primary" />
                            ) : (
                              <Icon name="User" size={24} className="text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        {user.role !== 'super_admin' && (
                          <div className="flex gap-2 mt-3">
                            {user.role === 'user' && !user.banned && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user.name);
                                  setActionType('promote');
                                }}
                              >
                                <Icon name="ArrowUp" size={14} className="mr-1" />
                                Сделать админом
                              </Button>
                            )}
                            {user.role === 'junior_admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user.name);
                                  setActionType('demote');
                                }}
                              >
                                <Icon name="ArrowDown" size={14} className="mr-1" />
                                Понизить
                              </Button>
                            )}
                            {!user.banned ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(user.name);
                                  setActionType('ban');
                                }}
                              >
                                <Icon name="Ban" size={14} className="mr-1" />
                                Забанить
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user.name);
                                  setActionType('unban');
                                }}
                              >
                                <Icon name="CheckCircle" size={14} className="mr-1" />
                                Разбанить
                              </Button>
                            )}
                          </div>
                        )}
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Users" size={20} />
                      Всего пользователей
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold">{users.length}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Shield" size={20} />
                      Младших администраторов
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-primary">{juniorAdminsCount}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      30% прав от суперадмина
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Ban" size={20} />
                      Заблокированных
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-destructive">
                      {users.filter(u => u.banned).length}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="ShoppingBag" size={20} />
                      Покупателей
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold">
                      {users.filter(u => u.role === 'user' && !u.banned).length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Распределение ролей</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Icon name="Crown" size={16} className="text-yellow-500" />
                      Суперадмин
                    </span>
                    <Badge>1</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Icon name="Shield" size={16} className="text-primary" />
                      Младшие админы
                    </span>
                    <Badge variant="secondary">{juniorAdminsCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Icon name="User" size={16} className="text-muted-foreground" />
                      Пользователи
                    </span>
                    <Badge variant="outline">
                      {users.filter(u => u.role === 'user').length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!selectedUser && !!actionType} onOpenChange={() => {
        setSelectedUser(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'promote' && 'Назначить младшим администратором?'}
              {actionType === 'demote' && 'Понизить до пользователя?'}
              {actionType === 'ban' && 'Заблокировать пользователя?'}
              {actionType === 'unban' && 'Разблокировать пользователя?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'promote' && `${selectedUser} получит 30% прав суперадмина (добавление товаров)`}
              {actionType === 'demote' && `${selectedUser} потеряет права администратора`}
              {actionType === 'ban' && `${selectedUser} будет заблокирован навсегда и не сможет заходить на сайт`}
              {actionType === 'unban' && `${selectedUser} снова сможет пользоваться сайтом`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleUserAction}>
              Подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminPanel;
