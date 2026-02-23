import { Moon, Sun } from "lucide-react"
import { useTheme } from "./ThemeProvider"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full p-2 bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors relative h-9 w-9 flex items-center justify-center border border-border"
            title={`Alternar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
            <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
            <span className="sr-only">Alternar tema</span>
        </button>
    )
}
