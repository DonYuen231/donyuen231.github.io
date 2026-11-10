export const SITE = {
  name: 'Don Yuen',
  url: 'https://donyuen231.github.io',
  email: 'donyuen231@gmail.com',
  github: 'https://github.com/DonYuen231',
  linkedin: 'https://www.linkedin.com/in/donyuen231/',
} as const;

export interface MenuItem {
  label: string;
  href: string;
}

export function menuItems(showNotes: boolean): MenuItem[] {
  return [
    { label: 'Work', href: '/projects/' },
    { label: 'About', href: '/about/' },
    { label: 'Experience', href: '/experience/' },
    ...(showNotes ? [{ label: 'Notes', href: '/notes/' }] : []),
    { label: 'Resume', href: '/resume/' },
    { label: 'Contact', href: '#contact' },
  ];
}
