import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertUserSchema, InsertUser } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';

interface AddUserModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AddUserModal({ open, onOpenChange }: AddUserModalProps) {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	const form = useForm<InsertUser>({
		resolver: zodResolver(insertUserSchema),
		defaultValues: {
			email: '',
			firstName: '',
			lastName: '',
			password_hash: '',
			isActive: true,
		},
	});

	const mutation = useMutation({
		mutationFn: async (data: InsertUser) => {
			return await apiRequest('POST', '/api/admin/user', data);
		},
		onSuccess: () => {
			toast({
				title: 'User added',
				description: 'New user has been added successfully.',
			});
			queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
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
				description: error.message || 'Failed to add user',
				variant: 'destructive',
			});
		},
	});

	const onSubmit = (data: InsertUser) => {
		mutation.mutate(data);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className='max-w-2xl mx-auto max-h-2xl overflow-y-auto'
				data-testid='modal-add-stock'
			>
				<DialogHeader>
					<DialogTitle className='text-lg sm:text-xl'>Add User</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3 sm:space-y-4'>
						{/* Email */}
						<FormField
							control={form.control}
							name='email'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type='email'
											placeholder='Enter Email'
											{...field}
											data-testid='input-user-email'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Password */}
						<FormField
							control={form.control}
							name='password_hash'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											placeholder='Enter password'
											type='password'
											{...field}
											data-testid='input-user-password'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
							<FormField
								control={form.control}
								name='firstName'
								render={({ field }) => (
									<FormItem>
										<FormLabel>First Name</FormLabel>
										<FormControl>
											<Input
												placeholder='first name'
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
								name='lastName'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Last Name</FormLabel>
										<FormControl>
											<Input
												placeholder='Last name'
												{...field}
												data-testid='input-last-name'
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						{/* // isActive Checkbox */}
						<FormField
							control={form.control}
							name='isActive'
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<div className='flex items-center space-x-3'>
											<Checkbox
												id='isActive'
												className='h-5 w-5'
												checked={field.value ?? false}
												onCheckedChange={(checked) =>
													field.onChange(!!checked)
												}
												name='isActive'
												data-testid='input-user-active'
											/>
											<FormLabel htmlFor='isActive' className='mb-0'>
												Activate User
											</FormLabel>
										</div>
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
								data-testid='button-add-user-submit'
							>
								{mutation.isPending ? 'Adding...' : 'Add User'}
							</Button>
							<Button
								type='button'
								variant='secondary'
								className='flex-1'
								onClick={() => onOpenChange(false)}
								data-testid='button-add-user-cancel'
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
