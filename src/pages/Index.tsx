import { useState, useEffect } from 'react';
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

type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
};

type CartItem = Product & { quantity: number };

const Index = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPaymentAnimation, setShowPaymentAnimation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
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

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    category: '',
    image: '/placeholder.svg'
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (isFirebaseEnabled && auth) {
      const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
        setUser(user);
        if (user) {
          setUserName(user.displayName || 'Пользователь');
          setUserAvatar(user.photoURL || '');
          setIsAdmin(true);
        } else {
          setUserName('');
          setUserAvatar('');
          setIsAdmin(false);
        }
      });

      return () => unsubscribe();
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseEnabled || !auth || !googleProvider) {
      setUser({ uid: 'demo', displayName: 'Демо Пользователь', photoURL: '' } as User);
      setUserName('Демо Пользователь');
      setUserAvatar('');
      setIsAdmin(true);
      toast({
        title: 'Демо режим',
        description: 'Добавьте Firebase ключи для настоящей авторизации'
      });
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
      toast({
        title: 'Вход выполнен',
        description: 'Добро пожаловать!'
      });
    } catch (error) {
      toast({
        title: 'Ошибка входа',
        description: 'Не удалось войти через Google',
        variant: 'destructive'
      });
    }
  };

  const handleLogout = async () => {
    if (!isFirebaseEnabled || !auth) {
      setUser(null);
      setUserName('');
      setUserAvatar('');
      setIsAdmin(false);
      toast({
        title: 'Выход выполнен',
        description: 'До встречи!'
      });
      return;
    }

    try {
      await signOut(auth);
      toast({
        title: 'Выход выполнен',
        description: 'До встречи!'
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось выйти',
        variant: 'destructive'
      });
    }
  };

  const handleProfileSave = (name: string, avatar: string) => {
    setUserName(name);
    setUserAvatar(avatar);
  };

  const addToCart = (product: Product) => {
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

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Icon name="Zap" size={28} className="text-primary" />
            <span className="text-xl font-bold">RillShop</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover-scale"
            >
              <Icon name={theme === 'light' ? 'Moon' : 'Sun'} size={20} />
            </Button>

            {!user ? (
              <Button onClick={handleGoogleLogin} variant="outline" className="gap-2">
                <Icon name="LogIn" size={18} />
                Войти
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
                    <span className="hidden sm:inline">{userName}</span>
                    {isAdmin && (
                      <Badge variant="secondary" className="ml-1">Admin</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowProfile(true)}>
                    <Icon name="User" size={16} className="mr-2" />
                    Настройки профиля
                  </DropdownMenuItem>
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
            <p className="text-muted-foreground">Пополните энергию для игр</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowAddProduct(true)} className="gap-2">
              <Icon name="Plus" size={18} />
              Добавить товар
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <Card key={product.id} className="hover-scale overflow-hidden">
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
              Только администраторы могут добавлять товары
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
    </div>
  );
};

export default Index;
