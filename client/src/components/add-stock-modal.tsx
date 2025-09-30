import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { CloudUpload } from 'lucide-react';
import type { InsertStock } from '@shared/schema';
import { uploadImageToSupabase } from '@/lib/uploadImage';

interface AddStockModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AddStockModal({ open, onOpenChange }: AddStockModalProps) {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	const form = useForm<InsertStock>({
		resolver: zodResolver(insertStockSchema),
		defaultValues: {
			name: '',
			code: '',
			description: '',
			imageUrl: '',
			imageFile: null,
			quantity: 0,
			category: '',
		},
	});

	const mutation = useMutation({
		mutationFn: async (data: InsertStock) => {
			return await apiRequest('POST', '/api/admin/stocks', data);
		},
		onSuccess: () => {
			toast({
				title: 'Stock added',
				description: 'New stock item has been added successfully.',
			});
			queryClient.invalidateQueries({ queryKey: ['/api/admin/stocks'] });
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

	const onSubmit = async (data: InsertStock & { imageFile?: File | null }) => {
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

		// Prepare data for mutation
		const submitData = { ...data, imageUrl };
		delete submitData.imageFile;
		mutation.mutate(submitData);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className='w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto'
				data-testid='modal-add-stock'
			>
				<DialogHeader>
					<DialogTitle className='text-lg sm:text-xl'>Add New Stock Item</DialogTitle>
				</DialogHeader>

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
													field.onChange(parseInt(e.target.value) || 0)
												}
												data-testid='input-stock-quantity'
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
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
								{mutation.isPending ? 'Adding...' : 'Add Stock Item'}
							</Button>
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
