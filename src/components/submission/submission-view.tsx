// The team's submission, read-only, for when submissions are closed (docs/08 >
// Submit project).

export function SubmissionView({
  submission,
}: {
  submission: { title: string; description: string; repoUrl: string };
}) {
  return (
    <dl className="flex flex-col gap-4 text-sm">
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">Project title</dt>
        <dd className="font-medium">{submission.title}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-muted-foreground">Description</dt>
        <dd className="whitespace-pre-line">{submission.description}</dd>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <dt className="text-muted-foreground">Repository link</dt>
        <dd>
          <a
            href={submission.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary break-all underline-offset-4 hover:underline"
          >
            {submission.repoUrl}
          </a>
        </dd>
      </div>
    </dl>
  );
}
