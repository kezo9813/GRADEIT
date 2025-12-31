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
        <Link className="btn secondary" href="/">
          Feed
        </Link>
        {user ? (
          <>
            <Link className="btn" href="/new">
              New post
            </Link>
            <form action="/logout" method="post">
              <button className="btn secondary" type="submit">
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
