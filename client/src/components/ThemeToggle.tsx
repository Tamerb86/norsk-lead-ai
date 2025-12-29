import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-lg"
        >
          {theme === "dark" ? (
            <Moon className="h-4 w-4 text-yellow-400" />
          ) : (
            <Sun className="h-4 w-4 text-orange-500" />
          )}
          <span className="sr-only">Bytt tema</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{theme === "dark" ? "Bytt til lyst tema" : "Bytt til mørkt tema"}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function ThemeToggleDropdown() {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
          {theme === "dark" ? (
            <Moon className="h-4 w-4 text-yellow-400" />
          ) : (
            <Sun className="h-4 w-4 text-orange-500" />
          )}
          <span className="sr-only">Bytt tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={toggleTheme}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Lyst</span>
          {theme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Mørkt</span>
          {theme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
