import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";

const sectionVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { delay: i * 0.05, duration: 0.25, ease: "easeOut" as const },
	}),
};

type AnimatedSectionProps = {
	index: number;
};

export function AnimatedSection({ index, children }: PropsWithChildren<AnimatedSectionProps>) {
	return (
		<motion.div custom={index} initial="hidden" animate="visible" variants={sectionVariants}>
			{children}
		</motion.div>
	);
}
