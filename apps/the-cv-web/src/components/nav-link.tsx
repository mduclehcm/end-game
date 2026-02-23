import { Link } from "react-router-dom";

export function NavLink({ children, to, ...props }: React.ComponentProps<typeof Link>) {
	return (
		<Link to={to} {...props} state={{ internal: true }}>
			{children}
		</Link>
	);
}
