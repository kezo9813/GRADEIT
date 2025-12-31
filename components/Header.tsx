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
        <span>Grade it</span>
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link className="btn" href="/new" title="New post" aria-label="New post">
              <span aria-hidden>＋</span>
            </Link>
            <Link className="btn secondary" href="/" title="Feed" aria-label="Feed">
              <span aria-hidden>⌂</span>
            </Link>
            <Link className="btn secondary" href="/profile" title="Profile" aria-label="Profile">
              <span aria-hidden>👤</span>
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
