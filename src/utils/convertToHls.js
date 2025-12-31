// const ffmpeg = require("fluent-ffmpeg");
// const path = require("path");
// const fs = require("fs-extra");

// module.exports.convertToHls = async (inputPath) => {
//   // Use a unique folder for HLS output
//   const outputDir = path.join(path.dirname(inputPath), `hls-${Date.now()}`);
//   await fs.ensureDir(outputDir);

//   const playlistPath = path.join(outputDir, "index.m3u8");
  
//   // Use forward slashes for segment pattern to prevent Windows pathing errors
//   const segmentPath = path.join(outputDir, "segment_%03d.ts").replace(/\\/g, '/');

//   return new Promise((resolve, reject) => {
//     ffmpeg(inputPath)
//       .output(playlistPath)
//       .outputOptions([
//         "-y",                             // Overwrite existing files
//         "-c:v libx264",                   // Standard video codec
//         "-profile:v main",
//         "-level 3.1",
//         "-pix_fmt yuv420p",
//         "-preset veryfast",               // Balance between speed and compression
//         "-g 48",                          // Fixed GOP size (needed for consistent segmenting)
//         "-sc_threshold 0",                // Disable scene detection to force segments at 6s
//         "-c:a aac",                       // Standard audio codec
//         "-b:a 128k",
//         "-ar 44100",
//         "-f hls",                         // Explicitly set format to HLS
//         "-hls_time 6",                    // Target segment duration
//         "-hls_playlist_type vod",         // Set as VOD (non-looping)
//         "-hls_list_size 0",               // Keep all segments in the playlist
//         "-hls_flags independent_segments", // Metadata for better player seeking
//     //    "-hls_segment_filename", segmentPath
//       ])
//       .on("start", (cmd) => console.log("FFmpeg command spawned:", cmd))
//       .on("progress", (progress) => {
//         // Log progress if available; else log the current timestamp (timemark)
//         const percent = progress.percent ? `${Math.floor(progress.percent)}%` : progress.timemark;
//         console.log(`Processing: ${percent} done`);
//       })
//       .on("end", () => {
//         console.log("Transcoding finished successfully.");
//         resolve({ outputDir, playlistPath });
//       })
//       .on("error", (err) => {
//         console.error("FFmpeg Error:", err.message);
//         reject(err);
//       })
//       .run();
//   });
// };
