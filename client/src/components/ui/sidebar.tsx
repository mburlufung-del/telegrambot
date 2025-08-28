import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, BarChart3, Package, ShoppingCart, MessageSquare, Settings, Bot, FolderOpen, CreditCard, Truck, Send, TrendingUp, Headphones, Activity } from "lucide-react"
import { Link, useLocation } from "wouter"

const sidebarNavigation = [
  {
    title: "Dashboard",
    href: "/",
    icon: BarChart3
  },
  {
    title: "Products",
    href: "/products",
    icon: Package
  },
  {
    title: "Categories",
    href: "/categories",
    icon: FolderOpen
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart
  },
  {
    title: "Inquiries",
    href: "/inquiries",
    icon: MessageSquare
  },
  {
    title: "Payment Methods",
    href: "/payment-methods",
    icon: CreditCard
  },
  {
    title: "Delivery Methods",
    href: "/delivery-methods",
    icon: Truck
  },
  {
    title: "Broadcast",
    href: "/broadcast",
    icon: Send
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: TrendingUp
  },
  {
    title: "Operator Support",
    href: "/operator-support",
    icon: Headphones
  },
  {
    title: "Bot Settings",
    href: "/bot-settings",
    icon: Bot
  }
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation()

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            TeleShop Admin v2.0
          </h2>
          <div className="space-y-1">
            {sidebarNavigation.map((item) => {
              const Icon = item.icon
              const isActive = location === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button 
                    variant={isActive ? "secondary" : "ghost"} 
                    className="w-full justify-start"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MobileSidebar() {
  const [location] = useLocation()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              TeleShop Admin
            </h2>
            <div className="space-y-1">
              {sidebarNavigation.map((item) => {
                const Icon = item.icon
                const isActive = location === item.href
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button 
                      variant={isActive ? "secondary" : "ghost"} 
                      className="w-full justify-start"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}