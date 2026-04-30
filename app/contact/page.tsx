const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

export default function ContactPage() {
  return (
    <div className="my-auto mx-auto w-full max-w-[900px] space-y-4 px-4 sm:px-8">
      <p>Inquiries and collaborations.</p>
      {email ? (
        <p>
          <a
            href={`mailto:${email}`}
            className="font-medium text-black transition-colors hover:text-black/60"
          >
            {email}
          </a>
        </p>
      ) : process.env.NODE_ENV === "development" ? (
        <p className="text-black/40">
          Add <span className="font-mono text-[11px]">NEXT_PUBLIC_CONTACT_EMAIL</span> to
          .env.local to show a mail link.
        </p>
      ) : null}
    </div>
  );
}
