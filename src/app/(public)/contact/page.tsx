import { BugIcon, CalendarPlusIcon, MessageCircleQuestionIcon, ShieldIcon } from "lucide-react";
import type { ReactNode } from "react";

import { DocPage, TextLink } from "@/components/site-pages/doc-page";
import { pageMetadata, REPO_URL } from "@/lib/site";

// /contact: every way to reach the HackHub team goes through the public GitHub
// repository (landing plan: no email, no form). Security reports go through
// SECURITY.md's private advisory, never a public issue.

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Report a bug, ask a question, ask to run an event on HackHub, or report a security problem privately. Everything goes through GitHub.",
  path: "/contact",
});

const ISSUES = `${REPO_URL}/issues`;
const NEW_ISSUE = `${REPO_URL}/issues/new/choose`;

export default function ContactPage() {
  return (
    <DocPage
      title="Contact"
      intro={
        <p>
          HackHub is an open-source project, and we talk in the open: every way
          to reach us goes through our GitHub repository. You need a free
          GitHub account to open an issue.
        </p>
      }
    >
      <ul className="flex flex-col divide-y">
        <Channel
          id="bugs"
          icon={<BugIcon />}
          title="Found a bug?"
          link={{ href: NEW_ISSUE, label: "Open a bug report" }}
        >
          <p>
            Open an issue and choose <strong>Bug report</strong>. Say what you
            did, what you expected and what happened instead, and add a
            screenshot if you can. Check the{" "}
            <TextLink href={ISSUES}>open issues</TextLink> first: someone may
            have reported it already.
          </p>
        </Channel>

        <Channel
          id="questions"
          icon={<MessageCircleQuestionIcon />}
          title="Questions and ideas"
          link={{ href: NEW_ISSUE, label: "Ask a question" }}
        >
          <p>
            Open an issue and choose <strong>Question or request</strong>, or{" "}
            <strong>Feature request</strong> for an idea. That&apos;s also the
            place for anything about your account or your data; see{" "}
            <TextLink href="/privacy#retention">Privacy</TextLink>.
          </p>
        </Channel>

        <Channel
          id="run-an-event"
          icon={<CalendarPlusIcon />}
          title="Want to run an event?"
          link={{ href: NEW_ISSUE, label: "Ask to run an event" }}
        >
          <p>
            Organizer accounts are set up by the HackHub team. Open an issue,
            choose <strong>Question or request</strong> and pick &ldquo;I&apos;d
            like to run an event&rdquo;. Tell us who is organizing (a club,
            company, community or university) and roughly when.
          </p>
        </Channel>

        <Channel
          id="security"
          icon={<ShieldIcon />}
          title="Security problems"
          link={{
            href: `${REPO_URL}/blob/master/SECURITY.md`,
            label: "Read the security policy",
          }}
        >
          <p>
            Please don&apos;t open a public issue. Follow our security policy,
            which explains how to report a vulnerability privately through
            GitHub.
          </p>
        </Channel>
      </ul>

      <p className="mt-8 border-t pt-8 text-pretty text-muted-foreground">
        Issues are public. Never post your password, phone number or email
        address in one: if we need to confirm an account is yours, we&apos;ll
        agree on a way in the replies.
      </p>
    </DocPage>
  );
}

function Channel({
  id,
  icon,
  title,
  link,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  link: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <li>
      <section
        id={id}
        aria-labelledby={`${id}-heading`}
        className="flex scroll-mt-20 gap-4 py-8"
      >
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card text-primary [&_svg]:size-5"
        >
          {icon}
        </span>
        <div className="flex min-w-0 flex-col gap-3">
          <h2 id={`${id}-heading`} className="text-section-title">
            {title}
          </h2>
          <div className="text-body text-pretty">{children}</div>
          <a
            href={link.href}
            className="inline-flex min-h-11 w-fit items-center rounded-sm font-medium text-foreground underline underline-offset-4 outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {link.label}
            <span aria-hidden className="ml-1.5 inline-block no-underline">
              →
            </span>
          </a>
        </div>
      </section>
    </li>
  );
}
