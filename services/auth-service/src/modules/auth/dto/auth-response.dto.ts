export interface AuthResponseDto {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	user: {
		id: string;
		email: string;
		username: string | null;
		displayName: string;
		avatarUrl: string | null;
	};
}

export interface RefreshBodyDto {
	refreshToken: string;
}

export interface LogoutBodyDto {
	refreshToken: string;
}
