import { useState, useEffect } from 'react';

export function useAuth() {
	// ToDo : Proper type for user
	const [user, setUser] = useState<any | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		checkAuthStatus();
	}, []);

	const checkAuthStatus = async () => {
		try {
			const response = await fetch('/api/auth/me', {
				credentials: 'include',
			});

			if (response.ok) {
				const userData = await response.json();
				setUser(userData.user);
			} else {
				setUser(null);
			}
		} catch (error) {
			console.error('Error checking auth status:', error);
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	const signIn = async (email: string, password: string) => {
		try {
			const response = await fetch('/api/auth/signin', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ email, password }),
			});

			const result = await response.json();

			if (response.ok) {
				setUser(result.user);
				return { error: null };
			} else {
				return { error: result };
			}
		} catch (error) {
			return { error: { message: 'Network error occurred' } };
		}
	};

	const signUp = async (
		email: string,
		password: string,
		firstName?: string,
		lastName?: string
	) => {
		try {
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					email,
					password,
					firstName,
					lastName,
				}),
			});

			const result = await response.json();

			if (response.ok) {
				return { error: null };
			} else {
				return { error: result };
			}
		} catch (error) {
			return { error: { message: 'Network error occurred' } };
		}
	};

	const signOut = async () => {
		try {
			const response = await fetch('/api/auth/signout', {
				method: 'POST',
				credentials: 'include',
			});

			if (response.ok) {
				setUser(null);
				return { error: null };
			} else {
				const result = await response.json();
				return { error: result };
			}
		} catch (error) {
			return { error: { message: 'Network error occurred' } };
		}
	};

	return {
		user,
		loading,
		isAuthenticated: !!user,
		isAdmin: user?.is_admin ?? false,
		signIn,
		signUp,
		signOut,
		checkAuthStatus,
	};
}
