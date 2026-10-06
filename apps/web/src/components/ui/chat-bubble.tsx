import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

// Adapted from shadcn-chat (jakobhoeg/shadcn-chat, MIT) — the "message"
// bubble primitives: a group wrapper (ChatBubble), avatar, the bubble
// itself with per-side rounding, a timestamp line, and a hover action
// wrapper that pins buttons to the bubble's outer edge instead of
// cramming them into the same flex row (that's what made the hand-rolled
// version misaligned).

const chatBubbleVariant = cva('group relative flex max-w-[75%] items-end gap-2', {
  variants: {
    variant: {
      received: 'self-start',
      sent: 'flex-row-reverse self-end',
    },
  },
  defaultVariants: { variant: 'received' },
});

interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof chatBubbleVariant> {}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(({ className, variant, children, ...props }, ref) => (
  <div ref={ref} className={cn(chatBubbleVariant({ variant }), className)} {...props}>
    {React.Children.map(children, (child) =>
      React.isValidElement(child) && typeof child.type !== 'string'
        ? React.cloneElement(child, { variant } as React.ComponentProps<typeof child.type>)
        : child,
    )}
  </div>
));
ChatBubble.displayName = 'ChatBubble';

interface ChatBubbleAvatarProps {
  src?: string;
  fallback: string;
  className?: string;
}

const ChatBubbleAvatar: React.FC<ChatBubbleAvatarProps> = ({ src, fallback, className }) => (
  <Avatar className={cn('size-7 shrink-0', className)}>
    {src && <AvatarImage src={src} alt="" />}
    <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
  </Avatar>
);

const chatBubbleMessageVariants = cva('max-w-full px-3.5 py-2 text-sm break-words whitespace-pre-wrap [&_a]:underline [&_p]:m-0 [&_p]:mb-1 [&_p:last-child]:mb-0', {
  variants: {
    variant: {
      received: 'bg-muted rounded-2xl rounded-bl-sm',
      sent: 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm',
    },
  },
  defaultVariants: { variant: 'received' },
});

interface ChatBubbleMessageProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof chatBubbleMessageVariants> {
  html?: string;
}

const ChatBubbleMessage = React.forwardRef<HTMLDivElement, ChatBubbleMessageProps>(
  ({ className, variant, html, children, ...props }, ref) =>
    html !== undefined ? (
      <div ref={ref} className={cn(chatBubbleMessageVariants({ variant, className }))} dangerouslySetInnerHTML={{ __html: html }} {...props} />
    ) : (
      <div ref={ref} className={cn(chatBubbleMessageVariants({ variant, className }))} {...props}>
        {children}
      </div>
    ),
);
ChatBubbleMessage.displayName = 'ChatBubbleMessage';

const ChatBubbleTimestamp: React.FC<React.HTMLAttributes<HTMLDivElement> & { timestamp: string }> = ({
  timestamp,
  className,
  ...props
}) => (
  <div className={cn('text-muted-foreground mt-1 px-1 text-[11px]', className)} {...props}>
    {timestamp}
  </div>
);

type ChatBubbleActionProps = React.ComponentProps<typeof Button> & { icon: React.ReactNode };

const ChatBubbleAction: React.FC<ChatBubbleActionProps> = ({ icon, className, variant = 'ghost', size = 'icon-sm', ...props }) => (
  <Button variant={variant} size={size} className={cn('rounded-full', className)} {...props}>
    {icon}
  </Button>
);

interface ChatBubbleActionWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'sent' | 'received';
}

// Floats above the bubble's top-right corner, slightly overlapping it —
// always on the right (Teams-style) regardless of own/received, since
// mirroring by side crowded the avatar and the name label on received
// messages and the "which side" inconsistency was its own complaint.
const ChatBubbleActionWrapper = React.forwardRef<HTMLDivElement, ChatBubbleActionWrapperProps>(
  ({ variant: _variant, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-background border-border absolute -top-3.5 right-2 z-10 flex items-center gap-0.5 rounded-full border px-0.5 py-0.5 opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
ChatBubbleActionWrapper.displayName = 'ChatBubbleActionWrapper';

export {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
  chatBubbleVariant,
  chatBubbleMessageVariants,
};
