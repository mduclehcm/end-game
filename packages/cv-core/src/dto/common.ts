export interface ListResponse<T> {
	data: T[];
}

export interface SingleResponse<T> {
	data: T;
}

export interface DeleteItemResponse {
	success: boolean;
}
