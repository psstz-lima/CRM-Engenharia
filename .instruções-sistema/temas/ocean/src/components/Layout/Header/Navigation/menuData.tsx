import { HeaderItem } from "@/types/menu";

export const headerData: HeaderItem[] = [
  { label: "Homepage", href: "/" },
  { label: "Schedules", href: "/schedules" },
  { label: "Speakers", href: "/speakers" },
  {
    label: "Blog",
    href: "/blog",
    submenu: [
      { label: "Blog list", href: "/blog" },
      { label: "Blog details", href: "/blog/blog_1" },
    ],
  },
  { label: "Contact", href: "/contact" },
  { label: "Documentation", href: "/documentation" },
];  