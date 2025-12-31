"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { PostKind } from "@/lib/types";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

export function NewPostForm() {
  const router = useRouter();
  const [kind, setKind] = useState<PostKind>("text");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearFile = useCallback(() => {
    setFile(null);
    setVideoDurationMs(null);
  }, []);

  const handleKindChange = (value: PostKind) => {
    setKind(value);
    clearFile();
    setStatus(null);
  };

  const handleFileChange = (inputFile: File | null) => {
    setStatus(null);
    setFile(null);
    setVideoDurationMs(null);

    if (!inputFile) return;

    if (kind === "image") {
      if (!inputFile.type.startsWith("image/")) {
        setStatus("Please choose an image file.");
        return;
      }
      if (inputFile.size > MAX_IMAGE_BYTES) {
        setStatus("Images must be 5MB or less.");
        return;
      }
      setFile(inputFile);
      return;
    }

    if (kind === "video") {
      if (!inputFile.type.startsWith("video/")) {
        setStatus("Please choose a video file.");
        return;
      }
      if (inputFile.size > MAX_VIDEO_BYTES) {
        setStatus("Videos must be 20MB or less.");
        return;
      }
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const durationMs = Math.round((video.duration || 0) * 1000);
        if (durationMs > 10000) {
          setStatus("Videos must be 10 seconds or shorter.");
          setFile(null);
          setVideoDurationMs(null);
          return;
        }
        setVideoDurationMs(durationMs);
        setFile(inputFile);
      };
      video.src = URL.createObjectURL(inputFile);
    }
  };

  const submit = async () => {
    setStatus(null);

    if (kind === "text" && !title.trim() && !text.trim()) {
      setStatus("Add a title or some text.");
      return;
    }

    if ((kind === "image" || kind === "video") && !file) {
      setStatus("Attach a file for image/video posts.");
      return;
    }

    if (kind === "video" && !videoDurationMs) {
      setStatus("Waiting for video metadata. Please choose the file again.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.set("kind", kind);
      if (title) payload.set("title", title);
      if (text) payload.set("text_content", text);
      if (file) payload.set("file", file);
      if (kind === "video" && videoDurationMs) {
        payload.set("duration_ms", String(videoDurationMs));
      }

      const res = await fetch("/api/posts", { method: "POST", body: payload });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Unable to create post.");
      } else {
        router.push(`/p/${data.id}`);
        router.refresh();
      }
    } catch (err) {
      setStatus("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fileHint = useMemo(() => {
    if (kind === "image") return "PNG/JPEG/GIF up to 5MB.";
    if (kind === "video") return "MP4/WebM up to 20MB and 10 seconds.";
    return null;
  }, [kind]);

  return (
    <div className="panel card" style={{ padding: 20 }}>
      <div className="stack">
        <div className="row">
          {(["text", "image", "video"] as PostKind[]).map((option) => (
            <button
              key={option}
              type="button"
              className={`btn ${kind === option ? "" : "secondary"}`}
              onClick={() => handleKindChange(option)}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="field">
          <label htmlFor="title">Title (optional)</label>
          <input
            id="title"
            name="title"
            placeholder="A quick summary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="text_content">
            {kind === "text" ? "What are we grading?" : "Notes (optional)"}
          </label>
          <textarea
            id="text_content"
            name="text_content"
            rows={kind === "text" ? 6 : 3}
            placeholder={kind === "text" ? "Share the idea, prompt, or take..." : "Extra context"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {kind !== "text" ? (
          <div className="field">
            <label htmlFor="file">Upload {kind}</label>
            <input
              id="file"
              name="file"
              type="file"
              accept={kind === "image" ? "image/*" : "video/*"}
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            <div className="muted">{fileHint}</div>
            {file ? (
              <div className="muted">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                {kind === "video" && videoDurationMs
                  ? ` · ${(videoDurationMs / 1000).toFixed(1)}s`
                  : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <button className="btn" type="button" onClick={submit} disabled={submitting}>
          {submitting ? "Submitting..." : "Publish"}
        </button>
        {status ? <div className="muted">{status}</div> : null}
      </div>
    </div>
  );
}
