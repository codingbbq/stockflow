import { BarChart3, Plus, History, SquarePen } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { AddStockModal } from '../add-stock-modal';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stock } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { StockDetailModal } from '../stock-detail-modal';
import { AllRequestModal } from '../all-request-modal';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';

const StockManagementTab = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [addStockModalOpen, setAddStockModalOpen] = useState(false);
	const [selectedStock, setSelectedStock] = useState<Stock | undefined>();
	const [allRequestModalOpen, setAllRequestModalOpen] = useState(false);
	const [stockDetailModalOpen, setStockDetailModalOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);

	const itemsPerPage = 8;
	const { data, isLoading: stocksLoading } = useQuery<{ stocks: Stock[]; totalPages: number }>({
		queryKey: ['/api/stocks', currentPage, itemsPerPage],
		queryFn: async () => {
			const res = await fetch(`/api/stocks?page=${currentPage}&limit=${itemsPerPage}`);
			if (!res.ok) throw new Error('Network response was not ok');
			return res.json();
		},
	});
	const stocks = data?.stocks ?? [];
	const totalPages = data?.totalPages ?? 0;

	return (
		<>
			<div className='flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0'>
				<div>
					<h2 className='text-xl sm:text-2xl font-bold text-foreground'>
						Stock Management
					</h2>
					<p className='text-sm sm:text-base text-muted-foreground'>
						Add, edit, and manage your inventory
					</p>
				</div>
				<Button
					onClick={() => { setSelectedStock(undefined); setAddStockModalOpen(true)}}
					data-testid='button-add-stock'
					className='w-full sm:w-auto'
				>
					<Plus className='w-4 h-4 mr-2' />
					<span className='sm:inline'>Add New Stock</span>
				</Button>
			</div>

			<Card>
				<CardContent className='p-0'>
					<div className='overflow-x-auto'>
						<table className='w-full min-w-[640px]'>
							<thead className='bg-muted/50'>
								<tr>
									<th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
										Image
									</th>
									<th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
										Name
									</th>
									<th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
										Code
									</th>
									<th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
										Quantity
									</th>
									<th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
										Status
									</th>
									<th className='text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm'>
										Actions
									</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-border'>
								{stocksLoading
									? [...Array(5)].map((_, i) => (
											<tr key={i}>
												{[...Array(6)].map((_, j) => (
													<td key={j} className='py-3 px-4'>
														<Skeleton className='h-8 w-full' />
													</td>
												))}
											</tr>
									  ))
									: stocks?.map((stock) => (
											<tr
												key={stock.id}
												data-testid={`row-stock-${stock.id}`}
											>
												<td className='py-3 px-4'>
													<img
														src={
															stock.imageUrl ||
															'https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100'
														}
														alt={stock.name}
														className='w-12 h-12 object-cover rounded-lg'
													/>
												</td>
												<td className='py-3 px-4 font-medium text-foreground'>
													{stock.name}
												</td>
												<td className='py-3 px-4 text-muted-foreground'>
													{stock.code}
												</td>
												<td className='py-3 px-4 text-foreground'>
													{stock.quantity}
												</td>
												<td className='py-3 px-4'>
													<Badge
														className={
															stock.quantity === 0
																? 'bg-red-100 text-red-800'
																: stock.quantity <= 5
																? 'bg-yellow-100 text-yellow-800'
																: 'bg-green-100 text-green-800'
														}
													>
														{stock.quantity === 0
															? 'Out of Stock'
															: stock.quantity <= 5
															? 'Low Stock'
															: 'In Stock'}
													</Badge>
												</td>
												<td className='py-3 px-4'>
													<div className='flex space-x-3'>
														<Tooltip>
															<TooltipTrigger>
																<Button
																	size='sm'
																	variant='outline'
																	onClick={() => {
																		setSelectedStock(stock);
																		setAllRequestModalOpen(
																			true
																		);
																	}}
																	data-testid={`button-view-stock-${stock.id}`}
																>
																	<History className='w-4 h-4' />
																</Button>
															</TooltipTrigger>
															<TooltipContent
																side='top'
																align='center'
															>
																View All Requests
															</TooltipContent>
														</Tooltip>

														<Tooltip>
															<TooltipTrigger>
																<Button
																	size='sm'
																	variant='outline'
																	onClick={() => {
																		setSelectedStock(stock);
																		setStockDetailModalOpen(
																			true
																		);
																	}}
																	data-testid={`button-view-stock-${stock.id}`}
																>
																	<BarChart3 className='w-4 h-4' />
																</Button>
															</TooltipTrigger>
															<TooltipContent
																side='top'
																align='center'
															>
																Stock History
															</TooltipContent>
														</Tooltip>

														<Tooltip>
															<TooltipTrigger>
																<Button
																	size='sm'
																	variant='outline'
																	onClick={() => {
																		setSelectedStock(stock);
																		setAddStockModalOpen(
																			true
																		);
																	}}
																	data-testid={`button-view-stock-${stock.id}`}
																>
																	<SquarePen className='w-4 h-4' />
																</Button>
															</TooltipTrigger>
															<TooltipContent
																side='top'
																align='center'
															>
																Update stock
															</TooltipContent>
														</Tooltip>
													</div>
												</td>
											</tr>
									  ))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>

			{totalPages > 1 && (
				<Pagination className='my-6'>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href='#'
								onClick={(e) => {
									e.preventDefault();
									if (currentPage > 1) setCurrentPage(currentPage - 1);
								}}
							/>
						</PaginationItem>
						{Array.from({ length: totalPages }).map((_, i) => (
							<PaginationItem key={i + 1}>
								<PaginationLink
									href='#'
									isActive={currentPage === i + 1}
									onClick={(e) => {
										e.preventDefault();
										setCurrentPage(i + 1);
									}}
								>
									{i + 1}
								</PaginationLink>
							</PaginationItem>
						))}
						<PaginationItem>
							<PaginationNext
								href='#'
								onClick={(e) => {
									e.preventDefault();
									if (currentPage < totalPages) setCurrentPage(currentPage + 1);
								}}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}

			<StockDetailModal
				open={stockDetailModalOpen}
				onOpenChange={setStockDetailModalOpen}
				stock={selectedStock}
			/>

			<AllRequestModal
				open={allRequestModalOpen}
				onOpenChange={setAllRequestModalOpen}
				stock={selectedStock}
			/>

			<AddStockModal open={addStockModalOpen} onOpenChange={setAddStockModalOpen} stock={selectedStock} />
		</>
	);
};

export default StockManagementTab;
