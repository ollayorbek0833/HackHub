import { DocPage, DocSection, TextLink } from "@/components/site-pages/doc-page";
import { pageMetadata, REPO_URL } from "@/lib/site";

// /privacy. Every statement here is checked against the code: the data model
// (prisma/schema.prisma), sign-in and its cookie (src/auth.ts, Auth.js
// defaults), password hashing (src/lib/password.ts), who sees a profile and
// its phone (/profile/[userId], lib/domain/profile.ts), what the published
// ranking shows (components/ranking), image uploads (lib/uploads) and hosting
// (deploy/, docs/04). The Cloudflare part (the cf_clearance cookie, its bot
// check and Web Analytics scripts) was checked on production on 28 Oct 2026:
// Cloudflare adds them at the edge, not the app. Change this page when any of
// those change.

export const metadata = pageMetadata({
  title: "Privacy",
  description:
    "What HackHub collects, why, who can see it, the cookies it uses, where the data is kept and how to ask for it to be deleted.",
  path: "/privacy",
});

const CONTENTS = [
  { id: "what-we-collect", title: "What we collect" },
  { id: "why", title: "Why we collect it" },
  { id: "who-sees-what", title: "Who sees what" },
  { id: "cookies", title: "Cookies" },
  { id: "hosting", title: "Hosting and processors" },
  { id: "retention", title: "Keeping and deleting data" },
  { id: "changes", title: "Changes to this page" },
];

function Cookie({ name }: { name: string }) {
  return (
    <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-small break-words max-sm:break-all">
      {name}
    </code>
  );
}

export default function PrivacyPage() {
  return (
    <DocPage
      title="Privacy"
      intro={
        <p>
          HackHub is a small open-source project. We collect only what it
          takes to run a hackathon, and we don&apos;t sell it, share it with
          advertisers or track you across sites.
        </p>
      }
      updated="28 October 2026"
      contents={CONTENTS}
    >
      <DocSection id="what-we-collect" title="What we collect">
        <ul>
          <li>
            <strong>Your account:</strong> your email address and your role
            (participant, judge or organizer). Your password is never stored:
            we keep only a bcrypt hash of it, which can check a password but
            can&apos;t be turned back into one.
          </li>
          <li>
            <strong>Your profile:</strong> your name and faculty, and if you
            add them, your skills, a short bio, links and a phone number. The
            phone is optional.
          </li>
          <li>
            <strong>What you do in events:</strong> the events you register
            for, the team you create or join, your team&apos;s submission (a
            project title, a description and a repository link), and, if you
            judge, the scores you give.
          </li>
          <li>
            <strong>Event images:</strong> the logo and banner an organizer
            uploads for an event. We convert each one to WebP, which also drops
            the photo&apos;s hidden metadata, such as where it was taken.
          </li>
        </ul>
        <p>
          We don&apos;t ask for your date of birth, address or any ID
          document, and we don&apos;t collect payment details: HackHub has no
          payments.
        </p>
      </DocSection>

      <DocSection id="why" title="Why we collect it">
        <ul>
          <li>
            Your email and password hash let you sign in, and let organizers
            reach the people at their event.
          </li>
          <li>
            Your name and faculty let organizers, judges and teammates know who
            you are. The rest of your profile helps people form teams.
          </li>
          <li>
            The optional phone lets the organizer of an event you registered
            for reach you during it.
          </li>
          <li>
            Registrations, teams, submissions and scores are the event itself:
            without them there&apos;s nothing to judge or rank.
          </li>
        </ul>
      </DocSection>

      <DocSection id="who-sees-what" title="Who sees what">
        <ul>
          <li>
            <strong>Profiles</strong> can be opened only by people who are
            signed in. They show your name, faculty, role, skills, bio and
            links. Visitors who aren&apos;t signed in can&apos;t open them.
          </li>
          <li>
            <strong>Your phone number</strong> is shown only to you and to the
            organizers of events you register for. Other organizers,
            participants and judges never see it.
          </li>
          <li>
            <strong>Your email address</strong> is shown only to you and to
            organizers, in their participant, team and user lists.
          </li>
          <li>
            <strong>Your team</strong>: teammates see each other&apos;s names
            and faculties. Judges see each team&apos;s name, its members&apos;
            names and its submission.
          </li>
          <li>
            <strong>Published rankings are public.</strong> Once an organizer
            publishes the results, anyone who opens the event page, signed in
            or not, sees each ranked team&apos;s name, its members&apos; names
            and its total. Single judges&apos; scores and per-criterion scores
            are never published.
          </li>
          <li>
            <strong>Event pages</strong>, with their images, are public.
          </li>
        </ul>
      </DocSection>

      <DocSection id="cookies" title="Cookies">
        <p>
          HackHub&apos;s own cookies are all for signing in. None of them can
          be read by scripts on the page.
        </p>
        <ul>
          <li>
            <Cookie name="__Secure-authjs.session-token" /> keeps you signed
            in. It&apos;s set when you log in and lasts up to 30 days, or
            until you log out.
          </li>
          <li>
            <Cookie name="__Host-authjs.csrf-token" /> protects the sign-in
            form against forged requests, and{" "}
            <Cookie name="__Secure-authjs.callback-url" /> remembers where to
            send you after you log in. Both are set on your first visit and
            are deleted when you close the browser.
          </li>
          <li>
            <Cookie name="cf_clearance" /> is set by Cloudflare (see below)
            when your browser passes its security check for automated
            traffic. Cloudflare sets its lifetime; on our site it lasts up to
            a year.
          </li>
        </ul>
        <p>
          Apart from Cloudflare&apos;s cookie-free Web Analytics (see below),
          we don&apos;t use analytics, advertising or tracking scripts or
          cookies. The fonts are served from our own server.
        </p>
      </DocSection>

      <DocSection id="hosting" title="Hosting and processors">
        <p>
          HackHub runs on our own server, with its database and uploaded
          images stored on that server. Like any website, the server keeps
          technical logs of requests, such as IP addresses and the pages
          asked for, to keep the site running and safe.
        </p>
        <p>
          Traffic reaches the server through <strong>Cloudflare</strong>,
          which handles the secure connection and protects the site from
          attacks. To do that, Cloudflare sees each request, and adds two
          small scripts of its own to our pages: one checks for automated
          traffic, and one counts page views and measures how fast pages load
          (Cloudflare Web Analytics, which uses no cookies and doesn&apos;t
          build a profile of you). Cloudflare&apos;s handling of this
          data is covered by its own privacy policy.
        </p>
        <p>We don&apos;t use any other service that receives your data.</p>
      </DocSection>

      <DocSection id="retention" title="Keeping and deleting data">
        <p>
          We keep your account and what you add to events until you ask us to
          delete it, so past events and their rankings stay complete.
        </p>
        <p>
          You can change your profile at any time on your Profile page, and
          remove the optional fields: skills, bio, links and phone. The app
          doesn&apos;t have a &ldquo;Delete my account&rdquo; button yet. To
          have your account deleted, or to get a copy of your data or a
          correction, open an issue on{" "}
          <TextLink href={`${REPO_URL}/issues/new/choose`}>GitHub</TextLink>{" "}
          and choose <strong>Question or request</strong>. Issues are public,
          so don&apos;t post your email, phone or password there: we&apos;ll
          agree on a way to confirm the account is yours before we act on it.
          More on the <TextLink href="/contact">Contact</TextLink> page.
        </p>
      </DocSection>

      <DocSection id="changes" title="Changes to this page">
        <p>
          If what we collect or how we use it changes, we&apos;ll update this
          page and the date at the top. The full history of this page is
          public in the project&apos;s repository on GitHub.
        </p>
      </DocSection>
    </DocPage>
  );
}
