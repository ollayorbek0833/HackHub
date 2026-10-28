import { DocPage, DocSection, TextLink } from "@/components/site-pages/doc-page";
import { pageMetadata, REPO_URL } from "@/lib/site";

// /terms: the rules for using HackHub, in plain language. Kept short and
// honest: a student-built, open-source project, provided as is.

export const metadata = pageMetadata({
  title: "Terms",
  description:
    "The rules for using HackHub: accounts, acceptable use, organizers' responsibility for their events, your content, and no warranty.",
  path: "/terms",
});

const CONTENTS = [
  { id: "using-hackhub", title: "Using HackHub" },
  { id: "accounts", title: "Your account" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "organizers", title: "Organizers and their events" },
  { id: "your-content", title: "Your content" },
  { id: "no-warranty", title: "No warranty" },
  { id: "changes", title: "Changes" },
  { id: "contact", title: "Contact" },
];

export default function TermsPage() {
  return (
    <DocPage
      title="Terms of use"
      intro={
        <p>
          These are the rules for using HackHub. By creating an account or
          using the site, you agree to them. How we handle your data is on the{" "}
          <TextLink href="/privacy">Privacy</TextLink> page.
        </p>
      }
      updated="28 October 2026"
      contents={CONTENTS}
    >
      <DocSection id="using-hackhub" title="Using HackHub">
        <p>
          HackHub is a free, open-source app for running hackathons, built by
          students. Anyone can browse open events. To register for an event,
          join a team, submit a project or judge, you need an account.
        </p>
      </DocSection>

      <DocSection id="accounts" title="Your account">
        <ul>
          <li>
            Use your own email address and a real name, so organizers and
            teammates know who you are.
          </li>
          <li>
            Keep your password to yourself. You&apos;re responsible for what
            happens under your account.
          </li>
          <li>One person, one account.</li>
          <li>
            Organizers decide who is a judge: they can switch an account
            between participant and judge.
          </li>
        </ul>
      </DocSection>

      <DocSection id="acceptable-use" title="Acceptable use">
        <p>Please don&apos;t:</p>
        <ul>
          <li>
            harass, threaten or impersonate anyone, or post hateful or
            sexual content;
          </li>
          <li>
            submit work that isn&apos;t yours or your team&apos;s, or that you
            don&apos;t have the right to share;
          </li>
          <li>
            try to see or change things your role doesn&apos;t allow, such as
            other teams&apos; scores before they&apos;re published;
          </li>
          <li>
            overload, scrape or attack the site, or look for weak spots
            without following our{" "}
            <TextLink href={`${REPO_URL}/blob/master/SECURITY.md`}>
              security policy
            </TextLink>
            .
          </li>
        </ul>
        <p>
          We may remove content or close accounts that break these rules.
        </p>
      </DocSection>

      <DocSection id="organizers" title="Organizers and their events">
        <p>
          Organizers run their own events. Each organizer is responsible for
          their event&apos;s description, dates and rules, the judging
          criteria and their weights, when registration and
          submissions open and close, and publishing the ranking.
        </p>
        <p>
          HackHub computes the ranking from the judges&apos; scores using the
          organizer&apos;s criteria, but prizes, disputes about results and
          anything that happens at the event itself are between the organizer
          and the people taking part.
        </p>
      </DocSection>

      <DocSection id="your-content" title="Your content">
        <p>
          You keep the rights to what you add: your profile, your team&apos;s
          project, and, for organizers, event descriptions and images. You let
          HackHub store and show it to the people who need it to run the
          event, as described on the{" "}
          <TextLink href="/privacy">Privacy</TextLink> page. Published
          rankings, with team and member names, are public.
        </p>
        <p>
          Your project&apos;s code stays in your own repository: HackHub only
          keeps its title, description and link. Organizers should upload
          only images they have the right to use.
        </p>
      </DocSection>

      <DocSection id="no-warranty" title="No warranty">
        <p>
          HackHub is a student project, provided as is, without any warranty.
          We do our best to keep it running and your data safe, but we
          can&apos;t promise it will always be available or free of mistakes,
          and we aren&apos;t liable for losses caused by using it. The code is
          shared under the{" "}
          <TextLink href={`${REPO_URL}/blob/master/LICENSE`}>
            MIT licence
          </TextLink>
          .
        </p>
      </DocSection>

      <DocSection id="changes" title="Changes">
        <p>
          We may update these terms as HackHub changes. When we do, we update
          the date at the top of this page. The full history is public in the
          project&apos;s repository.
        </p>
      </DocSection>

      <DocSection id="contact" title="Contact">
        <p>
          Questions about these terms? See{" "}
          <TextLink href="/contact">Contact</TextLink>.
        </p>
      </DocSection>
    </DocPage>
  );
}
