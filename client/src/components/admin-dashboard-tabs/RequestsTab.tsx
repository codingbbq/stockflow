import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from "wouter";

const RequestsTab = () => {
	const { isAdmin, isAuthenticated, loading } = useAuth();
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [requestFilter, setRequestFilter] = useState('all');
	const [searchTerm, setSearchTerm] = useState('');
	const [location, navigate] = useLocation();

	const { data: requests, isLoading: requestsLoading } = useQuery<any[]>({
		queryKey: ['/api/admin/requests'],
		enabled: isAuthenticated && isAdmin, // Only fetch if authorized
	});

	const approveMutation = useMutation({
		mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
			await apiRequest('PUT', `/api/admin/requests/${id}/approve`, { adminNotes });
		},
		onSuccess: () => {
			toast({
				title: 'Request approved',
				description: 'Stock request has been approved successfully.',
			});
			queryClient.invalidateQueries({ queryKey: ['/api/admin/requests'] });
			queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
			queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard/stats'] });
		},
		onError: (error) => {
			if (isUnauthorizedError(error)) {
				toast({
					title: 'Unauthorized',
					description: 'You are logged out. Logging in again...',
					variant: 'destructive',
				});
				setTimeout(() => {
					navigate('/api/login');
				}, 500);
				return;
			}
			toast({
				title: 'Error',
				description: error.message || 'Failed to approve request',
				variant: 'destructive',
			});
		},
	});

	const denyMutation = useMutation({
		mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
			await apiRequest('PUT', `/api/admin/requests/${id}/deny`, { adminNotes });
		},
		onSuccess: () => {
			toast({
				title: 'Request denied',
				description: 'Stock request has been denied.',
			});
			queryClient.invalidateQueries({ queryKey: ['/api/admin/requests'] });
		},
		onError: (error) => {
			if (isUnauthorizedError(error)) {
				toast({
					title: 'Unauthorized',
					description: 'You are logged out. Logging in again...',
					variant: 'destructive',
				});
				setTimeout(() => {
					navigate('/api/login');
				}, 500);
				return;
			}
			toast({
				title: 'Error',
				description: error.message || 'Failed to deny request',
				variant: 'destructive',
			});
		},
	});

	const filteredRequests = requests?.filter((request) => {
		const matchesFilter = requestFilter === 'all' || request.status === requestFilter;
		const matchesSearch =
			!searchTerm ||
			(request as any).user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(request as any).user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(request as any).stock?.name?.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesFilter && matchesSearch;
	});
	return (
		<>
			<div className='mb-4 sm:mb-8'>
				<h2 className='text-xl sm:text-2xl font-bold text-foreground'>
					Request Management
				</h2>
				<p className='text-sm sm:text-base text-muted-foreground'>
					Review and manage stock requests
				</p>
			</div>

			{/* Request Filters */}
			<Card>
				<CardContent className='p-4'>
					<div className='flex flex-col sm:flex-row gap-2 sm:gap-4'>
						<Select value={requestFilter} onValueChange={setRequestFilter}>
							<SelectTrigger
								className='w-full sm:w-40'
								data-testid='select-request-filter'
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Requests</SelectItem>
								<SelectItem value='pending'>Pending</SelectItem>
								<SelectItem value='approved'>Approved</SelectItem>
								<SelectItem value='denied'>Denied</SelectItem>
							</SelectContent>
						</Select>
						<Input
							placeholder='Search by user or item...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className='flex-1 min-w-0'
							data-testid='input-search-requests'
						/>
					</div>
				</CardContent>
			</Card>

			{/* Requests Table */}
			<Card>
				<CardContent className='p-0'>
					<div className='overflow-x-auto'>
						<table className='w-full min-w-[768px]'>
							<thead className='bg-muted/50'>
								<tr>
									<th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
										User
									</th>
									<th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
										Item
									</th>
									<th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
										Qty
									</th>
									<th className='text-left py-3 px-4 font-medium text-foreground'>
										Date
									</th>
									<th className='text-left py-3 px-4 font-medium text-foreground'>
										Status
									</th>
									<th className='text-left py-3 px-4 font-medium text-foreground'>
										Actions
									</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-border'>
								{requestsLoading
									? [...Array(5)].map((_, i) => (
											<tr key={i}>
												{[...Array(6)].map((_, j) => (
													<td key={j} className='py-4 px-4'>
														<Skeleton className='h-8 w-full' />
													</td>
												))}
											</tr>
									  ))
									: filteredRequests?.map((request) => (
											<tr
												key={request.id}
												data-testid={`row-request-${request.id}`}
											>
												<td className='py-4 px-4'>
													<div className='flex items-center space-x-3'>
														<div className='w-8 h-8 bg-muted rounded-full flex items-center justify-center'>
															<span className='text-xs font-medium'>
																{(
																	(request as any).user
																		?.firstName?.[0] ||
																	(request as any).user
																		?.email?.[0] ||
																	'U'
																).toUpperCase()}
															</span>
														</div>
														<div>
															<p className='font-medium text-foreground'>
																{(request as any).user?.firstName ||
																	(request as any).user?.email ||
																	'Unknown'}
															</p>
															<p className='text-xs text-muted-foreground'>
																{(request as any).user?.email}
															</p>
														</div>
													</div>
												</td>
												<td className='py-4 px-4'>
													<div className='flex items-center space-x-3'>
														<img
															src={
																(request as any).stock?.imageUrl ||
																'https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100'
															}
															alt={(request as any).stock?.name}
															className='w-10 h-10 object-cover rounded'
														/>
														<div>
															<p className='font-medium text-foreground'>
																{(request as any).stock?.name}
															</p>
															<p className='text-xs text-muted-foreground'>
																{(request as any).stock?.code}
															</p>
														</div>
													</div>
												</td>
												<td className='py-4 px-4 text-foreground'>
													{request.quantity}
												</td>
												<td className='py-4 px-4 text-muted-foreground'>
													{request.createdAt
														? new Date(
																request.createdAt
														  ).toLocaleDateString()
														: 'Unknown date'}
												</td>
												<td className='py-4 px-4'>
													<Badge
														className={
															request.status === 'approved'
																? 'bg-green-100 text-green-800'
																: request.status === 'denied'
																? 'bg-red-100 text-red-800'
																: 'bg-yellow-100 text-yellow-800'
														}
													>
														{request.status}
													</Badge>
												</td>
												<td className='py-4 px-4'>
													{request.status === 'pending' ? (
														<div className='flex space-x-2'>
															<Button
																size='sm'
																className='bg-green-600 hover:bg-green-700 text-white'
																onClick={() =>
																	approveMutation.mutate({
																		id: request.id,
																	})
																}
																disabled={approveMutation.isPending}
																data-testid={`button-approve-${request.id}`}
															>
																<Check className='w-3 h-3 mr-1' />
																Approve
															</Button>
															<Button
																size='sm'
																variant='destructive'
																onClick={() =>
																	denyMutation.mutate({
																		id: request.id,
																	})
																}
																disabled={denyMutation.isPending}
																data-testid={`button-deny-${request.id}`}
															>
																<X className='w-3 h-3 mr-1' />
																Deny
															</Button>
														</div>
													) : (
														<span className='text-muted-foreground text-sm'>
															Completed
														</span>
													)}
												</td>
											</tr>
									  ))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</>
	);
};

export default RequestsTab;
