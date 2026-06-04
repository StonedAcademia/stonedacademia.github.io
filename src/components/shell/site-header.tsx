import { AtSign, BookOpenText, Home } from "lucide-react";

import { TextLink } from "@/components/shell/text-link";
import type { Navigate } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    icon: Home,
    label: "about",
    matches: (pathname: string) => pathname === "/",
  },
  {
    href: "/blog",
    icon: BookOpenText,
    label: "blog",
    matches: (pathname: string) =>
      pathname === "/blog" ||
      pathname === "/blog/" ||
      pathname.startsWith("/blog/"),
  },
  {
    href: "/contact",
    icon: AtSign,
    label: "contact",
    matches: (pathname: string) =>
      pathname === "/contact" || pathname === "/contact/",
  },
];

export function SiteHeader({
  navigate,
  pathname,
}: {
  navigate: Navigate;
  pathname: string;
}) {
  return (
    <header className="motion-header mb-12 flex items-center gap-4 text-xs text-muted-foreground">
      {navItems.map((item, itemIndex) => {
        const Icon = item.icon;
        const active = item.matches(pathname);

        return (
          <span className="inline-flex items-center gap-4" key={item.href}>
            {itemIndex > 0 ? (
              <span className="motion-separator">/</span>
            ) : null}
            <TextLink href={item.href} navigate={navigate}>
              <span
                aria-current={active ? "page" : undefined}
                className={cn(
                  "motion-nav-item inline-flex items-center gap-1",
                  active && "motion-nav-item-active text-primary",
                )}
              >
                <Icon className="motion-icon h-3.5 w-3.5" />
                {item.label}
              </span>
            </TextLink>
          </span>
        );
      })}
    </header>
  );
}
