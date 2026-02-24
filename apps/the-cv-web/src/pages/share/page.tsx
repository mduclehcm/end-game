import { PageErrorBoundary } from "./error.page";

export function Page(Component: React.ComponentType): React.ComponentType<React.ComponentProps<typeof Component>> {
	return function PageWithErrorBoundary(props: React.ComponentProps<typeof Component>) {
		return (
			<PageErrorBoundary>
				<Component {...props} />
			</PageErrorBoundary>
		);
	};
}
