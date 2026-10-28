# 5. User guide

This guide describes how each role uses HackHub, following the confirmed product rules in
[Scope decisions](02-scope-decisions.md#product-rules) and the screens in the [UI specification](08-ui-spec.md).
HackHub works in phone and desktop browsers. All times are shown in Tashkent time (GMT+5).

> **How this guide was written.** Each section was written by the person who built its screens (the owner comment
> above each one), and reviewed as one guide on 28 Oct.

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

1. Select **Register** at the top of any page (on a phone, open the menu first), or go to `/register`.
2. Enter your email, a password of at least 8 characters, and the same password again in **Confirm password**.
3. Select **Create account**. You land on **My profile** with the message "Account created. Add your name and
   faculty to finish your profile."
4. If you see "An account with this email already exists", you already have an account: select **Log in instead**.

### Log in and log out
<!-- owner: Ollayorbek · card #3 · fill in your PR -->

**What you can do:** log in with your email and password, and log out from the user menu.

**Good to know:**
- If the email or password is wrong, HackHub says so without telling you which one.
- After logging in you go back to the page you were on, or to your home page: My events for participants, Judging
  for judges, Events I run for organizers.
- Your email isn't case-sensitive: `Ana@Example.com` and `ana@example.com` are the same account.
- Opening a page that needs an account while logged out takes you to the login page first.

**Steps:**

1. Select **Log in** at the top of any page, or go to `/login`.
2. Enter your email and password and select **Log in**.
3. If you see "Email or password is incorrect.", check both and try again.
4. To log out, open the user menu (your name or email, top right; on a phone, the menu button) and select
   **Log out**. You return to the home page with the message "You're logged out."

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

1. The bar at the top of every page has the HackHub logo (it takes you home) and the links for your role. The link
   for the section you're in is underlined.
2. Your name, or your email until your profile has a name, is on the right. Open it for **My profile** and **Log out**.
3. On a phone, select the menu button at the top right. The same links, My profile and Log out are in the panel that
   opens.
4. Signed out, you see **Events**, **Log in** and **Register**. Opening a page that needs an account takes you to the login page and
   back to that page afterwards.

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
   **Phone** is optional: organizers use it to reach your team. Type it any way you like, for example `90 123 45 67`;
   it's saved as `+998 90 123 45 67`. Only you and the organizers of events you register for can see it; other
   organizers, participants and judges can't.
3. To add a skill, type it and press Enter or select **Add skill**. Remove one with the **×** on its tag.
4. Write a short **Bio** if you like. The counter under it shows how many of the 500 characters you've used.
5. Add up to 3 **Links**, each starting with `https://`. Use **Add link** for another row.
6. Select **Save profile**. You see "Profile saved." The first time you save after creating your account, you're
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
- Judges and organizers don't register. The organizer who created an event sees "Manage event" on its page instead;
  other organizers see "Organizers don't register for events."

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

1. Register for the event first, then open it from **My events** and select **Create or join a team**.
2. **To create a team:** under "Create a team", type a team name (2–40 characters, not already used in this event)
   and select **Create team**. You're its first member.
3. **To share it:** your team page shows the 6-character invite code. Select **Copy code** and send it to your
   teammates, or read it out: it has no 0/O or 1/I, so it's hard to mistype.
4. **To join a team:** under "Join with a code", enter the code your teammate sent (upper or lower case) and select
   **Join team**. If it doesn't work, HackHub says why: wrong code, team full, you're already on a team, or the team
   has already submitted.
5. Your team page lists every member (select a name to see their profile), shows "{n} of {max}" and whether your team
   has submitted, with a button to submit or edit your project while submissions are open.
6. **To leave:** select **Leave team** and confirm. If you're the last member, the team is deleted. After your team
   submits, the button is disabled.

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

1. On your team page, select **Submit project**. (Until the organizer opens submissions, the page says "Submissions
   haven't opened yet.")
2. Fill in the **Project title**, a **Description** (the counter shows how many of the 2000 characters you've used)
   and the **Repository link**, for example `https://github.com/team/project`.
3. Select **Submit project**. You're taken back to your team page with "Project submitted."
4. To change something while submissions are open, any team member opens the same page again: the form is filled
   in, and **Save changes** updates it ("Submission updated."). The page shows when it was last updated.
5. Once the organizer closes submissions, the page shows your submission read-only. If your team didn't submit, it
   says so: that team won't be ranked.

### See the results
<!-- owner: Mehroj · card #16 · fill in your PR -->

**What you can do:** see the final ranking on the event page once the organizer publishes it.

**Good to know:**
- The ranking shows each team's rank, members and total score (0–100), not individual judges' scores.
- Teams tied on every criterion share a rank.

**Steps:**

1. Open the event's page, from **My events** or the link you were given. Before the organizer publishes, there's no
   ranking on it.
2. Once results are published, the **Final ranking** section lists each team's rank, name, members and total.
3. If your team is in the list, its row is labelled **Your team**. When you're signed in, select a member's name to
   open their profile.
4. On a phone, each team is shown as a card with its rank and total at the top.

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

1. Open **Events I run**. The tabs **All**, **Live**, **Upcoming**, **Judging** and **Finished** filter the list, each with
   its count (an event whose dates passed without opening counts as Finished). It lists the events you created with their dates, their status (registration and submissions open or
   closed) and how many people registered, how many teams formed and how many submitted.
2. Select **New event**. Enter the name, a description, the start and end dates, and the maximum team size. Each
   field is checked as soon as you leave it, and a message under it says what to fix; it goes away as you correct it.
3. Select **Create event**. You land on the event's overview with the message "Event created. It's hidden from
   participants until you open registration."
4. To change it later, open the event and select **Edit** in the menu under its name. Change what you need and select
   **Save changes**. You go back to the overview with "Event saved."
5. **Cancel** takes you back to the page you came from. If you changed anything, HackHub asks whether to discard your
   changes first.

The menu under an event's name has the event's pages: Overview, Edit, Criteria, Participants and Ranking.

### Add a logo and a header image

**What you can do:** give an event a logo (a square picture, shown like a profile picture) and a header image (a wide
banner across the top of the event). Both are optional.

**Good to know:**
- Use a PNG, JPEG or WebP file of up to 5 MB. HackHub crops it to fit: the logo becomes 512 × 512 pixels and the header
  image 1600 × 600, so start from at least that size and keep the important part in the middle.
- Any other kind of file, or a bigger one, is refused with a message under the field, and nothing else on the form is
  lost.

**Steps:**

1. On **New event**, or on the event's **Edit** page, find **Logo** and **Header image** at the bottom of the form.
2. Select **Choose file** (the wording depends on your browser) and pick an image. A preview appears next to the field.
3. Select **Create event** or **Save changes**. The images are saved with the rest of the event.
4. To replace an image, pick a new file on the Edit page and save. To take one away, tick **Remove the current logo**
   (or **header image**) and save.

### Set the judging criteria
<!-- owner: Ollayorbek · card #10 · fill in your PR -->

**What you can do:** add the criteria judges score, each with a weight and a maximum score.

**Good to know:**
- Weights are whole percentages and must add up to exactly 100%, or you can't save.
- Each criterion has a maximum score of at least 1 (10 by default).
- Once any judge has scored, the criteria are locked.

**Steps:**

1. Open the event from **Events I run** and select **Criteria**.
2. Fill in the first row: a name (for example "Innovation"), its weight in percent and its max score.
3. Select **Add criterion** for each further criterion, and the bin icon to remove one.
4. Watch the total at the bottom of the page. It tells you how much is left to assign ("Total 90%: 10% left to
   assign") or how much you're over, and says "exactly 100%" when you're ready.
5. Select **Save criteria**. You see "Criteria saved." If something is wrong, the message next to the row or above
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

1. Select **Users** in the navigation. Everyone is listed, organizers first.
2. Find the person: type part of their name, email or phone in **Search by name, email or phone**, or select a role chip
   (**Participants**, **Judges**, **Organizers**). Each chip shows how many people it has. Select a column heading to
   sort by it.
3. Select **Make judge** on a participant, or **Make participant** on a judge. You can also select the person's name
   to open their details on the side (full screen on a phone) and change the role there. You see "{name} is now a
   judge." (or "a participant") and the row updates. To undo, select the other button.
4. If the button is greyed out, the details panel says why, for example "Ana is on a team in Demo Hack, so they can't
   become a judge."

### Open and close registration and submissions
<!-- owner: Abdurauf · card #12 · fill in your PR -->

**What you can do:** open and close registration and submissions for an event from its overview, and publish the
results.

**Good to know:**
- Judges can score once submissions are closed.
- Submissions can't reopen once any judge has scored.
- Publishing needs at least one team to have submitted, submissions closed and criteria set. It can't be undone, and
  afterwards scores are locked.

**Steps:**

1. Open the event from **Events I run**. The **Overview** shows the event's phase (Not open yet, Registration open,
   Submissions open, Judging or Results published), how many people registered, how many teams formed, how many submitted and
   how many submitted teams a judge has fully scored.
2. **Readiness** lists what has to be true before the results can go out: criteria that total 100%, participants,
   teams, submissions, every submitted team scored, results published. Each open item links to the page that fixes it.
3. The **Next step** card says the one thing to do now and what it changes, for example "Next: open submissions".
   Select its button, then confirm. You see "Registration opened.", "Submissions opened.", "Submissions closed." or
   "Results published." The order is: open registration, open submissions, close submissions (judges can then
   score), publish the results. If criteria aren't set when judging starts, the card sends you to **Criteria** first.
4. Before publishing, the card tells you if some submitted teams haven't been scored on every criterion yet. The
   confirmation also reminds you to check the ranking preview. Publishing can't be undone.
5. To do something out of order, open **Manual controls**: the **Registration** and **Submissions** switches and
   **Publish results** are there, with the same rules. Closing submissions asks you to confirm, and a switch that
   can't change says why.
6. After you publish, the card links to the ranking on the public event page, and every control is greyed out.

### See participants and teams
<!-- owner: Abdurauf · card #11 · fill in your PR -->

**What you can do:** see everyone registered for an event, every team with its members, and which teams have
submitted.

**Good to know:**
- Only organizers can open this page.
- People who haven't filled in their profile yet are shown by their email.
- On a phone, each person and each team is a large row you can tap instead of a table row.

**Steps:**

1. Open the event from **Events I run** and select **Participants** in the menu under its name.
2. The **Participants** tab lists everyone registered: name, email, faculty, team (or "No team") and the day they
   registered. Select a column heading to sort by it.
3. To find someone, type part of their name, email, faculty, team or phone in the search box. The **In a team** and **No
   team** chips narrow the list; each shows how many people it has.
4. Select a person to open their details on the side (full screen on a phone): faculty, phone, team, skills, bio and links,
   and a link to their full profile. Press Escape or select **Close** to go back to the list.
5. Select the **Teams** tab for every team: its members, how full it is ("2 of 4") and whether it has submitted. The
   **Submitted** and **Not submitted** chips filter the list. Select a team to see its members and its submission:
   the project title, description and repository link.

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

1. Open the event and select **Ranking** in the menu under its name. Until submissions are closed and the criteria
   are set, the page says "The ranking appears once submissions are closed and criteria are set."
2. Read the table: rank, team, members, the number of **Judges** who scored each team, and the total. If nobody has
   scored yet, every total is 0 and the page says "No scores yet."
3. Teams without a submission are listed under the table as "Not ranked (no submission)".
4. When every judge has finished, select **Publish results** and confirm. Publishing can't be undone: scores lock and
   the ranking appears on the public event page. You can also publish from the event's overview.
5. Afterwards the page says "Results were published." with a link to the public event page.

---

## Judge

### Your judging list
<!-- owner: Ollayorbek · card #8 · fill in your PR -->

**What you can do:** see the events being judged and every team that submitted, with your progress on each.

**Good to know:**
- Every judge scores every team that submitted. There's no assignment step.
- An event shows up here once the organizer closes its submissions.

**Steps:**

1. Log in, or select **Judging** in the navigation.
2. Each event being judged shows your progress, for example "1 of 2 scored", and its number of criteria.
3. Next to it is the queue: every team that submitted, in order, with its project title and your status:
   **To score**, **In progress** (some criteria scored) or **Scored**.
4. Select **Start scoring** (or **Continue scoring**) to open the first team you haven't finished, or select any
   team in the queue.
5. Events whose results are out are listed under **Results published**, with a link to the ranking.

### Score a team
<!-- owner: Ollayorbek · card #8 · fill in your PR -->

**What you can do:** read a team's project and give a whole-number score for each criterion.

**Good to know:**
- Each score goes from 0 to the criterion's maximum.
- You can save with some criteria empty and come back later.
- You can change your scores until the organizer publishes the results.

**Steps:**

1. Open a team from **Judging**. On a computer the queue stays on the left, so you can see where you are; on a phone
   the top of the page says "Team 2 of 7" and **Queue** takes you back to the list.
2. Read the project title and description, and select **Open the repository** to see the code in a new tab.
3. Under **Your scores**, each criterion has a row of numbers from 0 to its maximum. Select the score you give.
   The **×** next to a row clears it.
4. With a keyboard: Tab moves from criterion to criterion, keys **0**–**9** give the score (type **1** then **0**
   quickly for 10), the arrow keys step up and down, Backspace clears, and Enter saves and opens the next team.
5. Select **Save** to stay on the team ("Scores saved."), or **Save and next** to move on. On a phone both buttons
   stay at the bottom of the screen. After the last team you return to Judging with "You've scored every team in
   {event}."
6. To change a score, open the team again, pick another number and save. Clearing a row and saving removes that
   score. If you try to leave with unsaved scores, HackHub asks "Leave without saving your scores?".
7. If you see "Scoring starts when the organizer closes submissions." or "Results are published, so scores can't be
   changed.", the scores are read-only.

---

## For administrators

### Running HackHub
<!-- owner: Abdurauf · card #28 · fill in your PR -->

**What you can do:** deploy HackHub and create the first organizer account. The full commands are in
[Setup and deployment](04-setup-and-deployment.md).

**Steps:**

1. HackHub runs at https://hackhub.mekhroj.uz. The server deploys `master` on its own within a few minutes of a merge,
   and rolls back if the new version doesn't pass its health check. To check it: `curl -fsS
   https://hackhub.mekhroj.uz/api/health` returns `{"status":"ok"}`.
2. The first organizer account comes from `SEED_ORGANIZER_EMAIL` and `SEED_ORGANIZER_PASSWORD` in the server's `.env`.
   It's created on the first deploy, and later deploys never change its password. Log in with it, then use **Users** to
   make judges. Every other account registers itself.
3. Setting up a new server, deploying by hand, backups and pausing the automatic deploys are in
   [Setup and deployment](04-setup-and-deployment.md#production-deployment-vps--docker).

---

## Not in this release

These are planned for after the release, so they don't appear in HackHub yet: the event schedule and challenge
brief, judge comments, auto-assigning judges to teams, team member roles, password reset and email verification,
deleting events, and unpublishing results.
