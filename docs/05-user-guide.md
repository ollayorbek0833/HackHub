# 5. User guide

This guide describes how each role uses HackHub, following the confirmed product rules in
[Scope decisions](02-scope-decisions.md#product-rules) and the screens in the [UI specification](08-ui-spec.md).
HackHub works in phone and desktop browsers. All times are shown in Tashkent time (GMT+5).

> **How this guide is filled in.** Each section has an owner comment (`<!-- owner: … -->`). The person who builds a
> screen replaces that section's placeholder with real steps and screenshots **in the same PR as the screen**, and
> touches only their own sections. Unfinished parts are marked `TODO(user-guide)`; the final docs review searches for
> that token, and none may be left at release.

---

## Everyone

### Create an account
<!-- owner: Ollayorbek · card #3 · fill in your PR -->

**What you can do:** create an account with your email and a password, then finish your profile.

**Good to know:**
- Your password needs at least 8 characters.
- An email can have only one account, whatever the letter case.
- After creating an account you're signed in and taken to your profile.

**Steps:**

TODO(user-guide) _To be completed with screenshots when the screen is built._

### Log in and log out
<!-- owner: Ollayorbek · card #3 · fill in your PR -->

**What you can do:** log in with your email and password, and log out from the user menu.

**Good to know:**
- If the email or password is wrong, HackHub says so without telling you which one.
- After logging in you go back to the page you were on, or to your home page: My events for participants, Judging
  for judges, Events I run for organizers.

**Steps:**

TODO(user-guide) _To be completed with screenshots when the screen is built._

### Find your way around
<!-- owner: Xurliman · card #46 · fill in your PR -->

**What you can do:** use the navigation at the top of every page to reach the areas your role can use, and open your
user menu for your profile and logging out.

**Good to know:**
- Participants see Events and My events. Judges see Judging and Events. Organizers see Events I run, Users and
  Public events.
- On a phone, the navigation is behind the menu button.
- If you open a page your role can't use, you're taken to your home page with the message "You don't have access to
  that page."

**Steps:**

TODO(user-guide) _To be completed with screenshots when the screen is built._

### Your profile
<!-- owner: Mehroj · card #4 · fill in your PR -->

**What you can do:** add your name, faculty, skills, a short bio and links, and view other people's profiles.

**Good to know:**
- Name and faculty are required. You need them before you can register for an event.
- You can add up to 10 skills, a bio of up to 500 characters and up to 3 links starting with https://.
- Any signed-in user can see your profile, but not your email.
- Everyone starts as a participant. Organizers give the judge role.

**Steps:**

1. Open **My profile** from the user menu (top right; on a phone, the menu button). Until your name and faculty are
   saved, a notice at the top reminds you to add them.
2. Fill in **Name** and **Faculty**. Your email and role are shown above the form; you can't change them here.
3. To add a skill, type it and press Enter or **Add skill**. Remove one with the **×** on its tag.
4. Write a short **Bio** if you like. The counter under it shows how many of the 500 characters you've used.
5. Add up to 3 **Links**, each starting with `https://`. Use **Add link** for another row.
6. Press **Save profile**. You see "Profile saved." The first time you save after creating your account, you're
   taken to the events list. If something is missing or too long, the message appears under that field.
7. To see someone else's profile, select their name in a team list or the ranking. Their profile is read-only. On
   your own, **Edit my profile** brings you back to the form.

---

## Participant

### Find an event and register
<!-- owner: Xurliman · card #5 · fill in your PR -->

**What you can do:** browse the events that are open for registration and register for one.

**Good to know:**
- Events appear in the list only while their registration is open.
- You can register for each event once. If registration is closed, you can't register.
- You need a name and faculty on your profile first. Until then the event page shows "Complete your profile before
  registering." with a link to your profile.
- Judges and organizers don't register. Organizers see "Manage event" on the event page instead.

**Steps:**

1. Open **Events** in the top navigation. Each card shows the event's dates, the maximum team size and the start of
   its description. Events you're already registered for have a "Registered" badge.
2. Select an event to open its page. It shows the full description, the status badges and how many people have
   registered.
3. Select **Register**. The page now says "You're registered" and offers **Create or join a team**.
4. Not logged in? Select **Log in to register**; after logging in you come back to the event.
5. If registration has closed, the button reads "Registration closed" and can't be used.

### My events
<!-- owner: Xurliman · card #5 · fill in your PR -->

**What you can do:** see every event you registered for, your team and submission status in each, and the results
once they're published.

**Steps:**

1. Open **My events** in the top navigation. It's also where you land after logging in.
2. Each event shows its dates and status, your team (or "No team yet") and whether your team has submitted.
3. Select **Go to my team** or **Create or join a team** to manage your team, or **Open event** for the event page.
4. Once the organizer publishes results, select **Results published: see the ranking** to jump to the ranking.
5. Events whose results are still to come are listed first, soonest first.

### Form a team
<!-- owner: Xurliman · card #6 · fill in your PR -->

**What you can do:** create a team in an event you registered for, or join one with its invite code, and leave
before your team submits.

**Good to know:**
- Agree on your team with your teammates first. One person creates the team and shares its 6-character invite code;
  the others join with it.
- You can be on only one team per event, and a team has a maximum size set by the organizer (4 by default).
- You can leave until your team submits. If the last member leaves, the team is deleted.
- Once a team has submitted, nobody can join or leave it.

**Steps:**

TODO(user-guide) _To be completed with screenshots when the screen is built._

### Submit your project
<!-- owner: Mehroj · card #7 · fill in your PR -->

**What you can do:** submit your team's project with a title, a description and a repository link while submissions
are open, and update it until they close.

**Good to know:**
- Any member of the team can submit. Each team has one submission.
- The repository link must be a full link starting with http:// or https://.
- Submitting locks your team: nobody can join or leave after this.
- A team that didn't submit isn't ranked.

**Steps:**

TODO(user-guide) _To be completed with screenshots when the screen is built._

### See the results
<!-- owner: Mehroj · card #16 · fill in your PR -->

**What you can do:** see the final ranking on the event page once the organizer publishes it.

**Good to know:**
- The ranking shows each team's rank, members and total score (0–100), not individual judges' scores.
- Teams tied on every criterion share a rank.

**Steps:**

TODO(user-guide) _To be completed with screenshots when the screen is built._

---

## Organizer

### Create and edit an event
<!-- owner: Abdurauf · card #9 · fill in your PR -->

**What you can do:** create an event with a name, dates, a description and a maximum team size, and edit it later.

**Good to know:**
- The end date can't be before the start date. An event can start and end on the same day.
- A new event has registration closed, so participants don't see it until you open registration.
- Any organizer can manage any event.
- The maximum team size is a whole number from 1 to 10 (4 by default). When you edit it, you can't set it below the
  size of the largest team that already exists.

**Steps:**

1. Open **Events I run**. It lists every event with its dates, its status (registration and submissions open or
   closed) and how many people registered, how many teams formed and how many submitted.
2. Select **New event**. Enter the name, a description, the start and end dates, and the maximum team size.
3. Select **Create event**. You land on the event's overview with the message "Event created. It's hidden from
   participants until you open registration."
4. To change it later, open the event and select **Edit** in the menu under its name. Change what you need and select
   **Save changes**. You go back to the overview with "Event saved."
5. **Cancel** takes you back to the page you came from. If you changed anything, HackHub asks whether to discard your
   changes first.

The menu under an event's name has the event's pages: Overview, Edit, Criteria, Participants and Ranking.

### Set the judging criteria
<!-- owner: Ollayorbek · card #10 · fill in your PR -->

**What you can do:** add the criteria judges score, each with a weight and a maximum score.

**Good to know:**
- Weights are whole percentages and must add up to exactly 100%, or you can't save.
- Each criterion has a maximum score of at least 1 (10 by default).
- Once any judge has scored, the criteria are locked.

**Steps:**

1. Open the event from **Events I run** and choose **Criteria**.
2. Fill in the first row: a name (for example "Innovation"), its weight in percent and its max score.
3. Choose **Add criterion** for each further criterion, and the bin icon to remove one.
4. Watch the total at the bottom of the page. It tells you how much is left to assign ("Total 90%: 10% left to
   assign") or how much you're over, and says "exactly 100%" when you're ready.
5. Choose **Save criteria**. You see "Criteria saved." If something is wrong, the message next to the row or above
   the list says what to fix.
6. Once a judge has scored, the page shows the criteria read-only with "Criteria are locked because judges have
   started scoring."

### Make users judges
<!-- owner: Ollayorbek · card #13 · fill in your PR -->

**What you can do:** make a participant a judge, or a judge a participant again.

**Good to know:**
- Someone who is on a team in any event can't become a judge.
- Nobody can change their own role, and organizers' roles can't be changed here.
- The change applies right away, without the user logging in again.

**Steps:**

TODO(user-guide) _To be completed with screenshots when the screen is built._

### Open and close registration and submissions
<!-- owner: Abdurauf · card #12 · fill in your PR -->

**What you can do:** open and close registration and submissions for an event from its overview, and publish the
results.

**Good to know:**
- Judges can score once submissions are closed.
- Submissions can't reopen once any judge has scored.
- Publishing needs submissions closed and criteria set. It can't be undone, and afterwards scores are locked.

**Steps:**

1. Open the event from **Events I run**. The **Overview** shows how many people registered, how many teams formed,
   how many submitted, and whether the criteria are set.
2. Under **Event controls**, turn **Registration** on to list the event on Events so participants can register. Turn
   it off to stop new registrations. You see "Registration opened." or "Registration closed."
3. Turn **Submissions** on when teams may submit. When you turn it off, HackHub asks you to confirm: teams can't
   submit or edit any more, and judges can start scoring. If a judge has already scored, the switch stays off and says
   why.
4. When the judges are done, select **Publish results**. If the button is greyed out, the line under it says what's
   missing: close submissions first, or set the judging criteria first. The confirmation reminds you to check the
   ranking preview, because HackHub doesn't track whether every team has been scored.
5. After you publish, the overview says "Results were published." with a link to the public event page, and every
   control is greyed out.

### See participants and teams
<!-- owner: Abdurauf · card #11 · fill in your PR -->

**What you can do:** see everyone registered for an event, every team with its members, and which teams have
submitted.

**Good to know:**
- Only organizers can open this page.
- People who haven't filled in their profile yet are shown by their email.
- On a phone, each person and each team is shown as a card instead of a table row.

**Steps:**

1. Open the event from **Events I run** and select **Participants** in the menu under its name.
2. The **Participants** tab lists everyone registered, sorted by name: their email, faculty, team (or "No team") and
   the day they registered. Select a name to open their profile.
3. To find someone, type part of their name or email under **Search by name or email** and select **Search**.
   **Clear search** shows everyone again.
4. Select the **Teams** tab for every team: its members, how full it is ("2 of 4") and whether it has submitted.
   A submitted team shows "Submitted" with the date, the project title and a **Repository** link that opens in a new
   tab. Select **Show description** to read the project description.

The number next to each tab is how many people registered and how many teams formed. Before anyone registers, the
page says "Nobody has registered yet."; before any team forms, "No teams yet."

### Review and publish the ranking
<!-- owner: Mehroj · card #16 · fill in your PR -->

**What you can do:** preview the ranking, check that the judges have finished, and publish it.

**Good to know:**
- Teams are ranked by weighted total score (0–100). A criterion nobody scored counts as 0 for that team.
- Ties are broken by the highest-weight criterion, then the next.
- Teams without a submission aren't ranked; they're listed under the table.
- HackHub doesn't track which teams are still unscored. Use the number of judges per team in the preview and ask the
  judges before you publish.

**Steps:**

TODO(user-guide) _To be completed with screenshots when the screen is built._

---

## Judge

### Your judging list
<!-- owner: Ollayorbek · card #8 · fill in your PR -->

**What you can do:** see the events being judged and every team that submitted, with your progress on each.

**Good to know:**
- Every judge scores every team that submitted. There's no assignment step.
- An event shows up here once the organizer closes its submissions.

**Steps:**

TODO(user-guide) _To be completed with screenshots when the screen is built._

### Score a team
<!-- owner: Ollayorbek · card #8 · fill in your PR -->

**What you can do:** read a team's project and give a whole-number score for each criterion.

**Good to know:**
- Each score goes from 0 to the criterion's maximum.
- You can save with some criteria empty and come back later.
- You can change your scores until the organizer publishes the results.

**Steps:**

TODO(user-guide) _To be completed with screenshots when the screen is built._

---

## For administrators

### Running HackHub
<!-- owner: Abdurauf · card #28 · fill in your PR -->

**What you can do:** deploy HackHub and create the first organizer account. The full commands are in
[Setup and deployment](04-setup-and-deployment.md).

**Steps:**

TODO(user-guide) _To be completed when the deploy is in place._

---

## Not in this release

These are planned for after the release, so they don't appear in HackHub yet: the event schedule and challenge
brief, judge comments, auto-assigning judges to teams, team member roles, password reset and email verification,
deleting events, and unpublishing results.
