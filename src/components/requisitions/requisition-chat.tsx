"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  useListKaizen AdminDiscussionsApiV1DiscussionsKaizen AdminsKaizen AdminIdGet,
  useGetThreadedCommentsApiV1DiscussionsDiscussionIdThreadedGet,
  useAddCommentApiV1DiscussionsKaizen AdminsKaizen AdminIdCommentsPost,
} from "@/lib/generated/requisition/discussions-v1/discussions-v1";
import { Chat } from "@/components/chat/chat";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatToolbar, ChatToolbarTextarea, ChatToolbarAddon, ChatToolbarButton } from "@/components/chat/chat-toolbar";
import { ChatEvent, ChatEventAddon, ChatEventBody, ChatEventTitle, ChatEventContent, ChatEventAvatar, ChatEventTime } from "@/components/chat/chat-event";
import { PERMISSION, useAuthorization } from "@/lib/authorization";
import { useAuth } from "@/hooks/use-auth";
import { ProfilePicture } from "@/components/ui/profile-picture";
import { Send, Loader2, Lock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { CommentThread, CommentType } from "@/lib/generated/requisition/models";
import { extractItems } from "@/lib/list-response";
import { cn } from "@/lib/utils";

interface Kaizen AdminChatProps {
  requisitionId: string;
}

export function Kaizen AdminChat({ requisitionId }: Kaizen AdminChatProps) {
  const { hasPermission } = useAuthorization();
  const { user } = useAuth();
  const canWrite = hasPermission(PERMISSION.DISCUSSIONS_WRITE);
  const currentUserId = user?.id;
  const [selectedDiscussion, setSelectedDiscussion] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: discussionsData } = useListKaizen AdminDiscussionsApiV1DiscussionsKaizen AdminsKaizen AdminIdGet(requisitionId);
  const discussions = extractItems<{ id: string }>(discussionsData, "discussions");

  const { data: threadedComments, refetch: refetchComments } = useGetThreadedCommentsApiV1DiscussionsDiscussionIdThreadedGet(
    selectedDiscussion ?? "",
    { query: { enabled: !!selectedDiscussion } }
  );

  const { mutate: addComment, isPending: isSending } = useAddCommentApiV1DiscussionsKaizen AdminsKaizen AdminIdCommentsPost({
    mutation: {
      onSuccess: () => {
        setMessage("");
        if (selectedDiscussion) refetchComments();
        toast.success("Comment posted");
      },
      onError: () => {
        toast.error("Failed to post comment");
      },
    },
  });

  useEffect(() => {
    if (discussions.length > 0 && !selectedDiscussion) {
      setSelectedDiscussion(discussions[0].id);
    }
  }, [discussions, selectedDiscussion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadedComments]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    addComment({
      requisitionId,
      data: {
        discussion_id: selectedDiscussion || undefined,
        content: message,
        comment_type: "comment" as CommentType,
        visibility: "public",
      },
    });
  };

  const formatTime = (iso: string | undefined): string => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  };

  const renderComment = (thread: CommentThread, depth = 0) => {
    const comment = thread.comment;
    const isOwn = !!currentUserId && comment.author_id === currentUserId;
    const authorName = comment.author_name || "Unknown";
    const firstName = authorName.split(" ")[0];
    const lastName = authorName.split(" ")[1];

    return (
      <div key={comment.id} className={cn(depth > 0 && "ml-8 mt-2")}>
        <div
          className={cn(
            "flex gap-2 items-end",
            isOwn ? "flex-row-reverse" : "flex-row",
          )}
        >
          <ProfilePicture
            firstName={firstName}
            lastName={lastName}
            size="sm"
            className="shrink-0 mb-1"
          />
          <div
            className={cn(
              "flex flex-col max-w-[75%]",
              isOwn ? "items-end" : "items-start",
            )}
          >
            <div
              className={cn(
                "text-xs text-muted-foreground px-1 mb-0.5",
                isOwn ? "text-right" : "text-left",
              )}
            >
              {isOwn ? "You" : authorName}
              {" · "}
              {formatTime(comment.created_at ?? undefined)}
            </div>
            <div
              className={cn(
                "rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words shadow-sm",
                isOwn
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm",
              )}
            >
              {comment.content}
            </div>
          </div>
        </div>

        {thread.replies && thread.replies.length > 0 && (
          <div className="space-y-2 mt-2">
            {thread.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Link
          href={`/requisitions/${requisitionId}/discussion`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Open full view
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      <Chat className="h-[600px] border rounded-lg">
        <ChatMessages>
          {threadedComments && threadedComments.length > 0 ? (
            <div className="space-y-3">
              {threadedComments.map((thread) => renderComment(thread))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div className="space-y-2">
                <p className="text-muted-foreground">No comments yet</p>
                <p className="text-sm text-muted-foreground">
                  {canWrite ? "Start the conversation below" : "No one has commented on this requisition yet."}
                </p>
              </div>
            </div>
          )}
        </ChatMessages>

        {canWrite ? (
          <ChatToolbar>
            <ChatToolbarTextarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onSubmit={handleSendMessage}
              placeholder="Write a message..."
              disabled={isSending}
            />

            <ChatToolbarAddon align="inline-end">
              <ChatToolbarButton onClick={handleSendMessage} disabled={!message.trim() || isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </ChatToolbarButton>
            </ChatToolbarAddon>
          </ChatToolbar>
        ) : (
          <div className="flex items-center gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            You have read-only access to this discussion.
          </div>
        )}
      </Chat>
    </div>
  );
}
