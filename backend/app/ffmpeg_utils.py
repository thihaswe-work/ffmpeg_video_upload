import subprocess
import os


class VideoProcessor:
    def __init__(self, input_path, output_dir):
        self.input_path = input_path
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    def _probe(self, entries, stream_selector="v:0"):
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-select_streams", stream_selector,
                "-show_entries", entries,
                "-of", "csv=p=0",
                self.input_path,
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        return result.stdout.strip()

    def _source_height(self):
        try:
            value = self._probe("stream=height").splitlines()[0]
            return int(value)
        except (ValueError, IndexError):
            return 1080

    def _has_audio(self):
        return bool(self._probe("stream=codec_type", "a"))

    def extract_thumbnail(self, timestamp="00:00:01.0"):
        thumbnail_path = os.path.join(self.output_dir, "thumbnail.jpg")
        cmd = [
            "ffmpeg", "-y",
            "-ss", timestamp,
            "-i", self.input_path,
            "-frames:v", "1",
            "-q:v", "2",
            thumbnail_path,
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return thumbnail_path

    def _renditions(self):
        all_renditions = [
            {"h": 1080, "v": "5000k", "max": "6400k", "a": "160k"},
            {"h": 720, "v": "2800k", "max": "3600k", "a": "128k"},
            {"h": 480, "v": "1400k", "max": "1800k", "a": "128k"},
        ]
        source_h = self._source_height()
        selected = [r for r in all_renditions if r["h"] <= source_h]
        if selected:
            return selected
        even_h = source_h if source_h % 2 == 0 else source_h - 1
        return [{"h": even_h, "v": "1000k", "max": "1200k", "a": "128k"}]

    def transcode_hls(self):
        hls_dir = os.path.join(self.output_dir, "hls")
        os.makedirs(hls_dir, exist_ok=True)
        master_path = os.path.join(hls_dir, "master.m3u8")
        renditions = self._renditions()
        has_audio = self._has_audio()

        filters = []
        split_labels = "".join(f"[v{i}]" for i in range(len(renditions)))
        filters.append(f"[0:v]split={len(renditions)}{split_labels}")
        for i, r in enumerate(renditions):
            filters.append(
                f"[v{i}]scale=w=-2:h={r['h']}:force_divisible_by=2[o{i}]"
            )
        filter_complex = ";".join(filters)

        cmd = ["ffmpeg", "-y", "-i", self.input_path, "-threads", "0",
               "-filter_complex", filter_complex]

        for i, r in enumerate(renditions):
            cmd += [
                "-map", f"[o{i}]",
                f"-c:v:{i}", "libx264",
                "-preset", "veryfast",
                f"-b:v:{i}", r["v"],
                f"-maxrate:v:{i}", r["max"],
                f"-bufsize:v:{i}", r["max"],
                "-g", "48",
                "-keyint_min", "48",
                "-sc_threshold", "0",
            ]

        if has_audio:
            for i, r in enumerate(renditions):
                cmd += ["-map", "a:0", f"-c:a:{i}", "aac", f"-b:a:{i}", r["a"], "-ac", "2"]
            var_map = " ".join(f"v:{i},a:{i}" for i in range(len(renditions)))
        else:
            var_map = " ".join(f"v:{i}" for i in range(len(renditions)))

        cmd += [
            "-f", "hls",
            "-hls_time", "6",
            "-hls_playlist_type", "vod",
            "-hls_flags", "independent_segments",
            "-hls_segment_filename", os.path.join(hls_dir, "v%v_segment_%03d.ts"),
            "-master_pl_name", "master.m3u8",
            "-var_stream_map", var_map,
            "-max_muxing_queue_size", "2048",
            os.path.join(hls_dir, "v%v.m3u8"),
        ]

        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return master_path, hls_dir
