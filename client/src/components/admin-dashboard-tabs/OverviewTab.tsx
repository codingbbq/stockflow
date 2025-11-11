import { AlertTriangle, Box, Clock, Users, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stock } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const OverviewTab = () => {
	const { isAdmin, isAuthenticated, loading } = useAuth();
	const { toast } = useToast();
	const queryClient = useQueryClient();

	// All hooks must be called before any conditional returns
	const { data, isLoading: stocksLoading } = useQuery<{ stocks: Stock[]; total: number }>({
		queryKey: ['/api/stocks'],
		enabled: isAuthenticated && isAdmin, // Only fetch if authorized
	});

	const stocks = data?.stocks ?? [];
	const totalPages = data?.total ?? 0;

	const { data: stats, isLoading: statsLoading } = useQuery<{
		totalStockItems: number;
		pendingRequests: number;
		lowStockItems: number;
		totalUsers: number;
	}>({
		queryKey: ['/api/admin/dashboard/stats'],
		enabled: isAuthenticated && isAdmin, // Only fetch if authorized
	});

	const { data: requests, isLoading: requestsLoading } = useQuery<any[]>({
		queryKey: ['/api/admin/requests'],
		enabled: isAuthenticated && isAdmin, // Only fetch if authorized
	});

	return (
		<>
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
				<Card>
					<CardContent className='p-4 sm:p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-muted-foreground text-sm'>Total Stock Items</p>
								<p
									className='text-xl sm:text-2xl font-bold text-foreground'
									data-testid='stat-total-stock'
								>
									{statsLoading ? (
										<Skeleton className='h-8 w-16' />
									) : (
										stats?.totalStockItems || 0
									)}
								</p>
							</div>
							<Box className='w-6 h-6 sm:w-8 sm:h-8 text-primary' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-4 sm:p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-muted-foreground text-sm'>Pending Requests</p>
								<p
									className='text-xl sm:text-2xl font-bold text-foreground'
									data-testid='stat-pending-requests'
								>
									{statsLoading ? (
										<Skeleton className='h-8 w-16' />
									) : (
										stats?.pendingRequests || 0
									)}
								</p>
							</div>
							<Clock className='w-6 h-6 sm:w-8 sm:h-8 text-yellow-600' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-4 sm:p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-muted-foreground text-sm'>Low Stock Items</p>
								<p
									className='text-xl sm:text-2xl font-bold text-foreground'
									data-testid='stat-low-stock'
								>
									{statsLoading ? (
										<Skeleton className='h-8 w-16' />
									) : (
										stats?.lowStockItems || 0
									)}
								</p>
							</div>
							<AlertTriangle className='w-6 h-6 sm:w-8 sm:h-8 text-red-600' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-4 sm:p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-muted-foreground text-sm'>Total Users</p>
								<p
									className='text-xl sm:text-2xl font-bold text-foreground'
									data-testid='stat-total-users'
								>
									{statsLoading ? (
										<Skeleton className='h-8 w-16' />
									) : (
										stats?.totalUsers || 0
									)}
								</p>
							</div>
							<Users className='w-6 h-6 sm:w-8 sm:h-8 text-green-600' />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
				<Card>
					<CardHeader>
						<CardTitle>Recent Requests</CardTitle>
					</CardHeader>
					<CardContent>
						{requestsLoading ? (
							<div className='space-y-3'>
								{[...Array(3)].map((_, i) => (
									<Skeleton key={i} className='h-12 w-full' />
								))}
							</div>
						) : (
							<div className='space-y-4'>
								{requests?.slice(0, 5).map((request) => (
									<div
										key={request.id}
										className='flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 space-y-2 sm:space-y-0'
									>
										<div className='flex items-center space-x-3'>
											<div className='w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded-full flex items-center justify-center shrink-0'>
												<span className='text-xs font-medium'>
													{(
														request.user?.firstName?.[0] ||
														request.user?.email?.[0] ||
														'U'
													).toUpperCase()}
												</span>
											</div>
											<div>
												<p className='text-sm font-medium text-foreground'>
													{(request as any).user?.firstName ||
														(request as any).user?.email ||
														'Unknown'}
												</p>
												<p className='text-xs text-muted-foreground'>
													{(request as any).stock?.name} (
													{request.quantity} qty)
												</p>
											</div>
										</div>
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
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Stock Alerts</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{stocksLoading ? (
								<div className='space-y-3'>
									{[...Array(3)].map((_, i) => (
										<Skeleton key={i} className='h-12 w-full' />
									))}
								</div>
							) : (
								stocks
									?.filter((stock) => stock.quantity <= 5)
									.map((stock) => (
										<div
											key={stock.id}
											className={`flex items-center space-x-3 p-3 rounded-lg ${
												stock.quantity === 0 ? 'bg-red-50' : 'bg-yellow-50'
											}`}
										>
											{stock.quantity === 0 ? (
												<X className='text-red-500 w-5 h-5' />
											) : (
												<AlertTriangle className='text-yellow-500 w-5 h-5' />
											)}
											<div>
												<p className='text-sm font-medium text-foreground'>
													{stock.name}{' '}
													{stock.quantity === 0
														? 'out of stock'
														: 'low stock'}
												</p>
												<p className='text-xs text-muted-foreground'>
													{stock.code} • {stock.quantity} remaining
												</p>
											</div>
										</div>
									))
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
};

export default OverviewTab;
