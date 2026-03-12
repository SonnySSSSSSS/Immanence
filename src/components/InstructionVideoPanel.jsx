import React from "react";

function getInstructionVideoUrl(video) {
  if (typeof video === "string") {
    const url = video.trim();
    return url || null;
  }

  if (!video || typeof video !== "object") return null;

  const url = typeof video.url === "string"
    ? video.url.trim()
    : (typeof video.videoUrl === "string" ? video.videoUrl.trim() : "");

  return url || null;
}

export function InstructionVideoPanel({ video, className = "" }) {
  const url = getInstructionVideoUrl(video);
  if (!url) return null;

  const title = typeof video === "object" && typeof video?.title === "string" && video.title.trim()
    ? video.title.trim()
    : "Instruction Video";
  const poster = typeof video === "object" && typeof video?.poster === "string" && video.poster.trim()
    ? video.poster.trim()
    : undefined;

  return (
    <section
      className={`w-full rounded-[24px] border overflow-hidden ${className}`.trim()}
      style={{
        borderColor: "rgba(255,255,255,0.12)",
        background: "rgba(8, 10, 18, 0.68)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div
        className="type-label"
        style={{
          padding: "14px 16px 10px",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        Instruction Video
      </div>
      <div style={{ padding: "0 16px 16px" }}>
        <div
          className="type-body"
          style={{
            marginBottom: 10,
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          {title}
        </div>
        <video
          controls
          playsInline
          preload="metadata"
          poster={poster}
          style={{
            width: "100%",
            display: "block",
            borderRadius: 16,
            background: "#000",
          }}
        >
          <source src={url} />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
}

export default InstructionVideoPanel;
