import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const STATE_FILE = path.join(process.cwd(), "content", ".youtube-sync-state.json");

const CHANNELS = [
  "https://www.youtube.com/@freecodecamp",
  "https://www.youtube.com/@WebDevSimplified",
  "https://www.youtube.com/@Fireship",
  "https://www.youtube.com/@KevinPowell",
  "https://www.youtube.com/@DesignCourse",
  "https://www.youtube.com/@academind",
];

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.2";
const MAX_VIDEOS_PER_CHANNEL = Number(process.env.YOUTUBE_MAX_VIDEOS_PER_CHANNEL ?? "5");
const LOOKBACK_HOURS = Number(process.env.YOUTUBE_LOOKBACK_HOURS ?? "36");
const OPENAI_API_URL = "https://api.openai.com/v1/responses";

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY mancante.");
}

function log(message) {
  console.log(`[youtube-blog] ${message}`);
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`);
  const match = xml.match(regex);

  return match ? decodeHtml(match[1].trim()) : null;
}

function extractAllEntries(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => match[1]);
}

function parseRssEntries(xml) {
  return extractAllEntries(xml).map((entry) => {
    const videoId = extractTag(entry, "yt:videoId");
    const title = extractTag(entry, "title");
    const publishedAt = extractTag(entry, "published");
    const author = extractTag(entry, "name");

    if (!videoId || !title || !publishedAt) {
      return null;
    }

    return {
      videoId,
      title,
      publishedAt,
      author: author ?? "YouTube",
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }).filter(Boolean);
}

async function readState() {
  try {
    const raw = await readFile(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { processedVideoIds: {} };
  }
}

async function writeState(state) {
  await mkdir(path.dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function fetchText(url, init) {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Richiesta fallita (${response.status}) ${url}`);
  }

  return response.text();
}

async function resolveChannel(channelUrl) {
  const html = await fetchText(channelUrl, {
    headers: {
      "user-agent": "mc-blog-dev-bot/1.0",
    },
  });
  const channelIdMatch =
    html.match(/"externalId":"(UC[^"]+)"/) ?? html.match(/"channelId":"(UC[^"]+)"/);

  if (!channelIdMatch) {
    throw new Error(`Impossibile ricavare il channelId da ${channelUrl}`);
  }

  return {
    channelId: channelIdMatch[1],
  };
}

async function fetchLatestVideos(channelUrl) {
  const { channelId } = await resolveChannel(channelUrl);
  const feedXml = await fetchText(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    {
      headers: {
        "user-agent": "mc-blog-dev-bot/1.0",
      },
    },
  );

  return parseRssEntries(feedXml).slice(0, MAX_VIDEOS_PER_CHANNEL);
}

function findCaptionTracks(html) {
  const tracksMatch = html.match(/"captionTracks":(\[[\s\S]*?\])/);

  if (!tracksMatch) {
    return [];
  }

  try {
    return JSON.parse(tracksMatch[1]);
  } catch {
    return [];
  }
}

function pickCaptionTrack(tracks) {
  const preferences = [
    (track) => track.languageCode === "it",
    (track) => track.languageCode?.startsWith("it"),
    (track) => track.languageCode === "en" && !track.kind,
    (track) => track.languageCode?.startsWith("en") && !track.kind,
    (track) => track.languageCode === "en",
    () => true,
  ];

  for (const predicate of preferences) {
    const track = tracks.find(predicate);

    if (track?.baseUrl) {
      return track;
    }
  }

  return null;
}

async function fetchTranscript(videoId) {
  const html = await fetchText(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "user-agent": "mc-blog-dev-bot/1.0",
    },
  });
  const track = pickCaptionTrack(findCaptionTracks(html));

  if (!track) {
    return null;
  }

  const transcriptUrl = new URL(track.baseUrl);
  transcriptUrl.searchParams.set("fmt", "json3");

  const response = await fetch(transcriptUrl, {
    headers: {
      "user-agent": "mc-blog-dev-bot/1.0",
    },
  });

  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  const transcript = (json.events ?? [])
    .flatMap((event) => event.segs ?? [])
    .map((segment) => segment.utf8 ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return transcript || null;
}

async function generateArticleFromTranscript(video, transcript) {
  const prompt = [
    `Canale: ${video.author}`,
    `Titolo video: ${video.title}`,
    `Data pubblicazione video: ${video.publishedAt}`,
    `URL video: ${video.url}`,
    "",
    "Transcript:",
    transcript.slice(0, 18000),
  ].join("\n");

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      instructions:
        "Trasforma il transcript di un video YouTube in un articolo originale in italiano per un blog frontend. Non tradurre letteralmente. Riscrivi, sintetizza e struttura il contenuto in modo chiaro. Il tono deve essere tecnico ma leggibile. Evita introduzioni generiche. Concentrati sui punti utili per chi sviluppa frontend.",
      text: {
        format: {
          type: "json_schema",
          name: "youtube_blog_post",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              subtitle: { type: "string" },
              description: { type: "string" },
              bodyMarkdown: { type: "string" },
            },
            required: ["title", "subtitle", "description", "bodyMarkdown"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  const outputText = json.output_text;

  if (!outputText) {
    throw new Error("La risposta OpenAI non contiene output_text.");
  }

  return JSON.parse(outputText);
}

function buildMarkdown(post, publishedAt) {
  const quote = (value) => JSON.stringify(value);

  return `---
title: ${quote(post.title)}
subtitle: ${quote(post.subtitle)}
description: ${quote(post.description)}
publishedAt: ${publishedAt}
---
${post.bodyMarkdown.trim()}
`;
}

async function existingSlugs() {
  try {
    const files = await readdir(BLOG_DIR);
    return new Set(files.filter((file) => file.endsWith(".md")).map((file) => file.replace(/\.md$/, "")));
  } catch {
    return new Set();
  }
}

function resolveUniqueSlug(baseSlug, usedSlugs, videoId) {
  let candidate = baseSlug || `video-${videoId.toLowerCase()}`;

  if (!usedSlugs.has(candidate)) {
    return candidate;
  }

  candidate = `${candidate}-${videoId.toLowerCase()}`;

  if (!usedSlugs.has(candidate)) {
    return candidate;
  }

  let index = 2;

  while (usedSlugs.has(`${candidate}-${index}`)) {
    index += 1;
  }

  return `${candidate}-${index}`;
}

async function main() {
  await mkdir(BLOG_DIR, { recursive: true });

  const state = await readState();
  const usedSlugs = await existingSlugs();
  const threshold = Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000;
  const allVideos = [];

  for (const channelUrl of CHANNELS) {
    try {
      log(`Controllo canale ${channelUrl}`);
      const videos = await fetchLatestVideos(channelUrl);
      allVideos.push(...videos);
    } catch (error) {
      log(`Errore sul canale ${channelUrl}: ${error.message}`);
    }
  }

  const freshVideos = allVideos
    .filter((video, index, collection) => collection.findIndex((item) => item.videoId === video.videoId) === index)
    .filter((video) => new Date(video.publishedAt).getTime() >= threshold)
    .filter((video) => !state.processedVideoIds[video.videoId]);

  log(`Video nuovi candidati: ${freshVideos.length}`);

  for (const video of freshVideos) {
    try {
      log(`Recupero transcript per ${video.title}`);
      const transcript = await fetchTranscript(video.videoId);

      if (!transcript) {
        log(`Transcript non disponibile per ${video.videoId}, salto`);
        continue;
      }

      log(`Genero articolo per ${video.videoId}`);
      const generated = await generateArticleFromTranscript(video, transcript);
      const baseSlug = slugify(generated.title);
      const slug = resolveUniqueSlug(baseSlug, usedSlugs, video.videoId);
      const publishedAt = video.publishedAt.slice(0, 10);
      const markdown = buildMarkdown(generated, publishedAt);

      await writeFile(path.join(BLOG_DIR, `${slug}.md`), markdown, "utf8");

      usedSlugs.add(slug);
      state.processedVideoIds[video.videoId] = {
        slug,
        title: generated.title,
        sourceTitle: video.title,
        publishedAt,
        createdAt: new Date().toISOString(),
      };

      log(`Creato post ${slug}.md`);
    } catch (error) {
      log(`Errore sul video ${video.videoId}: ${error.message}`);
    }
  }

  await writeState(state);
}

await main();
