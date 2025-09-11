import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { NavigationHeader } from '@/components/navigation-header';
import { StockCard } from '@/components/stock-card';
import { RequestModal } from '@/components/request-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Search, Grid, List, Plus } from 'lucide-react';
import type { Stock } from '@shared/schema';

export default function PublicCatalog() {
	const { isAuthenticated } = useAuth();
	const { toast } = useToast();
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [requestModalOpen, setRequestModalOpen] = useState(false);
	const [selectedStock, setSelectedStock] = useState<Stock | undefined>();

	const { data: stocks, isLoading } = useQuery<Stock[]>({
		queryKey: ['/api/stocks'],
		queryFn: async () => {
			const res = await fetch('/api/stocks');
			if (!res.ok) throw new Error('Network response was not ok');
			return res.json();
		},
	});

	const filteredStocks = stocks?.filter((stock) => {
		const matchesSearch =
			stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			stock.code.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = selectedCategory === 'all' || stock.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	const categories = stocks
		? Array.from(new Set(stocks.map((s) => s.category).filter(Boolean)))
		: [];

	const handleRequestClick = (stock: Stock) => {
		setSelectedStock(stock);
		setRequestModalOpen(true);
	};

	const handleLoginClick = () => {
		window.location.href = '/api/login';
	};

	return (
		<div className='min-h-screen bg-background'>
			<NavigationHeader />

			{/* Hero Section */}
			<section className='bg-gradient-to-r from-primary to-chart-3 text-primary-foreground py-8 sm:py-12 lg:py-16'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
					<h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4'>
						Stock Catalog
					</h1>
					<p className='text-base sm:text-lg lg:text-xl text-primary-foreground/90 mb-4 sm:mb-6 lg:mb-8'>
						Browse available inventory and request items
					</p>
					<div className='max-w-sm sm:max-w-md mx-auto'>
						<div className='relative'>
							<Input
								type='text'
								placeholder='Search stocks...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='w-full pl-10 bg-card text-foreground border-0 shadow-lg'
								data-testid='input-search-stocks'
							/>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
						</div>
					</div>
				</div>
			</section>

			{/* Stock Grid */}
			<section className='py-6 sm:py-8 lg:py-12'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 sm:mb-8 space-y-4 lg:space-y-0'>
						<div>
							<h2 className='text-xl sm:text-2xl font-bold text-foreground'>
								Available Stock
							</h2>
							<p className='text-sm sm:text-base text-muted-foreground'>
								Browse and request inventory items
							</p>
						</div>
						<div className='flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4'>
							<Select value={selectedCategory} onValueChange={setSelectedCategory}>
								<SelectTrigger
									className='w-full sm:w-40'
									data-testid='select-category-filter'
								>
									<SelectValue placeholder='All Categories' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Categories</SelectItem>
									{categories.map((category) => (
										<SelectItem key={category} value={category!}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{isLoading ? (
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'>
							{[...Array(8)].map((_, i) => (
								<div
									key={i}
									className='bg-card rounded-lg border border-border p-4'
								>
									<Skeleton className='w-full h-48 mb-4' />
									<Skeleton className='h-4 w-3/4 mb-2' />
									<Skeleton className='h-4 w-1/2 mb-4' />
									<Skeleton className='h-10 w-full' />
								</div>
							))}
						</div>
					) : filteredStocks && filteredStocks.length > 0 ? (
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'>
							{filteredStocks.map((stock) => (
								<StockCard
									key={stock.id}
									stock={stock}
									onRequestClick={handleRequestClick}
									isAuthenticated={isAuthenticated}
									onLoginClick={handleLoginClick}
								/>
							))}
						</div>
					) : (
						<div className='text-center py-8 sm:py-12 px-4'>
							<div className='w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4'>
								<Search className='w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground' />
							</div>
							<p className='text-lg sm:text-xl font-semibold text-foreground mb-2'>
								No stocks found
							</p>
							<p className='text-sm sm:text-base text-muted-foreground'>
								Try adjusting your search or filter criteria
							</p>
						</div>
					)}
				</div>
			</section>

			<RequestModal
				open={requestModalOpen}
				onOpenChange={setRequestModalOpen}
				stocks={stocks || []}
				selectedStock={selectedStock}
			/>
		</div>
	);
}
