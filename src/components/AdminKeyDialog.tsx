import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type AdminKeyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const AdminKeyDialog = ({ open, onOpenChange, onSuccess }: AdminKeyDialogProps) => {
  const [adminKey, setAdminKey] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    const correctKey = import.meta.env.VITE_ADMIN_SECRET_KEY || 'demo-admin-key';
    
    if (adminKey === correctKey) {
      onSuccess();
      setAdminKey('');
      onOpenChange(false);
      toast({
        title: 'Успешно!',
        description: 'Вы получили права администратора'
      });
    } else {
      toast({
        title: 'Неверный пароль',
        description: 'Проверьте правильность введённого пароля',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Key" size={24} />
            Стать администратором
          </DialogTitle>
          <DialogDescription>
            Введите специальный пароль, чтобы получить права администратора
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="adminKey">Пароль администратора</Label>
            <Input
              id="adminKey"
              type="password"
              placeholder="Введите секретный пароль"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <p className="text-xs text-muted-foreground">
              Этот пароль выдаёт главный администратор
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>
            <Icon name="Check" size={16} className="mr-2" />
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminKeyDialog;
