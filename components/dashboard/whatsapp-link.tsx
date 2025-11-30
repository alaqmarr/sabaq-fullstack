'use client';

import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

interface WhatsAppLinkProps {
    href: string;
}

export function WhatsAppLink({ href }: WhatsAppLinkProps) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 py-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20 backdrop-blur-sm gap-1.5 w-full"
        >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            Join WhatsApp Group
        </a>
    );
}
