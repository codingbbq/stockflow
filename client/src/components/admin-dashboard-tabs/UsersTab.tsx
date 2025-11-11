import { Plus, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { SafeUser } from '@shared/schema';
import { Badge } from '../ui/badge';
import { AddUserModal } from '../add-user-modal';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';

const UsersTab = () => {
	const { isAdmin, isAuthenticated, loading } = useAuth();
	const [addUserModalOpen, setAddUserModalOpen] = useState(false);
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const { data: users, isLoading: usersLoading } = useQuery<SafeUser[]>({
		queryKey: ['/api/admin/users'],
		enabled: isAuthenticated && isAdmin, // Only fetch if authorized
	});
	const toggleAdminMutation = useMutation({
		mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
			await apiRequest('PUT', `/api/admin/users/${id}/toggle-active`, { isActive });
		},
		onSuccess: () => {
			toast({
				title: 'User updated',
				description: 'User active status has been updated successfully.',
			});
			queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
		},
		onError: (error) => {
			if (isUnauthorizedError(error)) {
				toast({
					title: 'Unauthorized',
					description: 'You are logged out. Logging in again...',
					variant: 'destructive',
				});
				setTimeout(() => {
					window.location.href = '/login';
				}, 500);
				return;
			}
			toast({
				title: 'Error',
				description: error.message || 'Failed to update user admin status',
				variant: 'destructive',
			});
		},
	});
	return (
		<>
			<div className='flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0'>
				<div>
					<h2 className='text-xl sm:text-2xl font-bold text-foreground'>
						Users Management
					</h2>
					<p className='text-sm sm:text-base text-muted-foreground'>
						Add, edit, and manage your users
					</p>
				</div>
				<Button
					onClick={() => setAddUserModalOpen(true)}
					data-testid='button-add-user'
					className='w-full sm:w-auto'
				>
					<Plus className='w-4 h-4 mr-2' />
					<span className='sm:inline'>Add New User</span>
				</Button>
			</div>

			<Card>
				<CardContent>
					<div className='overflow-x-auto'>
						<table className='w-full border-collapse'>
							<thead>
								<tr className='border-b'>
									<th className='text-left py-3 px-4 font-medium'>User</th>
									<th className='text-left py-3 px-4 font-medium'>Email</th>
									<th className='text-left py-3 px-4 font-medium'>Joined</th>
									<th className='text-left py-3 px-4 font-medium'>Active</th>
									<th className='text-left py-3 px-4 font-medium'>Actions</th>
								</tr>
							</thead>
							<tbody>
								{usersLoading
									? [...Array(5)].map((_, i) => (
											<tr key={i} className='border-b'>
												<td className='py-4 px-4'>
													<Skeleton className='h-10 w-full' />
												</td>
												<td className='py-4 px-4'>
													<Skeleton className='h-6 w-32' />
												</td>
												<td className='py-4 px-4'>
													<Skeleton className='h-6 w-20' />
												</td>
												<td className='py-4 px-4'>
													<Skeleton className='h-6 w-16' />
												</td>
												<td className='py-4 px-4'>
													<Skeleton className='h-8 w-24' />
												</td>
											</tr>
									  ))
									: users?.map((user: SafeUser) => (
											<tr
												key={user.id}
												className='border-b hover:bg-muted/50'
											>
												<td className='py-4 px-4'>
													<div className='flex items-center space-x-3'>
														<div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center'>
															<span className='text-xs font-medium text-primary-foreground'>
																{(
																	user.firstName?.[0] ||
																	user.email?.[0] ||
																	'U'
																).toUpperCase()}
															</span>
														</div>
														<div>
															<p
																className='font-medium text-foreground'
																data-testid={`user-name-${user.id}`}
															>
																{user.firstName && user.lastName
																	? `${user.firstName} ${user.lastName}`
																	: user.firstName ||
																	  'Unknown User'}
															</p>
														</div>
													</div>
												</td>
												<td
													className='py-4 px-4 text-muted-foreground'
													data-testid={`user-email-${user.id}`}
												>
													{user.email}
												</td>
												<td className='py-4 px-4 text-muted-foreground'>
													{user.createdAt
														? new Date(
																user.createdAt
														  ).toLocaleDateString()
														: ''}
												</td>
												<td className='py-4 px-4'>
													<Badge
														className={
															user.isActive
																? 'bg-green-100 text-green-800'
																: 'bg-gray-100 text-gray-800'
														}
													>
														{user.isActive ? 'Active' : 'Inactive'}
													</Badge>
												</td>
												<td className='py-4 px-4'>
													<Button
														size='sm'
														variant={
															user.isActive
																? 'destructive'
																: 'default'
														}
														onClick={() =>
															toggleAdminMutation.mutate({
																id: user.id,
																isActive: !user.isActive,
															})
														}
														disabled={toggleAdminMutation.isPending}
														data-testid={`button-toggle-admin-${user.id}`}
													>
														{user.isActive ? 'Deactivate' : 'Activate'}
													</Button>
												</td>
											</tr>
									  ))}
							</tbody>
						</table>
						{users && users.length === 0 && !usersLoading && (
							<div className='text-center py-8'>
								<Users className='mx-auto h-12 w-12 text-muted-foreground' />
								<h3 className='mt-2 text-sm font-medium text-foreground'>
									No users found
								</h3>
								<p className='mt-1 text-sm text-muted-foreground'>
									Users will appear here once they sign up.
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<AddUserModal open={addUserModalOpen} onOpenChange={setAddUserModalOpen} />
		</>
	);
};

export default UsersTab;
