import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Stock } from "@shared/schema";

const requestSchema = z.object({
  stockId: z.string().min(1, "Please select a stock item"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  reason: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface RequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stocks: Stock[];
  selectedStock?: Stock;
}

export function RequestModal({ open, onOpenChange, stocks, selectedStock }: RequestModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      stockId: selectedStock?.id || "",
      quantity: 1,
      reason: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      await apiRequest("POST", "/api/requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Request submitted",
        description: "Your stock request has been submitted for approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RequestFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="modal-request-stock">
        <DialogHeader>
          <DialogTitle>Request Stock Item</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stockId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-stock-item">
                        <SelectValue placeholder="Select a stock item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stocks.filter(stock => stock.quantity > 0).map((stock) => (
                        <SelectItem key={stock.id} value={stock.id}>
                          {stock.name} ({stock.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-quantity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Briefly explain why you need this item..."
                      {...field}
                      data-testid="textarea-reason"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={mutation.isPending}
                data-testid="button-submit-request"
              >
                {mutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-request"
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
