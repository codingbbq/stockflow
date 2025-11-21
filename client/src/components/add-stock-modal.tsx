import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertStockSchema } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import type { InsertStock, Stock } from '@shared/schema';
import { uploadImageToSupabase } from '@/lib/uploadImage';
import { useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from './ui/alert-dialog';
import { Trash2 } from 'lucide-react';

// Extended schema for update mode
const updateStockSchema = insertStockSchema.extend({
	adjustQuantity: z.number().optional(),
	adjustComment: z.string().optional(),
});

type AddStockForm = z.infer<typeof insertStockSchema> & {
	adjustQuantity?: number;
	adjustComment?: string;
};

interface AddStockModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	stock?: Stock;
}

export function AddStockModal({ open, onOpenChange, stock }: AddStockModalProps) {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	const form = useForm<AddStockForm>({
		resolver: zodResolver(stock ? updateStockSchema : insertStockSchema),
		defaultValues: {
			name: '',
			code: '',
			description: '',
			imageUrl: '',
			imageFile: null,
			quantity: 0,
			category: '',
			adjustQuantity: 0,
			adjustComment: '',
		},
	});

	useEffect(() => {
		if (stock) {
			form.reset({
				name: stock.name,
				code: stock.code,
				description: stock.description ?? '',
				imageUrl: stock.imageUrl ?? '',
				imageFile: null,
				quantity: stock.quantity,
				category: stock.category ?? '',
				adjustQuantity: 0,
				adjustComment: '',
			});
		} else {
			form.reset({
				name: '',
				code: '',
				description: '',
				imageUrl: '',
				imageFile: null,
				quantity: 0,
				category: '',
				adjustQuantity: 0,
				adjustComment: '',
			});
		}
	}, [stock, open]);

	const mutation = useMutation({
		mutationFn: async (data: AddStockForm & { id?: string }) => {
			let payload = { ...data };
			if (stock) {
				// For update, send adjustQuantity and adjustComment if present
				payload = {
					...data,
					adjustQuantity: data.adjustQuantity ?? 0,
					adjustComment: data.adjustComment ?? '',
				};
				return await apiRequest('PUT', `/api/admin/stocks/${stock.id}`, payload);
			} else {
				return await apiRequest('POST', '/api/admin/stocks', data);
			}
		},
		onSuccess: () => {
			toast({
				title: stock ? 'Stock updated' : 'Stock added',
				description: stock
					? 'Stock item has been updated successfully.'
					: 'New stock item has been added successfully.',
			});
			queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
			queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard/stats'] });
			onOpenChange(false);
			form.reset();
		},
		onError: (error) => {
			if (isUnauthorizedError(error)) {
				toast({
					title: 'Unauthorized',
					description: 'You are logged out. Logging in again...',
					variant: 'destructive',
				});
				setTimeout(() => {
					window.location.href = '/api/login';
				}, 500);
				return;
			}
			toast({
				title: 'Error',
				description: error.message || 'Failed to add stock item',
				variant: 'destructive',
			});
		},
	});

	const onSubmit = async (data: AddStockForm & { imageFile?: File | null }) => {
		let imageUrl = '';

		if (data.imageFile) {
			imageUrl = await uploadImageToSupabase(data.imageFile);
			if (!imageUrl) {
				toast({
					title: 'Error',
					description: 'Image upload failed',
					variant: 'destructive',
				});
				return;
			}
		}

		const submitData = { ...data, imageUrl };
		delete submitData.imageFile;
		mutation.mutate(submitData);
	};

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await apiRequest('DELETE', `/api/admin/stocks/${id}`);
		},
		onSuccess: () => {
			toast({
				title: 'Stock deleted',
				description: 'Stock item has been deleted successfully.',
			});
			queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
			queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard/stats'] });
			onOpenChange(false);
		},
		onError: (error) => {
			if (isUnauthorizedError(error)) {
				toast({
					title: 'Unauthorized',
					description: 'You are logged out. Logging in again...',
					variant: 'destructive',
				});
				setTimeout(() => {
					window.location.href = '/api/login';
				}, 500);
				return;
			}
			toast({
				title: 'Error',
				description: error.message || 'Failed to delete stock',
				variant: 'destructive',
			});
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className='w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto'
				data-testid='modal-add-stock'
			>
				{stock ? (
					<DialogHeader className='flex flex-row items-center space-x-4 space-y-0'>
						<img
							src={
								stock.imageUrl ||
								'https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200'
							}
							alt={stock.name}
							className='w-16 h-16 object-cover rounded-lg'
							data-testid={`img-stock-detail-${stock.id}`}
						/>
						<div>
							<DialogTitle data-testid={`text-stock-detail-name-${stock.id}`}>
								Update details for <i>{stock.name}</i>
							</DialogTitle>
							<p
								className='text-muted-foreground'
								data-testid={`text-stock-detail-code-${stock.id}`}
							>
								Code: {stock.code}
							</p>
						</div>
					</DialogHeader>
				) : (
					<DialogHeader>
						<DialogTitle className='text-lg sm:text-xl'>Add New Stock Item</DialogTitle>
					</DialogHeader>
				)}

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3 sm:space-y-4'>
						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Item Name</FormLabel>
									<FormControl>
										<Input
											placeholder='Enter item name'
											{...field}
											data-testid='input-stock-name'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
							<FormField
								control={form.control}
								name='code'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Item Code</FormLabel>
										<FormControl>
											<Input
												placeholder='e.g., WM-001'
												{...field}
												data-testid='input-stock-code'
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* For new addition of products. */}
							{!stock && (
								<FormField
									control={form.control}
									name='quantity'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Quantity</FormLabel>
											<FormControl>
												<Input
													type='number'
													min='0'
													placeholder='0'
													{...field}
													onChange={(e) =>
														field.onChange(
															parseInt(e.target.value) || 0
														)
													}
													data-testid='input-stock-quantity'
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							{/* In case of edit of products, we need to show existing qty and then option to add or remove qty. */}
							{stock && (
								<div className='mb-4'>
									<div>
										<b>Current Quantity:</b> {stock.quantity}
									</div>
									<FormField
										control={form.control}
										name='adjustQuantity'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Adjust Quantity</FormLabel>
												<FormControl>
													<Input
														type='number'
														placeholder='e.g. 5 or -3'
														{...field}
														onChange={(e) =>
															field.onChange(Number(e.target.value))
														}
														data-testid='input-adjust-quantity'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name='adjustComment'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Comment for Adjustment</FormLabel>
												<FormControl>
													<Textarea
														placeholder='Reason for adjustment'
														{...field}
														data-testid='input-adjust-comment'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}
						</div>

						<FormField
							control={form.control}
							name='category'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Category</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value || ''}
									>
										<FormControl>
											<SelectTrigger data-testid='select-stock-category'>
												<SelectValue placeholder='Select category' />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value='Electronics'>Electronics</SelectItem>
											<SelectItem value='Office Supplies'>
												Office Supplies
											</SelectItem>
											<SelectItem value='Hardware'>Hardware</SelectItem>
											<SelectItem value='Other'>Other</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='imageFile'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Upload Image</FormLabel>
									<FormControl>
										<Input
											type='file'
											accept='image/*'
											onChange={(e) =>
												field.onChange(e.target.files?.[0] || null)
											}
											data-testid='input-stock-image-file'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='description'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											rows={3}
											placeholder='Enter item description...'
											{...field}
											value={field.value || ''}
											data-testid='textarea-stock-description'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4'>
							<Button
								type='submit'
								className='flex-1'
								disabled={mutation.isPending}
								data-testid='button-add-stock-submit'
							>
								{stock
									? mutation.isPending
										? 'Updating...'
										: 'Update Stock'
									: mutation.isPending
									? 'Adding...'
									: 'Add Stock Item'}
							</Button>

							{/* Delete button to delete a stock */}
							{stock && (
								<Tooltip>
									<TooltipTrigger asChild>
										<>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														className='flex-1'
														variant='destructive'
														disabled={deleteMutation.isPending}
														data-testid={`button-delete-stock-${stock.id}`}
													>
														<Trash2 className='w-4 h-4' /> Delete Stock
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Delete Stock
														</AlertDialogTitle>
														<AlertDialogDescription>
															Are you sure you want to delete{' '}
															<b>{stock.name}</b>? This action cannot
															be undone.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>
															Cancel
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={() =>
																deleteMutation.mutate(stock.id)
															}
															disabled={deleteMutation.isPending}
														>
															Delete
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</>
									</TooltipTrigger>
									<TooltipContent side='top' align='center'>
										Delete Product
									</TooltipContent>
								</Tooltip>
							)}

							<Button
								type='button'
								variant='secondary'
								className='flex-1'
								onClick={() => onOpenChange(false)}
								data-testid='button-add-stock-cancel'
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
