import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Logger } from "@/lib/logger";

export interface AppState {
	theme: "light" | "dark";
	toggleTheme: () => void;
}

const logger = new Logger("AppStore");

export const useAppStore = create<AppState>()(
	subscribeWithSelector((set) => ({
		theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
		toggleTheme: () => {
			const newTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
			logger.info(`toggling theme to "${newTheme}"`);
			document.documentElement.classList.toggle("dark", newTheme === "dark");
			localStorage.setItem("theme", newTheme);

			set({ theme: newTheme });
		},
	})),
);
