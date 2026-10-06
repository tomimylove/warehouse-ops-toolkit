import type { ReactNode } from 'react';
import { usePermissions } from '../../app/PermissionsContext';
import { CommentThread } from '../comments/CommentThread';
import { announcementsApi } from './api';
import type { AnnouncementComment } from './types';

export function AnnouncementComments({
  announcementId,
  header,
  className,
}: {
  announcementId: string;
  // The announcement's own title/author/cover/body — rendered inside this
  // component's scroll container (above the thread) rather than passed in
  // as a sibling, so the floating composer below can be positioned
  // relative to the one shared scroll area that holds both.
  header?: ReactNode;
  className?: string;
}) {
  const { user, has } = usePermissions();

  return (
    <CommentThread<AnnouncementComment>
      threadKey={announcementId}
      header={header}
      title="Discussion"
      className={className}
      currentUserId={user?.id}
      canDeleteComment={() => has('announcements:delete')}
      api={{
        list: () => announcementsApi.listComments(announcementId),
        create: (text, replyToId) => announcementsApi.createComment(announcementId, text, replyToId),
        update: (commentId, text) => announcementsApi.updateComment(announcementId, commentId, text),
        remove: (commentId) => announcementsApi.removeComment(announcementId, commentId),
        toggleReaction: (commentId, emoji) => announcementsApi.toggleCommentReaction(announcementId, commentId, emoji),
      }}
    />
  );
}
