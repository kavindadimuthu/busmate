// @busmate/ui — shared UI library
// Styles should be imported separately via "@busmate/ui/styles"

// ── Utilities ─────────────────────────────────────────────
export { cn } from "./lib/utils";

// ── Hooks ─────────────────────────────────────────────────
export { useMediaQuery, useMobile } from "./hooks";

// ── Base Components (shadcn/ui primitives) ────────────────

// Accordion
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./components/accordion";

// Alert Dialog
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/alert-dialog";

// Avatar
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from "./components/avatar";

// Badge
export { Badge, badgeVariants } from "./components/badge";

// Button
export { Button, buttonVariants } from "./components/button";

// Calendar
export { Calendar, CalendarDayButton } from "./components/calendar";

// Card
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "./components/card";

// Checkbox
export { Checkbox } from "./components/checkbox";

// Collapsible
export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./components/collapsible";

// Command
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./components/command";

// Dialog
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./components/dialog";

// Dropdown Menu
export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./components/dropdown-menu";

// Input
export { Input } from "./components/input";

// Label
export { Label } from "./components/label";

// Popover
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "./components/popover";

// Progress
export { Progress } from "./components/progress";

// Radio Group
export { RadioGroup, RadioGroupItem } from "./components/radio-group";

// Scroll Area
export { ScrollArea, ScrollBar } from "./components/scroll-area";

// Select
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./components/select";

// Separator
export { Separator } from "./components/separator";

// Sheet
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./components/sheet";

// Skeleton
export { Skeleton } from "./components/skeleton";

// Slider
export { Slider } from "./components/slider";

// Sonner (Toast replacement)
export { Toaster } from "./components/sonner";

// Switch
export { Switch } from "./components/switch";

// Table
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./components/table";

// Tabs
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
} from "./components/tabs";

// Textarea
export { Textarea } from "./components/textarea";

// Toggle
export { Toggle, toggleVariants } from "./components/toggle";

// Toggle Group
export { ToggleGroup, ToggleGroupItem } from "./components/toggle-group";

// Tooltip
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./components/tooltip";

// ── Patterns ──────────────────────────────────────────────

// StatusBadge
export { StatusBadge } from "./patterns/status-badge";

// StatsCard
export { StatsCard, StatsCardGrid } from "./patterns/stats-card";

// Dialogs
export { ConfirmDialog, FormDialog, useDialog } from "./patterns/dialogs";
