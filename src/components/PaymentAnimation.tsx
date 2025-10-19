import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

type PaymentAnimationProps = {
  open: boolean;
  amount: number;
  onComplete: () => void;
};

const PaymentAnimation = ({ open, amount, onComplete }: PaymentAnimationProps) => {
  const [phase, setPhase] = useState<'spinning' | 'success'>('spinning');
  const [displayAmount, setDisplayAmount] = useState(amount);

  useEffect(() => {
    if (!open) {
      setPhase('spinning');
      setDisplayAmount(amount);
      return;
    }

    let interval: number;
    const spinDuration = 2000;
    const startTime = Date.now();

    interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / spinDuration;

      if (progress < 1) {
        setDisplayAmount(Math.floor(Math.random() * amount * 2));
      } else {
        clearInterval(interval);
        setPhase('success');
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [open, amount, onComplete]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-lg">
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {phase === 'spinning' ? (
            <>
              <div className="relative">
                <div className="absolute inset-0 animate-ping">
                  <Icon name="Loader2" size={80} className="text-primary animate-spin" />
                </div>
                <Icon name="Loader2" size={80} className="text-primary animate-spin" />
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold animate-pulse text-primary">
                  {displayAmount} ₽
                </div>
                <p className="text-muted-foreground mt-2">Обработка платежа...</p>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <div className="absolute inset-0 animate-ping bg-green-500/20 rounded-full" />
                <div className="bg-green-500 rounded-full p-6 animate-bounce">
                  <Icon name="Check" size={64} className="text-white" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-5xl font-bold text-green-500 animate-pulse">
                  ОПЛАЧЕНО!
                </div>
                <p className="text-lg text-muted-foreground">Спасибо за покупку!</p>
              </div>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentAnimation;
