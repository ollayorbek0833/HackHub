"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/action-state";

// The /profile form (docs/08 > /profile). Every field is controlled, so the
// values survive React's form reset after the action returns. The server's
// result is the one that counts; the limits here only guide typing.

export type ProfileFormValues = {
  name: string;
  faculty: string;
  skills: string[];
  bio: string;
  links: string[];
};

const MAX_SKILLS = 10;
const MAX_LINKS = 3;
const MAX_BIO = 500;

export function ProfileForm({
  action,
  initial,
  goToEventsAfterSave,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial: ProfileFormValues;
  /** The first save after registering goes on to /events (docs/08). */
  goToEventsAfterSave: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);
  // Read once: after the save the page re-renders with the profile in place,
  // and the prop turns false in the same update as the result.
  const [isFirstSave] = useState(goToEventsAfterSave);

  const [name, setName] = useState(initial.name);
  const [faculty, setFaculty] = useState(initial.faculty);
  const [bio, setBio] = useState(initial.bio);
  const [skills, setSkills] = useState(initial.skills);
  const [skillDraft, setSkillDraft] = useState("");
  const [links, setLinks] = useState(
    initial.links.length > 0 ? initial.links : [""],
  );

  useEffect(() => {
    if (!state?.ok) return;
    toast.success(state.message ?? "Profile saved.");
    if (isFirstSave) router.push("/events");
  }, [state, isFirstSave, router]);

  const errors = state?.ok === false ? (state.fieldErrors ?? {}) : {};
  const fieldError = (key: string) =>
    errors[key]?.map((message) => ({ message }));

  function addSkill() {
    const skill = skillDraft.trim();
    if (!skill) return;
    const known = skills.some((s) => s.toLowerCase() === skill.toLowerCase());
    if (!known && skills.length < MAX_SKILLS) setSkills([...skills, skill]);
    setSkillDraft("");
  }

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state?.ok === false && state.formError && (
        <Alert variant="destructive">
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
          />
          <FieldError errors={fieldError("name")} />
        </Field>

        <Field data-invalid={!!errors.faculty}>
          <FieldLabel htmlFor="faculty">Faculty</FieldLabel>
          <Input
            id="faculty"
            name="faculty"
            maxLength={80}
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            aria-invalid={!!errors.faculty}
          />
          <FieldError errors={fieldError("faculty")} />
        </Field>

        <Field data-invalid={!!errors.skills}>
          <FieldLabel htmlFor="skill-draft">Skills</FieldLabel>
          <FieldDescription>
            Add up to {MAX_SKILLS}, one at a time. Optional.
          </FieldDescription>
          {skills.map((skill) => (
            <input key={skill} type="hidden" name="skills" value={skill} />
          ))}
          {skills.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Your skills">
              {skills.map((skill) => (
                <li key={skill}>
                  <Badge variant="secondary" className="h-11 gap-1 pr-0 md:h-8 md:pr-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() =>
                        setSkills(skills.filter((s) => s !== skill))
                      }
                      className="hover:bg-background/40 focus-visible:ring-ring inline-flex size-11 items-center justify-center rounded-full md:size-6 focus-visible:ring-2 focus-visible:outline-none"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Input
              id="skill-draft"
              value={skillDraft}
              maxLength={30}
              onChange={(e) => setSkillDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              disabled={skills.length >= MAX_SKILLS}
              aria-invalid={!!errors.skills}
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-11 md:min-h-9"
              onClick={addSkill}
              disabled={skills.length >= MAX_SKILLS || !skillDraft.trim()}
            >
              <Plus aria-hidden />
              Add skill
            </Button>
          </div>
          <FieldError errors={fieldError("skills")} />
        </Field>

        <Field data-invalid={!!errors.bio}>
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea
            id="bio"
            name="bio"
            rows={5}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            aria-invalid={!!errors.bio}
            aria-describedby="bio-count"
          />
          <FieldDescription id="bio-count" aria-live="polite">
            {bio.length} / {MAX_BIO} characters
          </FieldDescription>
          <FieldError errors={fieldError("bio")} />
        </Field>

        <Field data-invalid={!!errors.links}>
          <FieldLabel htmlFor="link-0">Links</FieldLabel>
          <FieldDescription>
            Up to {MAX_LINKS}, each a full link starting with https://.
            Optional.
          </FieldDescription>
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <Input
                id={`link-${i}`}
                name="links"
                type="url"
                inputMode="url"
                placeholder="https://github.com/you"
                value={link}
                onChange={(e) =>
                  setLinks(links.map((l, j) => (j === i ? e.target.value : l)))
                }
                aria-label={i === 0 ? undefined : `Link ${i + 1}`}
                aria-invalid={!!errors.links}
              />
              {links.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 md:size-9"
                  onClick={() => setLinks(links.filter((_, j) => j !== i))}
                  aria-label={`Remove link ${i + 1}`}
                >
                  <X aria-hidden />
                </Button>
              )}
            </div>
          ))}
          {links.length < MAX_LINKS && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 self-start md:min-h-9"
              onClick={() => setLinks([...links, ""])}
            >
              <Plus aria-hidden />
              Add link
            </Button>
          )}
          <FieldError errors={fieldError("links")} />
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        disabled={pending}
        className="min-h-11 self-start md:min-h-9"
      >
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
