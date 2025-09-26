import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { NavigationHeader } from '@/components/navigation-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Clock, CheckCircle, XCircle } from 'lucide-react';
import { StockRequestWithStock } from '@shared/types/StockRequestWithStock';

export default function UserDashboard() {
	const { user, isAuthenticated, loading } = useAuth();

	const { data: requests, isLoading } = useQuery<StockRequestWithStock[]>({
		queryKey: ['/api/requests/user'],
		enabled: isAuthenticated, // Only fetch if authenticated
	});

	// Redirect if not authenticated
	if (!loading && !isAuthenticated) {
		window.location.href = '/login';
		return null;
	}

	// Show loading while checking authentication
	if (loading) {
		return (
			<div className='min-h-screen bg-background flex items-center justify-center'>
				<div className='text-center'>
					<div className='w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
					<p className='text-muted-foreground'>Loading...</p>
				</div>
			</div>
		);
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'approved':
				return <CheckCircle className='w-4 h-4 text-green-600' />;
			case 'denied':
				return <XCircle className='w-4 h-4 text-red-600' />;
			default:
				return <Clock className='w-4 h-4 text-yellow-600' />;
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'approved':
				return 'bg-green-100 text-green-800';
			case 'denied':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-yellow-100 text-yellow-800';
		}
	};

	const stats = {
		total: requests?.length || 0,
		pending: requests?.filter((r) => r.status === 'pending').length || 0,
		approved: requests?.filter((r) => r.status === 'approved').length || 0,
		denied: requests?.filter((r) => r.status === 'denied').length || 0,
	};

	return (
		<div className='min-h-screen bg-background'>
			<NavigationHeader />

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8'>
				<div className='mb-4 sm:mb-6 lg:mb-8'>
					<h1 className='text-2xl sm:text-3xl font-bold text-foreground'>My Dashboard</h1>
					<p className='text-sm sm:text-base text-muted-foreground truncate'>
						Welcome back, {user?.first_name || user?.email}
					</p>
				</div>

				{/* Stats Cards */}
				<div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8'>
					<Card>
						<CardContent className='p-3 sm:p-4 lg:p-6'>
							<div className='flex items-center justify-between'>
								<div className='min-w-0 flex-1'>
									<p className='text-muted-foreground text-xs sm:text-sm truncate'>
										Total Requests
									</p>
									<p
										className='text-lg sm:text-xl lg:text-2xl font-bold text-foreground'
										data-testid='stat-total-requests'
									>
										{stats.total}
									</p>
								</div>
								<ClipboardList className='w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary shrink-0' />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-muted-foreground text-xs sm:text-sm truncate'>
										Pending
									</p>
									<p
										className='text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600'
										data-testid='stat-pending-requests'
									>
										{stats.pending}
									</p>
								</div>
								<Clock className='w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-600 shrink-0' />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-3 sm:p-4 lg:p-6'>
							<div className='flex items-center justify-between'>
								<div className='min-w-0 flex-1'>
									<p className='text-muted-foreground text-xs sm:text-sm truncate'>
										Approved
									</p>
									<p
										className='text-lg sm:text-xl lg:text-2xl font-bold text-green-600'
										data-testid='stat-approved-requests'
									>
										{stats.approved}
									</p>
								</div>
								<CheckCircle className='w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600 shrink-0' />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-3 sm:p-4 lg:p-6'>
							<div className='flex items-center justify-between'>
								<div className='min-w-0 flex-1'>
									<p className='text-muted-foreground text-xs sm:text-sm truncate'>
										Denied
									</p>
									<p
										className='text-lg sm:text-xl lg:text-2xl font-bold text-red-600'
										data-testid='stat-denied-requests'
									>
										{stats.denied}
									</p>
								</div>
								<XCircle className='w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-red-600 shrink-0' />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Requests Table */}
				<Card>
					<CardHeader>
						<CardTitle>My Stock Requests</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className='space-y-4'>
								{[...Array(5)].map((_, i) => (
									<Skeleton key={i} className='h-16 w-full' />
								))}
							</div>
						) : requests && requests.length > 0 ? (
							<div className='overflow-x-auto'>
								<table className='w-full min-w-[640px]'>
									<thead>
										<tr className='border-b border-border'>
											<th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
												Item
											</th>
                      <th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
												Qty
											</th>
											<th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
												Reason
											</th>
                      <th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
												Date
											</th>
											<th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
												Status
											</th>
											<th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
												Notes
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-border'>
										{requests.map((request) => (
											<tr
												key={request.id}
												data-testid={`row-user-request-${request.id}`}
											>
												<td className='py-2 px-2 sm:py-4 sm:px-4'>
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
												</td>
                        <td className='py-2 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm text-foreground'>
													{request.quantity}
												</td>
												<td className='py-2 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm text-foreground'>
													{request.reason}
												</td>
												<td className='py-2 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm text-muted-foreground'>
													{request.createdAt
														? new Date(
																request.createdAt
														  ).toLocaleDateString(undefined, {
																month: 'short',
																day: 'numeric',
														  })
														: '-'}
												</td>
												<td className='py-2 px-2 sm:py-4 sm:px-4'>
													<div className='flex items-center space-x-1 sm:space-x-2'>
														<div className='sm:hidden'>
															{getStatusIcon(request.status)}
														</div>
														<Badge
															className={`text-xs ${getStatusBadge(
																request.status
															)}`}
														>
															{request.status}
														</Badge>
													</div>
												</td>
												<td className='py-2 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm text-muted-foreground'>
													<div className='truncate max-w-[100px] sm:max-w-[200px]'>
														{request.adminNotes || '-'}
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<div className='text-center py-12'>
								<ClipboardList className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
								<p className='text-xl font-semibold text-foreground mb-2'>
									No requests yet
								</p>
								<p className='text-muted-foreground'>
									Start by requesting some stock items
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
