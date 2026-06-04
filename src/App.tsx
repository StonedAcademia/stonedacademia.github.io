import { useMemo, type ReactNode } from "react";

import { AboutPage } from "@/components/pages/about-page";
import { BlogPage } from "@/components/pages/blog-page";
import { NotFoundPage } from "@/components/pages/not-found-page";
import { SiteHeader } from "@/components/shell/site-header";
import { ThemeSwitcher } from "@/components/shell/theme-switcher";
import { posts } from "@/lib/blog";
import { usePathname } from "@/lib/navigation";
import { useTheme } from "@/lib/themes";

export default function App() {
  const { pathname, navigate } = usePathname();
  const { theme, setTheme } = useTheme();
  const activePost = useMemo(() => {
    const match = pathname.match(/^\/blog\/([^/]+)\.md$/);
    return match ? posts.find((post) => post.slug === match[1]) : undefined;
  }, [pathname]);

  let page: ReactNode;

  if (pathname === "/") {
    page = <AboutPage navigate={navigate} sortedPosts={posts} />;
  } else if (activePost) {
    page = <BlogPage navigate={navigate} post={activePost} />;
  } else {
    page = <NotFoundPage navigate={navigate} path={pathname} />;
  }

  return (
    <>
      <ThemeSwitcher setTheme={setTheme} theme={theme} />
      <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <SiteHeader navigate={navigate} />
        {page}
      </main>
    </>
  );
}
