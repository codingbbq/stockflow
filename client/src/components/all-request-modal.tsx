import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Stock, StockRequest } from '@shared/schema';

interface AllRequestProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	stock?: Stock;
}

export function AllRequestModal({ open, onOpenChange, stock }: AllRequestProps) {
	const { data: requests, isLoading: requestsLoading } = useQuery<StockRequest[]>({
		queryKey: ['/api/stocks', stock?.id, 'requests'],
		enabled: open && !!stock?.id,
	});

	if (!stock) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className='max-w-4xl max-h-[90vh] overflow-auto'
				data-testid='modal-stock-detail'
			>
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
							{stock.name}
						</DialogTitle>
						<p
							className='text-muted-foreground'
							data-testid={`text-stock-detail-code-${stock.id}`}
						>
							Code: {stock.code}
						</p>
					</div>
				</DialogHeader>
				{/* Request History Table */}
				<div className='mt-2'>
					<h4 className='font-semibold text-foreground mb-4'>All Requests</h4>
					<div className='bg-muted/50 rounded-lg overflow-hidden'>
						{requestsLoading ? (
							<div className='p-4'>
								<Skeleton className='h-40 w-full' />
							</div>
						) : (
							<table className='w-full'>
								<thead className='bg-muted'>
									<tr>
										<th className='text-left py-2 px-4 text-sm font-medium text-foreground'>
											User
										</th>
										<th className='text-left py-2 px-4 text-sm font-medium text-foreground'>
											Quantity
										</th>
										<th className='text-left py-2 px-4 text-sm font-medium text-foreground'>
											Date
										</th>
										<th className='text-left py-2 px-4 text-sm font-medium text-foreground'>
											Status
										</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-border'>
                                    {requests && requests?.length <= 0 && (
                                        <tr>
                                            <td className='text-center p-10' colSpan={4}>No Data Found</td>
                                        </tr>
                                    )}
									{requests?.map((request) => (
										<tr
											key={request.id}
											data-testid={`row-request-${request.id}`}
										>
											<td className='py-2 px-4 text-sm text-foreground'>
												{(request as any).user?.firstName ||
													(request as any).user?.email ||
													'Unknown'}
											</td>
											<td className='py-2 px-4 text-sm text-foreground'>
												{request.quantity}
											</td>
											<td className='py-2 px-4 text-sm text-muted-foreground'>
												{request.createdAt
													? new Date(
															request.createdAt
													  ).toLocaleDateString()
													: 'Unknown date'}
											</td>
											<td className='py-2 px-4'>
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
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
