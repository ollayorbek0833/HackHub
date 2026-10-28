import { DocPage, DocSection, TextLink } from "@/components/site-pages/doc-page";
import { pageMetadata, REPO_URL } from "@/lib/site";

// /about: what HackHub is for, what it does and the principles behind it
// (PRODUCT.md). Product only: no team names, no numbers, no partners.

export const metadata = pageMetadata({
  title: "About",
  description:
    "Why HackHub exists, what it does for organizers, participants and judges, and the principles it is built on. Open source under the MIT licence.",
  path: "/about",
});

const PRINCIPLES = [
  {
    title: "One flow from registration to results",
    text: "Nothing should send people back to spreadsheets, forms or group chats.",
  },
  {
    title: "Judging that is visibly fair",
    text: "The rules are explicit, the weights add up to 100, and the ranking can be explained.",
  },
  {
    title: "Phones first for participants",
    text: "Participants are mostly students on a phone. Organizers get speed and clarity on a desktop.",
  },
  {
    title: "Any organizer, local roots",
    text: "It works for any organizer without losing its campus roots.",
  },
];

export default function AboutPage() {
  return (
    <DocPage
      title="About HackHub"
      intro={
        <p>
          HackHub runs a whole hackathon in one app, so organizers no longer
          stitch it together from forms, group chats and spreadsheets.
        </p>
      }
    >
      <DocSection id="mission" title="Our mission">
        <p>
          A good hackathon needs a lot of small things to go right: people sign
          up, find a team, hand in a project, get scored and see a result they
          trust. HackHub keeps all of that in one place.
        </p>
        <p>
          Success means an organizer sets up an event quickly, participants find
          a team and submit without help, judges score every team, and everyone
          trusts the published ranking.
        </p>
      </DocSection>

      <DocSection id="what-it-does" title="What HackHub does">
        <p>Every event has three roles.</p>
        <ul>
          <li>
            <strong>Participants</strong> build a profile, register for an
            event, create a team or join one with its invite code, and submit
            a project: a title, a description and a repository link.
          </li>
          <li>
            <strong>Organizers</strong> create events with a logo and a banner,
            set weighted judging criteria, open and close registration and
            submissions, see the participants and teams, and publish the
            ranking.
          </li>
          <li>
            <strong>Judges</strong> score every submitted team against the
            event&apos;s criteria.
          </li>
        </ul>
        <p>
          An event runs in phases. Registration opens, people register and
          form teams, submissions open, teams submit, submissions close, judges
          score, and the organizer publishes the results.
        </p>
      </DocSection>

      <DocSection id="principles" title="Principles">
        <dl className="flex flex-col gap-4">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="border-l-2 border-primary/70 pl-4">
              <dt className="font-semibold">{p.title}</dt>
              <dd className="text-muted-foreground">{p.text}</dd>
            </div>
          ))}
        </dl>
      </DocSection>

      <DocSection id="who-its-for" title="Who it's for">
        <p>
          Anyone who runs a hackathon: student clubs, companies, communities
          and universities. We started with university events in Tashkent, and
          HackHub is made with Uzbek campuses and student communities in mind.
        </p>
      </DocSection>

      <DocSection id="open-source" title="Open source">
        <p>
          HackHub is open source under the MIT licence. You can read the code,
          report a problem or suggest a change on{" "}
          <TextLink href={REPO_URL}>GitHub</TextLink>. To get in touch, see{" "}
          <TextLink href="/contact">Contact</TextLink>.
        </p>
      </DocSection>
    </DocPage>
  );
}
