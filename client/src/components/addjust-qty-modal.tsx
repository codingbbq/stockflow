import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Stock } from '@shared/schema';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

const adjustQuantitySchema = z.object({
  adjustmentType: z.enum(['added', 'removed'], {
    message: "Please select adjustment type",
  }),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  comment: z.string().min(1, "Comment is required for quantity adjustment"),
});

type AdjustQuantityForm = z.infer<typeof adjustQuantitySchema>;

interface AdjustQuantityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock?: Stock;
}

export function AdjustQuantityModal({ open, onOpenChange, stock }: AdjustQuantityModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adjustmentType, setAdjustmentType] = useState<'added' | 'removed'>('added');

  const form = useForm<AdjustQuantityForm>({
    resolver: zodResolver(adjustQuantitySchema),
    defaultValues: {
      adjustmentType: 'added',
      quantity: 0,
      comment: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: AdjustQuantityForm) => {
      // Calculate the actual adjustment value
      return await apiRequest('PATCH', `/api/admin/stocks/${stock?.id}/adjust-quantity`, {
        stockId: stock?.id,
        changeType: data.adjustmentType,
        quantity: data.quantity,
        comment: data.comment,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Quantity adjusted',
        description: 'Stock quantity has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard/stats'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to adjust quantity',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AdjustQuantityForm) => {
    // Validation: Check if removal would result in negative quantity
    if (data.adjustmentType === 'removed' && stock && data.quantity > stock.quantity) {
      form.setError('quantity', {
        type: 'manual',
        message: `Cannot remove ${data.quantity} items. Only ${stock.quantity} available in stock.`,
      });
      return;
    }

    mutation.mutate(data);
  };

  if (!stock) return null;

  const currentQuantity = stock.quantity;
  const enteredQuantity = form.watch('quantity') || 0;
  const selectedType = form.watch('adjustmentType');
  const newQuantity = selectedType === 'added' 
    ? currentQuantity + enteredQuantity 
    : currentQuantity - enteredQuantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Adjust Quantity - {stock.name}</DialogTitle>
          <p className='text-sm text-muted-foreground'>
            Current quantity: <b>{currentQuantity}</b>
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='adjustmentType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        setAdjustmentType(value as 'added' | 'removed');
                      }}
                      value={field.value}
                      className='flex space-x-4'
                    >
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='added' id='added' />
                        <Label htmlFor='added' className='cursor-pointer'>
                          Add Stock
                        </Label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='removed' id='removed' />
                        <Label htmlFor='removed' className='cursor-pointer'>
                          Remove Stock
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='quantity'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min='1'
                      placeholder='Enter quantity'
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  {enteredQuantity > 0 && (
                    <p className={`text-xs ${newQuantity < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      New quantity will be: <b>{newQuantity}</b>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='comment'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Adjustment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='e.g. Received new shipment, Damaged items removed, etc.'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex space-x-3 pt-4'>
              <Button
                type='submit'
                className='flex-1'
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Adjusting...' : 'Adjust Quantity'}
              </Button>
              <Button
                type='button'
                variant='secondary'
                className='flex-1'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}