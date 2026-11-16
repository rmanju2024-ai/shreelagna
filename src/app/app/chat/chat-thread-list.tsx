"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChatAvatar } from "@/app/app/chat/chat-avatar";

export type ChatThreadRow = {
  id: string;
  name: string;
  photo: string | null;
  stamp: string;
  preview: string;
  unread: string;
};

export function ChatThreadList({
  threads,
  hrefFor,
  hrefBase,
  activeId,
}: {
  threads: ChatThreadRow[];
  hrefFor?: (id: string) => string;
  hrefBase?: string;
  activeId?: string | null;
}) {
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (hrefFor || hrefBase) return;
    for (const thread of threads.slice(0, 8)) {
      router.prefetch(`/app/chat/${thread.id}`);
    }
  }, [router, threads, hrefFor, hrefBase]);

  function threadHref(id: string) {
    if (hrefFor) return hrefFor(id);
    if (hrefBase) {
      const q = new URLSearchParams(hrefBase.split("?")[1] ?? "");
      q.set("peek", "inbox");
      q.set("tab", "chats");
      q.set("thread", id);
      q.delete("section");
      return `${hrefBase.split("?")[0]}?${q.toString()}`;
    }
    return `/app/chat/${id}`;
  }

  return (
    <ul className="wc-list">
      {threads.map((thread) => {
        const href = threadHref(thread.id);
        const on = hrefFor ? thread.id === activeId : path === href;
        return (
          <li key={thread.id}>
            <Link
              href={href}
              prefetch
              scroll={false}
              className={`wa-row${on ? " is-active" : ""}`}
              aria-current={on ? "page" : undefined}
            >
              <ChatAvatar name={thread.name} src={thread.photo} />
              <span className="wa-row-main">
                <span className="wa-row-top">
                  <b>{thread.name}</b>
                  <span className="wa-row-meta">
                    <time>{thread.stamp}</time>
                  </span>
                </span>
                <span className="wc-row-bottom">
                  <span className={`wa-preview${thread.unread ? " is-new" : ""}`}>{thread.preview}</span>
                  {thread.unread ? <span className="wa-unread">{thread.unread}</span> : null}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function ChatFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const open = /^\/app\/chat\/[^/]+/.test(path);
  return <div className={`wc-shell${open ? " has-thread" : ""}`}>{children}</div>;
}
