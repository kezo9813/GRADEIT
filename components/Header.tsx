import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";

type HeaderProps = {
  user: User | null;
};

export function Header({ user }: HeaderProps) {
  return (
    <header className="nav">
      <Link className="brand" href="/">
        <Image src="/logo.png" alt="Grade it logo" width={38} height={38} />
        <span>Grade it</span>
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link className="btn" href="/new" title="New post">
              <span aria-hidden>＋</span>
              New post
            </Link>
            <Link className="btn secondary" href="/" title="Feed">
              <span aria-hidden>⌂</span>
              Feed
            </Link>
            <Link className="btn secondary" href="/profile" title="Profile">
              <span aria-hidden>👤</span>
              Profile
            </Link>
            <form action="/logout" method="post" style={{ marginLeft: 8 }}>
              <button className="btn secondary small" type="submit" title="Log out">
                Log out
              </button>
            </form>
          </>
        ) : (
          <Link className="btn" href="/login">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
