import { useState, useEffect, useMemo } from 'react';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider, isFirebaseEnabled } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import ProfileDialog from '@/components/ProfileDialog';
import PaymentAnimation from '@/components/PaymentAnimation';
import AdminPanel from '@/components/AdminPanel';
import AdminKeyDialog from '@/components/AdminKeyDialog';
import AuthDialog from '@/components/AuthDialog';
import AIChatSupport from '@/components/AIChatSupport';
import AISiteManager from '@/components/AISiteManager';

type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
};

type CartItem = Product & { quantity: number };

type UserRole = 'super_admin' | 'junior_admin' | 'user';

type UserData = {
  name: string;
  email: string;
  role: UserRole;
  banned: boolean;
};

const Index = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPaymentAnimation, setShowPaymentAnimation] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminKeyDialog, setShowAdminKeyDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showAISupport, setShowAISupport] = useState(false);
  const [showAISiteManager, setShowAISiteManager] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#9b87f5');
  const [secondaryColor, setSecondaryColor] = useState('#7E69AB');
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Игровая энергия 1000',
      price: 299,
      image: '/placeholder.svg',
      category: 'Энергия',
      inStock: true
    },
    {
      id: 2,
      name: 'Премиум пакет 5000',
      price: 1299,
      image: '/placeholder.svg',
      category: 'Энергия',
      inStock: true
    },
    {
      id: 3,
      name: 'Стартовый набор',
      price: 599,
      image: '/placeholder.svg',
      category: 'Наборы',
      inStock: true
    }
  ]);

  const [users, setUsers] = useState<UserData[]>([
    { name: 'Демо пользователь', email: 'demo@example.com', role: 'user', banned: false },
    { name: 'Тестовый админ', email: 'admin@test.com', role: 'junior_admin', banned: false },
    { name: 'Забаненный пользователь', email: 'banned@test.com', role: 'user', banned: true }
  ]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    category: '',
    image: '/placeholder.svg'
  });

  const isSuperAdmin = userRole === 'super_admin';
  const isJuniorAdmin = userRole === 'junior_admin';
  const isAdmin = isSuperAdmin || isJuniorAdmin;

  const currentUserData = useMemo(() => {
    return users.find(u => u.name === userName);
  }, [users, userName]);

  const isBanned = currentUserData?.banned || false;

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  useEffect(() => {
    const savedPrimary = localStorage.getItem('site_primary_color');
    const savedSecondary = localStorage.getItem('site_secondary_color');
    
    if (savedPrimary) setPrimaryColor(savedPrimary);
    if (savedSecondary) setSecondaryColor(savedSecondary);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const hslPrimary = hexToHSL(primaryColor);
    const hslSecondary = hexToHSL(secondaryColor);
    
    root.style.setProperty('--primary', hslPrimary);
    root.style.setProperty('--secondary', hslSecondary);
  }, [primaryColor, secondaryColor]);

  useEffect(() => {
    if (isFirebaseEnabled && auth) {
      const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
        if (user) {
          const userName = user.displayName || 'Пользователь';
          const userBanStatus = localStorage.getItem(`banned_${userName}`);
          
          if (userBanStatus === 'true') {
            signOut(auth);
            toast({
              title: 'Доступ запрещён',
              description: 'Ваш аккаунт заблокирован',
              variant: 'destructive'
            });
            return;
          }

          setUser(user);
          setUserName(userName);
          setUserAvatar(user.photoURL || '');
          
          const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'admin@example.com';
          if (user.email === superAdminEmail) {
            setUserRole('super_admin');
          } else {
            const storedRole = localStorage.getItem(`role_${userName}`);
            setUserRole((storedRole as UserRole) || 'user');
          }
        } else {
          setUser(null);
          setUserName('');
          setUserAvatar('');
          setUserRole('user');
        }
      });

      return () => unsubscribe();
    }
  }, [toast]);

  const hexToHSL = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '262 83% 58%';

    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    const email = localStorage.getItem('user_email');
    const name = localStorage.getItem('user_name');
    
    if (token && email && name) {
      setIsAuthenticated(true);
      setUserName(name);
      setUser({ email, displayName: name } as User);
    } else {
      setShowAuthDialog(true);
    }
  }, []);

  const handleAuthSuccess = (email: string, name: string) => {
    setIsAuthenticated(true);
    setUserName(name);
    setUser({ email, displayName: name } as User);
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseEnabled || !auth || !googleProvider) {
      const demoUser = { uid: 'demo', displayName: 'Демо Пользователь', email: 'demo@example.com', photoURL: '' } as User;
      setUser(demoUser);
      setUserName('Демо Пользователь');
      setUserAvatar('');
      setUserRole('super_admin');
      toast({
        title: 'Демо режим',
        description: 'Вы вошли как суперадмин (демо)'
      });
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userName = result.user.displayName || 'Пользователь';
      const userBanStatus = localStorage.getItem(`banned_${userName}`);
      
      if (userBanStatus === 'true') {
        await signOut(auth);
        toast({
          title: 'Доступ запрещён',
          description: 'Ваш аккаунт заблокирован',
          variant: 'destructive'
        });
        return;
      }

      const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'admin@example.com';
      
      if (result.user.email === superAdminEmail) {
        setUserRole('super_admin');
        toast({
          title: 'Добро пожаловать, суперадмин!',
          description: 'У вас полный доступ к панели управления'
        });
      } else {
        toast({
          title: 'Вход выполнен',
          description: 'Добро пожаловать!'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка входа',
        description: 'Не удалось войти через Google',
        variant: 'destructive'
      });
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    
    setUser(null);
    setUserName('');
    setUserAvatar('');
    setUserRole('user');
    setIsAuthenticated(false);
    setShowAuthDialog(true);
    
    toast({
      title: 'Выход выполнен',
      description: 'До встречи!'
    });
  };

  const handleAdminKeySuccess = () => {
    setUserRole('junior_admin');
    if (userName) {
      localStorage.setItem(`role_${userName}`, 'junior_admin');
    }
  };

  const handleProfileSave = (name: string, avatar: string) => {
    setUserName(name);
    setUserAvatar(avatar);
  };

  const handleColorChange = (primary: string, secondary: string) => {
    setPrimaryColor(primary);
    setSecondaryColor(secondary);
  };

  const handleUserRoleChange = (targetUserName: string, newRole: 'junior_admin' | 'user') => {
    setUsers(prev => prev.map(u => 
      u.name === targetUserName ? { ...u, role: newRole } : u
    ));
    
    localStorage.setItem(`role_${targetUserName}`, newRole);
  };

  const handleUserBan = (targetUserName: string) => {
    setUsers(prev => prev.map(u => 
      u.name === targetUserName ? { ...u, banned: true } : u
    ));
    
    localStorage.setItem(`banned_${targetUserName}`, 'true');
  };

  const handleUserUnban = (targetUserName: string) => {
    setUsers(prev => prev.map(u => 
      u.name === targetUserName ? { ...u, banned: false } : u
    ));
    
    localStorage.removeItem(`banned_${targetUserName}`);
  };

  const addToCart = (product: Product) => {
    if (isBanned) {
      toast({
        title: 'Доступ запрещён',
        description: 'Ваш аккаунт заблокирован',
        variant: 'destructive'
      });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast({
      title: 'Добавлено в корзину',
      description: product.name
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const deleteProduct = (productId: number) => {
    if (!isAdmin) {
      toast({
        title: 'Доступ запрещён',
        description: 'Только администраторы могут удалять товары',
        variant: 'destructive'
      });
      return;
    }

    if (isJuniorAdmin) {
      toast({
        title: 'Недостаточно прав',
        description: 'Младшие админы не могут удалять товары (только 30% прав)',
        variant: 'destructive'
      });
      return;
    }

    const product = products.find(p => p.id === productId);
    setProducts(prev => prev.filter(item => item.id !== productId));
    toast({
      title: 'Товар удалён',
      description: product?.name
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите для оформления заказа',
        variant: 'destructive'
      });
      return;
    }

    if (isBanned) {
      toast({
        title: 'Доступ запрещён',
        description: 'Ваш аккаунт заблокирован',
        variant: 'destructive'
      });
      return;
    }

    setShowCheckout(true);
  };

  const completeCheckout = () => {
    setShowCheckout(false);
    setShowPaymentAnimation(true);
  };

  const handlePaymentComplete = () => {
    setCart([]);
    setShowPaymentAnimation(false);
  };

  const handleAddProduct = () => {
    if (!isAdmin) {
      toast({
        title: 'Доступ запрещён',
        description: 'Только администраторы могут добавлять товары',
        variant: 'destructive'
      });
      return;
    }

    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive'
      });
      return;
    }

    const product: Product = {
      id: products.length + 1,
      name: newProduct.name,
      price: newProduct.price,
      image: newProduct.image,
      category: newProduct.category,
      inStock: true
    };

    setProducts([...products, product]);
    setNewProduct({ name: '', price: 0, category: '', image: '/placeholder.svg' });
    setShowAddProduct(false);
    toast({
      title: 'Товар добавлен',
      description: product.name
    });
  };

  if (isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Icon name="Ban" size={24} />
              Доступ запрещён
            </CardTitle>
            <CardDescription>
              Ваш аккаунт был заблокирован администратором
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Обратитесь к администратору для разблокировки
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Выйти
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-2">
            <Icon name="Zap" size={28} className="text-primary" />
            <span className="text-xl font-bold hidden sm:inline">RillShop</span>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAISupport(true)}
              className="hover-scale"
              title="AI Поддержка"
            >
              <Icon name="Bot" size={20} />
            </Button>

            {isSuperAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAISiteManager(true)}
                className="hover-scale"
                title="AI Управление"
              >
                <Icon name="Sparkles" size={20} />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover-scale"
            >
              <Icon name={theme === 'light' ? 'Moon' : 'Sun'} size={20} />
            </Button>

            {!user ? (
              <Button onClick={() => setShowAuthDialog(true)} variant="outline" className="gap-2">
                <Icon name="LogIn" size={18} />
                <span className="hidden sm:inline">Войти</span>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hover-scale">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatar} alt={userName} />
                      <AvatarFallback>
                        {userName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline">{userName}</span>
                    {isSuperAdmin && (
                      <Icon name="Crown" size={16} className="text-yellow-500" />
                    )}
                    {isJuniorAdmin && (
                      <Badge variant="secondary" className="ml-1">
                        <Icon name="Shield" size={12} className="mr-1" />
                        30%
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowProfile(true)}>
                    <Icon name="User" size={16} className="mr-2" />
                    Настройки профиля
                  </DropdownMenuItem>
                  {isSuperAdmin && (
                    <DropdownMenuItem onClick={() => setShowAdminPanel(true)}>
                      <Icon name="Settings" size={16} className="mr-2" />
                      Панель суперадмина
                    </DropdownMenuItem>
                  )}
                  {!isAdmin && (
                    <DropdownMenuItem onClick={() => setShowAdminKeyDialog(true)}>
                      <Icon name="Key" size={16} className="mr-2" />
                      Стать администратором
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <Icon name="LogOut" size={16} className="mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Icon name="ShoppingCart" size={20} />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Корзина</SheetTitle>
                  <SheetDescription>
                    {cart.length === 0 ? 'Корзина пуста' : `Товаров: ${cart.length}`}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.price} ₽ × {item.quantity}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
                {cart.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Итого:</span>
                      <span>{getTotalPrice()} ₽</span>
                    </div>
                    <Button className="w-full" onClick={handleCheckout}>
                      Оформить заказ
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container py-8 px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Магазин игровой энергии</h1>
            <p className="text-muted-foreground">
              {searchQuery ? `Результаты поиска: "${searchQuery}"` : 'Пополните энергию для игр'}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowAddProduct(true)} className="gap-2">
              <Icon name="Plus" size={18} />
              <span className="hidden sm:inline">Добавить товар</span>
            </Button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center text-muted-foreground">
              <Icon name="Search" size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Товары не найдены</p>
              <p className="text-sm">Попробуйте изменить поисковый запрос</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <Card key={product.id} className="hover-scale overflow-hidden relative group">
                {isSuperAdmin && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteProduct(product.id)}
                  >
                    <Icon name="Trash2" size={16} />
                  </Button>
                )}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{product.name}</CardTitle>
                    <Badge>{product.category}</Badge>
                  </div>
                  <CardDescription>
                    {product.inStock ? 'В наличии' : 'Нет в наличии'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{product.price} ₽</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={!product.inStock}
                    onClick={() => addToCart(product)}
                  >
                    <Icon name="ShoppingBag" size={18} className="mr-2" />
                    В корзину
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Оформление заказа</DialogTitle>
            <DialogDescription>
              Выберите способ оплаты и подтвердите заказ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Способ оплаты</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <Icon name="CreditCard" size={16} />
                      <span>Банковская карта</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sbp">
                    <div className="flex items-center gap-2">
                      <Icon name="Smartphone" size={16} />
                      <span>СБП</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="paypal">
                    <div className="flex items-center gap-2">
                      <Icon name="Wallet" size={16} />
                      <span>PayPal</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Итого к оплате:</span>
                <span>{getTotalPrice()} ₽</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Отмена
            </Button>
            <Button onClick={completeCheckout}>
              Оплатить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить товар</DialogTitle>
            <DialogDescription>
              {isJuniorAdmin ? 'Младший админ (30% прав)' : 'Только администраторы могут добавлять товары'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Цена (₽)</Label>
              <Input
                id="price"
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Input
                id="category"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddProduct}>
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProfileDialog
        open={showProfile}
        onOpenChange={setShowProfile}
        currentName={userName}
        currentAvatar={userAvatar}
        onSave={handleProfileSave}
      />

      <PaymentAnimation
        open={showPaymentAnimation}
        amount={getTotalPrice()}
        onComplete={handlePaymentComplete}
      />

      <AdminPanel
        open={showAdminPanel}
        onOpenChange={setShowAdminPanel}
        onColorChange={handleColorChange}
        users={users}
        onUserRoleChange={handleUserRoleChange}
        onUserBan={handleUserBan}
        onUserUnban={handleUserUnban}
        currentColors={{ primary: primaryColor, secondary: secondaryColor }}
      />

      <AdminKeyDialog
        open={showAdminKeyDialog}
        onOpenChange={setShowAdminKeyDialog}
        onSuccess={handleAdminKeySuccess}
      />

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onAuthSuccess={handleAuthSuccess}
      />

      <AIChatSupport
        open={showAISupport}
        onOpenChange={setShowAISupport}
        userName={userName}
      />

      <AISiteManager
        open={showAISiteManager}
        onOpenChange={setShowAISiteManager}
        onSiteUpdate={(updates) => {
          if (updates.colors) {
            setPrimaryColor(updates.colors.primary);
            setSecondaryColor(updates.colors.secondary);
          }
        }}
      />
    </div>
  );
};

export default Index;