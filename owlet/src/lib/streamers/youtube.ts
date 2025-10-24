import { PassThrough, Readable } from "stream";
import { Track } from "discord-player";
import { YoutubeiExtractor } from "discord-player-youtubei";
import { YtDlp } from "ytdlp-nodejs";
import { spawn } from "child_process";

interface YoutubeStreamerOptions {
  // How much space to allocate for the download buffer, by default 32 MB
  highWaterMark?: number;
  // Format to download video in, by default it attempts to pick the best Opus format, and if it fails, goes on to any best audio format
  ytdlpFormat?: string;
}

export const buildYoutubeStreamer = async (options?: YoutubeStreamerOptions) => {
  const ytdlp = new YtDlp();
  const isInstallValid = await ytdlp.checkInstallationAsync();
  if (!isInstallValid) {
    throw "No valid yt-dlp installation";
  }

  const highWaterMark = options?.highWaterMark ?? (32 * 1024 * 1024);
  // const ytdlpFormat = options?.ytdlpFormat ?? "251/bestaudio";
  /* const createStream = async (track: Track, _extractor: YoutubeiExtractor): Promise<Readable> => {
    const stream = ytdlp.stream(track.url, {
      format: ytdlpFormat,
    });

    const passthrough = new PassThrough({ highWaterMark });
    stream.pipe(passthrough);
    return passthrough;
  }; */

  // HACK: workaround to get around current Youtube limitations, at least until yt-dlp updates
  const createStreamWorkaround = async (track: Track, _extractor: YoutubeiExtractor): Promise<Readable> => {
    const stream = ytdlp.stream(track.url, {
      format: "91",
    });

    const ffmpeg = spawn("ffmpeg", [
      "-i", "pipe:0",
      "-vn",
      "-acodec", "copy",
      "-f", "adts",
      "pipe:1",
    ]);

    const passthrough = new PassThrough({ highWaterMark });
    stream.pipe(ffmpeg.stdin);
    ffmpeg.stdout.pipe(passthrough);
    return passthrough;
  };

  return createStreamWorkaround;
};
